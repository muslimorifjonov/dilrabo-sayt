import '../styles.css';
import { $, boot, toast } from '../lib/ui.js';
import { renderNav } from './nav.js';

boot();
renderNav();
$('#year').textContent = new Date().getFullYear();

const input = $('#code');
input.addEventListener('input', () => {
  const d = input.value.replace(/\D/g, '').slice(0, 6);
  input.value = d.length > 3 ? `${d.slice(0, 3)} ${d.slice(3)}` : d;
});
$('#join-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const code = input.value.replace(/\D/g, '');
  if (code.length !== 6) { toast("Kod 6 ta raqamdan iborat bo'lishi kerak", 'error'); input.focus(); return; }
  location.href = `/play.html?c=${code}`;
});

// Jonli demo: ustunlar va "uchib chiquvchi" reaksiyalar
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const bars = [...document.querySelectorAll('#demo-bars div')];
function shuffleBars() {
  const raw = bars.map(() => 10 + Math.random() * 90);
  const sum = raw.reduce((a, b) => a + b, 0);
  const max = Math.max(...raw);
  bars.forEach((b, i) => { b.style.height = `${(raw[i] / max) * 100}%`; b.dataset.v = Math.round((raw[i] / sum) * 100); });
}
shuffleBars();
if (!reduced) {
  setInterval(shuffleBars, 2400);
  const box = $('#floaters');
  const emojis = ['🔥', '👏', '❤️', '😂', '🎉', '👍', '🤯'];
  setInterval(() => {
    if (document.hidden) return;
    const f = document.createElement('span');
    f.className = 'floater';
    f.textContent = emojis[(Math.random() * emojis.length) | 0];
    f.style.left = `${10 + Math.random() * 80}%`;
    f.style.top = `${55 + Math.random() * 30}%`;
    box.append(f);
    setTimeout(() => f.remove(), 4000);
  }, 900);
}
