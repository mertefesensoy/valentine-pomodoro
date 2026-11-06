-- The plan's index review (B3): with 100,000 daily_stats rows, the two hot reads use an index. The
-- N+1 review with pg_stat_statements happens on the hosted project at F3.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(3);

insert into auth.users (id, aud, role)
    select ('00000000-0000-0000-0000-' || lpad(to_hex(i), 12, '0'))::uuid, 'authenticated', 'authenticated'
    from generate_series(1, 300) as i;
insert into public.daily_stats (owner_kind, owner_id, day_key, focus_ms, sessions)
    select 'user', ('00000000-0000-0000-0000-' || lpad(to_hex(u), 12, '0'))::uuid, date '2026-01-01' + d, 1500000, 1
    from generate_series(1, 300) as u, generate_series(0, 333) as d;
select ok((select count(*) from public.daily_stats) >= 100000, 'at least 100,000 rows are seeded');
analyze public.daily_stats;

create function pg_temp.plan_of(q text) returns text language plpgsql as $$
declare
    line text;
    whole text := '';
begin
    for line in execute 'explain ' || q loop
        whole := whole || line || E'\n';
    end loop;
    return whole;
end;
$$;

-- home_snapshot's partner's today.
select ok(
    pg_temp.plan_of($$select * from public.daily_stats where owner_kind = 'user' and owner_id = '00000000-0000-0000-0000-000000000005' and day_key = date '2026-06-01'$$) !~ 'Seq Scan',
    'a person''s day is found by index');
-- home_snapshot's latest update.
select ok(
    pg_temp.plan_of($$select updated_at from public.daily_stats where owner_kind = 'user' and owner_id = '00000000-0000-0000-0000-000000000005' order by day_key desc limit 1$$) !~ 'Seq Scan',
    'a person''s latest day is found by index');

select * from finish();
rollback;
