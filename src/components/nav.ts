import { certificates } from '../data/certificates';
import type { Dict } from '../i18n';
import type { MediaCategory } from '../lib/media';

/** Doimiy sertifikatlar bor bo‘lsa — havola har doim ko‘rinadi */
const certReq: MediaCategory | undefined = certificates.length > 0 ? undefined : 'certificates';

export interface NavItem {
  id: string;
  label: string;
  /** Shu kategoriyada rasm bo‘lmasa — havola yashiriladi */
  req?: MediaCategory;
}

/** Desktop menyu (7 ta) */
export function desktopNav(t: Dict): NavItem[] {
  return [
    { id: 'about', label: t.nav.about },
    { id: 'certificates', label: t.nav.certificates, req: certReq },
    { id: 'services', label: t.nav.services },
    { id: 'results', label: t.nav.results, req: 'results' },
    { id: 'prices', label: t.nav.prices },
    { id: 'location', label: t.nav.location },
    { id: 'faq', label: t.nav.faq },
  ];
}

/** Mobil menyu (01–09), sahifadagi tartibda */
export function mobileNav(t: Dict): NavItem[] {
  return [
    { id: 'about', label: t.nav.about },
    { id: 'certificates', label: t.nav.certificates, req: certReq },
    { id: 'services', label: t.nav.services },
    { id: 'results', label: t.nav.results, req: 'results' },
    { id: 'prices', label: t.nav.prices },
    { id: 'reviews', label: t.nav.reviews, req: 'reviews' },
    { id: 'location', label: t.nav.location },
    { id: 'faq', label: t.nav.faq },
    { id: 'contact', label: t.nav.contact },
  ];
}
