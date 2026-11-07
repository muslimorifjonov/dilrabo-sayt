import type { Locale } from '../i18n/types';
import type { MediaCategory } from '../lib/media';

export interface ClientStrings {
  locale: Locale;
  alt: Record<MediaCategory, string>;
  lightbox: { close: string; prev: string; next: string; zoom: string; open: string };
  results: { before: string; after: string };
}

const FALLBACK: ClientStrings = {
  locale: 'uz',
  alt: {
    hero: 'Dilrabo Raximberdievna',
    about: 'Dilrabo Raximberdievna',
    certificates: 'Dilrabo Raximberdievna — sertifikat',
    results: 'Dilrabo Raximberdievna — muolaja natijasi',
    reviews: 'Mijoz fikri',
    clinic: 'Kabinet',
    promo: 'Aksiya',
  },
  lightbox: {
    close: 'Yopish',
    prev: 'Oldingi',
    next: 'Keyingi',
    zoom: 'Kattalashtirish',
    open: '',
  },
  results: { before: 'Oldin', after: 'Keyin' },
};

let cached: ClientStrings | null = null;

export function getStrings(): ClientStrings {
  if (cached) return cached;
  try {
    const el = document.getElementById('client-strings');
    cached = el?.textContent ? (JSON.parse(el.textContent) as ClientStrings) : FALLBACK;
  } catch {
    cached = FALLBACK;
  }
  return cached;
}

export const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const finePointer = (): boolean =>
  window.matchMedia('(hover: hover) and (pointer: fine)').matches;

export function qs<T extends Element = HTMLElement>(
  sel: string,
  root: ParentNode = document,
): T | null {
  return root.querySelector<T>(sel);
}

export function qsa<T extends Element = HTMLElement>(
  sel: string,
  root: ParentNode = document,
): T[] {
  return Array.from(root.querySelectorAll<T>(sel));
}

/** rAF bilan cheklangan chaqiruv (scroll/resize uchun) */
export function rafThrottle(fn: () => void): () => void {
  let queued = false;
  return () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      fn();
    });
  };
}
