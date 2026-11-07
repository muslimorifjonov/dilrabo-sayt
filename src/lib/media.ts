/**
 * Ommaviy sayt uchun rasmlar: Supabase REST’dan bitta so‘rov, stale-while-revalidate kesh.
 * supabase-js ishlatilmaydi — oddiy fetch (ommaviy sahifa JS’i minimal bo‘lsin).
 */

export const MEDIA_CATEGORIES = [
  'hero',
  'about',
  'certificates',
  'results',
  'reviews',
  'clinic',
  'promo',
] as const;

export type MediaCategory = (typeof MEDIA_CATEGORIES)[number];

/** Bitta rasmli slotlar */
export const SINGLE_SLOTS: readonly MediaCategory[] = ['hero', 'about', 'promo'];

export interface MediaItem {
  id: string;
  category: MediaCategory;
  path_lg: string;
  path_sm: string;
  width: number;
  height: number;
  focal_x: number;
  focal_y: number;
  title_uz: string | null;
  title_ru: string | null;
  caption_uz: string | null;
  caption_ru: string | null;
  alt_uz: string | null;
  alt_ru: string | null;
}

export interface AdminMediaItem extends MediaItem {
  sort_order: number;
  is_published: boolean;
  created_at: string;
}

export const SUPABASE_URL: string = (import.meta.env.PUBLIC_SUPABASE_URL ?? '')
  .trim()
  .replace(/\/+$/, '');
export const SUPABASE_ANON_KEY: string = (import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? '').trim();
export const isSupabaseConfigured: boolean =
  SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;

/**
 * Cloudflare R2 — admin yuklagan rasmlar ombori (public bucket manzili: custom domen yoki r2.dev).
 * Sozlangan bo‘lsa yangi rasmlar R2’ga ketadi; ma’lumotlar (jadval, admin, auth) Supabase’da qoladi.
 * Sozlanmagan bo‘lsa — avvalgidek Supabase Storage ishlatiladi.
 */
export const R2_PUBLIC_URL: string = (import.meta.env.PUBLIC_R2_PUBLIC_URL ?? '')
  .trim()
  .replace(/\/+$/, '');
export const isR2Configured: boolean = /^https:\/\/[^/]+/.test(R2_PUBLIC_URL);
/** R2’dagi fayl yo‘li bazada shu prefiks bilan saqlanadi: `r2:results/2026/<uuid>-lg.webp` */
export const R2_PREFIX = 'r2:';
/** R2 bilan ishlaydigan Netlify funksiyasi (netlify/functions/media.mts) */
export const MEDIA_API = '/api/media';

export const isR2Path = (path: string): boolean => path.startsWith(R2_PREFIX);
/** Bazadagi yo‘ldan ombor ichidagi kalit (prefikssiz) */
export const storageKey = (path: string): string =>
  isR2Path(path) ? path.slice(R2_PREFIX.length) : path;

export const MEDIA_BUCKET = 'media';
/** Kichik versiyaning maksimal tomoni (admin’dagi SM_MAX bilan bir xil) */
export const SM_WIDTH = 720;
export const CACHE_KEY = 'media-cache-v1';

const SELECT =
  'id,category,path_lg,path_sm,width,height,focal_x,focal_y,title_uz,title_ru,caption_uz,caption_ru,alt_uz,alt_ru';

export function publicUrl(path: string): string {
  const safe = storageKey(path)
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  if (isR2Path(path)) return `${R2_PUBLIC_URL}/${safe}`;
  return `${SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/${safe}`;
}

const isCategory = (value: unknown): value is MediaCategory =>
  typeof value === 'string' && (MEDIA_CATEGORIES as readonly string[]).includes(value);

const strOrNull = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value : null;

const clampPct = (value: unknown): number => {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : 50;
};

/** Tarmoqdan kelgan ma’lumotni himoyali tekshirish */
export function sanitizeItems(input: unknown): MediaItem[] {
  if (!Array.isArray(input)) return [];
  const out: MediaItem[] = [];
  for (const raw of input as unknown[]) {
    if (!raw || typeof raw !== 'object') continue;
    const r = raw as Record<string, unknown>;
    const width = Number(r.width);
    const height = Number(r.height);
    if (
      typeof r.id !== 'string' ||
      !isCategory(r.category) ||
      typeof r.path_lg !== 'string' ||
      typeof r.path_sm !== 'string' ||
      !(width > 0) ||
      !(height > 0)
    ) {
      continue;
    }
    out.push({
      id: r.id,
      category: r.category,
      path_lg: r.path_lg,
      path_sm: r.path_sm,
      width,
      height,
      focal_x: clampPct(r.focal_x),
      focal_y: clampPct(r.focal_y),
      title_uz: strOrNull(r.title_uz),
      title_ru: strOrNull(r.title_ru),
      caption_uz: strOrNull(r.caption_uz),
      caption_ru: strOrNull(r.caption_ru),
      alt_uz: strOrNull(r.alt_uz),
      alt_ru: strOrNull(r.alt_ru),
    });
  }
  return out;
}

interface CachePayload {
  v: 1;
  t: number;
  items: MediaItem[];
}

export function readCache(): MediaItem[] | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CachePayload>;
    if (parsed.v !== 1) return null;
    return sanitizeItems(parsed.items);
  } catch {
    return null;
  }
}

export function writeCache(items: MediaItem[]): void {
  try {
    const payload: CachePayload = { v: 1, t: Date.now(), items };
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    /* yopiq rejim yoki joy tugagan — kesh shart emas */
  }
}

export async function fetchMedia(timeoutMs = 8000): Promise<MediaItem[]> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const url =
      `${SUPABASE_URL}/rest/v1/media?select=${SELECT}` +
      '&is_published=eq.true&order=category.asc,sort_order.asc,created_at.desc';
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_ANON_KEY },
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return sanitizeItems(await res.json());
  } finally {
    window.clearTimeout(timer);
  }
}

export type MediaGroups = Record<MediaCategory, MediaItem[]>;

/** Kategoriyalar bo‘yicha guruhlash. Bitta slotlarda — eng oxirgi yuklangani (eng katta tartib). */
export function groupMedia(items: MediaItem[]): MediaGroups {
  const groups = Object.fromEntries(
    MEDIA_CATEGORIES.map((c) => [c, [] as MediaItem[]]),
  ) as MediaGroups;
  for (const item of items) groups[item.category].push(item);
  for (const slot of SINGLE_SLOTS) {
    const list = groups[slot];
    const last = list[list.length - 1];
    groups[slot] = last ? [last] : [];
  }
  return groups;
}
