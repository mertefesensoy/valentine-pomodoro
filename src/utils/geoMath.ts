/**
 * geoMath.ts — Pure geographic math utilities for Fly Mode
 * No React dependencies. All functions are stateless and testable in isolation.
 */

export interface LatLng {
    latitude: number;
    longitude: number;
}

const EARTH_RADIUS_KM = 6371;

/**
 * Haversine formula — computes the great-circle distance (km) between two
 * points on the Earth's surface.
 *
 * a = sin²(Δlat/2) + cos(lat1) · cos(lat2) · sin²(Δlon/2)
 * c = 2 · atan2(√a, √(1-a))
 * d = R · c
 */
export function haversineDistance(
    lat1: number, lon1: number,
    lat2: number, lon2: number
): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const rLat1 = toRad(lat1);
    const rLat2 = toRad(lat2);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(rLat1) * Math.cos(rLat2) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_KM * c;
}

/**
 * Converts a great-circle distance to a scaled Pomodoro duration in seconds.
 *
 * Uses 900 km/h modern jet cruising speed plus realistic per-band overhead
 * (taxi + takeoff/climb + descent):
 *   • short haul  < 1,500 km  → +45 min overhead
 *   • medium haul < 5,000 km  → +60 min overhead
 *   • long haul   ≥ 5,000 km  → +75 min overhead
 *
 * Scaled 10:1 (10 real flight minutes = 1 Pomodoro minute).
 * Clamped to a minimum of 5 min and maximum of 90 min.
 *
 * Examples:
 *   LHR→CDG  (340 km):  ~6.7 min Pomodoro  (was 2.6 min with old formula)
 *   JFK→LHR  (5,570 km): ~46 min Pomodoro
 *   SYD→LAX  (12,074 km): 90 min (capped)
 */
export function flightDurationToSeconds(distanceKm: number, scaleFactor = 10): number {
    const CRUISE_SPEED_KMH = 900;

    // Realistic taxi + takeoff/climb + descent overhead per distance band
    let overheadMinutes: number;
    if (distanceKm < 1500) {
        overheadMinutes = 45;   // short haul
    } else if (distanceKm < 5000) {
        overheadMinutes = 60;   // medium haul
    } else {
        overheadMinutes = 75;   // long haul
    }

    const cruiseMinutes = (distanceKm / CRUISE_SPEED_KMH) * 60;
    const realFlightMinutes = cruiseMinutes + overheadMinutes;
    const pomodoroMinutes = realFlightMinutes / scaleFactor;

    // Clamp: 5 min minimum (short hops), 90 min maximum
    return Math.round(Math.max(5 * 60, Math.min(90 * 60, pomodoroMinutes * 60)));
}

/**
 * Formats a duration in seconds to a human-readable string like "42 min" or "1h 23m".
 */
export function formatFlightDuration(seconds: number): string {
    const totalMinutes = Math.round(seconds / 60);
    if (totalMinutes < 60) return `${totalMinutes} min`;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Generates an array of intermediate LatLng waypoints along the great circle
 * (shortest) path between two points.
 *
 * Uses spherical linear interpolation (SLERP) in 3D Cartesian space, then
 * converts back to lat/lon. This guarantees a true great circle path — unlike
 * linear lat/lon interpolation (which produces a rhumb line).
 *
 * @param origin - starting coordinate
 * @param destination - ending coordinate
 * @param maxPoints - cap to prevent MapKit bridge overload (default 100)
 * @returns array of LatLng from origin to destination (inclusive)
 */
export function generateGreatCircleWaypoints(
    origin: LatLng,
    destination: LatLng,
    maxPoints = 100
): LatLng[] {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const toDeg = (rad: number) => (rad * 180) / Math.PI;

    // Convert lat/lon to unit Cartesian vectors on the unit sphere
    const toCartesian = (lat: number, lon: number): [number, number, number] => {
        const rLat = toRad(lat);
        const rLon = toRad(lon);
        return [
            Math.cos(rLat) * Math.cos(rLon),
            Math.cos(rLat) * Math.sin(rLon),
            Math.sin(rLat),
        ];
    };

    const fromCartesian = (x: number, y: number, z: number): LatLng => ({
        latitude: toDeg(Math.asin(z)),
        longitude: toDeg(Math.atan2(y, x)),
    });

    const [x1, y1, z1] = toCartesian(origin.latitude, origin.longitude);
    const [x2, y2, z2] = toCartesian(destination.latitude, destination.longitude);

    // Angle between the two vectors (= central angle = arc length on unit sphere)
    const dot = Math.min(1, Math.max(-1, x1 * x2 + y1 * y2 + z1 * z2));
    const omega = Math.acos(dot);

    // Edge case: same point → return single waypoint
    if (omega < 1e-10) return [origin];

    const sinOmega = Math.sin(omega);
    const points: LatLng[] = [];

    for (let i = 0; i < maxPoints; i++) {
        const t = i / (maxPoints - 1);
        // SLERP: p(t) = (sin((1-t)*ω) / sin(ω)) * p1 + (sin(t*ω) / sin(ω)) * p2
        const a = Math.sin((1 - t) * omega) / sinOmega;
        const b = Math.sin(t * omega) / sinOmega;
        points.push(fromCartesian(
            a * x1 + b * x2,
            a * y1 + b * y2,
            a * z1 + b * z2,
        ));
    }

    return points;
}

/**
 * Finds the nearest airport (or any coordinate-bearing object) to a given
 * tap coordinate, using Haversine distance.
 *
 * Generic over any object that has a `coordinates: { latitude, longitude }`
 * field, so it works with the Airport type without importing it here.
 *
 * @param tapLat - latitude of the map tap
 * @param tapLon - longitude of the map tap
 * @param airports - array of airport objects
 * @returns the airport object nearest to the tap
 */
export function findNearestAirport<T extends { coordinates: { latitude: number; longitude: number } }>(
    tapLat: number,
    tapLon: number,
    airports: T[]
): T {
    let nearest = airports[0];
    let minDist = Infinity;
    for (const airport of airports) {
        const d = haversineDistance(
            tapLat, tapLon,
            airport.coordinates.latitude,
            airport.coordinates.longitude
        );
        if (d < minDist) {
            minDist = d;
            nearest = airport;
        }
    }
    return nearest;
}

/**
 * Calculates the forward azimuth (bearing in degrees, 0–360) from one
 * coordinate to another along the great circle path.
 *
 * Used to rotate the airplane marker so it always faces its direction of travel.
 *
 * Formula:
 *   θ = atan2(sin(Δlon)·cos(lat2),
 *             cos(lat1)·sin(lat2) − sin(lat1)·cos(lat2)·cos(Δlon))
 */
export function calculateBearing(from: LatLng, to: LatLng): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const toDeg = (rad: number) => (rad * 180) / Math.PI;

    const lat1 = toRad(from.latitude);
    const lat2 = toRad(to.latitude);
    const dLon = toRad(to.longitude - from.longitude);

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x =
        Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    const bearing = toDeg(Math.atan2(y, x));
    return (bearing + 360) % 360;
}
