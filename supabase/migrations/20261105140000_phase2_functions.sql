-- Phase 2 B3: everything that changes data (docs/implementations/2026-11-05-phase2-b3-functions.md).
--
-- Every function is security definer with an empty search_path, and is granted to authenticated by
-- name at the end of this file. Expected outcomes come back as a status, not an error: raising would
-- roll back the transaction, and with it a recorded failed try.

-- Six characters from the 31-symbol alphabet, each equally likely (plan §4). Bytes of 248 or more are
-- thrown away, because 248 = 8 × 31.
create function public.random_invite_code() returns text
    language plpgsql volatile security definer set search_path = ''
as $$
declare
    alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    code text := '';
    b integer;
begin
    while char_length(code) < 6 loop
        b := get_byte(extensions.gen_random_bytes(1), 0);
        if b < 248 then
            code := code || substr(alphabet, (b % 31) + 1, 1);
        end if;
    end loop;
    return code;
end;
$$;

create function public.set_profile(
    p_display_name text default null,
    p_tz text default null,
    p_locale text default null
) returns jsonb
    language plpgsql security definer set search_path = ''
as $$
declare
    me uuid := (select auth.uid());
    name_clean text := nullif(btrim(p_display_name), '');
begin
    if me is null then raise exception 'not signed in' using errcode = '28000'; end if;
    if name_clean is not null and char_length(name_clean) > 60 then
        return jsonb_build_object('status', 'invalid');
    end if;
    if p_tz is not null and not exists (select 1 from pg_catalog.pg_timezone_names where name = p_tz) then
        return jsonb_build_object('status', 'invalid');
    end if;
    if p_locale is not null and p_locale not in ('en', 'tr') then
        return jsonb_build_object('status', 'invalid');
    end if;
    update public.profiles
        set display_name = coalesce(name_clean, display_name),
            tz = coalesce(p_tz, tz),
            locale = coalesce(p_locale, locale)
        where id = me;
    return jsonb_build_object('status', 'ok');
end;
$$;

-- 24 hours, and creating one cancels your earlier open code. Only the seed script writes 'infinity'.
create function public.create_invite() returns jsonb
    language plpgsql security definer set search_path = ''
as $$
declare
    me uuid := (select auth.uid());
    new_code text;
    new_expiry timestamptz := now() + interval '24 hours';
begin
    if me is null then raise exception 'not signed in' using errcode = '28000'; end if;
    if exists (select 1 from public.couple_members where user_id = me) then
        return jsonb_build_object('status', 'already_paired');
    end if;
    delete from public.invites
        where created_by = me and used_at is null and expires_at <> 'infinity'::timestamptz;
    for attempt in 1..5 loop
        new_code := public.random_invite_code();
        insert into public.invites (code, created_by, expires_at)
            values (new_code, me, new_expiry)
            on conflict (code) do nothing;
        if found then
            return jsonb_build_object('status', 'ok', 'code', new_code, 'expires_at', new_expiry);
        end if;
    end loop;
    raise exception 'no free code in five tries';
end;
$$;

-- Records a wrong guess, in a one-hour fixed window (plan §4).
create function public.note_failed_redeem(me uuid) returns void
    language sql security definer set search_path = ''
as $$
    update public.profiles
        set failed_redeems = case
                when failed_redeems_at is null or failed_redeems_at < now() - interval '1 hour' then 1
                else failed_redeems + 1
            end,
            failed_redeems_at = case
                when failed_redeems_at is null or failed_redeems_at < now() - interval '1 hour' then now()
                else failed_redeems_at
            end
        where id = me;
$$;

create function public.is_redeem_limited(me uuid) returns boolean
    language sql stable security definer set search_path = ''
as $$
    select exists (
        select 1 from public.profiles
        where id = me
          and failed_redeems >= 5
          and failed_redeems_at >= now() - interval '1 hour'
    );
$$;

-- What a typed code means to this person, with no effect beyond counting a wrong guess. Shared by
-- preview_invite and redeem_invite, so they can't disagree.
create function public.check_invite(me uuid, p_code text, out status text, out inviter uuid)
    language plpgsql security definer set search_path = ''
as $$
declare
    clean text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
    row public.invites;
begin
    inviter := null;
    if public.is_redeem_limited(me) then
        status := 'rate_limited';
        return;
    end if;
    if clean !~ '^[A-HJKMNP-Z2-9]{6}$' then
        status := 'invalid';
        return;
    end if;
    select * into row from public.invites where code = clean;
    if not found then
        perform public.note_failed_redeem(me);
        status := 'invalid';
        return;
    end if;
    inviter := row.created_by;
    if row.created_by = me then
        status := 'own_code';
    elsif row.used_at is not null then
        perform public.note_failed_redeem(me);
        status := 'used';
    elsif row.expires_at <= now() then
        perform public.note_failed_redeem(me);
        status := 'expired';
    elsif exists (select 1 from public.couple_members where user_id = row.created_by) then
        status := 'partner_paired';
    else
        status := 'ok';
    end if;
end;
$$;

create function public.preview_invite(p_code text) returns jsonb
    language plpgsql security definer set search_path = ''
as $$
declare
    me uuid := (select auth.uid());
    checked record;
begin
    if me is null then raise exception 'not signed in' using errcode = '28000'; end if;
    if exists (select 1 from public.couple_members where user_id = me) then
        return jsonb_build_object('status', 'already_paired');
    end if;
    select * into checked from public.check_invite(me, p_code);
    if checked.status <> 'ok' then
        return jsonb_build_object('status', checked.status);
    end if;
    return jsonb_build_object(
        'status', 'ok',
        'inviter_name', (select display_name from public.profiles where id = checked.inviter)
    );
end;
$$;

-- Creates the couple. Two people can redeem each other's codes at the same moment, so it locks both
-- ids in sorted order first: the second waits, then sees the first's couple, with no deadlock.
create function public.redeem_invite(p_code text) returns jsonb
    language plpgsql security definer set search_path = ''
as $$
declare
    me uuid := (select auth.uid());
    clean text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
    known_inviter uuid;
    checked record;
    existing_couple uuid;
    new_couple uuid;
begin
    if me is null then raise exception 'not signed in' using errcode = '28000'; end if;

    select created_by into known_inviter from public.invites where code = clean;
    if known_inviter is not null then
        perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(least(me, known_inviter)::text, 0));
        perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(greatest(me, known_inviter)::text, 0));
    end if;

    select couple_id into existing_couple from public.couple_members where user_id = me;
    if existing_couple is not null then
        -- A replay of this same redemption gets the same answer.
        if known_inviter is not null and exists (
            select 1 from public.couple_members where couple_id = existing_couple and user_id = known_inviter
        ) then
            return jsonb_build_object(
                'status', 'ok',
                'couple_id', existing_couple,
                'partner_name', (select display_name from public.profiles where id = known_inviter)
            );
        end if;
        return jsonb_build_object('status', 'already_paired');
    end if;

    select * into checked from public.check_invite(me, clean);
    if checked.status <> 'ok' then
        return jsonb_build_object('status', checked.status);
    end if;

    begin
        insert into public.couples default values returning id into new_couple;
        insert into public.couple_members (couple_id, user_id) values
            (new_couple, me),
            (new_couple, checked.inviter);
    exception when unique_violation then
        return jsonb_build_object('status', 'partner_paired');
    end;

    update public.invites set used_at = now(), used_by = me where code = clean;
    -- Your own open code, if you had one, has no more use.
    delete from public.invites
        where created_by = me and used_at is null and expires_at <> 'infinity'::timestamptz;
    update public.profiles set failed_redeems = 0, failed_redeems_at = null where id = me;

    return jsonb_build_object(
        'status', 'ok',
        'couple_id', new_couple,
        'partner_name', (select display_name from public.profiles where id = checked.inviter)
    );
end;
$$;

-- Deleting the couple cascades to its members and notes. Each person keeps their own days.
create function public.unpair() returns jsonb
    language plpgsql security definer set search_path = ''
as $$
declare
    me uuid := (select auth.uid());
    mine uuid;
begin
    if me is null then raise exception 'not signed in' using errcode = '28000'; end if;
    select couple_id into mine from public.couple_members where user_id = me;
    if mine is null then
        return jsonb_build_object('status', 'not_paired');
    end if;
    delete from public.couples where id = mine;
    return jsonb_build_object('status', 'ok');
end;
$$;

-- Idempotent and order-independent: a day can only grow (plan §4). Unpaired, it writes nothing
-- (FR-PAR-003). goal_minutes is the latest reported, since it isn't a total.
create function public.report_day(
    p_day date,
    p_focus_ms bigint,
    p_sessions integer,
    p_goal_hit boolean,
    p_goal_minutes integer default null
) returns jsonb
    language plpgsql security definer set search_path = ''
as $$
declare
    me uuid := (select auth.uid());
begin
    if me is null then raise exception 'not signed in' using errcode = '28000'; end if;
    if not exists (select 1 from public.couple_members where user_id = me) then
        return jsonb_build_object('status', 'not_paired');
    end if;
    if p_day is null or p_day > current_date + 1 or p_day < current_date - 400
       or p_focus_ms is null or p_focus_ms < 0 or p_focus_ms > 90000000
       or p_sessions is null or p_sessions < 0 or p_sessions > 1000
       or (p_goal_minutes is not null and (p_goal_minutes < 0 or p_goal_minutes > 1440)) then
        return jsonb_build_object('status', 'invalid');
    end if;
    insert into public.daily_stats as d (owner_kind, owner_id, day_key, focus_ms, sessions, goal_hit, goal_minutes)
        values ('user', me, p_day, p_focus_ms, p_sessions, coalesce(p_goal_hit, false), p_goal_minutes)
        on conflict (owner_kind, owner_id, day_key) do update
            set focus_ms = greatest(d.focus_ms, excluded.focus_ms),
                sessions = greatest(d.sessions, excluded.sessions),
                goal_hit = d.goal_hit or excluded.goal_hit,
                goal_minutes = coalesce(excluded.goal_minutes, d.goal_minutes),
                updated_at = now();
    return jsonb_build_object('status', 'ok');
end;
$$;

-- To your partner only. A repeated client id returns the first note, so a retry can't send twice.
create function public.send_note(p_client_id uuid, p_body text) returns jsonb
    language plpgsql security definer set search_path = ''
as $$
declare
    me uuid := (select auth.uid());
    clean text := btrim(coalesce(p_body, ''));
    mine uuid;
    partner uuid;
    existing uuid;
    new_id uuid;
begin
    if me is null then raise exception 'not signed in' using errcode = '28000'; end if;
    select couple_id into mine from public.couple_members where user_id = me;
    if mine is null then
        return jsonb_build_object('status', 'not_paired');
    end if;
    select id into existing from public.love_notes where author_id = me and client_id = p_client_id;
    if existing is not null then
        return jsonb_build_object('status', 'ok', 'id', existing);
    end if;
    if p_client_id is null or char_length(clean) not between 1 and 280 then
        return jsonb_build_object('status', 'invalid');
    end if;
    if (select count(*) from public.love_notes where author_id = me and created_at > now() - interval '1 day') >= 20 then
        return jsonb_build_object('status', 'rate_limited');
    end if;
    select user_id into partner from public.couple_members where couple_id = mine and user_id <> me;
    insert into public.love_notes (couple_id, author_id, recipient_id, client_id, body)
        values (mine, me, partner, p_client_id, clean)
        returning id into new_id;
    return jsonb_build_object('status', 'ok', 'id', new_id);
end;
$$;

-- The recipient's only; the first time counts.
create function public.mark_note_shown(p_id uuid) returns jsonb
    language plpgsql security definer set search_path = ''
as $$
declare
    me uuid := (select auth.uid());
begin
    if me is null then raise exception 'not signed in' using errcode = '28000'; end if;
    update public.love_notes set shown_at = coalesce(shown_at, now())
        where id = p_id and recipient_id = me;
    if not found then
        return jsonb_build_object('status', 'not_found');
    end if;
    return jsonb_build_object('status', 'ok');
end;
$$;

-- One request for everything the app shows, so there's no N+1 (rehaul plan §4.3). A partner's today
-- is found from their own time zone; without a row for that date it's null, never yesterday's.
create function public.home_snapshot() returns jsonb
    language plpgsql stable security definer set search_path = ''
as $$
declare
    me uuid := (select auth.uid());
    mine public.couple_members;
    partner public.profiles;
    partner_day date;
begin
    if me is null then raise exception 'not signed in' using errcode = '28000'; end if;
    select * into mine from public.couple_members where user_id = me;
    if mine.couple_id is not null then
        select p.* into partner
            from public.couple_members m
            join public.profiles p on p.id = m.user_id
            where m.couple_id = mine.couple_id and m.user_id <> me;
        partner_day := (now() at time zone partner.tz)::date;
    end if;
    return jsonb_build_object(
        'me', (select jsonb_build_object('id', p.id, 'display_name', p.display_name)
               from public.profiles p where p.id = me),
        'couple', case when mine.couple_id is null then null else jsonb_build_object(
            'id', mine.couple_id,
            'paired_at', mine.joined_at
        ) end,
        'partner', case when mine.couple_id is null then null else jsonb_build_object(
            'id', partner.id,
            'display_name', partner.display_name
        ) end,
        'partner_today', case when mine.couple_id is null then null else (
            select jsonb_build_object(
                'day_key', d.day_key,
                'focus_ms', d.focus_ms,
                'sessions', d.sessions,
                'goal_hit', d.goal_hit,
                'goal_minutes', d.goal_minutes
            )
            from public.daily_stats d
            where d.owner_kind = 'user' and d.owner_id = partner.id and d.day_key = partner_day
        ) end,
        'partner_updated_at', case when mine.couple_id is null then null else (
            select d.updated_at
            from public.daily_stats d
            where d.owner_kind = 'user' and d.owner_id = partner.id
            order by d.day_key desc
            limit 1
        ) end,
        'notes', coalesce((
            select jsonb_agg(jsonb_build_object('id', n.id, 'body', n.body, 'created_at', n.created_at) order by n.created_at)
            from (
                select l.id, l.body, l.created_at
                from public.love_notes l
                where l.recipient_id = me and l.shown_at is null
                order by l.created_at
                limit 20
            ) n
        ), '[]'::jsonb),
        'invite', case when mine.couple_id is not null then null else (
            select jsonb_build_object('code', i.code, 'expires_at', i.expires_at)
            from public.invites i
            where i.created_by = me and i.used_at is null and i.expires_at > now()
              and i.expires_at <> 'infinity'::timestamptz
        ) end
    );
end;
$$;

-- All of this person's data, as JSON (FR-ACC-004).
create function public.export_my_data() returns jsonb
    language plpgsql stable security definer set search_path = ''
as $$
declare
    me uuid := (select auth.uid());
begin
    if me is null then raise exception 'not signed in' using errcode = '28000'; end if;
    return jsonb_build_object(
        'exported_at', now(),
        'profile', (select jsonb_build_object(
            'id', p.id, 'display_name', p.display_name, 'tz', p.tz, 'locale', p.locale, 'created_at', p.created_at)
            from public.profiles p where p.id = me),
        'couple', (select jsonb_build_object(
            'paired_at', m.joined_at,
            'partner_name', (select pp.display_name from public.couple_members o
                             join public.profiles pp on pp.id = o.user_id
                             where o.couple_id = m.couple_id and o.user_id <> me))
            from public.couple_members m where m.user_id = me),
        'daily_stats', coalesce((select jsonb_agg(jsonb_build_object(
            'day_key', d.day_key, 'focus_ms', d.focus_ms, 'sessions', d.sessions,
            'goal_hit', d.goal_hit, 'goal_minutes', d.goal_minutes) order by d.day_key)
            from public.daily_stats d where d.owner_kind = 'user' and d.owner_id = me), '[]'::jsonb),
        'notes_written', coalesce((select jsonb_agg(jsonb_build_object(
            'body', n.body, 'created_at', n.created_at, 'shown_at', n.shown_at) order by n.created_at)
            from public.love_notes n where n.author_id = me), '[]'::jsonb),
        'notes_received', coalesce((select jsonb_agg(jsonb_build_object(
            'body', n.body, 'created_at', n.created_at, 'shown_at', n.shown_at) order by n.created_at)
            from public.love_notes n where n.recipient_id = me), '[]'::jsonb)
    );
end;
$$;

-- Helpers nobody calls directly.
revoke all on function public.random_invite_code() from public, anon, authenticated;
revoke all on function public.note_failed_redeem(uuid) from public, anon, authenticated;
revoke all on function public.is_redeem_limited(uuid) from public, anon, authenticated;
revoke all on function public.check_invite(uuid, text) from public, anon, authenticated;

-- The app's whole server surface in 1.5.0, by name.
revoke all on function public.set_profile(text, text, text) from public, anon;
revoke all on function public.create_invite() from public, anon;
revoke all on function public.preview_invite(text) from public, anon;
revoke all on function public.redeem_invite(text) from public, anon;
revoke all on function public.unpair() from public, anon;
revoke all on function public.report_day(date, bigint, integer, boolean, integer) from public, anon;
revoke all on function public.send_note(uuid, text) from public, anon;
revoke all on function public.mark_note_shown(uuid) from public, anon;
revoke all on function public.home_snapshot() from public, anon;
revoke all on function public.export_my_data() from public, anon;

grant execute on function public.set_profile(text, text, text) to authenticated;
grant execute on function public.create_invite() to authenticated;
grant execute on function public.preview_invite(text) to authenticated;
grant execute on function public.redeem_invite(text) to authenticated;
grant execute on function public.unpair() to authenticated;
grant execute on function public.report_day(date, bigint, integer, boolean, integer) to authenticated;
grant execute on function public.send_note(uuid, text) to authenticated;
grant execute on function public.mark_note_shown(uuid) to authenticated;
grant execute on function public.home_snapshot() to authenticated;
grant execute on function public.export_my_data() to authenticated;
