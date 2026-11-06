-- Phase 2 B1: this phase's tables (docs/implementations/2026-11-05-phase2-b1-tables.md).
--
-- Nothing is reachable unless a later migration grants it. The hosted project was created with new
-- tables not exposed and automatic RLS on, and a local database has neither, so this file makes them
-- behave alike: it revokes the default privileges, and each table enables RLS and revokes itself.

alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- A person. The name is nullable: Apple sends it only on the first sign-in, in the native response.
-- failed_redeems and failed_redeems_at carry the limit on wrong codes (plan §4).
create table public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    display_name text check (char_length(display_name) between 1 and 60),
    tz text not null default 'UTC',
    locale text not null default 'en' check (locale in ('en', 'tr')),
    failed_redeems integer not null default 0 check (failed_redeems >= 0),
    failed_redeems_at timestamptz,
    created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
revoke all on table public.profiles from anon, authenticated;

-- One pairing. Later phases add home_tz, plus_until and goal_minutes (rehaul plan §4.3).
create table public.couples (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now()
);
alter table public.couples enable row level security;
revoke all on table public.couples from anon, authenticated;

-- Unique user_id: one couple per person (FR-PAR-002).
create table public.couple_members (
    couple_id uuid not null references public.couples (id) on delete cascade,
    user_id uuid not null unique references public.profiles (id) on delete cascade,
    joined_at timestamptz not null default now(),
    primary key (couple_id, user_id)
);
alter table public.couple_members enable row level security;
revoke all on table public.couple_members from anon, authenticated;

-- A code, reached only through database functions (B3). The couple is created at redemption, so
-- there is no couple_id. expires_at is never null: seeded review codes use 'infinity' (plan E3).
create table public.invites (
    code text primary key check (code ~ '^[A-HJKMNP-Z2-9]{6}$'),
    created_by uuid not null references public.profiles (id) on delete cascade,
    created_at timestamptz not null default now(),
    expires_at timestamptz not null,
    used_at timestamptz,
    used_by uuid references public.profiles (id) on delete set null
);
alter table public.invites enable row level security;
revoke all on table public.invites from anon, authenticated;
-- One open code per person, not counting the seeded review codes.
create unique index invites_one_open_per_person on public.invites (created_by)
    where used_at is null and expires_at <> 'infinity'::timestamptz;
-- For deleting expired codes.
create index invites_open_by_expiry on public.invites (expires_at) where used_at is null;

-- A day's totals. The key is the rehaul's, kept for Phase 3's couple rollups, so owner_id can't
-- have a foreign key; a trigger on profiles deletes a person's rows.
create table public.daily_stats (
    owner_kind text not null check (owner_kind in ('user', 'couple')),
    owner_id uuid not null,
    day_key date not null,
    focus_ms bigint not null default 0 check (focus_ms >= 0),
    sessions integer not null default 0 check (sessions >= 0),
    goal_hit boolean not null default false,
    goal_minutes integer check (goal_minutes >= 0),
    updated_at timestamptz not null default now(),
    primary key (owner_kind, owner_id, day_key)
);
alter table public.daily_stats enable row level security;
revoke all on table public.daily_stats from anon, authenticated;

-- A note to your partner. couple_id cascades, so unpairing and deleting an account remove notes by
-- one path. client_id makes a retry of send_note safe.
create table public.love_notes (
    id uuid primary key default gen_random_uuid(),
    couple_id uuid not null references public.couples (id) on delete cascade,
    author_id uuid not null references public.profiles (id) on delete cascade,
    recipient_id uuid not null references public.profiles (id) on delete cascade,
    client_id uuid not null,
    body text not null check (char_length(body) between 1 and 280),
    created_at timestamptz not null default now(),
    shown_at timestamptz,
    unique (author_id, client_id)
);
alter table public.love_notes enable row level security;
revoke all on table public.love_notes from anon, authenticated;
create index love_notes_inbox on public.love_notes (recipient_id, shown_at nulls first, created_at);
create index love_notes_by_couple on public.love_notes (couple_id);

-- Makes a person's profile as their account is created.
create function public.handle_new_user() returns trigger
    language plpgsql security definer set search_path = ''
as $$
begin
    insert into public.profiles (id) values (new.id);
    return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- A couple can't outlive either member: deleting one deletes the couple, which cascades to the other
-- member and the notes. That cascade fires this again, and the second delete finds nothing.
create function public.dissolve_couple() returns trigger
    language plpgsql security definer set search_path = ''
as $$
begin
    delete from public.couples where id = old.couple_id;
    return old;
end;
$$;
revoke all on function public.dissolve_couple() from public, anon, authenticated;
create trigger on_couple_member_deleted
    after delete on public.couple_members
    for each row execute function public.dissolve_couple();

-- daily_stats can't reference profiles (its owner may be a couple from Phase 3), so this does it.
create function public.delete_user_stats() returns trigger
    language plpgsql security definer set search_path = ''
as $$
begin
    delete from public.daily_stats where owner_kind = 'user' and owner_id = old.id;
    return old;
end;
$$;
revoke all on function public.delete_user_stats() from public, anon, authenticated;
create trigger on_profile_deleted
    after delete on public.profiles
    for each row execute function public.delete_user_stats();
