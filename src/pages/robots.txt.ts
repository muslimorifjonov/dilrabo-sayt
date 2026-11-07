import type { APIRoute } from 'astro';

/** robots.txt — domen astro.config’dagi `site` dan olinadi (domen o‘zgarsa avtomatik yangilanadi). */
export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL('sitemap-index.xml', site ?? 'https://dilrabocosmetolog.netlify.app');
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin/',
    '',
    `Sitemap: ${sitemap.href}`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
