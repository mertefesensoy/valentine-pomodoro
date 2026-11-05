-- Phase 2 B4: anonymous start-up reports (ADR-0051, NFR-PERF-008, NFR-PRIV-001).
-- docs/implementations/2026-11-05-phase2-b4-startup-reports.md
--
-- The one thing the unauthenticated role may do. A row holds a group, a bucketed time, the iPhone
-- model, the iOS version, the app build and the day: no identifier of any kind, and no timestamp finer
-- than the day. Nobody reads it with the publishable key.

create table public.startup_reports (
    id bigint generated always as identity primary key,
    day date not null default current_date,
    arm text not null check (arm in ('deferred', 'eager')),
    tti_ms integer not null check (tti_ms > 0 and tti_ms < 60000),
    model text not null check (model ~ '^(iPhone|iPad|iPod)[0-9]{1,3},[0-9]{1,3}$' or model = 'unknown'),
    os text not null check (os ~ '^[0-9]{1,3}(\.[0-9]{1,3}){0,2}$'),
    build text not null check (build ~ '^[0-9]{1,8}$')
);
alter table public.startup_reports enable row level security;
revoke all on table public.startup_reports from anon, authenticated;
create index startup_reports_by_day on public.startup_reports (day);

-- Checks its inputs, and rounds the time to the nearest 10 ms (plan §4). It says nothing back, so a
-- caller can learn nothing, and a bad report is simply dropped.
create function public.report_startup(
    p_arm text,
    p_tti_ms integer,
    p_model text,
    p_os text,
    p_build text
) returns void
    language plpgsql security definer set search_path = ''
as $$
declare
    rounded integer := (round(p_tti_ms / 10.0) * 10)::integer;
begin
    insert into public.startup_reports (arm, tti_ms, model, os, build)
        values (p_arm, rounded, p_model, p_os, p_build);
exception when check_violation or not_null_violation then
    return;
end;
$$;
revoke all on function public.report_startup(text, integer, text, text, text) from public;
grant execute on function public.report_startup(text, integer, text, text, text) to anon, authenticated;

-- Keep 90 days of reports (NFR-PRIV-001), and sweep expired codes, each daily.
create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule('delete-old-startup-reports', '17 3 * * *',
    $$delete from public.startup_reports where day < current_date - 90$$);
select cron.schedule('delete-expired-invites', '37 3 * * *',
    $$delete from public.invites where used_at is null and expires_at < now() - interval '1 day' and expires_at <> 'infinity'::timestamptz$$);
