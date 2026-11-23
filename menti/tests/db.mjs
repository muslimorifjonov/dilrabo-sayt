// Supabase sxemasini PGlite (WASM Postgres) ichida sinaydi: npm run test:db
import fs from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
const db = new PGlite();
const schema = fs.readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8');
await db.exec(`
create role anon; create role authenticated;
create schema auth;
create table auth.users(id uuid primary key);
create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
create or replace function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('test.jwt', true), ''), '{}')::jsonb $$;
create publication supabase_realtime;
`);
await db.exec(schema);
console.log('schema OK');
await db.exec(schema); // idempotent?
console.log('schema re-run OK');

const OWNER = '11111111-1111-1111-1111-111111111111', U1 = '22222222-2222-2222-2222-222222222222', U2 = '33333333-3333-3333-3333-333333333333';
await db.exec(`insert into auth.users values ('${OWNER}'),('${U1}'),('${U2}')`);
const as = async (uid, jwt = '{}') => db.exec(`select set_config('test.uid', '${uid}', false), set_config('test.jwt', '${jwt}', false)`);
const q = async (sql, params) => (await db.query(sql, params)).rows;
const expectErr = async (label, sql, params, code) => {
  try { await db.query(sql, params); console.log('FAIL (no error):', label); process.exitCode = 1; }
  catch (e) { const ok = e.message.includes(code); console.log(ok ? 'ok ' : 'FAIL', label, '->', e.message); if (!ok) process.exitCode = 1; }
};
const check = (label, cond) => { console.log(cond ? 'ok ' : 'FAIL', label); if (!cond) process.exitCode = 1; };

await as(OWNER);
const [p] = await q(`insert into presentations(title) values ('Test') returning *`);
check('code generated 6 digits', /^\d{6}$/.test(p.code));
const [poll] = await q(`insert into slides(presentation_id, type, question, options, settings) values ($1,'poll','Q','["A","B","C"]','{"multiple":false}') returning *`, [p.id]);
const [quiz] = await q(`insert into slides(presentation_id, type, question, options, settings, position) values ($1,'quiz','Q2','["A","B"]','{"correct":1,"time_limit":20}',1) returning *`, [p.id]);
const [scale] = await q(`insert into slides(presentation_id, type, options, settings, position) values ($1,'scale','["X","Y"]','{"min":1,"max":5}',2) returning *`, [p.id]);
const [wc] = await q(`insert into slides(presentation_id, type, settings, position) values ($1,'wordcloud','{"max_words":2}',3) returning *`, [p.id]);
const [op] = await q(`insert into slides(presentation_id, type, settings, position) values ($1,'open','{"max_entries":2}',4) returning *`, [p.id]);

await as(U1, '{"is_anonymous":true}');
await expectErr('join not live', `select join_presentation($1,'Ali')`, [p.code], 'NOT_LIVE');
await expectErr('join bad code', `select join_presentation('000000x','Ali')`, [], 'NOT_FOUND');

await as(OWNER);
await q(`update presentations set is_live = true, current_slide_id = $2 where id = $1`, [p.id, poll.id]);

await as(U1, '{"is_anonymous":true}');
const st0 = (await q(`select get_live_state($1) s`, [p.code]))[0].s;
check('live state slide is poll', st0.slide.type === 'poll' && st0.server_now);
await expectErr('submit before join', `select submit_response($1,'{"choices":[0]}')`, [poll.id], 'NOT_JOINED');
await q(`select join_presentation($1,'  Ali  ')`, [p.code]);
await expectErr('poll missing choices', `select submit_response($1,'{}')`, [poll.id], 'INVALID');
await expectErr('poll out of range', `select submit_response($1,'{"choices":[5]}')`, [poll.id], 'INVALID');
await expectErr('poll multi not allowed', `select submit_response($1,'{"choices":[0,1]}')`, [poll.id], 'INVALID');
await q(`select submit_response($1,'{"choices":[2]}')`, [poll.id]);
await expectErr('poll twice', `select submit_response($1,'{"choices":[1]}')`, [poll.id], 'ALREADY_ANSWERED');
await expectErr('non-current slide', `select submit_response($1,'{"choice":1}')`, [quiz.id], 'NOT_ACTIVE');
const st1 = (await q(`select get_live_state($1) s`, [p.code]))[0].s;
check('my_responses returned', st1.slide.my_responses.length === 1);

// quiz
await as(OWNER);
await q(`update presentations set current_slide_id = $2 where id = $1`, [p.id, quiz.id]);
await as(U1, '{"is_anonymous":true}');
const st2 = (await q(`select get_live_state($1) s`, [p.code]))[0].s;
check('quiz correct hidden', st2.slide.correct === null && !('correct' in st2.slide.settings));
await expectErr('quiz not started', `select submit_response($1,'{"choice":1}')`, [quiz.id], 'QUIZ_NOT_STARTED');
await expectErr('participant cannot start quiz', `select start_quiz($1)`, [quiz.id], 'FORBIDDEN');
await as(OWNER);
await q(`select start_quiz($1)`, [quiz.id]);
await as(U1, '{"is_anonymous":true}');
await q(`select submit_response($1,'{"choice":1}')`, [quiz.id]);
await as(U2, '{"is_anonymous":true}');
await q(`select join_presentation($1,'')`, [p.code]);
await q(`select submit_response($1,'{"choice":0}')`, [quiz.id]);
const [pts] = await q(`select (select points from responses where slide_id=$1 and participant_id=$2) a, (select points from responses where slide_id=$1 and participant_id=$3) b`, [quiz.id, U1, U2]);
check(`quiz points correct>=500 wrong=0 (${pts.a},${pts.b})`, pts.a >= 500 && pts.a <= 1000 && pts.b === 0);
await as(OWNER);
await q(`update slides set revealed = true, voting_open = false where id = $1`, [quiz.id]);
await as(U1, '{"is_anonymous":true}');
const st3 = (await q(`select get_live_state($1) s`, [p.code]))[0].s;
check('revealed shows correct + my_points', st3.slide.correct === 1 && st3.slide.my_points === pts.a);
const lb = await q(`select * from get_leaderboard($1, 10)`, [p.id]);
check(`leaderboard (${lb.map((r) => r.name + ':' + r.score + '#' + r.rank).join(', ')})`, lb[0].name === 'Ali' && Number(lb[0].rank) === 1 && lb[1].name === 'Mehmon');
await as('44444444-4444-4444-4444-444444444444', '{"is_anonymous":true}');
check('stranger leaderboard empty', (await q(`select * from get_leaderboard($1, 10)`, [p.id])).length === 0);

// scale / wordcloud / open
for (const [slide, good, bads] of [
  [scale, '{"ratings":[3,5]}', ['{"ratings":[3]}', '{"ratings":[0,5]}', '{"ratings":["a",2]}', '{}']],
  [wc, '{"words":["  Zo\'\'r ","zo\'\'r","yangi"]}', ['{"words":[]}', '{"words":["a","b","c"]}', '{}']],
]) {
  await as(OWNER);
  await q(`update presentations set current_slide_id = $2 where id = $1`, [p.id, slide.id]);
  await as(U1, '{"is_anonymous":true}');
  for (const b of bads) await expectErr(`${slide.type} invalid ${b}`, `select submit_response($1,$2::jsonb)`, [slide.id, b], 'INVALID');
}
await as(U1, '{"is_anonymous":true}');
await q(`select submit_response($1,'{"words":["  Zo''r ","ZO''R","yangi"]}')`, [wc.id]);
const [w] = await q(`select value from responses where slide_id=$1`, [wc.id]);
check(`wordcloud normalized ${JSON.stringify(w.value)}`, JSON.stringify(w.value.words.sort()) === JSON.stringify(['yangi', "zo'r"]));

await as(OWNER);
await q(`update presentations set current_slide_id = $2 where id = $1`, [p.id, op.id]);
await as(U1, '{"is_anonymous":true}');
await q(`select submit_response($1,'{"text":"bir"}')`, [op.id]);
await q(`select submit_response($1,'{"text":"ikki"}')`, [op.id]);
await expectErr('open limit', `select submit_response($1,'{"text":"uch"}')`, [op.id], 'LIMIT_REACHED');
await expectErr('open empty', `select submit_response($1,'{"text":"  "}')`, [op.id], 'LIMIT_REACHED');

// Q&A
await q(`select ask_question($1,'Savol 1?')`, [p.id]);
const [qq] = await q(`select * from questions`);
check('question author', qq.author === 'Ali');
await q(`select toggle_upvote($1)`, [qq.id]);
await as(U2, '{"is_anonymous":true}');
await q(`select toggle_upvote($1)`, [qq.id]);
check('upvotes=2', (await q(`select upvotes from questions`))[0].upvotes === 2);
await q(`select toggle_upvote($1)`, [qq.id]);
check('upvote toggle off =1', (await q(`select upvotes from questions`))[0].upvotes === 1);
await q(`select ask_question($1,'a')`, [p.id]); await q(`select ask_question($1,'b')`, [p.id]); await q(`select ask_question($1,'c')`, [p.id]);
await expectErr('qa rate limit', `select ask_question($1,'d')`, [p.id], 'RATE_LIMIT');

// RLS as authenticated role
await db.exec(`grant usage on schema public, auth to authenticated;`);
await as(U1, '{"is_anonymous":true}');
await db.exec('set role authenticated');
check('RLS: participant sees no slides', (await q(`select * from slides`)).length === 0);
check('RLS: participant sees no responses', (await q(`select * from responses`)).length === 0);
check('RLS: participant sees questions', (await q(`select * from questions`)).length > 0);
await expectErr('RLS: anon cannot create presentation', `insert into presentations(title) values ('x')`, [], 'row-level security');
const rpcState = (await q(`select get_live_state($1) s`, [p.code]))[0].s;
check('RPC works under authenticated role', rpcState.slide.type === 'open');
await db.exec('reset role');
await as(OWNER);
await db.exec('set role authenticated');
check('RLS: owner sees responses', (await q(`select * from responses`)).length > 0);
check('RLS: owner sees participants', (await q(`select * from participants`)).length === 2);
await db.exec('reset role');
await as(U2, '{}');
await db.exec('set role authenticated');
const [own] = await q(`insert into presentations(title) values ('Mine') returning owner_id`);
check('RLS: real user can create', own.owner_id === U2);
await db.exec('reset role');
await db.exec('set role authenticated');
check('RLS: other user cannot see presentation', (await q(`select * from presentations where title = 'Test'`)).length === 0);
await db.exec('reset role');
// Shablonlar RLS
await as(OWNER); await db.exec('set role authenticated');
await q(`insert into templates(title, slides) values ('Mening shablonim', '[{"type":"poll"}]')`);
check('templates: owner sees own', (await q(`select * from templates`)).length === 1);
await db.exec('reset role'); await as(U2, '{}'); await db.exec('set role authenticated');
check('templates: other user sees none', (await q(`select * from templates`)).length === 0);
await db.exec('reset role'); await as(U1, '{"is_anonymous":true}'); await db.exec('set role authenticated');
await expectErr('templates: anon cannot create', `insert into templates(title) values ('x')`, [], 'row-level security');
await db.exec('reset role');
console.log(process.exitCode ? 'SOME FAILED' : 'ALL PASSED');
