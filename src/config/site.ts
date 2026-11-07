/**
 * ┌───────────────────────────────────────────────────────────────────┐
 * │  SAYTNING BARCHA ASOSIY MA’LUMOTLARI SHU YERDA.                     │
 * │  `[[...]]` belgili joylarni buyurtmachi to‘ldiradi.                │
 * │  Bo‘sh qoldirilsa ('' yoki null) — saytda zaxira matn chiqadi       │
 * │  yoki element umuman ko‘rsatilmaydi.                               │
 * └───────────────────────────────────────────────────────────────────┘
 */

export interface Localized<T = string> {
  uz: T;
  ru: T;
}

export interface SiteConfig {
  brand: string;
  brandSecond: string;
  name: Localized;
  phone: { display: string; tel: string };
  instagram: { handle: string; url: string; direct: string; followers: string };
  telegram: string;
  address: { cabinet: Localized; street: Localized };
  hours: Localized;
  openingHoursSchema: string[];
  maps: { yandex: string; google: string };
  experienceYears: number | null;
  clients: string;
  promo: { active: boolean; price: number };
  since: number;
}

export const site: SiteConfig = {
  /** Brend nomi (ikkala tilda lotinda) */
  brand: 'DILRABO',
  brandSecond: 'RAXIMBERDIEVNA',

  name: {
    uz: 'Dilrabo Raximberdievna',
    ru: 'Дилрабо Рахимбердиевна',
  },

  phone: {
    display: '+998 97 723 26 26',
    tel: '+998977232626',
  },

  instagram: {
    handle: 'dilrabocosmetolog',
    url: 'https://www.instagram.com/dilrabocosmetolog/',
    direct: 'https://ig.me/m/dilrabocosmetolog',
    followers: '55.8K',
  },

  /** [[TELEGRAM]] — masalan 'https://t.me/username'. Bo‘sh bo‘lsa ko‘rsatilmaydi. */
  telegram: '',

  address: {
    /** [[KABINET_NOMI / mo‘ljal binosi]] */
    cabinet: { uz: '', ru: '' },
    /** [[ANIQ_MANZIL]] — «Toshkent, » dan keyingi qism, masalan «Chilonzor tumani, ...» */
    street: { uz: '', ru: '' },
  },

  /** [[ISH_VAQTI]] — masalan { uz: 'Du–Sh, 10:00–19:00', ru: 'Пн–Сб, 10:00–19:00' } */
  hours: { uz: '', ru: '' },

  /** Schema.org formatida ish vaqti (ixtiyoriy), masalan ['Mo-Sa 10:00-19:00'] */
  openingHoursSchema: [],

  maps: {
    /** [[YANDEX_MAP_URL]] */
    yandex: '',
    /** [[GOOGLE_MAP_URL]] */
    google: '',
  },

  /** [[TAJRIBA_YILI]] — masalan 8. null bo‘lsa uchinchi statistika — Instagram obunachilar. */
  experienceYears: null,

  clients: '5000+',

  promo: {
    /** [[AKSIYA HALI AMALDAMI?]] — false bo‘lsa aksiya kartasi va «Aksiyalar» tabi yashiriladi */
    active: true,
    price: 600000,
  },

  /** Sayt yaratilgan yil (© uchun); joriy yil avtomatik qo‘shiladi */
  since: 2026,
};

/** Bo‘sh bo‘lmagan qiymatni tekshiradi */
export function has(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
