import type { ImageMetadata } from 'astro';
import type { Localized } from '../config/site';
import bazisMedic from '../assets/certificates/bazis-medic-diplom.jpg';
import botulino from '../assets/certificates/botulinoterapiya.jpg';
import giperpigmentatsiya from '../assets/certificates/giperpigmentatsiya.jpg';
import lifting from '../assets/certificates/lifting.jpg';
import grandCeremony from '../assets/certificates/pelart-grand-ceremony.jpg';
import yogliTeri from '../assets/certificates/yogli-teri.jpg';

/**
 * Saytga doimiy joylangan diplom va sertifikatlar (build vaqtida WebP’ga optimallashtiriladi).
 * Admin paneldan yuklangan sertifikatlar shulardan keyin avtomatik qo‘shiladi.
 *
 * Yangi hujjat qo‘shish: rasmni `src/assets/certificates/` ga qo‘ying va shu ro‘yxatga yozing.
 */
export interface Certificate {
  id: string;
  image: ImageMetadata;
  kind: 'diploma' | 'certificate';
  title: Localized;
  issuer: Localized;
  /** ISO sana (YYYY-MM-DD) yoki null — hujjatda sana bo‘lmasa */
  date: string | null;
}

export const certificates: Certificate[] = [
  {
    id: 'bazis-medic',
    image: bazisMedic,
    kind: 'diploma',
    title: { uz: 'Kosmetolog-estet', ru: 'Косметолог-эстет' },
    issuer: {
      uz: 'Bazis Medic — kosmetologiya va estetik tibbiyot maktabi',
      ru: 'Bazis Medic — школа косметологии и эстетической медицины',
    },
    date: null,
  },
  {
    id: 'botulinoterapiya',
    image: botulino,
    kind: 'certificate',
    title: { uz: 'Botulinoterapiya kursi', ru: 'Курс по ботулинотерапии' },
    issuer: { uz: 'CV Cosmetology School', ru: 'CV Cosmetology School' },
    date: '2025-06-27',
  },
  {
    id: 'lifting',
    image: lifting,
    kind: 'certificate',
    title: {
      uz: 'Yuzning pastki uchdan bir qismi liftingi',
      ru: 'Лифтинг нижней трети лица',
    },
    issuer: { uz: 'CV Cosmetology · seminar', ru: 'CV Cosmetology · семинар' },
    date: '2025-01-30',
  },
  {
    id: 'giperpigmentatsiya',
    image: giperpigmentatsiya,
    kind: 'diploma',
    title: {
      uz: 'Giperpigmentatsiyani davolashning samarali usullari',
      ru: 'Эффективные методы лечения гиперпигментации',
    },
    issuer: { uz: 'Pelart Laboratory · seminar', ru: 'Pelart Laboratory · семинар' },
    date: '2025-01-23',
  },
  {
    id: 'yogli-teri',
    image: yogliTeri,
    kind: 'diploma',
    title: {
      uz: 'Yog‘li va muammoli terini davolashga zamonaviy yondashuvlar',
      ru: 'Современные подходы к лечению жирной и проблемной кожи',
    },
    issuer: { uz: 'Pelart Laboratory · seminar', ru: 'Pelart Laboratory · семинар' },
    date: '2025-01-16',
  },
  {
    id: 'pelart-grand-ceremony',
    image: grandCeremony,
    kind: 'certificate',
    title: { uz: 'Pelart Grand Ceremony ishtirokchisi', ru: 'Участник Pelart Grand Ceremony' },
    issuer: { uz: 'Pelart Laboratory · CV Cosmetology', ru: 'Pelart Laboratory · CV Cosmetology' },
    date: '2025-06-03',
  },
];

/** Ta’lim markazlari (sertifikatlar bo‘limi tepasidagi qator) */
export const certificateSchools: string[] = [
  'Bazis Medic',
  'Pelart Laboratory',
  'CV Cosmetology School',
];

/** 2025-06-27 → 27.06.2025 */
export function formatCertDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}
