/** Ming ajratgich va valyuta oldidagi bo‘shliq — bo‘linmaydigan bo‘shliq (U+00A0). */
export const NBSP = ' ';

/** 600000 → «600 000» (Intl ishlatilmaydi — bo‘shliq turi brauzerga qarab farq qiladi) */
export function formatNumber(value: number): string {
  const sign = value < 0 ? '-' : '';
  const digits = Math.abs(Math.round(value)).toString();
  return sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
}

export interface PriceLabels {
  currency: string;
  fromPrefix: string;
  fromSuffix: string;
}

/**
 * UZ: «600 000 so‘m», «300 000 so‘mdan»
 * RU: «600 000 сум», «от 300 000 сум»
 */
export function formatPrice(value: number, labels: PriceLabels, from = false): string {
  const core = `${formatNumber(value)}${NBSP}${labels.currency}`;
  if (!from) return core;
  return `${labels.fromPrefix}${core}${labels.fromSuffix}`;
}

/** Joriy yil bilan © oralig‘i: 2026 yoki 2026–2027 */
export function copyrightYears(since: number, now = new Date().getFullYear()): string {
  return now > since ? `${since}–${now}` : String(since);
}
