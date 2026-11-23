import { aggregate, pct, cloudSize } from './results.js';
import { h } from './ui.js';

const COLORS = 8; // CSS: --c0 … --c7

/** Slayd natijasini konteynerga chizadi. opts: { hidden, revealed } */
export function renderResults(container, slide, responses, opts = {}) {
  const agg = aggregate(slide, responses);
  const prev = container.dataset.kind;
  if (prev !== agg.kind || container.dataset.slide !== slide.id) {
    container.replaceChildren();
    container.dataset.kind = agg.kind;
    container.dataset.slide = slide.id;
  }
  container.classList.toggle('is-hidden', !!opts.hidden);

  if (agg.kind === 'bars') renderBars(container, slide, agg, opts);
  else if (agg.kind === 'scale') renderScale(container, slide, agg);
  else if (agg.kind === 'cloud') renderCloud(container, agg);
  else if (agg.kind === 'wall') renderWall(container, agg);
  return agg;
}

function renderBars(el, slide, agg, { revealed }) {
  const max = Math.max(1, ...agg.counts);
  let wrap = el.querySelector('.bars');
  if (!wrap || wrap.children.length !== agg.counts.length) {
    wrap = h('div', { class: 'bars' }, slide.options.map((o, i) =>
      h('div', { class: 'bar', style: { '--c': `var(--c${i % COLORS})` } },
        h('div', { class: 'bar-val' }, h('span', { class: 'bar-num' }), h('span', { class: 'bar-pct' })),
        h('div', { class: 'bar-track' }, h('div', { class: 'bar-fill' })),
        h('div', { class: 'bar-label' }, o))));
    el.replaceChildren(wrap);
  }
  [...wrap.children].forEach((b, i) => {
    b.querySelector('.bar-fill').style.height = `${(agg.counts[i] / max) * 100}%`;
    b.querySelector('.bar-num').textContent = agg.counts[i];
    b.querySelector('.bar-pct').textContent = `${pct(agg.counts[i], agg.total)}%`;
    b.querySelector('.bar-label').textContent = slide.options[i];
    const correct = slide.type === 'quiz' && revealed;
    b.classList.toggle('correct', correct && i === slide.settings?.correct);
    b.classList.toggle('dim', correct && i !== slide.settings?.correct);
  });
}

function renderScale(el, slide, agg) {
  const { min = 1, max = 5, min_label = '', max_label = '' } = slide.settings || {};
  el.replaceChildren(h('div', { class: 'scale' },
    slide.options.map((o, i) => {
      const a = agg.averages[i];
      const pos = a == null ? 0 : ((a - min) / Math.max(1, max - min)) * 100;
      return h('div', { class: 'scale-row' },
        h('div', { class: 'scale-label' }, o),
        h('div', { class: 'scale-track' },
          h('div', { class: 'scale-fill', style: { width: `${pos}%`, '--c': `var(--c${i % COLORS})` } }),
          a == null ? null : h('div', { class: 'scale-dot', style: { left: `${pos}%`, '--c': `var(--c${i % COLORS})` } }, a.toFixed(1))));
    }),
    h('div', { class: 'scale-ends' }, h('span', {}, `${min} · ${min_label}`), h('span', {}, `${max_label} · ${max}`))));
}

function renderCloud(el, agg) {
  if (!agg.words.length) { el.replaceChildren(h('p', { class: 'empty' }, "Hali so'zlar yo'q")); return; }
  const max = agg.words[0].count;
  const words = agg.words.slice(0, 80);
  // Kattalarini markazga: navbatma-navbat chap/o'ngga joylash
  const ordered = [];
  words.forEach((w, i) => (i % 2 ? ordered.push(w) : ordered.unshift(w)));
  el.replaceChildren(h('div', { class: 'cloud' }, ordered.map((w) => {
    const idx = words.indexOf(w);
    return h('span', { class: 'cloud-word', title: `${w.count}`, style: { fontSize: `${cloudSize(w.count, max)}rem`, color: `var(--c${idx % COLORS})` } }, w.text);
  })));
}

function renderWall(el, agg) {
  if (!agg.items.length) { el.replaceChildren(h('p', { class: 'empty' }, "Hali javoblar yo'q")); return; }
  let wall = el.querySelector('.wall');
  if (!wall) { wall = h('div', { class: 'wall' }); el.replaceChildren(wall); }
  const have = new Set([...wall.children].map((c) => c.dataset.id));
  const want = new Set(agg.items.map((i) => String(i.id)));
  [...wall.children].forEach((c) => { if (!want.has(c.dataset.id)) c.remove(); });
  agg.items.slice().reverse().forEach((it, i) => {
    if (have.has(String(it.id))) return;
    wall.prepend(h('div', { class: 'card note', 'data-id': it.id, style: { '--c': `var(--c${i % COLORS})` } }, it.text));
  });
}
