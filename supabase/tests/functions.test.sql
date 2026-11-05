-- The database functions (Phase 2 B3), called as the people who'd call them, replays included.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(80);

-- Created here, while still postgres, because the tests below change role.
create temporary table anas (code text) on commit drop;
create temporary table live (code text) on commit drop;
create temporary table expired (code text) on commit drop;
create temporary table the_note (id uuid) on commit drop;
grant all on anas, live, expired, the_note to public;

insert into auth.users (id, aud, role) values
    ('00000000-0000-0000-0000-00000000000a', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-00000000000b', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-00000000000c', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-00000000000d', 'authenticated', 'authenticated');

-- Who can call what: anon nothing of these, and authenticated exactly the planned set.
select is(
    (select string_agg(p.proname, ',' order by p.proname) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and has_function_privilege('authenticated', p.oid, 'execute')
       and p.proname <> 'report_startup'),
    'create_invite,export_my_data,home_snapshot,is_couple_member,is_partner_of,mark_note_shown,preview_invite,redeem_invite,report_day,send_note,set_profile,unpair',
    'authenticated can call exactly the planned functions');
select is(
    (select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'execute')
       and p.proname <> 'report_startup'),
    0, 'anon can call none of them');

-- set_profile
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
select is((select public.set_profile('  Ana  ', 'Europe/Istanbul', 'tr') ->> 'status'), 'ok', 'set_profile saves');
select is((select display_name from public.profiles where id = '00000000-0000-0000-0000-00000000000a'), 'Ana', 'the name is trimmed');
select is((select public.set_profile(null, 'Mars/Olympus') ->> 'status'), 'invalid', 'an unknown time zone is refused');
select is((select public.set_profile(repeat('x', 61)) ->> 'status'), 'invalid', 'a name over 60 characters is refused');
select is((select tz from public.profiles where id = '00000000-0000-0000-0000-00000000000a'), 'Europe/Istanbul', 'a refused call changes nothing');
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
select is((select public.set_profile('Bora', 'Pacific/Auckland') ->> 'status'), 'ok', 'Bora saves a name');

-- create_invite: Ana makes one.
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
insert into anas select public.create_invite() ->> 'code';
select ok((select code ~ '^[A-HJKMNP-Z2-9]{6}$' from anas), 'a code uses the 31-symbol alphabet');
select is((select count(*)::int from public.home_snapshot() s where s -> 'invite' ->> 'code' = (select code from anas)), 1, 'the snapshot holds your open code');
select ok(
    (select (s -> 'invite' ->> 'expires_at')::timestamptz between now() + interval '23 hours 59 minutes' and now() + interval '24 hours 1 minute'
     from public.home_snapshot() s),
    'a code lasts 24 hours');
-- A new one cancels the old one.
insert into anas select public.create_invite() ->> 'code';
reset role;
select is((select count(*)::int from public.invites where created_by = '00000000-0000-0000-0000-00000000000a'), 1, 'a new code cancels the old one');
select is((select count(*)::int from public.invites where expires_at = 'infinity'), 0, 'create_invite never makes an immortal code');
set local role authenticated;

-- preview_invite and its statuses, as Bora.
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
select is((select public.preview_invite(null) ->> 'status'), 'invalid', 'no code is invalid');
reset role;
insert into live select code from public.invites where created_by = '00000000-0000-0000-0000-00000000000a';
select is((select failed_redeems from public.profiles where id = '00000000-0000-0000-0000-00000000000b'), 0, 'a malformed code isn''t a guess');
set local role authenticated;
select is((select public.preview_invite((select lower(code) from live)) ->> 'status'), 'ok', 'a code can be typed in lower case');
select is((select public.preview_invite((select code from live)) ->> 'inviter_name'), 'Ana', 'preview says whose code it is');
select is((select count(*)::int from public.couple_members), 0, 'preview changes nothing');
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
select is((select public.preview_invite((select code from live)) ->> 'status'), 'own_code', 'your own code is refused');
select is((select public.redeem_invite((select code from live)) ->> 'status'), 'own_code', 'and can''t be redeemed');

-- The limit: five wrong guesses in the hour, then no more, even with a right code.
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}';
select is((select public.preview_invite('ZZZZZZ') ->> 'status'), 'invalid', 'a wrong code, 1');
select is((select public.preview_invite('ZZZZZY') ->> 'status'), 'invalid', 'a wrong code, 2');
select is((select public.redeem_invite('ZZZZZX') ->> 'status'), 'invalid', 'a wrong code, 3');
select is((select public.redeem_invite('ZZZZZW') ->> 'status'), 'invalid', 'a wrong code, 4');
select is((select public.preview_invite('ZZZZZV') ->> 'status'), 'invalid', 'a wrong code, 5');
select is((select public.preview_invite((select code from live)) ->> 'status'), 'rate_limited', 'then even a right code waits');
select is((select public.redeem_invite((select code from live)) ->> 'status'), 'rate_limited', 'and can''t be redeemed');
reset role;
update public.profiles set failed_redeems_at = now() - interval '61 minutes' where id = '00000000-0000-0000-0000-00000000000c';
set local role authenticated;
select is((select public.preview_invite((select code from live)) ->> 'status'), 'ok', 'after an hour, it works again');

-- redeem_invite: Bora pairs with Ana.
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
select is((select public.redeem_invite((select code from live)) ->> 'status'), 'ok', 'redeeming pairs them');
select is((select public.redeem_invite((select code from live)) ->> 'status'), 'ok', 'replaying it gives the same answer');
select is((select public.redeem_invite((select code from live)) ->> 'partner_name'), 'Ana', 'and names the partner');
select is((select count(*)::int from public.couple_members), 2, 'one couple, two members');
select is((select public.create_invite() ->> 'status'), 'already_paired', 'someone paired can''t make a code');
-- A used code, and an inviter who's taken.
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}';
select is((select public.redeem_invite((select code from live)) ->> 'status'), 'used', 'a used code is refused');
select is((select count(*)::int from public.couple_members), 0, 'and Cem still sees no couple');

-- An expired code.
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000d","role":"authenticated"}';
insert into live select public.create_invite() ->> 'code';
reset role;
update public.invites set expires_at = now() - interval '1 minute' where created_by = '00000000-0000-0000-0000-00000000000d';
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}';
select is((select public.redeem_invite('') ->> 'status'), 'invalid', 'nothing typed is invalid');
reset role;
select is((select count(*)::int from public.invites where created_by = '00000000-0000-0000-0000-00000000000d' and expires_at < now()), 1, 'the code has expired');
insert into expired select code from public.invites where created_by = '00000000-0000-0000-0000-00000000000d';
set local role authenticated;
select is((select public.redeem_invite((select code from expired)) ->> 'status'), 'expired', 'an expired code is refused');
-- A seeded review code, with no expiry, works.
reset role;
update public.invites set expires_at = 'infinity' where created_by = '00000000-0000-0000-0000-00000000000d';
set local role authenticated;
select is((select public.preview_invite((select code from expired)) ->> 'status'), 'ok', 'a seeded review code doesn''t expire');

-- report_day: a day can only grow.
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
select is((select public.report_day(current_date, 1500000, 1, false, 100) ->> 'status'), 'ok', 'a report is saved');
select is((select public.report_day(current_date, 1500000, 1, false, 100) ->> 'status'), 'ok', 'a replay is accepted');
select is((select public.report_day(current_date, 3000000, 2, true, 100) ->> 'status'), 'ok', 'a later report is saved');
select is((select public.report_day(current_date, 1500000, 1, false, 100) ->> 'status'), 'ok', 'an out-of-order report is accepted');
select results_eq(
    $$select focus_ms, sessions, goal_hit from public.daily_stats where owner_id = '00000000-0000-0000-0000-00000000000a'$$,
    $$values (3000000::bigint, 2, true)$$,
    'an out-of-order replay can''t lower or double a day');
select is((select public.report_day(current_date, -1, 1, false) ->> 'status'), 'invalid', 'negative minutes are refused');
select is((select public.report_day(current_date + 5, 1, 1, false) ->> 'status'), 'invalid', 'a day far ahead is refused');
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}';
select is((select public.report_day(current_date, 1500000, 1, false) ->> 'status'), 'not_paired', 'unpaired, nothing is written');

-- send_note and mark_note_shown.
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
select is((select public.send_note('20000000-0000-0000-0000-000000000001', repeat('x', 281)) ->> 'status'), 'invalid', 'a note over 280 characters is refused');
select is((select public.send_note('20000000-0000-0000-0000-000000000001', '   ') ->> 'status'), 'invalid', 'an empty note is refused');
select is((select public.send_note('20000000-0000-0000-0000-000000000001', 'Good luck') ->> 'status'), 'ok', 'a note is sent');
select is((select public.send_note('20000000-0000-0000-0000-000000000001', 'Good luck') ->> 'status'), 'ok', 'a retry is accepted');
select is((select count(*)::int from public.love_notes), 1, 'and sends nothing twice');
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
select is((select jsonb_array_length(public.home_snapshot() -> 'notes')), 1, 'the recipient''s snapshot holds it');
select is((select public.home_snapshot() -> 'partner' ->> 'display_name'), 'Ana', 'and names the partner');
select is(((select public.home_snapshot() -> 'partner_today' ->> 'sessions')::int), 2, 'and holds their today');

-- mark_note_shown: the recipient's only, and the first time counts.
reset role;
insert into the_note select id from public.love_notes;
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
select is((select public.mark_note_shown((select id from the_note)) ->> 'status'), 'not_found', 'the author can''t mark their own note shown');
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
select is((select public.mark_note_shown((select id from the_note)) ->> 'status'), 'ok', 'the recipient marks it shown');
select is((select public.mark_note_shown((select id from the_note)) ->> 'status'), 'ok', 'a replay is accepted');
select is((select jsonb_array_length(public.home_snapshot() -> 'notes')), 0, 'and it isn''t delivered again');

-- A partner's today comes from their own time zone, and without a row for it, it's null.
select is((select public.report_day((now() at time zone 'Pacific/Auckland')::date, 600000, 1, false, 50) ->> 'status'), 'ok', 'Bora reports their own local date');
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
select is((select public.home_snapshot() -> 'partner_today' ->> 'day_key'), ((now() at time zone 'Pacific/Auckland')::date)::text, 'Ana sees Bora''s today by Bora''s time zone');
reset role;
update public.daily_stats set day_key = day_key - 2 where owner_id = '00000000-0000-0000-0000-00000000000b';
set local role authenticated;
select is((select public.home_snapshot() -> 'partner_today'), 'null'::jsonb, 'with no row for their today, nothing shows, never an older day');
select ok((select public.home_snapshot() ->> 'partner_updated_at') is not null, 'and the last update is still known');

-- export_my_data
select is((select public.export_my_data() -> 'profile' ->> 'display_name'), 'Ana', 'the export holds your profile');
select is((select public.export_my_data() -> 'couple' ->> 'partner_name'), 'Bora', 'your couple');
select is((select jsonb_array_length(public.export_my_data() -> 'daily_stats')), 1, 'your days');
select is((select jsonb_array_length(public.export_my_data() -> 'notes_written')), 1, 'and the notes you wrote');

-- The note limit.
reset role;
insert into public.love_notes (couple_id, author_id, recipient_id, client_id, body)
    select m.couple_id, '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b', gen_random_uuid(), 'n'
    from public.couple_members m, generate_series(1, 19)
    where m.user_id = '00000000-0000-0000-0000-00000000000a';
set local role authenticated;
select is((select public.send_note(gen_random_uuid(), 'One more') ->> 'status'), 'rate_limited', 'at 20 notes in a day, the next waits');

-- Deleting an account: the couple dissolves, and the partner keeps their own history.
reset role;
delete from auth.users where id = '00000000-0000-0000-0000-00000000000b';
select is((select count(*)::int from public.profiles where id = '00000000-0000-0000-0000-00000000000b'), 0, 'deletion removes the profile');
select is((select count(*)::int from public.daily_stats where owner_id = '00000000-0000-0000-0000-00000000000b'), 0, 'and their days');
select is((select count(*)::int from public.couple_members where user_id = '00000000-0000-0000-0000-00000000000a'), 0, 'the couple dissolves');
select is((select count(*)::int from public.love_notes), 0, 'the notes go');
select is((select count(*)::int from public.daily_stats where owner_id = '00000000-0000-0000-0000-00000000000a'), 1, 'the partner keeps their own days');

-- unpair: Cem pairs with Deniz, using the review code, then unpairs.
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}';
select is((select public.redeem_invite((select code from expired)) ->> 'status'), 'ok', 'a seeded review code pairs');
select is((select public.report_day(current_date, 100, 1, false) ->> 'status'), 'ok', 'Cem reports a day');
select is((select public.unpair() ->> 'status'), 'ok', 'unpair');
select is((select public.unpair() ->> 'status'), 'not_paired', 'a replay says so');
select is((select count(*)::int from public.couple_members), 0, 'the couple is gone');
select is((select count(*)::int from public.daily_stats), 1, 'and Cem keeps their day');
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000d","role":"authenticated"}';
select is((select public.home_snapshot() -> 'partner'), 'null'::jsonb, 'Deniz sees no partner');

select * from finish();
rollback;
