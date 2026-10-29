/**
 * geoMathWorklet.ts — UI-thread twin of geoMath.ts:interpolateAlongPath.
 *
 * Worklets cannot call ordinary JS functions, so the interpolation and the
 * bearing formula are inlined here instead of calling calculateBearing.
 * The two implementations must stay numerically identical; that contract is
 * enforced by src/utils/__tests__/geoMath.equivalence.test.ts, not by comments.
 *
 * Module scope is deliberate: the worklets Babel plugin instruments the
 * function where it is defined, before any useFrameCallback closure captures it.
 */

import type { LatLng } from './geoMath';

/**
 * Position and heading at `progress` (0–1) along a polyline of waypoints.
 *
 * Contract: same inputs and outputs as interpolateAlongPath. Progress is
 * clamped to [0, 1]; longitude interpolation takes the short way across the
 * ±180° meridian; bearing is degrees clockwise from north in [0, 360).
 */
export function interpolateAlongPathWorklet(
    waypoints: LatLng[],
    progress: number,
): { coord: LatLng; bearing: number } {
    'worklet';
    if (waypoints.length === 0) return { coord: { latitude: 0, longitude: 0 }, bearing: 0 };
    if (waypoints.length === 1) return { coord: waypoints[0], bearing: 0 };

    const clamped = Math.max(0, Math.min(1, progress));
    const exactIdx = clamped * (waypoints.length - 1);
    const lowerIdx = Math.min(Math.floor(exactIdx), waypoints.length - 2);
    const upperIdx = lowerIdx + 1;
    const fraction = exactIdx - lowerIdx;

    let lonDiff = waypoints[upperIdx].longitude - waypoints[lowerIdx].longitude;
    if (lonDiff > 180) lonDiff -= 360;
    if (lonDiff < -180) lonDiff += 360;

    const lat = waypoints[lowerIdx].latitude + fraction * (waypoints[upperIdx].latitude - waypoints[lowerIdx].latitude);
    const lon = waypoints[lowerIdx].longitude + fraction * lonDiff;

    const toRad = (d: number) => (d * Math.PI) / 180;
    const toDeg = (r: number) => (r * 180) / Math.PI;
    const lat1 = toRad(waypoints[lowerIdx].latitude);
    const lat2 = toRad(waypoints[upperIdx].latitude);
    const dLon = toRad(waypoints[upperIdx].longitude - waypoints[lowerIdx].longitude);
    const sinDLon = Math.sin(dLon);
    const cosLat2 = Math.cos(lat2);
    const y = sinDLon * cosLat2;
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * cosLat2 * Math.cos(dLon);
    const bearing = (toDeg(Math.atan2(y, x)) + 360) % 360;

    return { coord: { latitude: lat, longitude: lon }, bearing };
}
