/**
 * What happened to the Stats banner on this launch (Phase 1 B6 fix, record §9).
 *
 * Build 46 showed no banner in Stats, and its code and B7's showed no cause.
 * This keeps, in memory only, the banner's request, its load result and where
 * its container landed, for B7's hidden panel (Settings → About) and its
 * shared data, so a device build tells "didn't load" (the error code) from
 * "loaded behind the tab bar" (a bottom edge below the bar's top).
 *
 * Nothing is stored or sent. Each launch starts at "not requested".
 */

export type BannerStatus = {
    state: 'not requested' | 'requested' | 'loaded' | 'failed';
    /** The loaded ad's size, pt. */
    size?: { width: number; height: number };
    /** The SDK's error, e.g. `googleMobileAds/no-fill`. */
    error?: { code: string; message: string };
    /** In window coordinates, pt: the container's bottom edge, and the tab bar's top edge. */
    layout?: { bottom: number; barTop: number };
};

let status: BannerStatus = { state: 'not requested' };

export function noteBannerRequested(): void {
    if (status.state === 'not requested') status = { ...status, state: 'requested' };
}

export function noteBannerLoaded(size: { width: number; height: number }): void {
    status = { ...status, state: 'loaded', size: { width: size.width, height: size.height }, error: undefined };
}

export function noteBannerFailed(error: { code?: string; message?: string }): void {
    status = {
        ...status,
        state: 'failed',
        error: { code: error.code ?? 'unknown', message: error.message ?? '' },
    };
}

export function noteBannerLayout(bottom: number, barTop: number): void {
    status = { ...status, layout: { bottom, barTop } };
}

export function bannerStatus(): BannerStatus {
    return status;
}

const pt = (v: number) => `${Math.round(v)}`;

/** One line for the panel. */
export function bannerStatusLine(s: BannerStatus = status): string {
    let line = 'Stats banner (this launch): ';
    if (s.state === 'not requested') line += 'not requested (Stats not opened yet)';
    else if (s.state === 'requested') line += 'requested, no result yet';
    else if (s.state === 'loaded') line += `loaded ${pt(s.size!.width)}×${pt(s.size!.height)}`;
    else line += `failed: ${s.error!.code}${s.error!.message ? ` (${s.error!.message})` : ''}`;
    if (s.layout) {
        const where = s.layout.bottom <= s.layout.barTop + 0.5 ? 'above the tab bar' : 'reaches under the tab bar';
        line += ` · bottom ${pt(s.layout.bottom)} / bar top ${pt(s.layout.barTop)} pt (${where})`;
    }
    return line;
}
