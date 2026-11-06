-- Phase 2 E3: partners for App Review (docs/implementations/2026-11-06-phase2-e3-review-partners.md).
--
-- This makes no accounts. The owner runs `select * from public.seed_review_partners();` in the SQL
-- editor when the submission is near, and `select public.remove_review_partners();` after release.
-- The codes are drawn then, so they're never in this public repository. Only postgres can call these.

-- Three, since one account can pair only once: check_invite answers partner_paired after that.
create function public.review_partner_ids() returns uuid[]
    language sql immutable set search_path = ''
as $$
    select array[
        '00000000-0000-4000-8000-00000000a001',
        '00000000-0000-4000-8000-00000000a002',
        '00000000-0000-4000-8000-00000000a003'
    ]::uuid[];
$$;
revoke all on function public.review_partner_ids() from public, anon, authenticated;

-- home_snapshot shows a partner's row only for today in their time zone, and a review can outlast a
-- day, so a job writes it again. It runs every 6 hours, as "Updated 22 hours ago" on their day would
-- make a demo look dead. With no partners it writes nothing.
create function public.refresh_review_partner_days() returns void
    language sql security definer set search_path = ''
as $$
    insert into public.daily_stats (owner_kind, owner_id, day_key, focus_ms, sessions, goal_hit, goal_minutes, updated_at)
        select 'user', p.id, (now() at time zone p.tz)::date, 3000000, 2, false, 120, now()
        from public.profiles p
        where p.id = any (public.review_partner_ids())
    on conflict (owner_kind, owner_id, day_key) do update set updated_at = excluded.updated_at;
$$;
revoke all on function public.refresh_review_partner_days() from public, anon, authenticated;

select cron.schedule('review-partner-days', '5 */6 * * *', $$select public.refresh_review_partner_days()$$);

-- Makes what's missing and returns the open codes, so running it again is safe, and is how a used code
-- gets replaced. The accounts have no email, password or Apple identity, so nobody can sign in as them.
-- The empty strings and the nil instance_id are what Supabase's own sign-up writes: NULL in those
-- columns breaks the dashboard's user list, and a NULL instance_id keeps a row out of it.
create function public.seed_review_partners() returns table (partner_name text, invite_code text)
    language plpgsql security definer set search_path = ''
as $$
declare
    partner uuid;
    fresh text;
begin
    foreach partner in array public.review_partner_ids() loop
        insert into auth.users (
            instance_id, id, aud, role, created_at, updated_at,
            confirmation_token, recovery_token, email_change_token_new, email_change
        ) values (
            '00000000-0000-0000-0000-000000000000', partner, 'authenticated', 'authenticated', now(), now(),
            '', '', '', ''
        ) on conflict (id) do nothing;

        update public.profiles
            set display_name = 'Review Partner', tz = 'UTC', locale = 'en'
            where id = partner;

        if not exists (select 1 from public.invites i where i.created_by = partner and i.used_at is null)
           and not exists (select 1 from public.couple_members m where m.user_id = partner) then
            loop
                fresh := public.random_invite_code();
                insert into public.invites (code, created_by, expires_at)
                    values (fresh, partner, 'infinity'::timestamptz)
                    on conflict (code) do nothing;
                exit when found;
            end loop;
        end if;
    end loop;

    perform public.refresh_review_partner_days();

    return query
        select p.display_name, i.code
        from public.invites i
        join public.profiles p on p.id = i.created_by
        where i.created_by = any (public.review_partner_ids())
          and i.used_at is null
          and i.expires_at = 'infinity'::timestamptz
        order by i.created_by;
end;
$$;
revoke all on function public.seed_review_partners() from public, anon, authenticated;

-- The cascades take the profiles, codes, days and couples, so a reviewer still paired is just unpaired.
create function public.remove_review_partners() returns void
    language sql security definer set search_path = ''
as $$
    delete from auth.users where id = any (public.review_partner_ids());
$$;
revoke all on function public.remove_review_partners() from public, anon, authenticated;

-- So a reviewer sees a note arrive after a focus, with nobody on the other side to write one. A real
-- pairing stops at the first line. It runs after the statement, when both members' rows are there.
create function public.review_partner_says_hello() returns trigger
    language plpgsql security definer set search_path = ''
as $$
declare
    other uuid;
begin
    if not (new.user_id = any (public.review_partner_ids())) then
        return new;
    end if;
    select m.user_id into other
        from public.couple_members m
        where m.couple_id = new.couple_id and m.user_id <> new.user_id;
    if other is not null then
        insert into public.love_notes (couple_id, author_id, recipient_id, client_id, body)
            values (new.couple_id, new.user_id, other, gen_random_uuid(),
                    'Hi! This is a sample note from your review partner.');
    end if;
    return new;
end;
$$;
revoke all on function public.review_partner_says_hello() from public, anon, authenticated;
create trigger on_couple_member_added
    after insert on public.couple_members
    for each row execute function public.review_partner_says_hello();
