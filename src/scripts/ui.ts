import { finePointer, prefersReducedMotion, qs, qsa, rafThrottle } from './env';

/* ───────────────────────── Scroll: header, progress, parallax ───────────────────────── */

type ScrollFn = (y: number, vh: number) => void;
const scrollSubs: ScrollFn[] = [];

function onScroll(fn: ScrollFn): void {
  scrollSubs.push(fn);
}

export function initScrollLoop(): void {
  const run = rafThrottle(() => {
    const y = window.scrollY;
    const vh = window.innerHeight;
    for (const fn of scrollSubs) fn(y, vh);
  });
  window.addEventListener('scroll', run, { passive: true });
  window.addEventListener('resize', run, { passive: true });
  run();
}

export function initHeader(): void {
  const header = qs('[data-header]');
  const progress = qs('[data-progress]');
  if (!header) return;
  onScroll((y, vh) => {
    header.classList.toggle('is-scrolled', y > 24);
    if (progress) {
      const max = document.documentElement.scrollHeight - vh;
      progress.style.setProperty('--progress', (max > 0 ? Math.min(1, y / max) : 0).toFixed(4));
    }
  });
}

/* ───────────────────────── Scrollspy (aktiv menyu) ───────────────────────── */

let currentSection = '';

export function initScrollSpy(): void {
  const links = qsa<HTMLAnchorElement>('[data-nav-link]');
  const ids = [
    'top',
    'about',
    'certificates',
    'services',
    'results',
    'prices',
    'reviews',
    'location',
    'faq',
    'contact',
  ];
  const sections = ids
    .map((id) => document.getElementById(id))
    .filter((s): s is HTMLElement => !!s);
  if (!('IntersectionObserver' in window) || sections.length === 0) return;

  const setActive = (id: string) => {
    currentSection = id;
    for (const a of links) {
      const active = a.dataset.navLink === id;
      a.classList.toggle('is-active', active);
      if (active) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    }
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
    },
    { rootMargin: '-42% 0px -56% 0px', threshold: 0 },
  );
  sections.forEach((s) => io.observe(s));
}

/* ───────────────────────── Til almashtirgich: anchor saqlanadi ───────────────────────── */

export function initLangSwitch(): void {
  for (const a of qsa<HTMLAnchorElement>('[data-lang-link]')) {
    a.addEventListener('click', (e) => {
      if (a.getAttribute('aria-current') === 'true') {
        e.preventDefault();
        return;
      }
      const hash = window.location.hash.slice(1);
      const id = currentSection && currentSection !== 'top' ? currentSection : hash;
      if (id && /^[a-z-]+$/.test(id)) {
        e.preventDefault();
        window.location.href = `${a.pathname}#${id}`;
      }
    });
  }
}

/* ───────────────────────── Mobil menyu: Esc, scroll bloki, focus trap ───────────────────────── */

export function initMobileMenu(): void {
  const burger = qs<HTMLButtonElement>('[data-burger]');
  const menu = qs('[data-mobile-menu]');
  if (!burger || !menu) return;
  const html = document.documentElement;
  let open = false;

  const focusables = (): HTMLElement[] =>
    [burger, ...qsa<HTMLElement>('a[href], button:not([disabled])', menu)].filter(
      (el) => el.offsetParent !== null || el === burger,
    );

  const setOpen = (value: boolean, restoreFocus = true) => {
    open = value;
    burger.setAttribute('aria-expanded', String(value));
    burger.setAttribute(
      'aria-label',
      (value ? burger.dataset.labelClose : burger.dataset.labelOpen) ?? '',
    );
    menu.classList.toggle('is-open', value);
    menu.inert = !value;
    html.classList.toggle('menu-open', value);
    html.classList.toggle('is-locked', value);
    if (value) {
      window.setTimeout(() => qs<HTMLElement>('a[href]', menu)?.focus({ preventScroll: true }), 60);
    } else if (restoreFocus) {
      burger.focus({ preventScroll: true });
    }
  };

  burger.addEventListener('click', () => setOpen(!open));

  menu.addEventListener('click', (e) => {
    const link = (e.target as Element).closest('a');
    if (link) setOpen(false, false);
  });

  document.addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === 'Tab') {
      const items = focusables();
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (!items.includes(active as HTMLElement)) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  window.matchMedia('(min-width: 1200px)').addEventListener('change', (e) => {
    if (e.matches && open) setOpen(false, false);
  });
}

/* ───────────────────────── Scroll reveal ───────────────────────── */

let revealObserver: IntersectionObserver | null = null;

export function observeReveal(root: ParentNode = document): void {
  const els = qsa('[data-reveal]:not(.is-in)', root);
  if (root instanceof HTMLElement && root.matches('[data-reveal]:not(.is-in)')) els.push(root);
  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-in'));
    return;
  }
  revealObserver ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealObserver?.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -4% 0px' },
  );
  els.forEach((el) => revealObserver?.observe(el));
}

/* ───────────────────────── Raqamlar sanog‘i ───────────────────────── */

export function initCounters(): void {
  const els = qsa('[data-count]');
  if (els.length === 0 || prefersReducedMotion() || !('IntersectionObserver' in window)) return;

  const ease = (x: number) => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x));

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        io.unobserve(entry.target);
        const el = entry.target as HTMLElement;
        const target = Number.parseFloat(el.dataset.count ?? '');
        const decimals = Number.parseInt(el.dataset.decimals ?? '0', 10) || 0;
        const suffix = el.dataset.suffix ?? '';
        const finalText = el.dataset.final ?? el.textContent ?? '';
        const start = performance.now();
        const duration = 1700;
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / duration);
          el.textContent = `${(target * ease(p)).toFixed(decimals)}${suffix}`;
          if (p < 1) requestAnimationFrame(tick);
          else el.textContent = finalText;
        };
        requestAnimationFrame(tick);
      }
    },
    { threshold: 0.6 },
  );

  for (const el of els) {
    const target = Number.parseFloat(el.dataset.count ?? '');
    if (!Number.isFinite(target)) continue;
    el.dataset.final = el.textContent?.trim() ?? '';
    const decimals = Number.parseInt(el.dataset.decimals ?? '0', 10) || 0;
    el.textContent = `${(0).toFixed(decimals)}${el.dataset.suffix ?? ''}`;
    io.observe(el);
  }
}

/* ───────────────────────── FAQ akkordeon (bitta ochiq) ───────────────────────── */

export function initFaq(): void {
  const list = qs('[data-faq]');
  if (!list) return;
  list.addEventListener('click', (e) => {
    const btn = (e.target as Element).closest<HTMLButtonElement>('[data-faq-toggle]');
    if (!btn) return;
    const item = btn.closest('.faq-item');
    if (!item) return;
    const willOpen = !item.classList.contains('is-open');
    for (const other of qsa('.faq-item.is-open', list)) {
      if (other === item) continue;
      other.classList.remove('is-open');
      qs('[data-faq-toggle]', other)?.setAttribute('aria-expanded', 'false');
    }
    item.classList.toggle('is-open', willOpen);
    btn.setAttribute('aria-expanded', String(willOpen));
  });
}

/* ───────────────────────── Narx tablari ───────────────────────── */

export function initPriceTabs(): void {
  const root = qs('[data-prices]');
  const panel = qs('[data-price-panel]');
  if (!root || !panel) return;
  const tabs = qsa<HTMLButtonElement>('[role="tab"]', root);

  const apply = (cat: string) => {
    for (const el of qsa('[data-cat]', panel)) {
      const show = cat === 'all' || el.dataset.cat === cat;
      el.classList.toggle('is-filtered', !show);
    }
    const list = qs('[data-price-list]', panel);
    if (list) {
      const any = qsa('.price-group:not(.is-filtered)', list).length > 0;
      list.classList.toggle('is-filtered', !any);
    }
  };

  let timer = 0;
  const select = (tab: HTMLButtonElement, focus = false) => {
    for (const t of tabs) {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    }
    if (focus) tab.focus();
    tab.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    panel.setAttribute('aria-labelledby', tab.id);
    const cat = tab.dataset.tab ?? 'all';
    window.clearTimeout(timer);
    if (prefersReducedMotion()) {
      apply(cat);
      return;
    }
    panel.classList.add('is-fading');
    timer = window.setTimeout(() => {
      apply(cat);
      panel.classList.remove('is-fading');
    }, 200);
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', (e) => {
      let next = -1;
      if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      const target = tabs[next];
      if (target) {
        e.preventDefault();
        select(target, true);
      }
    });
  });
}

/* ───────────────────────── Karusellar (scroll-snap + o‘qlar) ───────────────────────── */

export function initCarousels(): void {
  for (const root of qsa('[data-carousel]')) {
    const track = qs('[data-carousel-track]', root);
    const prev = qs<HTMLButtonElement>('[data-carousel-prev]', root);
    const next = qs<HTMLButtonElement>('[data-carousel-next]', root);
    if (!track) continue;

    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      if (prev) prev.disabled = track.scrollLeft <= 4;
      if (next) next.disabled = track.scrollLeft >= max - 4;
    };

    const step = (): number => {
      const first = track.firstElementChild as HTMLElement | null;
      const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 16;
      const card = first ? first.getBoundingClientRect().width + gap : track.clientWidth * 0.8;
      return Math.max(1, Math.floor(track.clientWidth / card)) * card;
    };

    const go = (dir: 1 | -1) =>
      track.scrollBy({ left: dir * step(), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });

    prev?.addEventListener('click', () => go(-1));
    next?.addEventListener('click', () => go(1));
    track.addEventListener('scroll', rafThrottle(update), { passive: true });
    window.addEventListener('resize', rafThrottle(update), { passive: true });
    document.addEventListener('media:rendered', () => requestAnimationFrame(update));
    update();
  }
}

/* ───────────────────────── Mobil CTA paneli ───────────────────────── */

export function initCtaBar(): void {
  const bar = qs('[data-cta-bar]');
  const heroActions = qs('.hero-actions');
  const contact = qs('[data-contact]');
  if (!bar || !heroActions || !('IntersectionObserver' in window)) return;
  let heroVisible = true;
  let contactVisible = false;

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.target === heroActions) heroVisible = e.isIntersecting || e.boundingClientRect.top > 0;
      if (e.target === contact) contactVisible = e.isIntersecting;
    }
    const show = !heroVisible && !contactVisible;
    bar.classList.toggle('is-visible', show);
    bar.inert = !show;
  });
  io.observe(heroActions);
  if (contact) io.observe(contact);
}

/* ───────────────────────── Parallaks, spotlight, watermark ───────────────────────── */

export function initMotion(): void {
  if (prefersReducedMotion()) return;

  // Hero: sichqoncha bilan yengil parallaks (faqat desktop)
  const hero = qs('[data-hero]');
  if (hero && finePointer()) {
    let px = 0;
    let py = 0;
    const apply = rafThrottle(() => {
      hero.style.setProperty('--px', px.toFixed(3));
      hero.style.setProperty('--py', py.toFixed(3));
    });
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      px = (e.clientX - r.left) / r.width - 0.5;
      py = (e.clientY - r.top) / r.height - 0.5;
      apply();
    });
    hero.addEventListener('pointerleave', () => {
      px = 0;
      py = 0;
      apply();
    });
  }

  // Hero portreti: scroll bilan sekin siljish (desktop)
  const portrait = qs('[data-scroll-parallax]');
  const desktop = window.matchMedia('(min-width: 1024px)');
  if (portrait) {
    onScroll((y, vh) => {
      if (!desktop.matches || y > vh * 1.2) {
        if (!desktop.matches) portrait.style.translate = '';
        return;
      }
      portrait.style.translate = `0 ${(y * 0.12).toFixed(1)}px`;
    });
  }

  // Aloqa paneli: ulkan watermark sekin suzadi
  const wm = qs('[data-watermark]');
  if (wm) {
    onScroll((_y, vh) => {
      const r = wm.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      const shift = (r.top + r.height / 2 - vh / 2) * -0.08;
      wm.style.setProperty('--wm-shift', `${shift.toFixed(1)}px`);
    });
  }

  // Xizmat kartalari: kursor ortidan pushti nur
  const grid = qs('[data-spotlight]');
  if (grid && finePointer()) {
    grid.addEventListener('pointermove', (e) => {
      const card = (e.target as Element).closest<HTMLElement>('.svc-card');
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  }
}

/* ───────────────────────── Footer yili ───────────────────────── */

export function initYear(): void {
  const el = qs('[data-year]');
  if (!el) return;
  const text = el.textContent ?? '';
  const since = Number.parseInt(text, 10);
  const now = new Date().getFullYear();
  if (Number.isFinite(since) && now > since) el.textContent = `${since}–${now}`;
}
