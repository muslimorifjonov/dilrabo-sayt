-- =====================================================================
--  Dilrabo Raximberdievna · Kosmetolog — Supabase sxemasi
--  Supabase → SQL Editor → shu faylni to‘liq joylab → Run
--  Qayta ishga tushirish xavfsiz (idempotent).
-- =====================================================================

-- 1) Jadval
create table if not exists public.media (
  id           uuid primary key default gen_random_uuid(),
  category     text not null check (category in ('hero','about','certificates','results','reviews','clinic','promo')),
  path_lg      text not null,   -- katta versiya (max 1920px)
  path_sm      text not null,   -- kichik versiya (max 720px)
  width        int  not null,   -- lg o‘lchami (CLS bo‘lmasligi uchun)
  height       int  not null,
  focal_x      smallint not null default 50 check (focal_x between 0 and 100),
  focal_y      smallint not null default 50 check (focal_y between 0 and 100),
  title_uz     text, title_ru   text,   -- sertifikat nomi va h.k.
  caption_uz   text, caption_ru text,   -- beruvchi tashkilot / izoh
  alt_uz       text, alt_ru     text,
  sort_order   int  not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now()
);
create index if not exists media_category_sort_idx on public.media (category, sort_order, created_at desc);

-- 2) Adminlar
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- 3) RLS
alter table public.media  enable row level security;
alter table public.admins enable row level security;

drop policy if exists "media_public_read" on public.media;
create policy "media_public_read" on public.media
  for select using (is_published or public.is_admin());

drop policy if exists "media_admin_insert" on public.media;
create policy "media_admin_insert" on public.media
  for insert to authenticated with check (public.is_admin());

drop policy if exists "media_admin_update" on public.media;
create policy "media_admin_update" on public.media
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "media_admin_delete" on public.media;
create policy "media_admin_delete" on public.media
  for delete to authenticated using (public.is_admin());

drop policy if exists "admins_self_read" on public.admins;
create policy "admins_self_read" on public.admins
  for select to authenticated using (user_id = auth.uid());

-- 4) Tartiblash (bitta tranzaksiyada)
create or replace function public.reorder_media(ids uuid[])
returns void language plpgsql security invoker set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  update public.media m set sort_order = t.ord
  from unnest(ids) with ordinality as t(id, ord)
  where m.id = t.id;
end $$;

-- 5) Storage bucket (public o‘qish URL orqali; yozish faqat admin)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 10485760, array['image/webp','image/jpeg'])
on conflict (id) do update set public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "media_admin_select_obj" on storage.objects;
create policy "media_admin_select_obj" on storage.objects
  for select to authenticated using (bucket_id = 'media' and public.is_admin());

drop policy if exists "media_admin_insert_obj" on storage.objects;
create policy "media_admin_insert_obj" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "media_admin_update_obj" on storage.objects;
create policy "media_admin_update_obj" on storage.objects
  for update to authenticated using (bucket_id = 'media' and public.is_admin());

drop policy if exists "media_admin_delete_obj" on storage.objects;
create policy "media_admin_delete_obj" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and public.is_admin());

-- 6) Admin qo‘shish (foydalanuvchi Auth’da yaratilgandan keyin):
-- insert into public.admins (user_id) values ('<AUTH USER UUID>');

-- 7) Aniq ruxsatlar (yangi Supabase loyihalarida avtomatik berilmasligi mumkin).
--    Bu xavfsiz: haqiqiy cheklovni yuqoridagi RLS siyosatlari bajaradi.
grant usage on schema public to anon, authenticated;
grant select on public.media to anon, authenticated;
grant insert, update, delete on public.media to authenticated;
grant select on public.admins to authenticated;
grant execute on function public.is_admin() to anon, authenticated;
revoke execute on function public.reorder_media(uuid[]) from public, anon;
grant execute on function public.reorder_media(uuid[]) to authenticated;
