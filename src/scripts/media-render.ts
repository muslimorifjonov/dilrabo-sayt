/**
 * Admin yuklagan rasmlarni ommaviy sahifada chizish.
 * Keshdan darhol → tarmoqdan yangilash. Xatoda: hero/about doimiy rasmi qoladi, qolganlari yashiriladi.
 * Rasmlar R2 (`r2:` prefiksli yo‘l) yoki Supabase Storage’dan — publicUrl() o‘zi aniqlaydi.
 */
import {
  fetchMedia,
  groupMedia,
  isSupabaseConfigured,
  MEDIA_CATEGORIES,
  publicUrl,
  readCache,
  SM_WIDTH,
  writeCache,
  type MediaCategory,
  type MediaGroups,
  type MediaItem,
} from '../lib/media';
import { getStrings, qs, qsa, type ClientStrings } from './env';
import { openLightbox, warmLightbox, type LightboxItem } from './lightbox';
import { observeReveal } from './ui';

const RESULTS_STEP = 9;
const ZOOM_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="11" x2="11" y1="8" y2="14"/><line x1="8" x2="14" y1="11" y2="11"/></svg>';

type Lang = 'uz' | 'ru';

const text = (item: MediaItem, field: 'title' | 'caption' | 'alt', lang: Lang): string | null =>
  item[`${field}_${lang}`];

function altFor(item: MediaItem, strings: ClientStrings): string {
  const lang = strings.locale;
  return text(item, 'alt', lang) ?? text(item, 'title', lang) ?? strings.alt[item.category];
}

function smWidth(item: MediaItem): number {
  const scale = Math.min(1, SM_WIDTH / Math.max(item.width, item.height));
  return Math.round(item.width * scale);
}

function buildImg(item: MediaItem, sizes: string, alt: string, eager = false): HTMLImageElement {
  const img = document.createElement('img');
  const sm = publicUrl(item.path_sm);
  const lg = publicUrl(item.path_lg);
  const smW = smWidth(item);
  img.src = sm;
  if (smW < item.width) {
    img.srcset = `${sm} ${smW}w, ${lg} ${item.width}w`;
    img.sizes = sizes;
  } else {
    img.src = lg;
  }
  img.width = item.width;
  img.height = item.height;
  img.alt = alt;
  img.decoding = 'async';
  img.loading = eager ? 'eager' : 'lazy';
  img.draggable = false;
  img.style.objectPosition = `${item.focal_x}% ${item.focal_y}%`;
  return img;
}

function frame(img: HTMLImageElement, extra?: string): HTMLDivElement {
  const f = document.createElement('div');
  f.className = extra ? `media-frame ${extra}` : 'media-frame';
  const done = () => f.classList.add('is-loaded');
  img.addEventListener('load', done, { once: true });
  img.addEventListener('error', done, { once: true });
  f.append(img);
  if (img.complete && img.naturalWidth > 0) done();
  return f;
}

function zoomIcon(): HTMLSpanElement {
  const s = document.createElement('span');
  s.className = 'zoom-ico';
  s.innerHTML = ZOOM_SVG;
  return s;
}

function lightboxItem(
  item: MediaItem,
  strings: ClientStrings,
  element?: HTMLElement,
): LightboxItem {
  const lang = strings.locale;
  return {
    src: publicUrl(item.path_lg),
    width: item.width,
    height: item.height,
    alt: altFor(item, strings),
    title: text(item, 'title', lang) ?? undefined,
    caption: text(item, 'caption', lang) ?? undefined,
    element,
  };
}

/**
 * Tugmalar ro‘yxatiga lightbox ulash. `onclick` ishlatiladi — qayta chizishda
 * (kesh → tarmoq) bir tugmaga ikki marta ulanib qolmaydi.
 */
function bindButtons(
  buttons: HTMLButtonElement[],
  build: () => LightboxItem[],
  strings: ClientStrings,
) {
  buttons.forEach((btn, i) => {
    btn.addEventListener('pointerenter', warmLightbox, { once: true });
    btn.addEventListener('focus', warmLightbox, { once: true });
    btn.onclick = () => void openLightbox(build(), i, strings.lightbox, btn);
  });
}

function bindGallery(buttons: HTMLButtonElement[], items: MediaItem[], strings: ClientStrings) {
  bindButtons(buttons, () => items.map((it, j) => lightboxItem(it, strings, buttons[j])), strings);
}

/** Build vaqtida chizilgan (statik) rasm tugmasi: ma’lumot data-lb-* atributlarida */
function staticLightboxItem(btn: HTMLButtonElement): LightboxItem {
  const d = btn.dataset;
  const img = btn.querySelector('img');
  const width = Number(d.lbW) || img?.naturalWidth || 1200;
  const height = Number(d.lbH) || img?.naturalHeight || 1500;
  return {
    src: d.lbSrc || img?.currentSrc || img?.src || '',
    width,
    height,
    alt: d.lbAlt ?? img?.alt ?? '',
    title: d.lbTitle || undefined,
    caption: d.lbCaption || undefined,
    element: btn,
  };
}

/** Statik sertifikatlar va «Ish jarayonida» rasmi — Supabase sozlanmagan bo‘lsa ham ishlaydi */
function bindStatic(strings: ClientStrings) {
  for (const btn of qsa<HTMLButtonElement>('button[data-static-zoom]')) {
    bindButtons([btn], () => [staticLightboxItem(btn)], strings);
  }
  const cert = qs('[data-gallery="certificates"]');
  if (cert) renderCertificates(cert, [], strings);
}

/**
 * label berilsa — aria-label (ko‘rinadigan matni yo‘q tugmalar uchun).
 * null bo‘lsa — yashirin prefiks qo‘shiladi, accessible nom ko‘rinadigan matnni ham o‘z ichiga oladi (WCAG 2.5.3).
 */
function zoomButton(className: string, label: string | null, prefix = ''): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `zoomable ${className}`;
  if (label) {
    btn.setAttribute('aria-label', label);
  } else if (prefix) {
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = `${prefix}: `;
    btn.append(sr);
  }
  return btn;
}

/* ── Bitta rasmli slotlar ───────────────────────────────────────────── */

function renderPortrait(
  container: HTMLElement | null,
  fallback: HTMLImageElement | null,
  item: MediaItem | undefined,
  liveClass: string,
  sizes: string,
  strings: ClientStrings,
  eager: boolean,
) {
  if (!container) return;
  const existing = container.querySelector<HTMLImageElement>(`.${liveClass}`);
  if (!item) {
    existing?.remove();
    if (fallback) fallback.style.visibility = '';
    return;
  }
  const key = `${item.id}:${item.focal_x}:${item.focal_y}:${strings.locale}`;
  if (existing?.dataset.key === key) return;
  const img = buildImg(item, sizes, altFor(item, strings), eager);
  if (eager) img.setAttribute('fetchpriority', 'high');
  img.classList.add(liveClass);
  img.dataset.key = key;
  const show = () => {
    img.classList.add('is-loaded');
    existing?.remove();
    window.setTimeout(() => {
      if (fallback && img.isConnected) fallback.style.visibility = 'hidden';
    }, 900);
  };
  img.addEventListener('load', show, { once: true });
  img.addEventListener('error', () => img.remove(), { once: true });
  container.append(img);
  if (img.complete && img.naturalWidth > 0) show();
}

/* ── Galereyalar ────────────────────────────────────────────────────── */

function span(className: string, content?: string): HTMLSpanElement {
  const s = document.createElement('span');
  s.className = className;
  if (content !== undefined) s.textContent = content;
  return s;
}

/**
 * Sertifikatlar: build vaqtida chizilgan doimiy kartalar (li[data-static]) saqlanadi,
 * admin yuklaganlari (li[data-dynamic]) ulardan keyin qo‘shiladi. Lightbox — bitta umumiy galereya.
 */
function renderCertificates(list: HTMLElement, items: MediaItem[], strings: ClientStrings) {
  const lang = strings.locale;
  const staticButtons = qsa<HTMLButtonElement>(':scope > li[data-static] > button', list);
  const dynamicButtons: HTMLButtonElement[] = [];
  const offset = staticButtons.length;

  const nodes = items.map((item, i) => {
    const li = document.createElement('li');
    li.dataset.reveal = '';
    li.dataset.dynamic = '';
    li.style.setProperty('--d', String((offset + i) % 3));
    const btn = zoomButton('cert-card', null, strings.lightbox.open);
    const img = buildImg(
      item,
      '(min-width: 1024px) 340px, (min-width: 768px) 44vw, 80vw',
      altFor(item, strings),
    );
    // Sertifikat to‘liq ko‘rinsin (kesilmasin) — fokus nuqtasi kerak emas
    img.style.objectPosition = '';
    const mat = frame(img, 'cert-mat');
    mat.append(zoomIcon());
    btn.append(mat);

    const title = text(item, 'title', lang);
    const caption = text(item, 'caption', lang);
    if (title || caption) {
      const body = span('cert-body');
      if (title) body.append(span('cert-title', title));
      if (caption) body.append(span('cert-caption', caption));
      btn.append(body);
    }
    dynamicButtons.push(btn);
    li.append(btn);
    return li;
  });

  list.querySelectorAll(':scope > li[data-dynamic]').forEach((li) => li.remove());
  list.append(...nodes);

  const buttons = [...staticButtons, ...dynamicButtons];
  bindButtons(
    buttons,
    () => [
      ...staticButtons.map(staticLightboxItem),
      ...items.map((it, j) => lightboxItem(it, strings, dynamicButtons[j])),
    ],
    strings,
  );
}

/** «Oldin · Keyin» belgisi (premium natija kartasi ustida) */
function beforeAfterBadge(strings: ClientStrings): HTMLSpanElement {
  const badge = span('result-badge');
  badge.setAttribute('aria-hidden', 'true');
  badge.append(
    span('', strings.results.before),
    span('result-badge-arrow'),
    span('', strings.results.after),
  );
  return badge;
}

/**
 * Natijalar: premium karta — rasm (oldin/keyin kollaj) + pastda ma’lumot
 * (sarlavha — muolaja nomi, izoh — natija haqida). Matn bo‘lmasa pastki qism chiqmaydi.
 * Rasm bo‘lmasa butun bo‘lim va menyu havolasi yashiriladi (data-req="results").
 */
function renderResults(list: HTMLElement, items: MediaItem[], strings: ClientStrings) {
  const lang = strings.locale;
  const buttons: HTMLButtonElement[] = [];
  const nodes = items.map((item, i) => {
    const li = document.createElement('li');
    li.className = 'result-item';
    li.dataset.reveal = '';
    li.style.setProperty('--d', String(i % 3));
    if (i >= RESULTS_STEP) li.classList.add('is-hidden');

    const card = document.createElement('article');
    card.className = 'result-card';
    const title = text(item, 'title', lang);
    const caption = text(item, 'caption', lang);

    const btn = zoomButton(
      'result-media w-full',
      `${strings.lightbox.open}: ${title ?? altFor(item, strings)}`,
    );
    btn.append(
      frame(
        buildImg(
          item,
          '(min-width: 1024px) 384px, (min-width: 640px) 46vw, 100vw',
          altFor(item, strings),
        ),
      ),
      beforeAfterBadge(strings),
      zoomIcon(),
    );
    card.append(btn);

    if (title || caption) {
      const info = document.createElement('div');
      info.className = 'result-info';
      const rule = span('gold-rule');
      rule.setAttribute('aria-hidden', 'true');
      info.append(rule);
      if (title) {
        const h = document.createElement('h3');
        h.className = 'result-title';
        h.textContent = title;
        info.append(h);
      }
      if (caption) {
        const p = document.createElement('p');
        p.className = 'result-text';
        p.textContent = caption;
        info.append(p);
      }
      card.append(info);
    } else {
      card.classList.add('is-bare');
    }

    li.append(card);
    buttons.push(btn);
    return li;
  });
  list.replaceChildren(...nodes);
  bindGallery(buttons, items, strings);

  const more = qs('[data-results-more]');
  const moreBtn = more?.querySelector('button');
  if (!more || !moreBtn) return;
  more.hidden = items.length <= RESULTS_STEP;
  moreBtn.onclick = () => {
    const hidden = Array.from(list.querySelectorAll<HTMLElement>('.result-item.is-hidden'));
    const batch = hidden.slice(0, RESULTS_STEP);
    batch.forEach((li) => li.classList.remove('is-hidden'));
    observeReveal(list);
    batch[0]?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
    if (hidden.length <= RESULTS_STEP) more.hidden = true;
  };
}

function renderReviews(track: HTMLElement, items: MediaItem[], strings: ClientStrings) {
  const buttons: HTMLButtonElement[] = [];
  const nodes = items.map((item, i) => {
    const li = document.createElement('li');
    li.dataset.reveal = '';
    li.style.setProperty('--d', String(Math.min(i, 4)));
    const btn = zoomButton('review-card', `${strings.lightbox.open}: ${altFor(item, strings)}`);
    const notch = document.createElement('span');
    notch.className = 'notch';
    notch.setAttribute('aria-hidden', 'true');
    btn.append(
      frame(buildImg(item, '(min-width: 768px) 280px, 64vw', altFor(item, strings))),
      notch,
    );
    buttons.push(btn);
    li.append(btn);
    return li;
  });
  track.replaceChildren(...nodes);
  bindGallery(buttons, items, strings);
}

function renderClinic(track: HTMLElement, items: MediaItem[], strings: ClientStrings) {
  const buttons: HTMLButtonElement[] = [];
  const nodes = items.map((item) => {
    const li = document.createElement('li');
    const btn = zoomButton(
      'clinic-card overflow-hidden',
      `${strings.lightbox.open}: ${altFor(item, strings)}`,
    );
    btn.append(
      frame(buildImg(item, '(min-width: 768px) 400px, 82vw', altFor(item, strings)), 'h-full'),
      zoomIcon(),
    );
    buttons.push(btn);
    li.append(btn);
    return li;
  });
  track.replaceChildren(...nodes);
  bindGallery(buttons, items, strings);
}

function renderPromo(box: HTMLElement, item: MediaItem | undefined, strings: ClientStrings) {
  if (!item) {
    box.replaceChildren();
    return;
  }
  const btn = zoomButton('w-full', `${strings.lightbox.open}: ${altFor(item, strings)}`);
  btn.append(
    frame(buildImg(item, '(min-width: 1024px) 340px, 100vw', altFor(item, strings))),
    zoomIcon(),
  );
  box.replaceChildren(btn);
  bindGallery([btn], [item], strings);
}

/* ── Asosiy chizish ─────────────────────────────────────────────────── */

function markPresence(groups: MediaGroups | null) {
  const html = document.documentElement;
  const present = groups ? MEDIA_CATEGORIES.filter((c: MediaCategory) => groups[c].length > 0) : [];
  html.setAttribute('data-m', present.join(' '));
  html.setAttribute('data-m-ready', '');
}

function render(items: MediaItem[], strings: ClientStrings) {
  const groups = groupMedia(items);

  renderPortrait(
    qs('[data-hero-media] .hero-media-inner'),
    qs<HTMLImageElement>('[data-hero-fallback]'),
    groups.hero[0],
    'hero-img-live',
    '(min-width: 1024px) 55vw, 100vw',
    strings,
    true,
  );
  renderPortrait(
    qs('[data-about-frame]'),
    qs<HTMLImageElement>('[data-about-fallback]'),
    groups.about[0],
    'about-img-live',
    '(min-width: 1024px) 480px, 100vw',
    strings,
    false,
  );

  const cert = qs('[data-gallery="certificates"]');
  if (cert) renderCertificates(cert, groups.certificates, strings);
  const results = qs('[data-gallery="results"]');
  if (results) renderResults(results, groups.results, strings);
  const reviews = qs('[data-gallery="reviews"]');
  if (reviews) renderReviews(reviews, groups.reviews, strings);
  const clinic = qs('[data-gallery="clinic"]');
  if (clinic) renderClinic(clinic, groups.clinic, strings);
  const promo = qs('[data-gallery="promo"]');
  if (promo) renderPromo(promo, groups.promo[0], strings);

  markPresence(groups);
  // Bo‘limlar ko‘ringandan keyin yangi elementlarni kuzatish
  requestAnimationFrame(() => {
    observeReveal(document);
    document.dispatchEvent(new CustomEvent('media:rendered'));
  });
}

export function initMedia(): void {
  const strings = getStrings();
  // Doimiy (build’dagi) rasmlar lightbox’i — admin rasmlaridan qat’i nazar darhol ishlaydi
  try {
    bindStatic(strings);
  } catch (error) {
    console.warn('[media] statik galereya ulanmadi:', error);
  }
  if (!isSupabaseConfigured) {
    markPresence(null);
    return;
  }

  let lastKey = '';
  const apply = (items: MediaItem[]) => {
    const key = JSON.stringify(items);
    if (key === lastKey) return;
    lastKey = key;
    render(items, strings);
  };

  const cached = readCache();
  if (cached) apply(cached);

  fetchMedia()
    .then((items) => {
      writeCache(items);
      apply(items);
    })
    .catch((error: unknown) => {
      console.warn('[media] rasmlarni yuklab bo‘lmadi — zaxira ko‘rinish ishlatiladi:', error);
      if (!cached) apply([]);
    });
}
