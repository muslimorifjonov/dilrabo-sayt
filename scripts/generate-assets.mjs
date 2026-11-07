/**
 * Statik grafikalarni yaratadi (bir marta ishga tushiriladi: `npm run assets`):
 *   public/favicon.svg, public/apple-touch-icon.png, public/og.jpg,
 *   public/fallback/hero.webp, public/fallback/about.webp (vaqtinchalik — buyurtmachi portreti bilan almashtiriladi)
 *
 * Matn satori orqali vektor yo‘llarga aylantiriladi (shrift o‘rnatish shart emas).
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pub = (p) => resolve(root, 'public', p);
const font = (pkg, file) => readFile(resolve(root, 'node_modules/@fontsource', pkg, 'files', file));

const C = {
  bg: '#FBF7F4',
  bgSoft: '#F6ECE7',
  blush100: '#F3DCDF',
  blush200: '#EFD3D7',
  rose300: '#D9A3AE',
  primary: '#A0526A',
  primaryHover: '#8E4459',
  gold: '#C8A26B',
  ink: '#3B2A30',
  inkSoft: '#76616A',
};

const fonts = [
  {
    name: 'Cormorant',
    data: await font('cormorant-garamond', 'cormorant-garamond-latin-500-normal.woff'),
    weight: 500,
    style: 'normal',
  },
  {
    name: 'Cormorant',
    data: await font('cormorant-garamond', 'cormorant-garamond-latin-600-normal.woff'),
    weight: 600,
    style: 'normal',
  },
  {
    name: 'Cormorant',
    data: await font('cormorant-garamond', 'cormorant-garamond-latin-500-italic.woff'),
    weight: 500,
    style: 'italic',
  },
  {
    name: 'Manrope',
    data: await font('manrope', 'manrope-latin-500-normal.woff'),
    weight: 500,
    style: 'normal',
  },
  {
    name: 'Manrope',
    data: await font('manrope', 'manrope-latin-700-normal.woff'),
    weight: 700,
    style: 'normal',
  },
];

/** Kichik JSX o‘rnini bosuvchi */
const h = (type, style = {}, ...children) => ({
  type,
  props: {
    style: { display: 'flex', ...style },
    children: children.flat().filter((c) => c !== null),
  },
});

const render = (node, width, height) => satori(node, { width, height, fonts });

const diamond = (size, color) =>
  h('div', { width: size, height: size, background: color, transform: 'rotate(45deg)' });

/* ── Favicon: «D» monogramma, pushti doira ichida ───────────────────── */
async function favicon() {
  const svg = await render(
    h(
      'div',
      {
        width: 64,
        height: 64,
        borderRadius: 32,
        background: C.blush100,
        alignItems: 'center',
        justifyContent: 'center',
      },
      h(
        'div',
        { fontFamily: 'Cormorant', fontWeight: 600, fontSize: 50, color: C.primary, marginTop: -4 },
        'D',
      ),
    ),
    64,
    64,
  );
  await writeFile(pub('favicon.svg'), svg);

  // apple-touch-icon: to‘liq kvadrat (iOS o‘zi yumaloqlaydi)
  const touch = await render(
    h(
      'div',
      {
        width: 180,
        height: 180,
        background: C.blush100,
        alignItems: 'center',
        justifyContent: 'center',
      },
      h(
        'div',
        {
          fontFamily: 'Cormorant',
          fontWeight: 600,
          fontSize: 132,
          color: C.primary,
          marginTop: -10,
        },
        'D',
      ),
    ),
    180,
    180,
  );
  await sharp(Buffer.from(touch)).png({ compressionLevel: 9 }).toFile(pub('apple-touch-icon.png'));
}

/* ── OG rasm 1200×630 ───────────────────────────────────────────────── */
async function og() {
  const svg = await render(
    h(
      'div',
      {
        width: 1200,
        height: 630,
        background: `linear-gradient(120deg, ${C.bg} 0%, ${C.bg} 55%, ${C.blush100} 100%)`,
        position: 'relative',
        overflow: 'hidden',
      },
      // dekor doiralar
      h('div', {
        position: 'absolute',
        left: -180,
        top: -220,
        width: 620,
        height: 620,
        borderRadius: 310,
        background: `radial-gradient(circle, ${C.blush100} 0%, rgba(243,220,223,0) 70%)`,
      }),
      h('div', {
        position: 'absolute',
        right: -120,
        top: 70,
        width: 560,
        height: 560,
        borderRadius: 280,
        border: `2px solid ${C.gold}`,
        opacity: 0.55,
      }),
      h(
        'div',
        {
          position: 'absolute',
          right: -40,
          top: 150,
          width: 400,
          height: 400,
          borderRadius: 200,
          background: `linear-gradient(160deg, #FFFFFF 0%, ${C.blush100} 100%)`,
          alignItems: 'center',
          justifyContent: 'center',
        },
        h(
          'div',
          {
            fontFamily: 'Cormorant',
            fontStyle: 'italic',
            fontWeight: 500,
            fontSize: 300,
            color: C.primary,
            marginTop: -40,
          },
          'D',
        ),
      ),
      // matn
      h(
        'div',
        { position: 'absolute', left: 80, top: 110, flexDirection: 'column' },
        h(
          'div',
          { alignItems: 'center', gap: 14 },
          diamond(10, C.gold),
          h(
            'div',
            {
              fontFamily: 'Manrope',
              fontWeight: 700,
              fontSize: 20,
              letterSpacing: 5,
              color: C.primaryHover,
            },
            'KOSMETOLOG · TOSHKENT',
          ),
        ),
        h(
          'div',
          {
            fontFamily: 'Cormorant',
            fontWeight: 500,
            fontSize: 176,
            lineHeight: 1,
            color: C.ink,
            marginTop: 22,
          },
          'DILRABO',
        ),
        h(
          'div',
          {
            fontFamily: 'Manrope',
            fontWeight: 500,
            fontSize: 28,
            letterSpacing: 11,
            color: C.primary,
            marginTop: 14,
          },
          'RAXIMBERDIEVNA',
        ),
        h('div', { width: 64, height: 2, background: C.gold, marginTop: 40 }),
        h(
          'div',
          { fontFamily: 'Manrope', fontWeight: 500, fontSize: 24, color: C.inkSoft, marginTop: 28 },
          'Mezo · Botoks · Biorevitalizatsiya · Full face',
        ),
        h(
          'div',
          { fontFamily: 'Manrope', fontWeight: 700, fontSize: 24, color: C.ink, marginTop: 12 },
          '+998 97 723 26 26 · @dilrabocosmetolog',
        ),
      ),
    ),
    1200,
    630,
  );
  await sharp(Buffer.from(svg)).jpeg({ quality: 88, mozjpeg: true }).toFile(pub('og.jpg'));
}

/* ── Vaqtinchalik zaxira portretlar (mavhum, stock emas) ────────────── */
async function placeholder(file, variant) {
  const W = 1200;
  const H = 1500;
  const angle = variant === 'hero' ? 165 : 200;
  const svg = await render(
    h(
      'div',
      {
        width: W,
        height: H,
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(${angle}deg, ${C.bgSoft} 0%, ${C.blush100} 52%, ${C.blush200} 100%)`,
        alignItems: 'center',
        justifyContent: 'center',
      },
      h('div', {
        position: 'absolute',
        left: variant === 'hero' ? 520 : -200,
        top: variant === 'hero' ? -260 : 760,
        width: 900,
        height: 900,
        borderRadius: 450,
        background: 'radial-gradient(circle, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 68%)',
      }),
      h('div', {
        position: 'absolute',
        left: 150,
        top: 250,
        width: 900,
        height: 900,
        borderRadius: 450,
        border: `2px solid ${C.gold}`,
        opacity: 0.5,
      }),
      h('div', {
        position: 'absolute',
        left: 230,
        top: 330,
        width: 740,
        height: 740,
        borderRadius: 370,
        border: '1px solid rgba(255,255,255,0.9)',
      }),
      h(
        'div',
        {
          fontFamily: 'Cormorant',
          fontStyle: 'italic',
          fontWeight: 500,
          fontSize: 820,
          lineHeight: 1,
          color: 'rgba(255,255,255,0.82)',
          marginTop: -60,
        },
        'D',
      ),
      h(
        'div',
        {
          position: 'absolute',
          bottom: 150,
          left: 0,
          right: 0,
          justifyContent: 'center',
          alignItems: 'center',
          gap: 22,
        },
        h('div', { width: 80, height: 1, background: C.gold }),
        diamond(12, C.gold),
        h('div', { width: 80, height: 1, background: C.gold }),
      ),
    ),
    W,
    H,
  );
  await sharp(Buffer.from(svg))
    .webp({ quality: 82 })
    .toFile(pub(`fallback/${file}`));
}

await mkdir(pub('fallback'), { recursive: true });
await favicon();
await og();
await placeholder('hero.webp', 'hero');
await placeholder('about.webp', 'about');
console.log('✓ favicon.svg, apple-touch-icon.png, og.jpg, fallback/hero.webp, fallback/about.webp');
