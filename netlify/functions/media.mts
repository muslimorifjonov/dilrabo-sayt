import type { Config } from '@netlify/functions';
import { presignUrl } from '../lib/sigv4';

/**
 * Admin rasmlari uchun Cloudflare R2 ombori: yuklash (PUT) va o‘chirish (DELETE).
 *
 *   PUT    /api/media?path=<kalit>            body: rasm (image/webp | image/jpeg)
 *   DELETE /api/media?path=<kalit>&path=...    (10 tagacha)
 *
 * Ruxsat: `Authorization: Bearer <Supabase sessiya tokeni>` — token Supabase’dagi
 * `is_admin()` funksiyasi orqali tekshiriladi (faqat `public.admins` ro‘yxatidagilar).
 * R2 kalitlari faqat shu yerda (server) — brauzerga hech qachon chiqmaydi.
 *
 * Kerakli muhit o‘zgaruvchilari (Netlify → Environment variables):
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
 *   PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY (sayt uchun allaqachon bor)
 *   R2_ENDPOINT — ixtiyoriy (masalan EU yurisdiksiyasi: https://<id>.eu.r2.cloudflarestorage.com)
 */

const KEY_RE =
  /^(hero|about|certificates|results|reviews|clinic|promo)\/\d{4}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-(lg|sm)\.(webp|jpg)$/;
const TYPE_BY_EXT: Record<string, string> = { webp: 'image/webp', jpg: 'image/jpeg' };
/** Netlify funksiyasi so‘rov tanasi limiti ~6 MB; brauzerda siqilgan rasm odatda 0.1–1 MB */
const MAX_BYTES = 5.5 * 1024 * 1024;
const CACHE_CONTROL = 'public, max-age=31536000, immutable';
const MAX_DELETE = 10;

interface R2Config {
  host: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  supabaseUrl: string;
  anonKey: string;
}

/** R2_ENDPOINT berilsa — o‘sha (masalan EU), aks holda <account>.r2.cloudflarestorage.com */
function r2Host(endpoint: string, accountId: string): string {
  if (endpoint) {
    try {
      return new URL(endpoint).host;
    } catch {
      return '';
    }
  }
  return accountId ? `${accountId}.r2.cloudflarestorage.com` : '';
}

function readConfig(): R2Config | null {
  const env = (name: string) => (process.env[name] ?? '').trim();
  const cfg: R2Config = {
    host: r2Host(env('R2_ENDPOINT'), env('R2_ACCOUNT_ID')),
    bucket: env('R2_BUCKET'),
    accessKeyId: env('R2_ACCESS_KEY_ID'),
    secretAccessKey: env('R2_SECRET_ACCESS_KEY'),
    supabaseUrl: env('PUBLIC_SUPABASE_URL').replace(/\/+$/, ''),
    anonKey: env('PUBLIC_SUPABASE_ANON_KEY'),
  };
  return Object.values(cfg).every((v) => v.length > 0) ? cfg : null;
}

const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

/** Token egasi admin ekanini Supabase’ning o‘zi tekshiradi (RLS bilan bir xil manba) */
async function isAdmin(cfg: R2Config, token: string): Promise<boolean> {
  try {
    const res = await fetch(`${cfg.supabaseUrl}/rest/v1/rpc/is_admin`, {
      method: 'POST',
      headers: {
        apikey: cfg.anonKey,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return false;
    return (await res.json()) === true;
  } catch (error) {
    console.warn('[media] admin tekshiruvi bajarilmadi:', error);
    return false;
  }
}

function sign(
  cfg: R2Config,
  method: 'PUT' | 'DELETE',
  key: string,
  headers?: Record<string, string>,
) {
  return presignUrl({
    method,
    host: cfg.host,
    pathSegments: [cfg.bucket, ...key.split('/')],
    accessKeyId: cfg.accessKeyId,
    secretAccessKey: cfg.secretAccessKey,
    region: 'auto',
    expires: 300,
    headers,
  });
}

async function handlePut(cfg: R2Config, req: Request, key: string): Promise<Response> {
  const ext = key.slice(key.lastIndexOf('.') + 1);
  const expected = TYPE_BY_EXT[ext];
  const contentType = (req.headers.get('content-type') ?? '').split(';')[0]?.trim().toLowerCase();
  if (!expected || contentType !== expected) return json(415, { error: 'bad-type' });

  const declared = Number(req.headers.get('content-length') ?? '0');
  if (declared > MAX_BYTES) return json(413, { error: 'too-large' });
  const body = await req.arrayBuffer();
  if (body.byteLength === 0) return json(400, { error: 'empty' });
  if (body.byteLength > MAX_BYTES) return json(413, { error: 'too-large' });

  const headers = { 'content-type': expected, 'cache-control': CACHE_CONTROL };
  const res = await fetch(sign(cfg, 'PUT', key, headers), {
    method: 'PUT',
    headers,
    body,
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) {
    console.warn(`[media] R2 PUT ${res.status}:`, (await res.text()).slice(0, 500));
    return json(502, { error: 'storage', status: res.status });
  }
  return json(201, { ok: true, path: key });
}

async function handleDelete(cfg: R2Config, keys: string[]): Promise<Response> {
  const results = await Promise.all(
    keys.map(async (key) => {
      const res = await fetch(sign(cfg, 'DELETE', key), {
        method: 'DELETE',
        signal: AbortSignal.timeout(15_000),
      });
      // 204 — o‘chirildi, 404 — allaqachon yo‘q (maqsadga erishilgan)
      if (!res.ok && res.status !== 404) {
        console.warn(`[media] R2 DELETE ${res.status}:`, (await res.text()).slice(0, 500));
        return false;
      }
      return true;
    }),
  );
  return results.every(Boolean) ? json(200, { ok: true }) : json(502, { error: 'storage' });
}

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'PUT' && req.method !== 'DELETE') {
    return new Response(null, { status: 405, headers: { Allow: 'PUT, DELETE' } });
  }

  const cfg = readConfig();
  if (!cfg) {
    console.warn('[media] R2 yoki Supabase muhit o‘zgaruvchilari to‘liq sozlanmagan');
    return json(503, { error: 'not-configured' });
  }

  const token = /^Bearer\s+(.+)$/i.exec(req.headers.get('authorization') ?? '')?.[1]?.trim();
  if (!token) return json(401, { error: 'unauthorized' });
  if (!(await isAdmin(cfg, token))) return json(403, { error: 'forbidden' });

  const keys = new URL(req.url).searchParams.getAll('path');
  if (keys.length === 0 || !keys.every((k) => KEY_RE.test(k))) {
    return json(400, { error: 'bad-path' });
  }

  try {
    if (req.method === 'PUT') {
      if (keys.length !== 1) return json(400, { error: 'bad-path' });
      return await handlePut(cfg, req, keys[0] as string);
    }
    if (keys.length > MAX_DELETE) return json(400, { error: 'too-many' });
    return await handleDelete(cfg, keys);
  } catch (error) {
    console.warn('[media] R2 so‘rovi bajarilmadi:', error);
    return json(502, { error: 'storage' });
  }
};

export const config: Config = {
  path: '/api/media',
};
