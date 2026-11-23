import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const configured = Boolean(url && key);

export const supabase = configured
  ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;

/** Taqdimotchi sessiyasini talab qiladi; bo'lmasa login sahifasiga yuboradi. */
export async function requireUser() {
  if (!configured) throw new Error('Supabase sozlanmagan');
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user || user.is_anonymous) {
    location.replace(`/auth.html?next=${encodeURIComponent(location.pathname + location.search)}`);
    return new Promise(() => {}); // yo'naltirish paytida to'xtatib turadi
  }
  return user;
}

/** Ishtirokchi uchun: mavjud sessiya yoki anonim sessiya. */
export async function ensureParticipant() {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session.user;
  const { data: d, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return d.user;
}

/** RPC chaqiruvi — xato bo'lsa tashlaydi. */
export async function rpc(fn, args) {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw error;
  return data;
}

/** Taqdimot kanali: holat o'zgarganini xabar qilish uchun (faqat "ping"). */
export function liveChannel(code) {
  return supabase.channel(`live:${code}`, { config: { broadcast: { self: false } } });
}
