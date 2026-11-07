// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

/**
 * Domen bitta joyda: SITE_URL (qo‘lda) → URL (Netlify avtomatik beradi) → zaxira.
 * Domen o‘zgarsa, kodga tegmasdan Netlify’da SITE_URL ni yangilab, redeploy qilish kifoya.
 */
const site = process.env.SITE_URL || process.env.URL || 'https://dilrabocosmetolog.netlify.app';

export default defineConfig({
  site,
  output: 'static',
  i18n: {
    defaultLocale: 'uz',
    locales: ['uz', 'ru'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    react({ include: ['**/components/admin/**'] }),
    sitemap({
      filter: (page) => !page.includes('/admin') && !page.includes('/404'),
      i18n: { defaultLocale: 'uz', locales: { uz: 'uz-UZ', ru: 'ru-RU' } },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    build: {
      // heic2any (~1.3 MB) faqat admin’da, HEIC fayl tanlanganda dinamik yuklanadi
      chunkSizeWarningLimit: 1500,
      // Shriftlar hech qachon CSS ichiga base64 qilib joylanmaydi (CSS yengil, render tez)
      assetsInlineLimit: (filePath) => (/\.(woff2?|ttf|otf)$/.test(filePath) ? false : undefined),
    },
  },
});
