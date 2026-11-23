import '../styles.css';
import { supabase, ensureParticipant, rpc, liveChannel } from '../lib/supabase.js';
import { $, h, boot, toast, fmtCode } from '../lib/ui.js';
import { errorText } from '../lib/results.js';
import { renderNav } from './nav.js';
import { confetti } from '../lib/fx.js';

const app = $('#app');
const NAME_KEY = 'sado-name';
let code = (new URLSearchParams(location.search).get('c') || '').replace(/\D/g, '');
let presId;
let state = null;
let lastKey = '';
let clockOffset = 0;
let timerRaf = 0;
let channel;
let qaChannel;
let questions = [];
let myVotes = new Set();
let me;

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};

// ---------- Kirish ekranlari ----------
function codeScreen() {
  const input = h('input', { class: 'input code-input', inputmode: 'numeric', maxLength: 7, placeholder: '123 456', 'aria-label': 'Kod', autocomplete: 'off',
    oninput: (e) => { const d = e.target.value.replace(/\D/g, '').slice(0, 6); e.target.value = d.length > 3 ? `${d.slice(0, 3)} ${d.slice(3)}` : d; } });
  app.replaceChildren(h('form', { class: 'card stack', onsubmit: (e) => {
    e.preventDefault();
    const c = input.value.replace(/\D/g, '');
    if (c.length !== 6) return toast("Kod 6 ta raqamdan iborat bo'lishi kerak", 'error');
    code = c;
    history.replaceState(null, '', `?c=${c}`);
    nameScreen();
  } }, h('h2', {}, 'Kodni kiriting'), input, h('button', { class: 'btn primary block lg' }, 'Davom etish')));
  input.focus();
}

function nameScreen() {
  const input = h('input', { class: 'input', maxLength: 40, placeholder: 'Ismingiz (ixtiyoriy)', value: store.get(NAME_KEY) || '', autocomplete: 'nickname' });
  const btn = h('button', { class: 'btn primary block lg' }, "Qo'shilish");
  app.replaceChildren(h('form', { class: 'card stack', onsubmit: async (e) => {
    e.preventDefault();
    btn.disabled = true;
    const name = input.value.trim();
    store.set(NAME_KEY, name);
    try { await join(name); } catch (err) { toast(errorText(err), 'error'); btn.disabled = false; }
  } },
  h('p', { class: 'muted small' }, `Kod: ${fmtCode(code)}`),
  h('h2', {}, 'Ismingiz'),
  h('p', { class: 'muted small' }, "Viktorinada reytingda ko'rinadi"),
  input, btn));
  input.focus();
}

async function join(name) {
  me = await ensureParticipant();
  const r = await rpc('join_presentation', { p_code: code, p_name: name });
  presId = r.presentation_id;
  document.title = `${r.title} — Sado`;
  try { sessionStorage.setItem(`sado-joined-${code}`, '1'); } catch {}
  connect();
  await refresh();
}

// ---------- Real vaqt ----------
function connect() {
  channel = liveChannel(code)
    .on('broadcast', { event: 'state' }, () => refresh())
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') { channel.track({ at: Date.now() }); refresh(); }
    });
  setInterval(() => { if (!document.hidden) refresh(); }, 15000); // zaxira
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
}

let refreshing = null;
async function refresh() {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const st = await rpc('get_live_state', { p_code: code });
      clockOffset = new Date(st.server_now || Date.now()).getTime() - Date.now();
      state = st;
      const s = st.slide;
      const key = JSON.stringify([st.presentation.is_live, s?.id, s?.type, s?.voting_open, s?.revealed, s?.quiz_started_at, s?.my_responses?.length, s?.question, s?.options, s?.settings]);
      if (key !== lastKey) { lastKey = key; render(); }
    } catch (err) {
      if (String(err.message).includes('NOT_FOUND')) { lastKey = ''; app.replaceChildren(h('div', { class: 'card empty' }, errorText(err))); }
    } finally { refreshing = null; }
  })();
  return refreshing;
}

// ---------- Chizish ----------
function waiting(icon, title, sub = '') {
  return h('div', { class: 'waiting' }, h('div', { class: 'big' }, icon), h('h2', {}, title), sub ? h('p', { class: 'muted' }, sub) : null);
}

function render() {
  cancelAnimationFrame(timerRaf);
  const st = state;
  const head = h('p', { class: 'muted small' }, `${st.presentation.title} · ${fmtCode(code)}`);
  if (!st.presentation.is_live) return app.replaceChildren(head, waiting('👋', 'Taqdimot tugadi', "Ishtirokingiz uchun rahmat!"));
  const s = st.slide;
  if (!s) return app.replaceChildren(head, waiting('⏳', 'Taqdimotchini kuting…'));
  if (s.type !== 'qa') { qaChannel?.unsubscribe(); qaChannel = null; }

  const q = h('div', { class: 'play-q' }, s.question || '');
  const mine = s.my_responses || [];
  let body;

  if (s.type === 'qa') body = renderQA(s);
  else if (s.type === 'quiz') body = renderQuiz(s, mine);
  else if (mine.length && s.type !== 'open') body = waiting('✅', 'Javobingiz qabul qilindi', "Natijalarni katta ekranda kuzating");
  else if (!s.voting_open) body = waiting('🔒', 'Ovoz berish yopildi');
  else if (s.type === 'poll') body = renderPoll(s);
  else if (s.type === 'scale') body = renderScale(s);
  else if (s.type === 'wordcloud') body = renderWords(s);
  else if (s.type === 'open') body = renderOpen(s, mine);

  app.replaceChildren(head, q, body);
}

async function submit(value, btn) {
  if (btn) btn.disabled = true;
  try {
    await rpc('submit_response', { p_slide_id: state.slide.id, p_value: value });
    if (navigator.vibrate) navigator.vibrate(30);
    lastKey = '';
    await refresh();
  } catch (err) {
    toast(errorText(err), 'error');
    if (btn) btn.disabled = false;
    lastKey = '';
    refresh();
  }
}

function renderPoll(s) {
  const multi = !!s.settings.multiple;
  const sel = new Set();
  const btn = h('button', { class: 'btn primary block lg', disabled: true, onclick: () => submit({ choices: [...sel] }, btn) }, 'Yuborish');
  const list = s.options.map((o, i) => {
    const el = h('button', { class: 'choice', type: 'button', 'aria-pressed': 'false', onclick: () => {
      if (multi) { sel.has(i) ? sel.delete(i) : sel.add(i); }
      else { sel.clear(); sel.add(i); }
      list.forEach((b, k) => { b.classList.toggle('sel', sel.has(k)); b.setAttribute('aria-pressed', String(sel.has(k))); });
      btn.disabled = sel.size === 0;
    } }, h('span', { class: 'mark' }, multi ? '✓' : ''), o);
    return el;
  });
  return h('div', {}, multi ? h('p', { class: 'muted small' }, 'Bir nechtasini tanlashingiz mumkin') : null, list, btn);
}

function renderScale(s) {
  const { min = 1, max = 5, min_label = '', max_label = '' } = s.settings;
  const mid = Math.round((min + max) / 2);
  const vals = s.options.map(() => mid);
  const btn = h('button', { class: 'btn primary block lg', onclick: () => submit({ ratings: vals }, btn) }, 'Yuborish');
  return h('div', {}, s.options.map((o, i) => {
    const out = h('span', { class: 'range-val' }, mid);
    return h('div', { class: 'range-row' },
      h('div', { class: 'row' }, h('b', {}, o), h('span', { class: 'spacer' }), out),
      h('input', { type: 'range', min, max, step: 1, value: mid, 'aria-label': o,
        oninput: (e) => { vals[i] = Number(e.target.value); out.textContent = e.target.value; } }),
      h('div', { class: 'row small muted' }, h('span', {}, min_label), h('span', { class: 'spacer' }), h('span', {}, max_label)));
  }), btn);
}

function renderWords(s) {
  const n = Math.max(1, s.settings.max_words ?? 3);
  const inputs = Array.from({ length: n }, (_, i) => h('input', { class: 'input', maxLength: 25, placeholder: `So'z ${i + 1}`, style: { marginBottom: '10px' } }));
  const btn = h('button', { class: 'btn primary block lg' }, 'Yuborish');
  return h('form', { onsubmit: (e) => {
    e.preventDefault();
    const words = inputs.map((x) => x.value.trim()).filter(Boolean);
    if (!words.length) return toast("Kamida bitta so'z kiriting", 'error');
    submit({ words }, btn);
  } }, h('p', { class: 'muted small' }, `${n} tagacha qisqa so'z yozing`), inputs, btn);
}

function renderOpen(s, mine) {
  const max = Math.max(1, s.settings.max_entries ?? 3);
  if (mine.length >= max) return waiting('✅', 'Javoblaringiz qabul qilindi', "Natijalarni katta ekranda kuzating");
  if (!s.voting_open) return waiting('🔒', 'Ovoz berish yopildi');
  const ta = h('textarea', { class: 'input', maxLength: 250, rows: 4, placeholder: 'Fikringizni yozing…' });
  const cnt = h('span', { class: 'muted small' }, '0/250');
  ta.addEventListener('input', () => { cnt.textContent = `${ta.value.length}/250`; });
  const btn = h('button', { class: 'btn primary block lg' }, 'Yuborish');
  return h('form', { class: 'stack', onsubmit: (e) => {
    e.preventDefault();
    if (!ta.value.trim()) return toast('Javob bo\'sh', 'error');
    submit({ text: ta.value.trim() }, btn);
  } }, mine.length ? h('p', { class: 'muted small' }, `Yuborildi: ${mine.length}/${max}`) : null, ta, h('div', { class: 'row' }, h('span', { class: 'spacer' }), cnt), btn);
}

function renderQuiz(s, mine) {
  const myChoice = mine[0]?.choice;
  if (s.revealed) {
    const ok = myChoice != null && myChoice === s.correct;
    const box = h('div', { class: 'stack' },
      h('div', { class: `result-badge ${ok ? 'ok' : 'no'}` }, ok ? `🎉 To'g'ri! +${s.my_points}` : myChoice == null ? '⏱ Javob bermadingiz' : "❌ Noto'g'ri"),
      s.options.map((o, i) => h('div', { class: `choice${i === s.correct ? ' right' : ' wrong'}` }, h('span', { class: 'mark' }, i === s.correct ? '✓' : ''), o)));
    showRank(box);
    if (ok) setTimeout(() => confetti(), 150);
    return box;
  }
  if (!s.quiz_started_at) return waiting('🏆', 'Viktorina tez orada boshlanadi', 'Tayyor turing!');
  if (myChoice != null) return waiting('⏳', 'Javob yuborildi', "To'g'ri javobni kuting…");

  const lim = Math.max(5, s.settings.time_limit ?? 20) * 1000;
  const start = new Date(s.quiz_started_at).getTime();
  const bar = h('div', { style: { width: '100%' } });
  const left = h('b', {});
  const wrap = h('div', {},
    h('div', { class: 'row' }, h('span', { class: 'muted small' }, 'Qolgan vaqt'), h('span', { class: 'spacer' }), left),
    h('div', { class: 'progress' }, bar),
    s.options.map((o, i) => h('button', { class: 'choice quiz', type: 'button', style: { '--c': `var(--c${i % 8})` },
      onclick: (e) => { wrap.querySelectorAll('.choice').forEach((b) => { b.disabled = true; }); e.currentTarget.classList.add('sel'); submit({ choice: i }); } }, o)));
  const tick = () => {
    const ms = Math.max(0, lim - (Date.now() + clockOffset - start));
    bar.style.width = `${(ms / lim) * 100}%`;
    left.textContent = `${Math.ceil(ms / 1000)} s`;
    if (ms > 0) timerRaf = requestAnimationFrame(tick);
    else app.replaceChildren(app.firstChild, app.children[1], waiting('⏱', 'Vaqt tugadi', "To'g'ri javobni kuting…"));
  };
  requestAnimationFrame(tick);
  return wrap;
}

async function showRank(box) {
  try {
    const rows = await rpc('get_leaderboard', { p_presentation_id: presId, p_limit: 100 });
    const mineRow = rows.find((r) => r.participant_id === me.id);
    if (mineRow) box.append(h('p', { class: 'center muted' }, `Umumiy ochko: `, h('b', {}, mineRow.score), ` · O'rningiz: `, h('b', {}, `#${mineRow.rank}`)));
  } catch { /* ixtiyoriy */ }
}

// ---------- Savol-javob ----------
function renderQA() {
  const listEl = h('div', { class: 'qa-list' });
  const ta = h('textarea', { class: 'input', maxLength: 280, rows: 3, placeholder: 'Savolingizni yozing…' });
  const btn = h('button', { class: 'btn primary block' }, 'Savol yuborish');
  const form = h('form', { class: 'stack', onsubmit: async (e) => {
    e.preventDefault();
    const t = ta.value.trim();
    if (!t) return;
    btn.disabled = true;
    try { await rpc('ask_question', { p_presentation_id: presId, p_text: t }); ta.value = ''; toast('Savol yuborildi', 'success'); await loadQuestions(listEl); }
    catch (err) { toast(errorText(err), 'error'); }
    finally { btn.disabled = false; }
  } }, ta, btn);

  loadQuestions(listEl);
  if (!qaChannel) {
    qaChannel = supabase.channel(`qa:${presId}:${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions', filter: `presentation_id=eq.${presId}` }, () => {
        const el = $('.qa-list');
        if (el) loadQuestions(el);
      })
      .subscribe();
  }
  return h('div', { class: 'stack' }, form, h('h3', { style: { marginTop: '24px' } }, 'Savollar'), listEl);
}

let qaLoading = 0;
async function loadQuestions(listEl) {
  const ticket = ++qaLoading;
  const [{ data: qs, error }, { data: votes }] = await Promise.all([
    supabase.from('questions').select('id,text,author,upvotes,answered,created_at').eq('presentation_id', presId)
      .order('answered').order('upvotes', { ascending: false }).order('created_at').limit(200),
    supabase.from('question_votes').select('question_id').eq('participant_id', me.id),
  ]);
  if (ticket !== qaLoading) return;
  if (error) return listEl.replaceChildren(h('p', { class: 'empty' }, errorText(error)));
  questions = qs;
  myVotes = new Set((votes || []).map((v) => v.question_id));
  drawQuestions(listEl);
}

function drawQuestions(listEl) {
  if (!questions.length) return listEl.replaceChildren(h('p', { class: 'empty' }, "Hali savollar yo'q. Birinchi bo'ling!"));
  listEl.replaceChildren(...questions.map((q) => h('div', { class: `card qa-item${q.answered ? ' answered' : ''}` },
    h('button', { class: `vote-btn${myVotes.has(q.id) ? ' on' : ''}`, 'aria-pressed': String(myVotes.has(q.id)), 'aria-label': 'Ovoz berish',
      onclick: async (e) => {
        const b = e.currentTarget;
        b.disabled = true;
        try { await rpc('toggle_upvote', { p_question_id: q.id }); await loadQuestions(listEl); }
        catch (err) { toast(errorText(err), 'error'); b.disabled = false; }
      } }, '▲', h('span', {}, q.upvotes)),
    h('div', { class: 'q-text' }, h('div', {}, q.text), h('div', { class: 'q-author' }, `${q.author}${q.answered ? ' · ✓ javob berildi' : ''}`)))));
}

// ---------- Boshlash ----------
if (boot()) {
  renderNav();
  if (code.length !== 6) codeScreen();
  else if ((() => { try { return sessionStorage.getItem(`sado-joined-${code}`); } catch { return null; } })()) {
    join(store.get(NAME_KEY) || '').catch((err) => { toast(errorText(err), 'error'); nameScreen(); });
  } else nameScreen();
}
