-- Menti: Supabase sxemasi. SQL Editor'da bir marta to'liq ishga tushiring.
-- Talab: Authentication → Sign In / Providers → "Allow anonymous sign-ins" yoqilgan bo'lsin.


-- ============ JADVALLAR ============
create table if not exists public.presentations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  title text not null default 'Nomsiz taqdimot' check (char_length(title) between 1 and 120),
  code text not null unique,
  is_live boolean not null default false,
  current_slide_id uuid,
  show_results boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.slides (
  id uuid primary key default gen_random_uuid(),
  presentation_id uuid not null references public.presentations(id) on delete cascade,
  position int not null default 0,
  type text not null check (type in ('poll','wordcloud','open','scale','quiz','qa')),
  question text not null default '' check (char_length(question) <= 300),
  options jsonb not null default '[]'::jsonb check (jsonb_typeof(options) = 'array'),
  settings jsonb not null default '{}'::jsonb check (jsonb_typeof(settings) = 'object'),
  voting_open boolean not null default true,
  quiz_started_at timestamptz,
  revealed boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists slides_pres_idx on public.slides(presentation_id, position);

alter table public.presentations drop constraint if exists presentations_current_slide_fk;
alter table public.presentations add constraint presentations_current_slide_fk
  foreign key (current_slide_id) references public.slides(id) on delete set null;

create table if not exists public.participants (
  id uuid not null,                       -- auth.uid() (anonim foydalanuvchi)
  presentation_id uuid not null references public.presentations(id) on delete cascade,
  name text not null default 'Mehmon' check (char_length(name) between 1 and 40),
  created_at timestamptz not null default now(),
  primary key (presentation_id, id)
);

create table if not exists public.responses (
  id bigint generated always as identity primary key,
  slide_id uuid not null references public.slides(id) on delete cascade,
  presentation_id uuid not null references public.presentations(id) on delete cascade,
  participant_id uuid not null,
  seq int not null default 0,
  value jsonb not null,
  points int not null default 0,
  created_at timestamptz not null default now(),
  unique (slide_id, participant_id, seq)
);
create index if not exists responses_pres_idx on public.responses(presentation_id);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  presentation_id uuid not null references public.presentations(id) on delete cascade,
  participant_id uuid not null,
  author text not null default 'Anonim',
  text text not null check (char_length(text) between 1 and 280),
  upvotes int not null default 0,
  answered boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists questions_pres_idx on public.questions(presentation_id);

create table if not exists public.question_votes (
  question_id uuid not null references public.questions(id) on delete cascade,
  participant_id uuid not null,
  primary key (question_id, participant_id)
);

-- Foydalanuvchining o'z shablonlari
create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  title text not null check (char_length(title) between 1 and 80),
  icon text not null default '📁' check (char_length(icon) between 1 and 8),
  description text not null default '' check (char_length(description) <= 160),
  slides jsonb not null default '[]'::jsonb check (jsonb_typeof(slides) = 'array' and jsonb_array_length(slides) <= 100),
  created_at timestamptz not null default now()
);
create index if not exists templates_owner_idx on public.templates(owner_id, created_at desc);

-- ============ TRIGGERLAR ============
create or replace function public.gen_presentation_code() returns trigger
language plpgsql set search_path = public as $$
declare c text;
begin
  if new.code is not null and new.code ~ '^\d{6}$' then return new; end if;
  loop
    c := lpad((floor(random() * 1000000))::int::text, 6, '0');
    exit when not exists (select 1 from presentations where code = c);
  end loop;
  new.code := c;
  return new;
end $$;

drop trigger if exists presentations_code on public.presentations;
create trigger presentations_code before insert on public.presentations
  for each row execute function public.gen_presentation_code();

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at := now(); return new; end $$;

drop trigger if exists presentations_touch on public.presentations;
create trigger presentations_touch before update on public.presentations
  for each row execute function public.touch_updated_at();

create or replace function public.sync_upvotes() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update questions set upvotes = (select count(*) from question_votes v where v.question_id = coalesce(new.question_id, old.question_id))
  where id = coalesce(new.question_id, old.question_id);
  return null;
end $$;

drop trigger if exists question_votes_sync on public.question_votes;
create trigger question_votes_sync after insert or delete on public.question_votes
  for each row execute function public.sync_upvotes();

-- ============ RLS ============
alter table public.presentations  enable row level security;
alter table public.slides         enable row level security;
alter table public.participants   enable row level security;
alter table public.responses      enable row level security;
alter table public.questions      enable row level security;
alter table public.question_votes enable row level security;
alter table public.templates      enable row level security;

drop policy if exists t_owner on public.templates;
create policy t_owner on public.templates for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

create or replace function public.owns_presentation(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from presentations where id = p and owner_id = auth.uid());
$$;

drop policy if exists p_owner on public.presentations;
create policy p_owner on public.presentations for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

drop policy if exists s_owner on public.slides;
create policy s_owner on public.slides for all to authenticated
  using (public.owns_presentation(presentation_id)) with check (public.owns_presentation(presentation_id));

drop policy if exists pa_owner on public.participants;
create policy pa_owner on public.participants for select to authenticated
  using (public.owns_presentation(presentation_id));

drop policy if exists r_owner_sel on public.responses;
create policy r_owner_sel on public.responses for select to authenticated
  using (public.owns_presentation(presentation_id));
drop policy if exists r_owner_del on public.responses;
create policy r_owner_del on public.responses for delete to authenticated
  using (public.owns_presentation(presentation_id));

-- Savollar sessiya ichida ochiq (ishtirokchilar ham ko'radi)
drop policy if exists q_read on public.questions;
create policy q_read on public.questions for select to authenticated using (true);
drop policy if exists q_owner_upd on public.questions;
create policy q_owner_upd on public.questions for update to authenticated
  using (public.owns_presentation(presentation_id)) with check (public.owns_presentation(presentation_id));
drop policy if exists q_owner_del on public.questions;
create policy q_owner_del on public.questions for delete to authenticated
  using (public.owns_presentation(presentation_id));

drop policy if exists qv_self on public.question_votes;
create policy qv_self on public.question_votes for select to authenticated
  using (participant_id = auth.uid());

-- ============ RUXSATLAR (GRANT) ============
-- Yangi Supabase loyihalarida jadvallar avtomatik ochilmaydi. Faqat kerakli amallar beriladi; qatorlarni RLS cheklaydi.
revoke all on public.presentations, public.slides, public.participants, public.responses,
  public.questions, public.question_votes, public.templates from anon, authenticated;
grant select, insert, update, delete on public.templates to authenticated;
grant select, insert, update, delete on public.presentations to authenticated;
grant select, insert, update, delete on public.slides to authenticated;
grant select on public.participants to authenticated;
grant select, delete on public.responses to authenticated;
grant select, update, delete on public.questions to authenticated;
grant select on public.question_votes to authenticated;

-- ============ RPC (ishtirokchilar uchun) ============
create or replace function public.join_presentation(p_code text, p_name text)
returns json language plpgsql security definer set search_path = public as $$
declare p presentations; n text;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into p from presentations where code = trim(p_code);
  if not found then raise exception 'NOT_FOUND'; end if;
  if not p.is_live then raise exception 'NOT_LIVE'; end if;
  n := left(coalesce(nullif(trim(p_name), ''), 'Mehmon'), 40);
  insert into participants(id, presentation_id, name) values (auth.uid(), p.id, n)
    on conflict (presentation_id, id) do update set name = excluded.name;
  return json_build_object('presentation_id', p.id, 'title', p.title, 'code', p.code, 'name', n);
end $$;

create or replace function public.get_live_state(p_code text)
returns json language plpgsql stable security definer set search_path = public as $$
declare p presentations; s slides; my json; pts int; sl json;
begin
  select * into p from presentations where code = trim(p_code);
  if not found then raise exception 'NOT_FOUND'; end if;
  if not p.is_live then
    return json_build_object('presentation', json_build_object('id', p.id, 'title', p.title, 'code', p.code, 'is_live', false), 'server_now', now());
  end if;
  select * into s from slides where id = p.current_slide_id;
  if found then
    select coalesce(json_agg(r.value order by r.seq), '[]'::json) into my
      from responses r where r.slide_id = s.id and r.participant_id = auth.uid();
    select coalesce(sum(r.points), 0) into pts
      from responses r where r.slide_id = s.id and r.participant_id = auth.uid();
    sl := json_build_object(
      'id', s.id, 'type', s.type, 'question', s.question, 'options', s.options,
      'settings', s.settings - 'correct',
      'correct', case when s.revealed then s.settings -> 'correct' end,
      'voting_open', s.voting_open, 'quiz_started_at', s.quiz_started_at,
      'revealed', s.revealed, 'my_responses', my, 'my_points', pts);
  end if;
  return json_build_object(
    'presentation', json_build_object('id', p.id, 'title', p.title, 'code', p.code, 'is_live', true),
    'slide', sl, 'server_now', now());
end $$;

create or replace function public.submit_response(p_slide_id uuid, p_value jsonb)
returns json language plpgsql security definer set search_path = public as $$
declare
  s slides; p presentations; uid uuid := auth.uid();
  n_opts int; cnt int; v jsonb; pts int := 0; elapsed numeric; lim numeric;
  max_entries int; words jsonb; t text; i int; mn int; mx int; el jsonb;
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into s from slides where id = p_slide_id;
  if not found then raise exception 'NOT_FOUND'; end if;
  select * into p from presentations where id = s.presentation_id;
  if not p.is_live or p.current_slide_id is distinct from s.id then raise exception 'NOT_ACTIVE'; end if;
  if not s.voting_open or s.revealed then raise exception 'VOTING_CLOSED'; end if;
  if not exists (select 1 from participants where presentation_id = p.id and id = uid) then
    raise exception 'NOT_JOINED';
  end if;
  n_opts := jsonb_array_length(s.options);
  select count(*) into cnt from responses where slide_id = s.id and participant_id = uid;

  if s.type = 'poll' then
    if cnt > 0 then raise exception 'ALREADY_ANSWERED'; end if;
    if coalesce(jsonb_typeof(p_value -> 'choices'), '') <> 'array' or jsonb_array_length(p_value -> 'choices') = 0 then raise exception 'INVALID'; end if;
    if jsonb_array_length(p_value -> 'choices') > 1 and coalesce((s.settings ->> 'multiple')::boolean, false) = false then raise exception 'INVALID'; end if;
    select jsonb_agg(distinct x::int) into words from jsonb_array_elements_text(p_value -> 'choices') x;
    for el in select * from jsonb_array_elements(words) loop
      if (el)::int < 0 or (el)::int >= n_opts then raise exception 'INVALID'; end if;
    end loop;
    v := jsonb_build_object('choices', words);

  elsif s.type = 'quiz' then
    if cnt > 0 then raise exception 'ALREADY_ANSWERED'; end if;
    if s.quiz_started_at is null then raise exception 'QUIZ_NOT_STARTED'; end if;
    i := (p_value ->> 'choice')::int;
    if i is null or i < 0 or i >= n_opts then raise exception 'INVALID'; end if;
    lim := greatest(5, coalesce((s.settings ->> 'time_limit')::int, 20));
    elapsed := extract(epoch from (now() - s.quiz_started_at));
    if elapsed > lim + 1.5 then raise exception 'TIME_UP'; end if;
    if i = (s.settings ->> 'correct')::int then
      pts := 500 + round(500 * greatest(0, 1 - elapsed / lim))::int;
    end if;
    v := jsonb_build_object('choice', i);

  elsif s.type = 'scale' then
    if cnt > 0 then raise exception 'ALREADY_ANSWERED'; end if;
    mn := coalesce((s.settings ->> 'min')::int, 1); mx := coalesce((s.settings ->> 'max')::int, 5);
    if coalesce(jsonb_typeof(p_value -> 'ratings'), '') <> 'array' or jsonb_array_length(p_value -> 'ratings') <> n_opts then raise exception 'INVALID'; end if;
    for el in select * from jsonb_array_elements(p_value -> 'ratings') loop
      if jsonb_typeof(el) <> 'number' or (el)::int < mn or (el)::int > mx then raise exception 'INVALID'; end if;
    end loop;
    v := jsonb_build_object('ratings', p_value -> 'ratings');

  elsif s.type = 'wordcloud' then
    if cnt > 0 then raise exception 'ALREADY_ANSWERED'; end if;
    if coalesce(jsonb_typeof(p_value -> 'words'), '') <> 'array' then raise exception 'INVALID'; end if;
    select coalesce(jsonb_agg(distinct w), '[]'::jsonb) into words from (
      select lower(left(regexp_replace(trim(x), '\s+', ' ', 'g'), 25)) w
      from jsonb_array_elements_text(p_value -> 'words') x
    ) q where w <> '';
    if jsonb_array_length(words) = 0 or jsonb_array_length(words) > greatest(1, coalesce((s.settings ->> 'max_words')::int, 3)) then
      raise exception 'INVALID';
    end if;
    v := jsonb_build_object('words', words);

  elsif s.type = 'open' then
    max_entries := least(10, greatest(1, coalesce((s.settings ->> 'max_entries')::int, 3)));
    if cnt >= max_entries then raise exception 'LIMIT_REACHED'; end if;
    t := trim(coalesce(p_value ->> 'text', ''));
    if t = '' or char_length(t) > 250 then raise exception 'INVALID'; end if;
    v := jsonb_build_object('text', t);
  else
    raise exception 'INVALID';
  end if;

  insert into responses(slide_id, presentation_id, participant_id, seq, value, points)
  values (s.id, p.id, uid, cnt, v, pts);
  return json_build_object('ok', true);
exception when unique_violation then
  raise exception 'ALREADY_ANSWERED';
end $$;

create or replace function public.ask_question(p_presentation_id uuid, p_text text)
returns json language plpgsql security definer set search_path = public as $$
declare nm text; t text := trim(coalesce(p_text, '')); recent int;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select name into nm from participants where presentation_id = p_presentation_id and id = auth.uid();
  if not found then raise exception 'NOT_JOINED'; end if;
  if t = '' or char_length(t) > 280 then raise exception 'INVALID'; end if;
  select count(*) into recent from questions
    where presentation_id = p_presentation_id and participant_id = auth.uid() and created_at > now() - interval '1 minute';
  if recent >= 3 then raise exception 'RATE_LIMIT'; end if;
  insert into questions(presentation_id, participant_id, author, text) values (p_presentation_id, auth.uid(), nm, t);
  return json_build_object('ok', true);
end $$;

create or replace function public.toggle_upvote(p_question_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare q questions;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into q from questions where id = p_question_id;
  if not found then raise exception 'NOT_FOUND'; end if;
  if not exists (select 1 from participants where presentation_id = q.presentation_id and id = auth.uid()) then
    raise exception 'NOT_JOINED';
  end if;
  if exists (select 1 from question_votes where question_id = q.id and participant_id = auth.uid()) then
    delete from question_votes where question_id = q.id and participant_id = auth.uid();
    return json_build_object('voted', false);
  end if;
  insert into question_votes(question_id, participant_id) values (q.id, auth.uid());
  return json_build_object('voted', true);
end $$;

create or replace function public.get_leaderboard(p_presentation_id uuid, p_limit int default 10)
returns table(participant_id uuid, name text, score bigint, rank bigint)
language sql stable security definer set search_path = public as $$
  select pa.id, pa.name, coalesce(sum(r.points), 0)::bigint as sc,
         rank() over (order by coalesce(sum(r.points), 0) desc)::bigint
  from participants pa
  left join responses r on r.participant_id = pa.id and r.presentation_id = pa.presentation_id
  where pa.presentation_id = p_presentation_id
    and (public.owns_presentation(p_presentation_id) or exists (
      select 1 from participants me where me.presentation_id = p_presentation_id and me.id = auth.uid()))
  group by pa.id, pa.name
  order by sc desc, min(pa.created_at)
  limit least(greatest(p_limit, 1), 100);
$$;

-- Taqdimotchi: viktorinani server vaqti bilan boshlash
create or replace function public.start_quiz(p_slide_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare s slides;
begin
  select * into s from slides where id = p_slide_id;
  if not found or not public.owns_presentation(s.presentation_id) then raise exception 'FORBIDDEN'; end if;
  delete from responses where slide_id = s.id;
  update slides set quiz_started_at = now(), voting_open = true, revealed = false where id = s.id;
  return json_build_object('started_at', now());
end $$;

revoke all on function public.join_presentation(text, text), public.get_live_state(text),
  public.submit_response(uuid, jsonb), public.ask_question(uuid, text),
  public.toggle_upvote(uuid), public.get_leaderboard(uuid, int), public.start_quiz(uuid) from public, anon;
grant execute on function public.join_presentation(text, text), public.get_live_state(text),
  public.submit_response(uuid, jsonb), public.ask_question(uuid, text),
  public.toggle_upvote(uuid), public.get_leaderboard(uuid, int), public.start_quiz(uuid) to authenticated;

-- ============ REALTIME ============
do $$ begin
  begin alter publication supabase_realtime add table public.responses; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.questions; exception when duplicate_object then null; end;
end $$;
