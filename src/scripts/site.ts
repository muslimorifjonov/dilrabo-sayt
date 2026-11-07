/**
 * Ommaviy sahifa skripti (kutubxonasiz, React yo‘q).
 * Har bir modul alohida himoyalangan — bittasidagi xato boshqalarini to‘xtatmaydi.
 */
import { initMedia } from './media-render';
import {
  initCarousels,
  initCounters,
  initCtaBar,
  initFaq,
  initHeader,
  initLangSwitch,
  initMobileMenu,
  initMotion,
  initPriceTabs,
  initScrollLoop,
  initScrollSpy,
  initYear,
  observeReveal,
} from './ui';

const steps: [string, () => void][] = [
  ['header', initHeader],
  ['motion', initMotion],
  ['scroll', initScrollLoop],
  ['spy', initScrollSpy],
  ['lang', initLangSwitch],
  ['menu', initMobileMenu],
  ['reveal', () => observeReveal(document)],
  ['counters', initCounters],
  ['faq', initFaq],
  ['tabs', initPriceTabs],
  ['carousels', initCarousels],
  ['cta', initCtaBar],
  ['year', initYear],
  ['media', initMedia],
];

for (const [name, fn] of steps) {
  try {
    fn();
  } catch (error) {
    console.warn(`[site] ${name} ishga tushmadi:`, error);
  }
}

window.__siteReady = true;
