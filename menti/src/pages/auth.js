import '../styles.css';
import { supabase } from '../lib/supabase.js';
import { $, $$, boot, toast } from '../lib/ui.js';
import { errorText } from '../lib/results.js';

const ok = boot();
let mode = 'login';
const next = (() => {
  const n = new URLSearchParams(location.search).get('next') || '/dashboard.html';
  return n.startsWith('/') && !n.startsWith('//') ? n : '/dashboard.html'; // ochiq redirectdan himoya
})();

function setMode(m) {
  mode = m;
  $$('.tabs button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.mode === m)));
  $('#name-field').hidden = m !== 'signup';
  $('#submit').textContent = m === 'signup' ? "Ro'yxatdan o'tish" : 'Kirish';
  $('#password').autocomplete = m === 'signup' ? 'new-password' : 'current-password';
  $('#forgot').hidden = m === 'signup';
  $('#auth-title').textContent = m === 'signup' ? 'Hisob yaratish' : 'Xush kelibsiz!';
  $('#auth-sub').textContent = m === 'signup'
    ? "Bepul hisob oching. Bu bir daqiqadan kam vaqt oladi."
    : 'Taqdimotlaringizni boshqarish uchun hisobingizga kiring.';
}
if (new URLSearchParams(location.search).get('mode') === 'signup') setMode('signup');
$('#pw-toggle').addEventListener('click', () => {
  const p = $('#password');
  const show = p.type === 'password';
  p.type = show ? 'text' : 'password';
  $('#pw-toggle').textContent = show ? 'Yashirish' : "Ko'rsatish";
});
$$('.tabs button').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));

$('#auth-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!ok) return;
  const email = $('#email').value.trim();
  const password = $('#password').value;
  if (!/^\S+@\S+\.\S+$/.test(email)) return toast("Email noto'g'ri", 'error');
  if (password.length < 8) return toast("Parol kamida 8 belgidan iborat bo'lsin", 'error');
  const btn = $('#submit');
  btn.disabled = true;
  try {
    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: $('#name').value.trim() }, emailRedirectTo: `${location.origin}/dashboard.html` },
      });
      if (error) throw error;
      if (!data.session) { toast(`Tasdiqlash havolasi ${email} manziliga yuborildi. Pochtangizni oching va havolani bosing.`, 'success'); setMode('login'); return; }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    }
    location.replace(next);
  } catch (err) {
    toast(errorText(err), 'error');
  } finally {
    btn.disabled = false;
  }
});

$('#forgot').addEventListener('click', async (e) => {
  e.preventDefault();
  if (!ok) return;
  const email = $('#email').value.trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) return toast('Avval emailni kiriting', 'error');
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/auth.html` });
  toast(error ? errorText(error) : 'Parolni tiklash havolasi yuborildi', error ? 'error' : 'success');
});

if (ok) {
  let recovering = false;
  supabase.auth.onAuthStateChange((event) => {
    if (event !== 'PASSWORD_RECOVERY') return;
    recovering = true;
    setTimeout(async () => { // callback ichida await qilmaslik kerak (supabase-js tavsiyasi)
      const pw = prompt('Yangi parol (kamida 8 belgi):');
      if (!pw || pw.length < 8) return toast("Parol o'zgartirilmadi", 'error');
      const { error } = await supabase.auth.updateUser({ password: pw });
      toast(error ? errorText(error) : 'Parol yangilandi', error ? 'error' : 'success');
      if (!error) location.replace('/dashboard.html');
    });
  });
  supabase.auth.getSession().then(({ data }) => {
    const u = data.session?.user;
    if (u && !u.is_anonymous && !recovering && !location.hash.includes('type=recovery')) location.replace(next);
  });
}
