// Vizual effektlar: aurora fon, scroll-reveal, konfetti, raqam animatsiyasi.
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function aurora() {
  if (document.querySelector('.aurora')) return;
  const el = document.createElement('div');
  el.className = 'aurora';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<span></span><span></span><span></span><i class="grain"></i>';
  document.body.prepend(el);
}

export function reveal(root = document) {
  const items = root.querySelectorAll('[data-reveal]:not(.in)');
  if (!('IntersectionObserver' in window) || reduced()) { items.forEach((e) => e.classList.add('in')); return; }
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  items.forEach((e, i) => { e.style.setProperty('--d', `${(i % 6) * 70}ms`); io.observe(e); });
}

/** Raqamni 0 dan qiymatgacha silliq oshiradi. */
export function countUp(el, to, ms = 900) {
  if (reduced() || !to) { el.textContent = to; return; }
  const t0 = performance.now();
  const step = (t) => {
    const k = Math.min(1, (t - t0) / ms);
    el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/** Yengil konfetti (canvas), tashqi kutubxonasiz. */
export function confetti(n = 140) {
  if (reduced()) return;
  const c = document.createElement('canvas');
  c.className = 'confetti';
  document.body.append(c);
  const ctx = c.getContext('2d');
  const dpr = devicePixelRatio || 1;
  c.width = innerWidth * dpr; c.height = innerHeight * dpr;
  ctx.scale(dpr, dpr);
  const colors = ['#8b5cf6', '#ec4899', '#22d3ee', '#facc15', '#34d399', '#fb7185'];
  const ps = Array.from({ length: n }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * 200, y: innerHeight * 0.35,
    vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 14 - 4,
    s: 6 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
    c: colors[(Math.random() * colors.length) | 0],
  }));
  const t0 = performance.now();
  const frame = (t) => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of ps) {
      p.vy += 0.35; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
      ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore();
    }
    if (t - t0 < 3500) requestAnimationFrame(frame); else c.remove();
  };
  requestAnimationFrame(frame);
}
