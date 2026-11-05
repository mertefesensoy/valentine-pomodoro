-- NFR-SEC-001: row-level security, tested as the people it protects. Ana and Bora are a couple, Cem
-- and Deniz are another, and Eda is on her own.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(35);

insert into auth.users (id, aud, role) values
    ('00000000-0000-0000-0000-00000000000a', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-00000000000b', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-00000000000c', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-00000000000d', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-00000000000e', 'authenticated', 'authenticated');
update public.profiles set display_name = 'Ana' where id = '00000000-0000-0000-0000-00000000000a';
update public.profiles set display_name = 'Bora' where id = '00000000-0000-0000-0000-00000000000b';
insert into public.couples (id) values
    ('10000000-0000-0000-0000-000000000001'),
    ('10000000-0000-0000-0000-000000000002');
insert into public.couple_members (couple_id, user_id) values
    ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a'),
    ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000b'),
    ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000c'),
    ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000d');
insert into public.daily_stats (owner_kind, owner_id, day_key, focus_ms, sessions) values
    ('user', '00000000-0000-0000-0000-00000000000a', '2026-11-05', 1500000, 1),
    ('user', '00000000-0000-0000-0000-00000000000b', '2026-11-05', 3000000, 2),
    ('user', '00000000-0000-0000-0000-00000000000c', '2026-11-05', 4500000, 3);
insert into public.love_notes (couple_id, author_id, recipient_id, client_id, body) values
    ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a',
     '00000000-0000-0000-0000-00000000000b', '20000000-0000-0000-0000-000000000001', 'Good luck today');
insert into public.invites (code, created_by, expires_at) values
    ('K7MP2Q', '00000000-0000-0000-0000-00000000000e', now() + interval '1 day');

-- RLS is on for every table, and anon holds no table at all.
select ok((select bool_and(relrowsecurity) from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relkind = 'r'), 'every table in public has RLS on');
select is((select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relkind = 'r'
             and has_table_privilege('anon', c.oid, 'select, insert, update, delete')), 0,
          'anon holds no table');
select is((select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relkind = 'r'
             and has_table_privilege('authenticated', c.oid, 'insert, update, delete')), 0,
          'authenticated can write no table directly');
select ok(not has_table_privilege('authenticated', 'public.invites', 'select'), 'invites has no grant to authenticated');
select ok(not has_column_privilege('authenticated', 'public.profiles', 'failed_redeems', 'select'), 'nobody reads failed_redeems');
select ok(not has_column_privilege('authenticated', 'public.profiles', 'failed_redeems_at', 'select'), 'nobody reads failed_redeems_at');
select ok(has_column_privilege('authenticated', 'public.profiles', 'display_name', 'select'), 'a name can be read, through its policy');
select ok(not has_function_privilege('anon', 'public.is_partner_of(uuid)', 'execute'), 'anon can''t call is_partner_of');
select ok(not has_function_privilege('anon', 'public.is_couple_member(uuid)', 'execute'), 'anon can''t call is_couple_member');
select ok(not has_function_privilege('authenticated', 'public.handle_new_user()', 'execute'), 'the triggers aren''t callable');
select ok(not has_function_privilege('authenticated', 'public.dissolve_couple()', 'execute'), 'the triggers aren''t callable');

-- Ana sees herself, her partner and their day and notes, and nothing of anyone else's.
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
select is((select count(*)::int from public.profiles), 2, 'a member sees two profiles');
select is((select display_name from public.profiles where id = '00000000-0000-0000-0000-00000000000b'), 'Bora', 'a member reads their partner''s name');
select is((select count(*)::int from public.couples), 1, 'a member sees one couple');
select is((select count(*)::int from public.couple_members), 2, 'a member sees their couple''s two members');
select is((select count(*)::int from public.daily_stats), 2, 'a member sees their day and their partner''s');
select is((select focus_ms from public.daily_stats where owner_id = '00000000-0000-0000-0000-00000000000b'), 3000000::bigint, 'partners read each other''s day');
select is((select count(*)::int from public.daily_stats where owner_id = '00000000-0000-0000-0000-00000000000c'), 0, 'a member can''t read another couple''s day');
select is((select count(*)::int from public.love_notes), 1, 'the author reads the note');

-- A member can't write anyone's row, their own included: writes go through functions.
select throws_ok($$update public.daily_stats set focus_ms = 0 where owner_id = '00000000-0000-0000-0000-00000000000b'$$, '42501', null, 'a member can''t change a partner''s day');
select throws_ok($$insert into public.daily_stats (owner_kind, owner_id, day_key) values ('user', '00000000-0000-0000-0000-00000000000a', '2026-11-06')$$, '42501', null, 'a member can''t write their own day directly');
select throws_ok($$delete from public.couple_members$$, '42501', null, 'a member can''t remove a member directly');
select throws_ok($$update public.profiles set display_name = 'x' where id = '00000000-0000-0000-0000-00000000000b'$$, '42501', null, 'a member can''t change a partner''s name');
select throws_ok($$insert into public.love_notes (couple_id, author_id, recipient_id, client_id, body) values ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000c', gen_random_uuid(), 'hi')$$, '42501', null, 'a member can''t write a note directly');
select throws_ok($$select * from public.invites$$, '42501', null, 'invites can''t be read');

-- The recipient reads it too.
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
select is((select count(*)::int from public.love_notes), 1, 'the recipient reads the note');

-- Someone from another couple sees none of it.
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}';
select is((select count(*)::int from public.love_notes), 0, 'another couple can''t read the note');
select is((select count(*)::int from public.daily_stats where owner_id = '00000000-0000-0000-0000-00000000000a'), 0, 'another couple can''t read the day');

-- A stranger, signed in but unpaired, sees only themselves.
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000e","role":"authenticated"}';
select is((select count(*)::int from public.profiles), 1, 'a stranger sees only their own profile');
select is((select count(*)::int from public.couples), 0, 'a stranger sees no couple');
select is((select count(*)::int from public.couple_members), 0, 'a stranger sees no members');
select is((select count(*)::int from public.daily_stats), 0, 'a stranger sees no day');
select is((select count(*)::int from public.love_notes), 0, 'a stranger sees no note');

-- anon, with the publishable key alone, is refused outright.
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select throws_ok($$select * from public.profiles$$, '42501', null, 'anon can''t read profiles');
select throws_ok($$select * from public.daily_stats$$, '42501', null, 'anon can''t read days');

reset role;
select * from finish();
rollback;
