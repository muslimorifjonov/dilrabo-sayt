import { ru } from './ru';
import type { Dict, Locale } from './types';
import { uz } from './uz';

export type { Dict, Locale } from './types';

export const locales: readonly Locale[] = ['uz', 'ru'];

const dicts: Record<Locale, Dict> = { uz, ru };

export function getDict(locale: Locale): Dict {
  return dicts[locale];
}

/** Bosh sahifa yo‘li: uz → '/', ru → '/ru/' */
export function homePath(locale: Locale): string {
  return locale === 'uz' ? '/' : '/ru/';
}

export interface Part {
  text: string;
  accent: boolean;
}

/** «Bilim va *mehr*» → [{text:'Bilim va ', accent:false}, {text:'mehr', accent:true}] */
export function splitAccent(input: string): Part[] {
  return input
    .split(/(\*[^*]+\*)/g)
    .filter((chunk) => chunk.length > 0)
    .map((chunk) =>
      chunk.startsWith('*') && chunk.endsWith('*')
        ? { text: chunk.slice(1, -1), accent: true }
        : { text: chunk, accent: false },
    );
}

/** Sarlavhadan `*` belgilarini olib tashlaydi (aria-label, meta uchun) */
export function plain(input: string): string {
  return input.replace(/\*/g, '');
}
