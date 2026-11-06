-- Partners for App Review (Phase 2 E3), called as the people who'd call them.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(33);

-- Created here, while still postgres, because the tests below change role.
create temporary table first_run (partner_name text, invite_code text) on commit drop;
create temporary table real_code (code text) on commit drop;
grant all on first_run, real_code to public;

insert into auth.users (id, aud, role) values
    ('00000000-0000-0000-0000-00000000000e', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-00000000000f', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-000000000010', 'authenticated', 'authenticated');
update public.profiles set display_name = 'Reviewer' where id = '00000000-0000-0000-0000-00000000000e';
update public.profiles set display_name = 'Ana' where id = '00000000-0000-0000-0000-00000000000f';
update public.profiles set display_name = 'Bora' where id = '00000000-0000-0000-0000-000000000010';

-- Nobody but postgres can call them.
select ok(not has_function_privilege('authenticated', 'public.seed_review_partners()', 'execute'), 'authenticated can''t seed');
select ok(not has_function_privilege('anon', 'public.seed_review_partners()', 'execute'), 'anon can''t seed');
select ok(not has_function_privilege('authenticated', 'public.remove_review_partners()', 'execute'), 'authenticated can''t remove');
select ok(not has_function_privilege('anon', 'public.remove_review_partners()', 'execute'), 'anon can''t remove');
select ok(not has_function_privilege('authenticated', 'public.refresh_review_partner_days()', 'execute'), 'authenticated can''t refresh');
select ok(not has_function_privilege('authenticated', 'public.review_partner_ids()', 'execute'), 'authenticated can''t list them');

-- Nothing until the owner runs it.
select is((select count(*)::int from public.profiles where id = any (public.review_partner_ids())), 0, 'no accounts until seeded');
select lives_ok('select public.refresh_review_partner_days()', 'the daily job runs with no partners');
select is((select count(*)::int from public.daily_stats where owner_id = any (public.review_partner_ids())), 0, 'the daily job writes nothing with no partners');

-- The owner's one line.
insert into first_run select * from public.seed_review_partners();
select is((select count(*)::int from first_run), 3, 'three codes');
select is((select count(distinct invite_code)::int from first_run), 3, 'all different');
select is((select count(*)::int from first_run where partner_name = 'Review Partner'), 3, 'each with its name');
select is((select count(*)::int from public.invites where created_by = any (public.review_partner_ids()) and expires_at = 'infinity'::timestamptz), 3, 'codes that never expire');
select is((select count(*)::int from public.profiles where id = any (public.review_partner_ids()) and tz = 'UTC'), 3, 'in UTC');
select is((select count(*)::int from public.daily_stats where owner_id = any (public.review_partner_ids()) and day_key = (now() at time zone 'UTC')::date and sessions = 2 and focus_ms = 3000000), 3, 'today''s day is there');
select is((select count(*)::int from auth.users where id = any (public.review_partner_ids()) and instance_id = '00000000-0000-0000-0000-000000000000' and confirmation_token = '' and recovery_token = ''), 3, 'rows the dashboard''s list can read');

-- Running it again changes nothing.
select is((select count(*)::int from public.seed_review_partners() s join first_run f on f.invite_code = s.invite_code), 3, 'the same codes come back');
select is((select count(*)::int from public.invites where created_by = any (public.review_partner_ids())), 3, 'and no more are made');

-- A reviewer pairs, and sees the day and the note.
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000e","role":"authenticated"}';
select is((select public.preview_invite((select invite_code from first_run order by invite_code limit 1)) ->> 'inviter_name'), 'Review Partner', 'the reviewer sees who it is');
select is((select public.redeem_invite((select invite_code from first_run order by invite_code limit 1)) ->> 'status'), 'ok', 'and pairs');
select is((select (public.home_snapshot() -> 'partner_today' ->> 'sessions')::int), 2, 'and sees the sample day');
select is((select jsonb_array_length(public.home_snapshot() -> 'notes')), 1, 'and one note');
select is((select public.home_snapshot() -> 'notes' -> 0 ->> 'body'), 'Hi! This is a sample note from your review partner.', 'that one');

-- One account can pair once, which is why there are three.
reset role;
insert into public.invites (code, created_by, expires_at)
    select 'ZZZZZ2', i.created_by, 'infinity'::timestamptz
    from public.invites i where i.code = (select invite_code from first_run order by invite_code limit 1);
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000f","role":"authenticated"}';
select is((select public.redeem_invite('ZZZZZ2') ->> 'status'), 'partner_paired', 'a second code for a paired partner says so');
reset role;
delete from public.invites where code = 'ZZZZZ2';

-- A real pairing gets no note.
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000f","role":"authenticated"}';
select is((select public.create_invite() ->> 'status'), 'ok', 'Ana makes a code');
reset role;
insert into real_code select code from public.invites where created_by = '00000000-0000-0000-0000-00000000000f';
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000010","role":"authenticated"}';
select is((select public.redeem_invite((select code from real_code)) ->> 'status'), 'ok', 'a real couple pairs');
select is((select jsonb_array_length(public.home_snapshot() -> 'notes')), 0, 'with no note');
reset role;

-- A used code is replaced by running it again, once its partner is free.
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000e","role":"authenticated"}';
select is((select public.unpair() ->> 'status'), 'ok', 'the reviewer unpairs');
reset role;
select is((select count(*)::int from public.seed_review_partners()), 3, 'three open codes again');

-- And it all goes.
select lives_ok('select public.remove_review_partners()', 'the owner removes them');
select is((select count(*)::int from auth.users where id = any (public.review_partner_ids())), 0, 'the accounts go');
select is((select count(*)::int from public.invites where created_by = any (public.review_partner_ids())), 0, 'with their codes');
select is((select count(*)::int from public.profiles where id in ('00000000-0000-0000-0000-00000000000e', '00000000-0000-0000-0000-00000000000f')), 2, 'and nobody else');

select * from finish();
rollback;
