export type Locale = 'uz' | 'ru';

/**
 * Har ikki til fayli (uz.ts, ru.ts) aynan shu tipga bo‘ysunadi.
 * Bitta kalit yetishmasa — `astro check` / `tsc` xato beradi.
 *
 * Sarlavhalarda `*so‘z*` — italic + brend rangida ko‘rsatiladi.
 */
export interface Dict {
  locale: Locale;
  htmlLang: string;
  ogLocale: string;

  meta: {
    title: string;
    description: string;
    ogImageAlt: string;
  };

  logoSub: string;

  nav: {
    about: string;
    certificates: string;
    services: string;
    results: string;
    prices: string;
    reviews: string;
    location: string;
    faq: string;
    contact: string;
  };

  header: {
    book: string;
    menuOpen: string;
    menuClose: string;
    navLabel: string;
    langLabel: string;
    skip: string;
    phoneLabel: string;
  };

  hero: {
    eyebrow: string;
    h1: string;
    lead: string;
    book: string;
    call: string;
    quickLabel: string;
    scroll: string;
    badgeClients: string;
    badgeClientsSub: string;
    badgeFollowers: string;
    badgeFollowersSub: string;
    portraitAlt: string;
  };

  marquee: string[];

  about: {
    eyebrow: string;
    title: string;
    text: string;
    statClientsLabel: string;
    statEduValue: string;
    statEduLabel: string;
    statExpLabel: string;
    statFollowersLabel: string;
    portraitAlt: string;
    ring: string;
    clinicEyebrow: string;
    clinicTitle: string;
    clinicAlt: string;
    /** «Ish jarayonida» — kichik rasm yorlig‘i */
    atWork: string;
    atWorkAlt: string;
  };

  certificates: {
    eyebrow: string;
    title: string;
    hint: string;
    altFallback: string;
    kindDiploma: string;
    kindCertificate: string;
    schoolsLabel: string;
  };

  services: {
    eyebrow: string;
    title: string;
    lead: string;
  };

  results: {
    eyebrow: string;
    title: string;
    note: string;
    more: string;
    altFallback: string;
    /** Karta ustidagi «Oldin · Keyin» belgisi */
    before: string;
    after: string;
  };

  prices: {
    eyebrow: string;
    title: string;
    note: string;
    tabsLabel: string;
    tabs: { all: string; care: string; injection: string; promo: string };
    consult: string;
    currency: string;
    fromPrefix: string;
    fromSuffix: string;
    promo: {
      badge: string;
      title: string;
      includesLabel: string;
      items: string[];
      gift: string;
      cta: string;
      imageAlt: string;
    };
  };

  reviews: {
    eyebrow: string;
    title: string;
    note: string;
    more: string;
    prev: string;
    next: string;
    altFallback: string;
  };

  location: {
    eyebrow: string;
    title: string;
    cabinet: string;
    address: string;
    city: string;
    landmark: string;
    landmarkValue: string;
    hours: string;
    hoursFallback: string;
    yandex: string;
    google: string;
    pinLabel: string;
    pinSub: string;
    metroName: string;
    mapLabel: string;
  };

  faq: {
    eyebrow: string;
    title: string;
    lead: string;
    ask: string;
  };

  contact: {
    eyebrow: string;
    title: string;
    text: string;
    bookTitle: string;
    bookSub: string;
    callTitle: string;
    telegramTitle: string;
    telegramSub: string;
  };

  footer: {
    tagline: string;
    disclaimer: string;
    rights: string;
    toTop: string;
  };

  cta: {
    book: string;
    call: string;
  };

  lightbox: {
    close: string;
    prev: string;
    next: string;
    zoom: string;
    open: string;
  };

  common: {
    newTab: string;
    instagram: string;
    phone: string;
    telegram: string;
  };
}
