import '../styles.css';
import { supabase, requireUser } from '../lib/supabase.js';
import { $, h, boot, toast, confirmDialog, fmtCode, joinUrl } from '../lib/ui.js';
import { errorText, SLIDE_TYPES } from '../lib/results.js';
import { TEMPLATES } from '../lib/templates.js';
import { countUp } from '../lib/fx.js';
import { renderNav } from './nav.js';

let items = [];
let user;
let customTemplates = [];
let hidden = new Set();

const COVERS = [
  'linear-gradient(135deg,#7c3aed,#db2777)', 'linear-gradient(135deg,#0891b2,#6366f1)',
  'linear-gradient(135deg,#f59e0b,#ef4444)', 'linear-gradient(135deg,#10b981,#0ea5e9)',
  'linear-gradient(135deg,#ec4899,#f97316)', 'linear-gradient(135deg,#6366f1,#22d3ee)',
];
const cover = (id) => COVERS[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % COVERS.length];

function ago(iso) {
  const s = (Date.now() - new Date(iso)) / 1000;
  if (s < 60) return 'hozirgina';
  if (s < 3600) return `${Math.floor(s / 60)} daqiqa oldin`;
  if (s < 86400) return `${Math.floor(s / 3600)} soat oldin`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} kun oldin`;
  return new Date(iso).toLocaleDateString('uz-UZ');
}

// ---------- Ma'lumot ----------
async function load() {
  // slides bilan ikki bog'lanish bor (presentation_id va current_slide_id) — aniq FK ko'rsatiladi
  const { data, error } = await supabase
    .from('presentations')
    .select('id,title,code,is_live,updated_at,slides!slides_presentation_id_fkey(id,type,position)')
    .order('updated_at', { ascending: false });
  if (error) return renderError(error);
  items = data.map((p) => ({ ...p, slides: (p.slides || []).sort((a, b) => a.position - b.position) }));
  render();
  renderStats();
}

async function renderStats() {
  const set = (k, v) => countUp($(`[data-stat="${k}"]`), v);
  set('pres', items.length);
  set('slides', items.reduce((a, p) => a + p.slides.length, 0));
  set('live', items.filter((p) => p.is_live).length);
  const { count } = await supabase.from('participants').select('id', { count: 'exact', head: true });
  set('people', count || 0);
}

function renderError(error) {
  console.error(error);
  $('#list').replaceChildren(h('div', { class: 'card empty-state error-state' },
    h('div', { class: 'art' }, '⚠️'),
    h('h3', {}, "Taqdimotlarni yuklab bo'lmadi"),
    h('p', {}, errorText(error)),
    error?.message ? h('code', {}, error.message) : null,
    h('button', { class: 'btn primary', onclick: () => { $('#list').replaceChildren(h('div', { class: 'spinner' })); load(); } }, '↻ Qayta urinish')));
}

// ---------- Chizish ----------
async function loadTemplates() {
  const { data, error } = await supabase.from('templates').select('id,title,icon,description,slides').order('created_at', { ascending: false });
  customTemplates = error ? [] : data.map((t) => ({ ...t, desc: t.description, custom: true }));
  renderTemplates();
}

function renderTemplates() {
  const builtins = TEMPLATES.filter((t) => !hidden.has(t.id));
  const all = [...customTemplates, ...builtins];
  const cards = all.map((t, i) => {
    const btn = h('button', { class: `card tpl glow-card${t.id === 'blank' ? ' is-blank' : ''}`, onclick: () => createFrom(t, btn) },
      h('span', { class: 'ico' }, t.icon), h('b', {}, t.title), h('small', {}, t.desc),
      h('span', { class: 'count' }, t.id === 'blank' ? 'Noldan boshlash →' : `${t.slides.length} ta tayyor slayd →`));
    return h('div', { class: 'tpl-wrap', style: { animationDelay: `${Math.min(i, 10) * 40}ms` } },
      btn,
      t.custom ? h('span', { class: 'tpl-tag' }, 'Meniki') : null,
      t.id === 'blank' ? null : h('button', { class: 'tpl-del', title: "Shablonni o'chirish", 'aria-label': `"${t.title}" shablonini o'chirish`,
        onclick: () => removeTemplate(t) }, '✕'));
  });
  cards.push(h('div', { class: 'tpl-wrap' }, h('button', { class: 'card tpl add', onclick: () => templateDialog() },
    h('span', { class: 'ico' }, '+'), h('b', {}, 'Yangi shablon'), h('small', {}, "Taqdimotingizni shablon qilib saqlang"))));
  $('#templates').replaceChildren(...cards);

  const nHidden = TEMPLATES.filter((t) => hidden.has(t.id)).length;
  $('#tpl-footer').replaceChildren(nHidden
    ? h('button', { class: 'link-btn', onclick: () => saveHidden(new Set()) }, `↺ O'chirilgan ${nHidden} ta tayyor shablonni qaytarish`)
    : '');
}

async function saveHidden(next) {
  const prev = hidden;
  hidden = next;
  renderTemplates();
  const { error } = await supabase.auth.updateUser({ data: { hidden_templates: [...next] } });
  if (error) { hidden = prev; renderTemplates(); toast(errorText(error), 'error'); }
}

async function removeTemplate(t) {
  if (!(await confirmDialog(`"${t.title}" shabloni o'chirilsinmi? Undan yaratilgan taqdimotlaringiz o'chmaydi.`, "Ha, o'chirish"))) return;
  if (!t.custom) {
    await saveHidden(new Set([...hidden, t.id]));
    toast("Shablon o'chirildi. Pastdagi havola orqali qaytarish mumkin.", 'success');
    return;
  }
  const { error } = await supabase.from('templates').delete().eq('id', t.id);
  if (error) return toast(errorText(error), 'error');
  customTemplates = customTemplates.filter((x) => x.id !== t.id);
  renderTemplates();
  toast("Shablon o'chirildi", 'success');
}

const EMOJIS = ['📁', '🎓', '🧠', '🧩', '📚', '🧪', '💡', '🎯', '🏆', '🌍', '💼', '🎤', '❤️', '⭐'];

/** Yangi shablon: mavjud taqdimotdan nusxa olinadi. p berilsa, o'sha taqdimot tanlangan bo'ladi. */
function templateDialog(p) {
  const sources = items.filter((x) => x.slides.length);
  if (!sources.length) {
    toast("Shablon yaratish uchun avval kamida bitta slaydli taqdimot yarating", 'error');
    return;
  }
  let icon = '📁';
  const title = h('input', { class: 'input', maxLength: 80, required: true, value: p ? p.title.slice(0, 80) : '', placeholder: 'Masalan: Biologiya — 5-mavzu' });
  const desc = h('input', { class: 'input', maxLength: 160, placeholder: 'Qisqa tavsif (ixtiyoriy)' });
  const src = h('select', {}, sources.map((x) => h('option', { value: x.id, selected: p?.id === x.id }, `${x.title} (${x.slides.length} slayd)`)));
  const emojiBtns = EMOJIS.map((e) => h('button', { type: 'button', 'aria-pressed': String(e === icon), 'aria-label': e,
    onclick: () => { icon = e; emojiBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.textContent === e))); } }, e));
  const save = h('button', { class: 'btn primary', type: 'submit' }, 'Saqlash');
  const dlg = h('dialog', { class: 'dialog', style: { width: 'min(520px, calc(100% - 32px))' } },
    h('form', { class: 'stack', onsubmit: async (e) => {
      e.preventDefault();
      if (!title.value.trim()) { title.focus(); return toast('Shablon nomini yozing', 'error'); }
      save.disabled = true;
      try {
        const { data: slides, error: e1 } = await supabase.from('slides').select('type,question,options,settings').eq('presentation_id', src.value).order('position');
        if (e1) throw e1;
        const { data, error } = await supabase.from('templates')
          .insert({ title: title.value.trim(), icon, description: desc.value.trim(), slides }).select('id,title,icon,description,slides').single();
        if (error) throw error;
        customTemplates.unshift({ ...data, desc: data.description, custom: true });
        renderTemplates();
        dlg.close();
        toast("Shablon saqlandi. Endi uni \"Tez boshlash\" bo'limida ko'rasiz", 'success');
      } catch (err) {
        toast(errorText(err), 'error');
        save.disabled = false;
      }
    } },
    h('h3', {}, 'Yangi shablon'),
    h('p', { class: 'muted small', style: { margin: 0 } }, "Tanlangan taqdimotning barcha slaydlari shablonga ko'chiriladi. Keyin bir bosishda undan yangi taqdimot yaratasiz."),
    h('div', {}, h('label', {}, 'Qaysi taqdimotdan?'), src),
    h('div', {}, h('label', {}, 'Shablon nomi'), title),
    h('div', {}, h('label', {}, 'Tavsif'), desc),
    h('div', {}, h('label', {}, 'Belgi'), h('div', { class: 'emoji-row' }, emojiBtns)),
    h('div', { class: 'row end' }, h('button', { class: 'btn ghost', type: 'button', onclick: () => dlg.close() }, 'Bekor qilish'), save)));
  dlg.addEventListener('close', () => dlg.remove());
  document.body.append(dlg);
  dlg.showModal();
  title.focus();
}

function render() {
  const q = $('#search').value.trim().toLowerCase();
  if (!items.length) {
    $('#list').replaceChildren(h('div', { class: 'card empty-state' },
      h('div', { class: 'art' }, '🎤'),
      h('h3', {}, 'Hali birorta taqdimot yaratmadingiz'),
      h('p', {}, "Birinchi taqdimotingizni yarating: savol yozing, kodni auditoriyaga ko'rsating va javoblar ekranda jonli paydo bo'lishini kuzating."),
      h('div', { class: 'row', style: { justifyContent: 'center' } },
        h('button', { class: 'btn primary lg', onclick: (e) => createFrom(TEMPLATES[0], e.currentTarget) }, '+ Birinchi taqdimotni yaratish'),
        h('a', { class: 'btn ghost lg', href: '#templates' }, 'Shablondan tanlash'))));
    return;
  }
  const list = items.filter((p) => p.title.toLowerCase().includes(q) || p.code.includes(q.replace(/\s/g, '')));
  $('#list').replaceChildren(list.length
    ? h('div', { class: 'grid' }, list.map(card))
    : h('div', { class: 'card empty-state' }, h('div', { class: 'art' }, '🔍'), h('h3', {}, 'Hech narsa topilmadi'), h('p', {}, `"${q}" bo'yicha taqdimot yo'q. Boshqa so'z bilan qidirib ko'ring.`)));
}

function card(p, i) {
  const n = p.slides.length;
  const types = [...new Set(p.slides.map((s) => s.type))].slice(0, 4);
  return h('article', { class: 'card pres-card', style: { animationDelay: `${Math.min(i, 8) * 60}ms` } },
    h('div', { class: 'pres-cover', style: { '--cover': cover(p.id) } },
      p.is_live ? h('span', { class: 'badge live' }, 'JONLI') : null,
      h('button', { class: 'badge code', title: 'Qo\'shilish havolasini nusxalash', onclick: () => copyLink(p) }, `# ${fmtCode(p.code)}`),
      h('div', { class: 'icons' }, types.map((t) => h('span', { title: SLIDE_TYPES[t].label }, SLIDE_TYPES[t].icon)))),
    h('div', { class: 'pres-body' },
      h('h3', {}, h('a', { href: `/edit.html?id=${p.id}` }, p.title)),
      h('div', { class: 'meta' }, h('span', {}, n ? `🧩 ${n} ta slayd` : "⚠️ Slayd yo'q"), h('span', {}, `🕒 ${ago(p.updated_at)}`)),
      h('div', { class: 'actions' },
        n ? h('a', { class: 'btn primary sm', href: `/present.html?id=${p.id}` }, '▶ Boshlash')
          : h('a', { class: 'btn primary sm', href: `/edit.html?id=${p.id}` }, "+ Slayd qo'shish"),
        h('a', { class: 'btn ghost sm', href: `/edit.html?id=${p.id}` }, 'Tahrirlash'),
        h('span', { class: 'spacer' }),
        n ? h('button', { class: 'icon-btn', title: 'Shablon sifatida saqlash', 'aria-label': 'Shablon sifatida saqlash', onclick: () => templateDialog(p) }, '⭐') : null,
        h('button', { class: 'icon-btn', title: 'Nusxa olish', 'aria-label': 'Nusxa olish', onclick: () => duplicate(p) }, '⧉'),
        h('button', { class: 'icon-btn', title: "O'chirish", 'aria-label': "O'chirish", onclick: () => removePres(p) }, '🗑'))));
}

// ---------- Amallar ----------
async function copyLink(p) {
  try { await navigator.clipboard.writeText(joinUrl(p.code)); toast('Qo\'shilish havolasi nusxalandi', 'success'); }
  catch { toast(`Kod: ${fmtCode(p.code)}`); }
}

async function createFrom(t, btn) {
  if (btn) btn.setAttribute('aria-busy', 'true');
  try {
    const title = t.id === 'blank' ? 'Yangi taqdimot' : t.title;
    const { data, error } = await supabase.from('presentations').insert({ title }).select('id').single();
    if (error) throw error;
    const { error: e2 } = await supabase.from('slides').insert(t.slides.map((s, i) => ({
      presentation_id: data.id, position: i, type: s.type, question: s.question || '',
      options: s.options || [], settings: s.settings || {},
    })));
    if (e2) throw e2;
    location.href = `/edit.html?id=${data.id}`;
  } catch (err) {
    toast(errorText(err), 'error');
    btn?.removeAttribute('aria-busy');
  }
}

async function duplicate(p) {
  try {
    const { data: slides, error: e1 } = await supabase.from('slides').select('type,question,options,settings,position').eq('presentation_id', p.id).order('position');
    if (e1) throw e1;
    const { data: np, error: e2 } = await supabase.from('presentations').insert({ title: `${p.title} (nusxa)`.slice(0, 120) }).select('id').single();
    if (e2) throw e2;
    if (slides.length) {
      const { error: e3 } = await supabase.from('slides').insert(slides.map((s) => ({ ...s, presentation_id: np.id })));
      if (e3) throw e3;
    }
    toast('Nusxa yaratildi', 'success');
    load();
  } catch (err) { toast(errorText(err), 'error'); }
}

async function removePres(p) {
  if (!(await confirmDialog(`"${p.title}" va uning barcha javoblari butunlay o'chiriladi. Davom etasizmi?`, "Ha, o'chirish"))) return;
  const { error } = await supabase.from('presentations').delete().eq('id', p.id);
  if (error) return toast(errorText(error), 'error');
  items = items.filter((x) => x.id !== p.id);
  render();
  renderStats();
  toast("Taqdimot o'chirildi", 'success');
}

if (boot()) {
  user = await requireUser();
  renderNav();
  const name = user.user_metadata?.full_name?.trim() || user.email?.split('@')[0] || '';
  const hour = new Date().getHours();
  const part = hour < 5 ? 'Xayrli tun' : hour < 12 ? 'Xayrli tong' : hour < 18 ? 'Xayrli kun' : 'Xayrli kech';
  $('#greet').textContent = `${part}${name ? `, ${name}` : ''}! 👋`;
  hidden = new Set(user.user_metadata?.hidden_templates || []);
  renderTemplates();
  loadTemplates();
  $('#new-btn').addEventListener('click', (e) => createFrom(TEMPLATES[0], e.currentTarget));
  $('#search').addEventListener('input', render);
  load();
}
