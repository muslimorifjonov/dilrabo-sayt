import type { Config } from '@netlify/functions';

/**
 * Bepul Supabase loyihasi uzoq faolsizlikdan keyin pauza qilinmasligi uchun
 * har kuni bitta yengil so‘rov yuboriladi.
 */
export default async (): Promise<Response> => {
  const url = process.env.PUBLIC_SUPABASE_URL;
  const key = process.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn('[keepalive] PUBLIC_SUPABASE_URL yoki PUBLIC_SUPABASE_ANON_KEY sozlanmagan');
    return new Response('not configured', { status: 500 });
  }

  try {
    const res = await fetch(`${url.replace(/\/+$/, '')}/rest/v1/media?select=id&limit=1`, {
      headers: { apikey: key },
      signal: AbortSignal.timeout(10_000),
    });
    console.log(`[keepalive] Supabase javobi: ${res.status} ${res.statusText}`);
    return new Response(`ok ${res.status}`, { status: res.ok ? 200 : 502 });
  } catch (error) {
    console.warn('[keepalive] so‘rov bajarilmadi:', error);
    return new Response('error', { status: 502 });
  }
};

export const config: Config = {
  schedule: '@daily',
};
