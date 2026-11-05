-- Anonymous start-up reports (Phase 2 B4, ADR-0051, NFR-PERF-008): what anon may do, and nothing more.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(19);

select ok((select relrowsecurity from pg_class where oid = 'public.startup_reports'::regclass), 'RLS is on');
select ok(not has_table_privilege('anon', 'public.startup_reports', 'select, insert, update, delete'), 'anon holds no privilege on the table');
select ok(not has_table_privilege('authenticated', 'public.startup_reports', 'select, insert, update, delete'), 'nor does authenticated');
select is(
    (select string_agg(p.proname, ',') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'execute')),
    'report_startup',
    'report_startup is the one function anon may call');
-- No column could hold an identifier.
select is(
    (select string_agg(column_name::text, ',' order by ordinal_position) from information_schema.columns
     where table_schema = 'public' and table_name = 'startup_reports'),
    'id,day,arm,tti_ms,model,os,build',
    'the table holds only these columns');

set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select lives_ok($$select public.report_startup('deferred', 812, 'iPhone13,2', '26.1', '62')$$, 'anon can send a report');
select throws_ok($$select * from public.startup_reports$$, '42501', null, 'anon can''t read the table');
select throws_ok($$insert into public.startup_reports (arm, tti_ms, model, os, build) values ('eager', 1, 'unknown', '26', '1')$$, '42501', null, 'anon can''t write it directly');
select throws_ok($$select public.home_snapshot()$$, '42501', null, 'anon can''t call anything else');
select throws_ok($$select public.create_invite()$$, '42501', null, 'not even to make a code');

reset role;
select results_eq(
    $$select day = current_date, arm, tti_ms, model, os, build from public.startup_reports$$,
    $$values (true, 'deferred', 810, 'iPhone13,2', '26.1', '62')$$,
    'the report is saved, its time rounded to 10 ms');

-- Bad reports are dropped, without an error.
set local role anon;
select lives_ok($$select public.report_startup('sideways', 812, 'iPhone13,2', '26.1', '62')$$, 'an unknown group is dropped');
select lives_ok($$select public.report_startup('eager', 0, 'iPhone13,2', '26.1', '62')$$, 'a zero time is dropped');
select lives_ok($$select public.report_startup('eager', 60000, 'iPhone13,2', '26.1', '62')$$, 'an absurd time is dropped');
select lives_ok($$select public.report_startup('eager', 812, 'Mert''s iPhone', '26.1', '62')$$, 'a device name is dropped, so a person''s name can''t land here');
select lives_ok($$select public.report_startup('eager', 812, 'iPhone13,2', 'x', '62')$$, 'a strange iOS version is dropped');
select lives_ok($$select public.report_startup('eager', 812, 'iPhone13,2', '26.1', 'abc')$$, 'a strange build is dropped');
select lives_ok($$select public.report_startup(null, null, null, null, null)$$, 'an empty report is dropped');
reset role;
select is((select count(*)::int from public.startup_reports), 1, 'none of those was saved');

select * from finish();
rollback;
