/** What `home_snapshot` returns (Phase 2 B3): one request for everything a paired person's screens show. */
export type HomeSnapshot = {
    me: { id: string; display_name: string | null } | null;
    couple: { id: string; paired_at: string } | null;
    partner: { id: string; display_name: string | null } | null;
    /** Their today, by their own time zone. Null when they have no row for it: never yesterday's. */
    partner_today: {
        day_key: string;
        focus_ms: number;
        sessions: number;
        goal_hit: boolean;
        goal_minutes: number | null;
    } | null;
    partner_updated_at: string | null;
    /** Undelivered notes from your partner, oldest first. */
    notes: { id: string; body: string; created_at: string }[];
    /** Your open code, while you aren't paired. */
    invite: { code: string; expires_at: string } | null;
};
