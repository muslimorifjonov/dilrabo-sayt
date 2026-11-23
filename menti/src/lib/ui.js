import { configured } from './supabase.js';
import { aurora, reveal } from './fx.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

/** Kichik HTML yordamchi: h('div', {class:'x', onclick}, ...children) */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') {
      for (const [p, val] of Object.entries(v)) {
        if (p.startsWith('--')) el.style.setProperty(p, val);
        else el.style[p] = val;
      }
    }
    else if (k in el && k !== 'list' && k !== 'form') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) if (c != null && c !== false) el.append(c instanceof Node ? c : document.createTextNode(c));
  return el;
}

let toastBox;
export function toast(msg, type = 'info') {
  if (!toastBox) { toastBox = h('div', { class: 'toasts', role: 'status', 'aria-live': 'polite' }); document.body.append(toastBox); }
  const t = h('div', { class: `toast toast-${type}` }, msg);
  toastBox.append(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 3200);
}

export function debounce(fn, ms = 400) {
  let t;
  const d = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  d.flush = (...a) => { clearTimeout(t); return fn(...a); };
  return d;
}

export function confirmDialog(message, okText = 'Tasdiqlash') {
  return new Promise((resolve) => {
    const dlg = h('dialog', { class: 'dialog' },
      h('p', {}, message),
      h('div', { class: 'row end' },
        h('button', { class: 'btn ghost', value: 'no', onclick: () => dlg.close('no') }, 'Bekor qilish'),
        h('button', { class: 'btn danger', value: 'ok', onclick: () => dlg.close('ok') }, okText)));
    dlg.addEventListener('close', () => { resolve(dlg.returnValue === 'ok'); dlg.remove(); });
    document.body.append(dlg);
    dlg.showModal();
  });
}

// ---- Mavzu (yorug'/qorong'i) ----
const THEME_KEY = 'sado-theme';
export function initTheme() {
  let t = null;
  try { t = localStorage.getItem(THEME_KEY); } catch {}
  if (t) document.documentElement.dataset.theme = t;
  const btn = $('[data-theme-toggle]');
  btn?.addEventListener('click', () => {
    const cur = document.documentElement.dataset.theme
      || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(THEME_KEY, next); } catch {}
  });
}

/** Har sahifa boshida: mavzu + sozlanmaganlik ogohlantirishi. */
export function boot() {
  initTheme();
  aurora();
  reveal();
  if (!configured) {
    document.body.prepend(h('div', { class: 'banner' },
      ".env faylida VITE_SUPABASE_URL va VITE_SUPABASE_ANON_KEY sozlanmagan. README'ga qarang."));
    return false;
  }
  return true;
}

export const joinUrl = (code) => `${location.origin}/play.html?c=${code}`;
export const fmtCode = (code) => `${code.slice(0, 3)} ${code.slice(3)}`;
