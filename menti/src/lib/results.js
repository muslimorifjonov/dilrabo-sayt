// Sof funksiyalar: natijalarni hisoblash, CSV, xatolar. (DOM'ga bog'liq emas — testlanadi)

export const SLIDE_TYPES = {
  poll: { label: "So'rovnoma", icon: '📊', hint: 'Variantlardan birini tanlashadi',
    explain: "Auditoriya variantlardan birini (yoki bir nechtasini) tanlaydi. Natija ekranda jonli ustunli grafik bo'lib o'sadi." },
  wordcloud: { label: "So'z buluti", icon: '☁️', hint: "Qisqa so'zlardan bulut",
    explain: "Har kim 1–5 ta qisqa so'z yozadi. Ko'p yozilgan so'zlar kattaroq ko'rinadi, ya'ni umumiy fikr bir qarashda ko'rinadi." },
  open: { label: 'Ochiq javob', icon: '💬', hint: 'Erkin matnli fikrlar',
    explain: "Ishtirokchilar o'z fikrini erkin yozadi. Javoblar ekranda rangli kartochkalar devori bo'lib chiqadi." },
  scale: { label: 'Baholash shkalasi', icon: '📏', hint: '1 dan 10 gacha baholash',
    explain: "Har bir fikrni shkala bo'yicha baholashadi (masalan 1–5). Ekranda har biri uchun o'rtacha ball ko'rsatiladi." },
  quiz: { label: 'Viktorina', icon: '🏆', hint: "Vaqtli o'yin va reyting",
    explain: "To'g'ri javobni belgilang va vaqt bering. Kim tez va to'g'ri javob bersa, ko'proq ochko oladi (500–1000). Oxirida reyting chiqadi." },
  qa: { label: 'Savol-javob', icon: '🙋', hint: 'Auditoriya savollari',
    explain: "Ishtirokchilar savol yuboradi va boshqalarning savoliga ovoz beradi. Eng ko'p ovoz olgan savollar tepada turadi." },
};

export function defaultSlide(type) {
  const base = { type, question: '', options: [], settings: {} };
  switch (type) {
    case 'poll': return { ...base, options: ['Variant 1', 'Variant 2', 'Variant 3'], settings: { multiple: false } };
    case 'quiz': return { ...base, options: ['A', 'B', 'C', 'D'], settings: { correct: 0, time_limit: 20 } };
    case 'scale': return { ...base, options: ['Fikr 1'], settings: { min: 1, max: 5, min_label: 'Umuman', max_label: "To'liq" } };
    case 'wordcloud': return { ...base, settings: { max_words: 3 } };
    case 'open': return { ...base, settings: { max_entries: 3 } };
    default: return base;
  }
}

/** Javoblardan slayd turiga mos natija tuzadi. */
export function aggregate(slide, responses) {
  const rs = responses.filter((r) => r.slide_id === slide.id);
  const participants = new Set(rs.map((r) => r.participant_id)).size;
  const opts = slide.options || [];
  switch (slide.type) {
    case 'poll':
    case 'quiz': {
      const counts = opts.map(() => 0);
      for (const r of rs) {
        const picks = slide.type === 'quiz' ? [r.value?.choice] : r.value?.choices || [];
        for (const i of picks) if (Number.isInteger(i) && i >= 0 && i < counts.length) counts[i]++;
      }
      return { kind: 'bars', counts, total: participants };
    }
    case 'scale': {
      const sums = opts.map(() => 0);
      const ns = opts.map(() => 0);
      for (const r of rs) (r.value?.ratings || []).forEach((v, i) => {
        if (i < sums.length && typeof v === 'number') { sums[i] += v; ns[i]++; }
      });
      return { kind: 'scale', averages: sums.map((s, i) => (ns[i] ? s / ns[i] : null)), total: participants };
    }
    case 'wordcloud': {
      const freq = new Map();
      for (const r of rs) for (const w of r.value?.words || []) {
        const k = String(w).trim().toLowerCase();
        if (k) freq.set(k, (freq.get(k) || 0) + 1);
      }
      const words = [...freq].map(([text, count]) => ({ text, count })).sort((a, b) => b.count - a.count || a.text.localeCompare(b.text));
      return { kind: 'cloud', words, total: participants };
    }
    case 'open': {
      const items = rs.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((r) => ({ id: r.id, text: r.value?.text || '' }));
      return { kind: 'wall', items, total: participants };
    }
    default:
      return { kind: 'none', total: participants };
  }
}

export const pct = (n, total) => (total > 0 ? Math.round((n / total) * 100) : 0);

/** So'z buluti uchun shrift o'lchami (rem) — 1..4.2 oralig'ida. */
export function cloudSize(count, max) {
  if (max <= 1) return 2;
  return +(1 + 3.2 * Math.sqrt((count - 1) / (max - 1))).toFixed(2);
}

/** Viktorina ochkosi (server formulasi bilan bir xil — ko'rsatish uchun). */
export function quizPoints(correct, elapsedSec, limitSec) {
  if (!correct) return 0;
  const lim = Math.max(5, limitSec || 20);
  return 500 + Math.round(500 * Math.max(0, 1 - elapsedSec / lim));
}

function csvCell(v) {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // CSV/formula injection himoyasi
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCSV(rows) {
  return '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
}

/** Barcha javoblarni CSV qatorlariga aylantiradi. */
export function responsesToRows(slides, responses, participants) {
  const names = new Map(participants.map((p) => [p.id, p.name]));
  const bySlide = new Map(slides.map((s, i) => [s.id, { s, i }]));
  const rows = [['Slayd #', 'Turi', 'Savol', 'Ishtirokchi', 'Javob', 'Ochko', 'Vaqt']];
  for (const r of responses) {
    const meta = bySlide.get(r.slide_id);
    if (!meta) continue;
    const { s, i } = meta;
    rows.push([i + 1, SLIDE_TYPES[s.type]?.label || s.type, s.question, names.get(r.participant_id) || 'Mehmon',
      formatAnswer(s, r.value), r.points || 0, new Date(r.created_at).toLocaleString('uz-UZ')]);
  }
  return rows;
}

export function formatAnswer(slide, value) {
  const o = slide.options || [];
  switch (slide.type) {
    case 'poll': return (value?.choices || []).map((i) => o[i] ?? '?').join('; ');
    case 'quiz': return o[value?.choice] ?? '?';
    case 'scale': return (value?.ratings || []).map((v, i) => `${o[i] ?? i + 1}: ${v}`).join('; ');
    case 'wordcloud': return (value?.words || []).join('; ');
    case 'open': return value?.text || '';
    default: return JSON.stringify(value);
  }
}

const ERRORS = {
  NOT_FOUND: 'Bunday kod topilmadi. Kodni tekshiring.',
  NOT_LIVE: 'Taqdimot hali boshlanmagan yoki tugagan.',
  NOT_ACTIVE: 'Bu slayd hozir faol emas.',
  VOTING_CLOSED: 'Ovoz berish yopilgan.',
  ALREADY_ANSWERED: 'Siz allaqachon javob bergansiz.',
  LIMIT_REACHED: 'Javoblar soni chegarasiga yetdingiz.',
  QUIZ_NOT_STARTED: 'Viktorina hali boshlanmagan.',
  TIME_UP: 'Vaqt tugadi!',
  NOT_JOINED: "Avval taqdimotga qo'shiling.",
  RATE_LIMIT: 'Juda tez. Birozdan keyin urinib ko\'ring.',
  INVALID: "Ma'lumot noto'g'ri.",
  AUTH_REQUIRED: 'Ulanishda xatolik. Sahifani yangilang.',
  FORBIDDEN: "Ruxsat yo'q.",
};

export function errorText(err) {
  const msg = String(err?.message || err || '');
  for (const k of Object.keys(ERRORS)) if (msg.includes(k)) return ERRORS[k];
  if (/Invalid login credentials/i.test(msg)) return "Email yoki parol noto'g'ri.";
  if (/already registered/i.test(msg)) return "Bu email allaqachon ro'yxatdan o'tgan.";
  if (/Email not confirmed/i.test(msg)) return 'Emailingizni tasdiqlang (pochtangizni tekshiring).';
  if (/anonymous sign-ins are disabled/i.test(msg)) return "Supabase'da anonim kirish o'chirilgan (README'ga qarang).";
  if (/fetch|network/i.test(msg)) return "Internet aloqasi yo'q yoki server javob bermadi. Aloqani tekshirib, qayta urinib ko'ring.";
  if (/permission denied/i.test(msg)) return "Ma'lumotlar bazasida ruxsat berilmagan. schema.sql dagi GRANT qismini ishga tushiring.";
  if (/relation .* does not exist|Could not find the (table|function)/i.test(msg)) return "Ma'lumotlar bazasi sozlanmagan: supabase/schema.sql ni SQL Editor'da ishga tushiring.";
  if (/JWT|session/i.test(msg)) return 'Sessiya muddati tugagan. Iltimos, qaytadan kiring.';
  return `Xatolik yuz berdi${msg ? `: ${msg.slice(0, 140)}` : ''}. Qaytadan urinib ko'ring.`;
}
