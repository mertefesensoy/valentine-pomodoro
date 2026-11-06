-- Phase 2 B2: who may read what (docs/implementations/2026-11-05-phase2-b2-rls.md; NFR-SEC-001).
--
-- People read through these policies and write only through database functions (B3), so there are
-- no insert, update or delete policies, and no such grants. invites is reached only through
-- functions, so it has no policy and no grant. anon gets nothing here.

-- Both helpers read couple_members, and a policy on couple_members calls the first, so both must be
-- security definer or that policy would recurse. Each policy runs them once per query, through
-- (select auth.uid()) inside.
create function public.is_couple_member(target_couple uuid) returns boolean
    language sql stable security definer set search_path = ''
as $$
    select exists (
        select 1 from public.couple_members m
        where m.couple_id = target_couple and m.user_id = (select auth.uid())
    );
$$;

create function public.is_partner_of(other_user uuid) returns boolean
    language sql stable security definer set search_path = ''
as $$
    select exists (
        select 1
        from public.couple_members mine
        join public.couple_members theirs on theirs.couple_id = mine.couple_id
        where mine.user_id = (select auth.uid())
          and theirs.user_id = other_user
          and theirs.user_id <> mine.user_id
    );
$$;

revoke all on function public.is_couple_member(uuid) from public, anon;
revoke all on function public.is_partner_of(uuid) from public, anon;
grant execute on function public.is_couple_member(uuid) to authenticated;
grant execute on function public.is_partner_of(uuid) to authenticated;

-- By column: failed_redeems and failed_redeems_at aren't anyone else's business.
grant select (id, display_name, tz, locale, created_at) on public.profiles to authenticated;
grant select on public.couples to authenticated;
grant select on public.couple_members to authenticated;
grant select on public.daily_stats to authenticated;
grant select on public.love_notes to authenticated;

create policy "see yourself and your partner" on public.profiles
    for select to authenticated
    using (id = (select auth.uid()) or public.is_partner_of(id));

create policy "see your couple" on public.couples
    for select to authenticated
    using (public.is_couple_member(id));

create policy "see your couple's members" on public.couple_members
    for select to authenticated
    using (public.is_couple_member(couple_id));

create policy "see your day and your partner's" on public.daily_stats
    for select to authenticated
    using (owner_kind = 'user' and (owner_id = (select auth.uid()) or public.is_partner_of(owner_id)));

create policy "see notes you wrote or received" on public.love_notes
    for select to authenticated
    using (author_id = (select auth.uid()) or recipient_id = (select auth.uid()));
