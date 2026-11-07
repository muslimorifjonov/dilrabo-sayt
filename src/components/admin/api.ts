import type { SupabaseClient } from '@supabase/supabase-js';
import type { PreparedImage } from '../../lib/image';
import {
  isR2Configured,
  isR2Path,
  MEDIA_API,
  MEDIA_BUCKET,
  R2_PREFIX,
  storageKey,
  type AdminMediaItem,
  type MediaCategory,
} from '../../lib/media';
import { isRetryable } from './constants';

/** HTTP xatosi (status bilan) — isRetryable() 4xx’ni qayta urinmaydi */
export class HttpError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export type MediaPatch = Partial<
  Pick<
    AdminMediaItem,
    | 'title_uz'
    | 'title_ru'
    | 'caption_uz'
    | 'caption_ru'
    | 'alt_uz'
    | 'alt_ru'
    | 'focal_x'
    | 'focal_y'
    | 'is_published'
  >
>;

/** Tarmoq xatosida 1 marta avtomatik qayta urinish */
export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (!isRetryable(error)) throw error;
    await new Promise((r) => setTimeout(r, 900));
    return fn();
  }
}

/** supabase-js { data, error } → throw */
function unwrap<T>(res: { data: T | null; error: unknown }): T {
  if (res.error) throw res.error;
  if (res.data === null) throw new Error('empty response');
  return res.data;
}

export async function listMedia(client: SupabaseClient): Promise<AdminMediaItem[]> {
  const res = await client
    .from('media')
    .select('*')
    .order('category', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  return unwrap(res) as AdminMediaItem[];
}

export async function isAdmin(client: SupabaseClient, userId: string): Promise<boolean> {
  const res = await client.from('admins').select('user_id').eq('user_id', userId).maybeSingle();
  if (res.error) throw res.error;
  return res.data !== null;
}

export async function maxSortOrder(
  client: SupabaseClient,
  category: MediaCategory,
): Promise<number> {
  const res = await client
    .from('media')
    .select('sort_order')
    .eq('category', category)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (res.error) throw res.error;
  return (res.data as { sort_order: number } | null)?.sort_order ?? 0;
}

/* ── R2 (Netlify funksiyasi orqali; R2 kalitlari faqat serverda) ───────── */

async function bearer(client: SupabaseClient): Promise<string> {
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  const token = data.session?.access_token;
  if (!token) throw new HttpError(401, 'session expired');
  return `Bearer ${token}`;
}

async function r2Request(
  client: SupabaseClient,
  method: 'PUT' | 'DELETE',
  keys: string[],
  body?: Blob,
  contentType?: string,
): Promise<void> {
  const query = new URLSearchParams();
  for (const key of keys) query.append('path', key);
  const headers: Record<string, string> = { Authorization: await bearer(client) };
  if (contentType) headers['Content-Type'] = contentType;
  const res = await fetch(`${MEDIA_API}?${query.toString()}`, { method, headers, body });
  if (!res.ok) {
    let code = '';
    try {
      code = ((await res.json()) as { error?: string }).error ?? '';
    } catch {
      /* JSON emas — status yetarli */
    }
    throw new HttpError(res.status, `media api ${res.status}${code ? ` ${code}` : ''}`);
  }
}

/* ── Umumiy: yo‘l prefiksiga qarab R2 yoki Supabase Storage ─────────────── */

async function uploadBlob(client: SupabaseClient, path: string, blob: Blob, contentType: string) {
  if (isR2Path(path)) {
    await r2Request(client, 'PUT', [storageKey(path)], blob, contentType);
    return;
  }
  const res = await client.storage.from(MEDIA_BUCKET).upload(path, blob, {
    contentType,
    cacheControl: '31536000',
    upsert: false,
  });
  if (res.error) throw res.error;
}

async function removeFiles(client: SupabaseClient, paths: string[]) {
  const r2Keys = paths.filter(isR2Path).map(storageKey);
  const legacy = paths.filter((p) => !isR2Path(p));
  if (r2Keys.length > 0) await r2Request(client, 'DELETE', r2Keys);
  if (legacy.length > 0) {
    const res = await client.storage.from(MEDIA_BUCKET).remove(legacy);
    if (res.error) throw res.error;
  }
}

/**
 * Tayyorlangan rasmni yuklaydi: lg + sm → media qatori.
 * R2 sozlangan bo‘lsa fayllar R2’ga (`r2:` prefiksi bilan saqlanadi), aks holda Supabase Storage’ga.
 * Qator qo‘shishda xato bo‘lsa — yuklangan fayllar o‘chiriladi (yetim fayl qolmaydi).
 */
export async function uploadPrepared(
  client: SupabaseClient,
  category: MediaCategory,
  img: PreparedImage,
  sortOrder: number,
): Promise<AdminMediaItem> {
  const year = new Date().getFullYear();
  const id = crypto.randomUUID();
  const base = `${isR2Configured ? R2_PREFIX : ''}${category}/${year}/${id}`;
  const lgPath = `${base}-lg.${img.ext}`;
  const smPath = `${base}-sm.${img.ext}`;
  const uploaded: string[] = [];

  try {
    await withRetry(() => uploadBlob(client, lgPath, img.lg, img.contentType));
    uploaded.push(lgPath);
    await withRetry(() => uploadBlob(client, smPath, img.sm, img.contentType));
    uploaded.push(smPath);

    const res = await withRetry(async () =>
      client
        .from('media')
        .insert({
          category,
          path_lg: lgPath,
          path_sm: smPath,
          width: img.width,
          height: img.height,
          sort_order: sortOrder,
        })
        .select('*')
        .single(),
    );
    return unwrap(res) as AdminMediaItem;
  } catch (error) {
    try {
      await removeFiles(client, uploaded);
    } catch {
      /* tozalash bajarilmasa ham asl xatoni ko‘rsatamiz */
    }
    throw error;
  }
}

export class DeleteError extends Error {
  readonly stage: 'files' | 'row';
  readonly cause: unknown;
  constructor(stage: 'files' | 'row', cause: unknown) {
    super(stage);
    this.stage = stage;
    this.cause = cause;
  }
}

/** O‘chirish: avval storage’dan ikkala fayl, keyin qator */
export async function deleteMedia(client: SupabaseClient, item: AdminMediaItem): Promise<void> {
  try {
    await withRetry(() => removeFiles(client, [item.path_lg, item.path_sm]));
  } catch (error) {
    throw new DeleteError('files', error);
  }
  try {
    await withRetry(async () => {
      const res = await client.from('media').delete().eq('id', item.id);
      if (res.error) throw res.error;
    });
  } catch (error) {
    throw new DeleteError('row', error);
  }
}

export async function updateMedia(
  client: SupabaseClient,
  id: string,
  patch: MediaPatch,
): Promise<AdminMediaItem> {
  const res = await withRetry(async () =>
    client.from('media').update(patch).eq('id', id).select('*').single(),
  );
  return unwrap(res) as AdminMediaItem;
}

export async function reorderMedia(client: SupabaseClient, ids: string[]): Promise<void> {
  await withRetry(async () => {
    const res = await client.rpc('reorder_media', { ids });
    if (res.error) throw res.error;
  });
}
