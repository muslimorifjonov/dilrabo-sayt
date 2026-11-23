import '../styles.css';
import QRCode from 'qrcode';
import { supabase, requireUser, rpc, liveChannel } from '../lib/supabase.js';
import { $, h, boot, toast, confirmDialog, fmtCode, joinUrl } from '../lib/ui.js';
import { SLIDE_TYPES, errorText, toCSV, responsesToRows } from '../lib/results.js';
import { renderResults } from '../lib/render.js';
import { confetti } from '../lib/fx.js';

const id = new URLSearchParams(location.search).get('id');
let pres;
let slides = [];
let responses = [];
let questions = [];
let channel;
let overlay = null; // null | 'leaderboard' | 'qr'
let clockOffset = 0; // server - local (ms)
let timerRaf = 0;
let qrDataUrl = '';

const cur = () => slides.find((s) => s.id === pres.current_slide_id) || slides[0];
const curIdx = () => Math.max(0, slides.indexOf(cur()));

async function fetchAll(table, filterCol, val, order = 'id') {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(table).select('*').eq(filterCol, val).order(order).range(from, from + 999);
    if (error) throw error;
    out.push(...data);
    if (data.length < 1000) return out;
  }
}

async function init() {
  const [{ data: p, error: e1 }, { data: s, error: e2 }] = await Promise.all([
    supabase.from('presentations').select('*').eq('id', id).maybeSingle(),
    supabase.from('slides').select('*').eq('presentation_id', id).order('position'),
  ]);
  if (e1 || e2 || !p) { $('#stage').replaceChildren(h('p', { class: 'empty' }, p === null ? 'Taqdimot topilmadi' : errorText(e1 || e2))); return; }
  pres = p;
  slides = s;
  document.title = `${p.title} — Taqdimot`;
  if (!slides.length) {
    $('#stage').replaceChildren(h('div', { class: 'empty stack' }, h('p', {}, "Taqdimotda slayd yo'q"), h('a', { class: 'btn primary', href: `/edit.html?id=${id}` }, 'Tahrirlash')));
    return;
  }

  $('#join-host').textContent = location.host;
  $('#join-code').textContent = fmtCode(p.code);
  qrDataUrl = await QRCode.toDataURL(joinUrl(p.code), { margin: 1, width: 600, errorCorrectionLevel: 'M' });
  $('#qr-mini').src = qrDataUrl;

  const startSlide = slides.some((x) => x.id === p.current_slide_id) ? p.current_slide_id : slides[0].id;
  await updatePres({ is_live: true, current_slide_id: startSlide });

  try {
    const st = await rpc('get_live_state', { p_code: p.code });
    if (st.server_now) clockOffset = new Date(st.server_now).getTime() - Date.now();
  } catch { /* soat farqi 0 deb olinadi */ }

  [responses, questions] = await Promise.all([
    fetchAll('responses', 'presentation_id', id),
    fetchAll('questions', 'presentation_id', id, 'created_at'),
  ]);
  subscribe();
  bindControls();
  render();
}

function subscribe() {
  channel = liveChannel(pres.code)
    .on('presence', { event: 'sync' }, () => {
      const n = Object.keys(channel.presenceState()).length;
      $('#count-badge').textContent = `👥 ${n}`;
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'responses', filter: `presentation_id=eq.${id}` }, (pl) => {
      if (pl.eventType === 'INSERT') { if (!responses.some((r) => r.id === pl.new.id)) responses.push(pl.new); }
      else if (pl.eventType === 'DELETE') responses = responses.filter((r) => r.id !== pl.old.id);
      scheduleRender();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'questions', filter: `presentation_id=eq.${id}` }, (pl) => {
      if (pl.eventType === 'DELETE') questions = questions.filter((q) => q.id !== pl.old.id);
      else {
        const i = questions.findIndex((q) => q.id === pl.new.id);
        if (i >= 0) questions[i] = pl.new; else questions.push(pl.new);
      }
      scheduleRender();
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') ping();
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') toast("Real vaqt ulanishi uzildi, qayta ulanmoqda…", 'error');
    });
}

/** Ishtirokchilarga "holat o'zgardi" signali. */
function ping() {
  channel?.send({ type: 'broadcast', event: 'state', payload: { t: Date.now() } });
}

async function updatePres(patch) {
  Object.assign(pres, patch);
  const { error } = await supabase.from('presentations').update(patch).eq('id', id);
  if (error) toast(errorText(error), 'error');
  ping();
}

async function updateSlide(s, patch) {
  Object.assign(s, patch);
  render();
  const { error } = await supabase.from('slides').update(patch).eq('id', s.id);
  if (error) toast(errorText(error), 'error');
  ping();
}

let renderQueued = false;
function scheduleRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => { renderQueued = false; render(); });
}

// ---------- Chizish ----------
function render() {
  const s = cur();
  const i = curIdx();
  $('#counter').textContent = `${i + 1} / ${slides.length}`;
  $('#prev').disabled = i === 0;
  $('#next').disabled = i === slides.length - 1;
  $('#state-badge').textContent = `${SLIDE_TYPES[s.type].icon} ${SLIDE_TYPES[s.type].label}`;
  renderActions(s);
  cancelAnimationFrame(timerRaf);

  const stage = $('#stage');
  if (overlay === 'qr') { if (stage.dataset.mode !== 'qr') renderQR(stage); return; }
  if (overlay === 'leaderboard') { if (stage.dataset.mode !== 'lb') renderLeaderboard(stage); return; }

  if (stage.dataset.slide !== s.id || stage.dataset.mode !== 'slide') {
    stage.replaceChildren(
      h('div', { class: 'row' }, h('div', { class: 'stage-q', id: 'stage-q' }), h('span', { class: 'spacer' }), h('div', { class: 'timer', id: 'timer' })),
      h('div', { class: 'muted', id: 'stage-sub' }),
      h('div', { class: 'results', id: 'results' }));
    stage.dataset.slide = s.id;
    stage.dataset.mode = 'slide';
  }
  $('#stage-q').textContent = s.question || SLIDE_TYPES[s.type].label;
  const res = $('#results');

  if (s.type === 'qa') { $('#stage-sub').textContent = `${questions.length} ta savol`; return renderQA(res); }

  const answered = new Set(responses.filter((r) => r.slide_id === s.id).map((r) => r.participant_id)).size;
  let sub = `${answered} ta ishtirokchi javob berdi`;
  if (!s.voting_open) sub += ' · Ovoz berish yopiq';

  if (s.type === 'quiz') {
    if (!s.quiz_started_at) {
      $('#stage-sub').textContent = 'Viktorinani boshlash uchun «Boshlash» tugmasini bosing';
      $('#timer').textContent = '';
      res.dataset.kind = '';
      res.replaceChildren(h('div', { class: 'empty' }, h('div', { style: { fontSize: '4rem' } }, '🏆'), h('p', {}, `${s.options.length} ta variant · ${s.settings.time_limit ?? 20} soniya`)));
      return;
    }
    $('#stage-sub').textContent = sub;
    if (!s.revealed) {
      runTimer(s);
      res.dataset.kind = '';
      res.replaceChildren(h('div', { class: 'type-menu' }, s.options.map((o, k) =>
        h('div', { class: 'card', style: { borderLeft: `6px solid var(--c${k % 8})`, fontSize: '1.3rem', fontWeight: 700 } }, o))));
      return;
    }
    $('#timer').textContent = '';
  } else {
    $('#timer').textContent = '';
    $('#stage-sub').textContent = sub;
  }
  renderResults(res, s, responses, { hidden: !pres.show_results, revealed: s.revealed });
}

function runTimer(s) {
  const lim = Math.max(5, s.settings.time_limit ?? 20) * 1000;
  const start = new Date(s.quiz_started_at).getTime();
  const tick = () => {
    const left = Math.max(0, lim - (Date.now() + clockOffset - start));
    const el = $('#timer');
    if (!el) return;
    el.textContent = Math.ceil(left / 1000);
    el.classList.toggle('low', left < 5000);
    if (left > 0) timerRaf = requestAnimationFrame(tick);
    else el.textContent = '⏱';
  };
  tick();
}

function renderQA(res) {
  res.dataset.kind = 'qa';
  const list = questions.slice().sort((a, b) => (a.answered - b.answered) || (b.upvotes - a.upvotes) || (new Date(a.created_at) - new Date(b.created_at)));
  if (!list.length) { res.replaceChildren(h('p', { class: 'empty' }, `Savollar kutilmoqda… Kod: ${fmtCode(pres.code)}`)); return; }
  res.replaceChildren(h('div', { class: 'qa-list' }, list.map((q) =>
    h('div', { class: `card qa-item${q.answered ? ' answered' : ''}` },
      h('div', { class: 'vote-btn', 'aria-label': 'Ovozlar' }, '▲', h('span', {}, q.upvotes)),
      h('div', { class: 'q-text' }, h('div', { style: { fontSize: '1.2rem', fontWeight: 600 } }, q.text), h('div', { class: 'q-author' }, q.author)),
      h('button', { class: 'btn sm ' + (q.answered ? 'ghost' : 'success'), onclick: () => setAnswered(q) }, q.answered ? 'Qaytarish' : '✓ Javob berildi'),
      h('button', { class: 'icon-btn', 'aria-label': "O'chirish", onclick: () => deleteQuestion(q) }, '🗑')))));
}

async function setAnswered(q) {
  q.answered = !q.answered;
  render();
  const { error } = await supabase.from('questions').update({ answered: q.answered }).eq('id', q.id);
  if (error) toast(errorText(error), 'error');
}

async function deleteQuestion(q) {
  if (!(await confirmDialog("Savol o'chirilsinmi?", "O'chirish"))) return;
  const { error } = await supabase.from('questions').delete().eq('id', q.id);
  if (error) return toast(errorText(error), 'error');
  questions = questions.filter((x) => x.id !== q.id);
  render();
}

async function renderLeaderboard(stage) {
  stage.dataset.mode = 'lb';
  stage.replaceChildren(h('div', { class: 'stage-q center' }, '🏆 Reyting'), h('div', { class: 'spinner' }));
  try {
    const rows = await rpc('get_leaderboard', { p_presentation_id: id, p_limit: 10 });
    if (overlay !== 'leaderboard') return;
    const top = rows.filter((r) => r.score > 0);
    if (top.length) confetti(200);
    stage.replaceChildren(h('div', { class: 'stage-q center' }, '🏆 Reyting'),
      top.length
        ? h('div', { class: 'leaderboard' }, top.map((r, i) =>
          h('div', { class: 'card lb-row', style: { animationDelay: `${i * 70}ms` } },
            h('span', { class: 'lb-rank' }, r.rank), h('span', { class: 'lb-name' }, r.name), h('span', { class: 'lb-score' }, r.score))))
        : h('p', { class: 'empty' }, "Hali ochko to'plaganlar yo'q"));
  } catch (err) { toast(errorText(err), 'error'); }
}

function renderQR(stage) {
  stage.dataset.mode = 'qr';
  stage.replaceChildren(h('div', { class: 'qr-big' },
    h('img', { src: qrDataUrl, alt: 'Qo\'shilish uchun QR kod' }),
    h('div', { class: 'stage-q' }, `${location.host} · ${fmtCode(pres.code)}`),
    h('p', { class: 'muted' }, 'Telefon kamerasi bilan skanerlang yoki kodni kiriting')));
}

// ---------- Boshqaruv ----------
function renderActions(s) {
  const box = $('#slide-actions');
  const btns = [];
  if (s.type !== 'qa' && s.type !== 'quiz') {
    btns.push(h('button', { class: 'btn ghost sm', title: 'H', onclick: () => updatePres({ show_results: !pres.show_results }).then(render) },
      pres.show_results ? '🙈 Yashirish' : '👁 Ko\'rsatish'));
    btns.push(h('button', { class: 'btn ghost sm', onclick: () => updateSlide(s, { voting_open: !s.voting_open }) },
      s.voting_open ? '🔒 Yopish' : '🔓 Ochish'));
  }
  if (s.type === 'quiz') {
    if (!s.quiz_started_at || s.revealed) btns.push(h('button', { class: 'btn success sm', onclick: () => startQuiz(s) }, s.quiz_started_at ? '↻ Qayta boshlash' : '▶ Boshlash'));
    else btns.push(h('button', { class: 'btn primary sm', onclick: () => { confetti(); updateSlide(s, { revealed: true, voting_open: false }); } }, "✓ Javobni ko'rsatish"));
  }
  if (s.type !== 'qa') btns.push(h('button', { class: 'btn ghost sm', onclick: () => resetSlide(s) }, '🧹 Tozalash'));
  box.replaceChildren(...btns);
}

async function startQuiz(s) {
  try {
    const r = await rpc('start_quiz', { p_slide_id: s.id });
    responses = responses.filter((x) => x.slide_id !== s.id);
    Object.assign(s, { quiz_started_at: r.started_at, revealed: false, voting_open: true });
    overlay = null;
    render();
    ping();
  } catch (err) { toast(errorText(err), 'error'); }
}

async function resetSlide(s) {
  if (!(await confirmDialog("Bu slayddagi barcha javoblar o'chirilsinmi?", 'Tozalash'))) return;
  const { error } = await supabase.from('responses').delete().eq('slide_id', s.id);
  if (error) return toast(errorText(error), 'error');
  responses = responses.filter((r) => r.slide_id !== s.id);
  if (s.type === 'quiz') await updateSlide(s, { quiz_started_at: null, revealed: false, voting_open: true });
  else { render(); ping(); }
  toast('Tozalandi', 'success');
}

function go(delta) {
  const j = curIdx() + delta;
  if (j < 0 || j >= slides.length) return;
  overlay = null;
  updatePres({ current_slide_id: slides[j].id });
  render();
}

function toggleOverlay(name) {
  overlay = overlay === name ? null : name;
  $('#stage').dataset.mode = '';
  render();
}

async function exportCSV() {
  try {
    const [all, { data: parts, error }] = await Promise.all([
      fetchAll('responses', 'presentation_id', id),
      supabase.from('participants').select('id,name').eq('presentation_id', id),
    ]);
    if (error) throw error;
    const rows = responsesToRows(slides, all, parts);
    if (rows.length <= 1) return toast("Eksport uchun javoblar yo'q", 'error');
    const blob = new Blob([toCSV(rows)], { type: 'text/csv;charset=utf-8' });
    const a = h('a', { href: URL.createObjectURL(blob), download: `${pres.title.replace(/[^\p{L}\p{N}]+/gu, '_')}_natijalar.csv` });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  } catch (err) { toast(errorText(err), 'error'); }
}

async function endSession() {
  if (!(await confirmDialog('Taqdimot tugatilsinmi? Ishtirokchilar boshqa ovoz bera olmaydi.', 'Tugatish'))) return;
  await updatePres({ is_live: false });
  location.href = `/edit.html?id=${id}`;
}

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.().catch(() => {});
}

function bindControls() {
  $('#prev').addEventListener('click', () => go(-1));
  $('#next').addEventListener('click', () => go(1));
  $('#lb-btn').addEventListener('click', () => toggleOverlay('leaderboard'));
  $('#qr-btn').addEventListener('click', () => toggleOverlay('qr'));
  $('#qr-mini').addEventListener('click', () => toggleOverlay('qr'));
  $('#csv-btn').addEventListener('click', exportCSV);
  $('#fs-btn').addEventListener('click', toggleFullscreen);
  $('#end-btn').addEventListener('click', endSession);
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, select, dialog') || e.ctrlKey || e.metaKey || e.altKey) return;
    if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); go(1); }
    else if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); go(-1); }
    else if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    else if ((e.key === 'h' || e.key === 'H') && !['qa', 'quiz'].includes(cur().type)) updatePres({ show_results: !pres.show_results }).then(render);
    else if (e.key === 'Escape' && overlay) toggleOverlay(overlay);
  });
}

if (boot()) {
  await requireUser();
  if (!id) location.replace('/dashboard.html');
  else init().catch((err) => toast(errorText(err), 'error'));
}
