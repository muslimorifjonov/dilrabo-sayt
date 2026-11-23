import '../styles.css';
import { supabase, requireUser } from '../lib/supabase.js';
import { $, h, boot, toast, debounce, confirmDialog } from '../lib/ui.js';
import { SLIDE_TYPES, defaultSlide, errorText } from '../lib/results.js';
import { renderResults } from '../lib/render.js';

const id = new URLSearchParams(location.search).get('id');
let pres;
let slides = [];
let activeId = null;
const MAX_OPTS = 10;

const setSaveState = (t) => { $('#save-state').textContent = t; };

async function load() {
  const [{ data: p, error: e1 }, { data: s, error: e2 }] = await Promise.all([
    supabase.from('presentations').select('*').eq('id', id).maybeSingle(),
    supabase.from('slides').select('*').eq('presentation_id', id).order('position'),
  ]);
  if (e1 || e2 || !p) {
    $('#panel').replaceChildren(h('div', { class: 'card empty' }, p === null ? 'Taqdimot topilmadi' : errorText(e1 || e2)));
    return;
  }
  pres = p;
  slides = s;
  document.title = `${p.title} — Sado`;
  $('#title').value = p.title;
  $('#present-btn').href = `/present.html?id=${id}`;
  activeId = slides[0]?.id ?? null;
  renderList();
  renderPanel();
}

// ---------- Saqlash ----------
const saveTitle = debounce(async () => {
  const title = $('#title').value.trim().slice(0, 120) || 'Nomsiz taqdimot';
  setSaveState('Saqlanmoqda…');
  const { error } = await supabase.from('presentations').update({ title }).eq('id', id);
  setSaveState(error ? 'Saqlanmadi' : 'Saqlandi ✓');
  if (error) toast(errorText(error), 'error');
  else document.title = `${title} — Sado`;
}, 600);

const pending = new Map();
const flushSlide = debounce(async () => {
  const batch = [...pending.values()];
  pending.clear();
  setSaveState('Saqlanmoqda…');
  try {
    for (const s of batch) {
      const { error } = await supabase.from('slides')
        .update({ type: s.type, question: s.question, options: s.options, settings: s.settings }).eq('id', s.id);
      if (error) throw error;
    }
    setSaveState('Saqlandi ✓');
  } catch (err) {
    setSaveState('Saqlanmadi');
    toast(errorText(err), 'error');
  }
}, 500);

function queueSave(s) {
  pending.set(s.id, s);
  setSaveState('Tahrirlanmoqda…');
  flushSlide();
  updateListItem(s);
  renderPreview(s);
}

window.addEventListener('beforeunload', (e) => {
  if (pending.size) { flushSlide.flush(); e.preventDefault(); }
});

// ---------- Slaydlar ro'yxati ----------
function renderList() {
  $('#slides').replaceChildren(...slides.map((s, i) =>
    h('button', { class: `slide-item${s.id === activeId ? ' active' : ''}`, 'data-id': s.id, onclick: () => { activeId = s.id; renderList(); renderPanel(); } },
      h('span', { class: 'num' }, i + 1),
      h('span', {}, SLIDE_TYPES[s.type].icon),
      h('span', { class: 'txt' }, s.question || SLIDE_TYPES[s.type].label))));
}

function updateListItem(s) {
  const el = $(`.slide-item[data-id="${s.id}"] .txt`);
  if (el) el.textContent = s.question || SLIDE_TYPES[s.type].label;
}

async function addSlide(type) {
  const position = slides.length ? Math.max(...slides.map((s) => s.position)) + 1 : 0;
  const { data, error } = await supabase.from('slides')
    .insert({ presentation_id: id, position, ...defaultSlide(type) }).select('*').single();
  if (error) return toast(errorText(error), 'error');
  slides.push(data);
  activeId = data.id;
  renderList();
  renderPanel();
  $('#q-input')?.focus();
}

function openTypeMenu() {
  const dlg = h('dialog', { class: 'dialog', style: { width: 'min(640px, calc(100% - 32px))' } },
    h('h3', {}, 'Qanday savol berasiz?'), h('p', { class: 'muted small' }, "Slayd turini tanlang. Keyin uni istalgan vaqtda o'zgartirishingiz mumkin."),
    h('div', { class: 'type-menu' }, Object.entries(SLIDE_TYPES).map(([t, m]) =>
      h('button', { class: 'type-btn', onclick: () => { dlg.close(); addSlide(t); } },
        h('span', { style: { fontSize: '1.5rem' } }, m.icon), h('b', {}, m.label), h('small', {}, m.hint)))),
    h('div', { class: 'row end', style: { marginTop: '14px' } }, h('button', { class: 'btn ghost', onclick: () => dlg.close() }, 'Yopish')));
  dlg.addEventListener('close', () => dlg.remove());
  document.body.append(dlg);
  dlg.showModal();
}

async function moveSlide(s, dir) {
  const i = slides.indexOf(s);
  const j = i + dir;
  if (j < 0 || j >= slides.length) return;
  [slides[i], slides[j]] = [slides[j], slides[i]];
  slides.forEach((x, k) => { x.position = k; });
  renderList();
  renderPanel();
  const results = await Promise.all([slides[i], slides[j]].map((x) => supabase.from('slides').update({ position: x.position }).eq('id', x.id)));
  const err = results.find((r) => r.error)?.error;
  if (err) toast(errorText(err), 'error');
}

async function duplicateSlide(s) {
  // Keyingi slaydlarni bir pozitsiya surish
  const idx = slides.indexOf(s);
  const after = slides.slice(idx + 1);
  for (const x of after) x.position += 1;
  await Promise.all(after.map((x) => supabase.from('slides').update({ position: x.position }).eq('id', x.id)));
  const { data, error } = await supabase.from('slides').insert({
    presentation_id: id, position: s.position + 1, type: s.type, question: s.question, options: s.options, settings: s.settings,
  }).select('*').single();
  if (error) return toast(errorText(error), 'error');
  slides.splice(idx + 1, 0, data);
  activeId = data.id;
  renderList();
  renderPanel();
}

async function deleteSlide(s) {
  if (!(await confirmDialog("Slayd va uning javoblari o'chirilsinmi?", "O'chirish"))) return;
  pending.delete(s.id);
  const { error } = await supabase.from('slides').delete().eq('id', s.id);
  if (error) return toast(errorText(error), 'error');
  const idx = slides.indexOf(s);
  slides.splice(idx, 1);
  activeId = slides[Math.min(idx, slides.length - 1)]?.id ?? null;
  renderList();
  renderPanel();
}

// ---------- Tahrirlash paneli ----------
function renderPanel() {
  const s = slides.find((x) => x.id === activeId);
  if (!s) {
    $('#panel').replaceChildren(h('div', { class: 'card empty stack' },
      h('p', {}, "Slaydlar yo'q"), h('button', { class: 'btn primary', onclick: openTypeMenu }, "+ Slayd qo'shish")));
    return;
  }
  const idx = slides.indexOf(s);
  $('#panel').replaceChildren(
    h('div', { class: 'card stack' },
      h('div', { class: 'row' },
        h('select', { 'aria-label': 'Slayd turi', style: { width: 'auto' }, onchange: (e) => changeType(s, e.target.value) },
          Object.entries(SLIDE_TYPES).map(([t, m]) => h('option', { value: t, selected: t === s.type }, `${m.icon} ${m.label}`))),
        h('span', { class: 'spacer' }),
        h('button', { class: 'icon-btn', title: 'Yuqoriga', 'aria-label': 'Yuqoriga', disabled: idx === 0, onclick: () => moveSlide(s, -1) }, '↑'),
        h('button', { class: 'icon-btn', title: 'Pastga', 'aria-label': 'Pastga', disabled: idx === slides.length - 1, onclick: () => moveSlide(s, 1) }, '↓'),
        h('button', { class: 'icon-btn', title: 'Nusxa', 'aria-label': 'Nusxa', onclick: () => duplicateSlide(s) }, '⧉'),
        h('button', { class: 'icon-btn', title: "O'chirish", 'aria-label': "O'chirish", onclick: () => deleteSlide(s) }, '🗑')),
      h('div', { class: 'type-explain' }, h('span', { style: { fontSize: '1.4rem' } }, SLIDE_TYPES[s.type].icon),
        h('div', {}, h('b', {}, SLIDE_TYPES[s.type].label), h('br'), SLIDE_TYPES[s.type].explain)),
      h('div', {},
        h('label', { for: 'q-input' }, s.type === 'qa' ? "Sarlavha (ekranda ko'rinadi)" : 'Savolingiz'),
        h('textarea', { id: 'q-input', class: 'input', maxLength: 300, rows: 2, placeholder: "Masalan: Bugungi mavzu sizga qanchalik tushunarli bo'ldi?", value: s.question,
          oninput: (e) => { s.question = e.target.value; queueSave(s); } })),
      optionsEditor(s),
      settingsEditor(s)),
    s.type === 'qa' ? null : h('div', { class: 'card stack', style: { marginTop: '16px' } },
      h('div', { class: 'row' }, h('b', {}, "Ko'rinish"), h('span', { class: 'muted small' }, '(namunaviy natijalar)')),
      h('div', { class: 'results', id: 'preview' })));
  renderPreview(s);
}

function changeType(s, type) {
  const d = defaultSlide(type);
  const keepOpts = ['poll', 'quiz'].includes(type) && ['poll', 'quiz'].includes(s.type) && s.options.length >= 2;
  s.type = type;
  s.options = keepOpts ? s.options : d.options;
  s.settings = d.settings;
  if (type === 'quiz' && s.settings.correct >= s.options.length) s.settings.correct = 0;
  queueSave(s);
  renderList();
  renderPanel();
}

function optionsEditor(s) {
  if (!['poll', 'quiz', 'scale'].includes(s.type)) return null;
  const isQuiz = s.type === 'quiz';
  const min = s.type === 'scale' ? 1 : 2;
  const wrap = h('div', { class: 'stack' }, h('label', {}, s.type === 'scale' ? 'Baholanadigan fikrlar' : isQuiz ? "Variantlar (to'g'ri javobni belgilang)" : 'Variantlar'));
  s.options.forEach((o, i) => {
    wrap.append(h('div', { class: 'opt-row' },
      isQuiz
        ? h('input', { type: 'radio', class: 'radio', name: 'correct', checked: s.settings.correct === i, 'aria-label': "To'g'ri javob",
          onchange: () => { s.settings.correct = i; queueSave(s); } })
        : h('span', { class: 'dot', style: { '--c': `var(--c${i % 8})` } }),
      h('input', { class: 'input', value: o, maxLength: 80, placeholder: `Variant ${i + 1}`,
        oninput: (e) => { s.options[i] = e.target.value; queueSave(s); },
        onblur: (e) => { if (!e.target.value.trim()) { s.options[i] = `Variant ${i + 1}`; e.target.value = s.options[i]; queueSave(s); } } }),
      h('button', { class: 'icon-btn', 'aria-label': "Variantni o'chirish", disabled: s.options.length <= min,
        onclick: () => {
          s.options.splice(i, 1);
          if (isQuiz) s.settings.correct = s.settings.correct === i ? 0 : s.settings.correct > i ? s.settings.correct - 1 : s.settings.correct;
          queueSave(s); renderPanel();
        } }, '✕')));
  });
  if (s.options.length < MAX_OPTS) {
    wrap.append(h('button', { class: 'btn ghost sm', onclick: () => {
      s.options.push(s.type === 'scale' ? `Fikr ${s.options.length + 1}` : `Variant ${s.options.length + 1}`);
      queueSave(s); renderPanel();
    } }, '+ Variant qo\'shish'));
  }
  return wrap;
}

function numInput(label, value, min, max, onChange) {
  return h('div', {}, h('label', {}, label),
    h('input', { class: 'input', type: 'number', min, max, value,
      onchange: (e) => {
        const v = Math.min(max, Math.max(min, parseInt(e.target.value, 10) || min));
        e.target.value = v;
        onChange(v);
      } }));
}

function settingsEditor(s) {
  const st = s.settings;
  const save = () => queueSave(s);
  switch (s.type) {
    case 'poll':
      return h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: !!st.multiple, onchange: (e) => { st.multiple = e.target.checked; save(); } }), 'Bir nechta variant tanlashga ruxsat');
    case 'quiz':
      return h('div', { class: 'grid-2' }, numInput('Vaqt (soniya)', st.time_limit ?? 20, 5, 120, (v) => { st.time_limit = v; save(); }));
    case 'scale':
      return h('div', { class: 'grid-2' },
        numInput('Minimum', st.min ?? 1, 0, 9, (v) => { st.min = v; if (st.max <= v) st.max = v + 1; save(); renderPanel(); }),
        numInput('Maksimum', st.max ?? 5, 1, 10, (v) => { st.max = Math.max(v, (st.min ?? 1) + 1); save(); renderPanel(); }),
        h('div', {}, h('label', {}, 'Past belgi'), h('input', { class: 'input', maxLength: 30, value: st.min_label ?? '', oninput: (e) => { st.min_label = e.target.value; save(); } })),
        h('div', {}, h('label', {}, 'Yuqori belgi'), h('input', { class: 'input', maxLength: 30, value: st.max_label ?? '', oninput: (e) => { st.max_label = e.target.value; save(); } })));
    case 'wordcloud':
      return h('div', { class: 'grid-2' }, numInput("Har bir ishtirokchi uchun so'zlar soni", st.max_words ?? 3, 1, 5, (v) => { st.max_words = v; save(); }));
    case 'open':
      return h('div', { class: 'grid-2' }, numInput('Har bir ishtirokchi uchun javoblar soni', st.max_entries ?? 3, 1, 10, (v) => { st.max_entries = v; save(); }));
    case 'qa':
      return h('p', { class: 'muted small' }, "Ishtirokchilar savol yuboradi va bir-birining savollariga ovoz beradi. Taqdimotda savollarni \"javob berildi\" deb belgilashingiz mumkin.");
    default: return null;
  }
}

// Namunaviy natijalar bilan ko'rinish
function renderPreview(s) {
  const el = $('#preview');
  if (!el) return;
  const rnd = (n) => (Math.sin(n * 9301 + 49297) + 1) / 2; // barqaror psevdo-tasodif
  const demo = [];
  const n = 12;
  for (let k = 0; k < n; k++) {
    let value;
    if (s.type === 'poll') value = { choices: [Math.floor(rnd(k) * s.options.length)] };
    else if (s.type === 'quiz') value = { choice: Math.floor(rnd(k) * s.options.length) };
    else if (s.type === 'scale') {
      const { min = 1, max = 5 } = s.settings;
      value = { ratings: s.options.map((_, i) => min + Math.round(rnd(k + i * 7) * (max - min))) };
    } else if (s.type === 'wordcloud') value = { words: [['ajoyib', 'qiziqarli', 'foydali', 'zo\'r', 'yangi'][Math.floor(rnd(k) * 5)]] };
    else if (s.type === 'open') value = { text: ['Juda yoqdi!', 'Ko\'proq misollar bo\'lsa yaxshi', 'Rahmat!'][k % 3] };
    demo.push({ id: k, slide_id: s.id, participant_id: String(k), value, created_at: new Date(Date.now() - k * 1000).toISOString() });
  }
  el.dataset.kind = '';
  renderResults(el, s, s.type === 'open' ? demo.slice(0, 3) : demo, { revealed: s.type === 'quiz' });
}

if (boot()) {
  await requireUser();
  if (!id) location.replace('/dashboard.html');
  $('#title').addEventListener('input', saveTitle);
  $('#add-slide').addEventListener('click', openTypeMenu);
  load();
}
