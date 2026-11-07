import { MEDIA_CATEGORIES, type MediaCategory } from '../../lib/media';

export interface CategoryInfo {
  label: string;
  hint: string;
  single: boolean;
  /** Saytdagi ko‘rinish nisbati (fokus nuqta preview uchun) */
  aspect: string;
}

export const CATEGORY_INFO: Record<MediaCategory, CategoryInfo> = {
  hero: {
    label: 'Asosiy portret',
    hint: 'Vertikal 4:5, kamida 1200×1500 px. Yuz markazda, fon tinch. Bitta rasm.',
    single: true,
    aspect: '4 / 5',
  },
  about: {
    label: '«Men haqimda» rasmi',
    hint: 'Vertikal 4:5. Bitta rasm.',
    single: true,
    aspect: '4 / 5',
  },
  certificates: {
    label: 'Sertifikatlar',
    hint: 'Aniq o‘qiladigan, to‘g‘ri burchakdan olingan surat. Sarlavha — sertifikat nomi, izoh — beruvchi tashkilot.',
    single: false,
    aspect: '4 / 3',
  },
  results: {
    label: 'Natijalar',
    hint: '4:5 yoki 1:1, «oldin/keyin» kollaj. Faqat mijoz roziligi bilan joylang. «Tahrirlash»da: sarlavha — muolaja nomi, izoh — natija haqida (kartaning pastida chiqadi).',
    single: false,
    aspect: '4 / 5',
  },
  reviews: {
    label: 'Mijozlar fikri',
    hint: 'Telefon skrinshoti (9:16). Mijozning ismi va rasmini yopib qo‘ying.',
    single: false,
    aspect: '9 / 16',
  },
  clinic: {
    label: 'Kabinet va ish jarayoni',
    hint: 'Gorizontal 4:3.',
    single: false,
    aspect: '4 / 3',
  },
  promo: {
    label: 'Aksiya banneri',
    hint: '4:5 yoki 1:1. Bitta rasm — aksiya kartasining yonida ko‘rinadi.',
    single: true,
    aspect: '4 / 5',
  },
};

export const CATEGORY_ORDER: readonly MediaCategory[] = MEDIA_CATEGORIES;

export const MSG = {
  added: 'Rasm saytga qo‘shildi',
  saved: 'O‘zgarishlar saqlandi',
  deleted: 'Rasm o‘chirildi',
  notImage: 'Bu fayl rasm emas',
  tooLarge: 'Fayl juda katta (25 MB dan oshmasin)',
  network: 'Internet bilan muammo — qayta urinib ko‘ring',
  saveFailed: 'Saqlab bo‘lmadi, qayta urinib ko‘ring',
  decodeFailed: 'Rasmni o‘qib bo‘lmadi — boshqa fayl tanlang',
  deleteFileFailed: 'Faylni ombordan o‘chirib bo‘lmadi, qayta urinib ko‘ring',
  deleteRowFailed: 'Yozuvni o‘chirib bo‘lmadi, qayta urinib ko‘ring',
  reorderFailed: 'Tartibni saqlab bo‘lmadi, qayta urinib ko‘ring',
  wrongCredentials: 'Login yoki parol noto‘g‘ri',
  notAdmin: 'Sizda admin huquqi yo‘q',
  storageNotConfigured:
    'Rasm ombori (Cloudflare R2) sozlanmagan — Netlify’dagi R2_* o‘zgaruvchilarini tekshiring',
  sessionExpired: 'Sessiya tugagan — sahifani yangilab, qayta kiring',
  fileTooLargeServer: 'Rasm juda katta — kichikroq fayl tanlang',
} as const;

/**
 * Supabase faqat email bilan kiritadi — shuning uchun oddiy login (masalan `dilrabo_kosmetolog`)
 * ichki email’ga aylantiriladi. `.invalid` domeni hech qachon xat qabul qilmaydi (RFC 2606),
 * ya’ni bu manzilga parol tiklash havolasi hech kimga yetib bormaydi.
 */
export const ADMIN_LOGIN_DOMAIN = 'dilrabo.invalid';

export function loginToEmail(login: string): string {
  const value = login.trim().toLowerCase();
  return value.includes('@') ? value : `${value}@${ADMIN_LOGIN_DOMAIN}`;
}

/** Xatoni tushunarli xabarga aylantirish */
export function errorText(error: unknown): string {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return MSG.network;
  const status = Number((error as { status?: unknown } | null)?.status);
  if (status === 503) return MSG.storageNotConfigured;
  if (status === 401) return MSG.sessionExpired;
  if (status === 403) return MSG.notAdmin;
  if (status === 413) return MSG.fileTooLargeServer;
  const text = error instanceof Error ? error.message : String(error ?? '');
  if (
    /failed to fetch|networkerror|load failed|network request failed|timeout|aborted/i.test(text)
  ) {
    return MSG.network;
  }
  return MSG.saveFailed;
}

/** 4xx xatolarda qayta urinish foydasiz */
export function isRetryable(error: unknown): boolean {
  if (!error || typeof error !== 'object') return true;
  const e = error as { status?: unknown; statusCode?: unknown };
  const status = Number(e.status ?? e.statusCode);
  return !(Number.isFinite(status) && status >= 400 && status < 500);
}
