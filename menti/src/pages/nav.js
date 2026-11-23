import { supabase, configured } from '../lib/supabase.js';
import { $, h } from '../lib/ui.js';

export async function renderNav() {
  const nav = $('#nav');
  if (!nav || !configured) return;
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (user && !user.is_anonymous) {
    nav.replaceChildren(
      h('a', { class: 'btn ghost sm', href: '/dashboard.html' }, 'Taqdimotlarim'),
      h('button', { class: 'btn ghost sm', onclick: async () => { await supabase.auth.signOut(); location.href = '/'; } }, 'Chiqish'));
  } else {
    nav.replaceChildren(h('a', { class: 'btn ghost sm', href: '/auth.html' }, 'Kirish'));
  }
}
