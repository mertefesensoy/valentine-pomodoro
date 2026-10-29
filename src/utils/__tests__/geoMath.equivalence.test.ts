import {
    calculateBearing,
    flightDurationToSeconds,
    generateGreatCircleWaypoints,
    haversineDistance,
    interpolateAlongPath,
    LatLng,
} from '../geoMath';
import { interpolateAlongPathWorklet } from '../geoMathWorklet';

// The JS function restores the plane on the JS thread; the worklet animates it on
// the UI thread. If they disagree the plane jumps on resume with no error, so the
// two are compared here on routes that exercise every branch.

const IST: LatLng = { latitude: 41.2753, longitude: 28.7519 };
const JFK: LatLng = { latitude: 40.6413, longitude: -73.7781 };
const SYD: LatLng = { latitude: -33.9399, longitude: 151.1753 };
const LAX: LatLng = { latitude: 33.9416, longitude: -118.4085 };
const NRT: LatLng = { latitude: 35.772, longitude: 140.3929 };
const ANC: LatLng = { latitude: 61.1743, longitude: -149.9963 };

const ROUTES: [string, LatLng[]][] = [
    ['IST→JFK great circle', generateGreatCircleWaypoints(IST, JFK)],
    ['SYD→LAX crosses the antimeridian', generateGreatCircleWaypoints(SYD, LAX)],
    ['NRT→ANC crosses the antimeridian northbound', generateGreatCircleWaypoints(NRT, ANC)],
    ['hand-made segment straddling ±180°', [
        { latitude: 10, longitude: 179 },
        { latitude: 12, longitude: -179 },
        { latitude: 14, longitude: -177 },
    ]],
    ['two points', [IST, JFK]],
];

const PROGRESS = [-0.5, 0, 1e-9, 0.25, 0.5, 0.731, 0.999999, 1, 1.5];
for (let i = 0; i <= 200; i++) PROGRESS.push(i / 200);

describe('interpolateAlongPathWorklet ≡ interpolateAlongPath', () => {
    it.each(ROUTES)('%s', (_name, waypoints) => {
        for (const p of PROGRESS) {
            const js = interpolateAlongPath(waypoints, p);
            const wk = interpolateAlongPathWorklet(waypoints, p);
            expect(wk.coord.latitude).toBeCloseTo(js.coord.latitude, 9);
            expect(wk.coord.longitude).toBeCloseTo(js.coord.longitude, 9);
            expect(wk.bearing).toBeCloseTo(js.bearing, 9);
        }
    });

    it('agrees on degenerate inputs', () => {
        expect(interpolateAlongPathWorklet([], 0.5)).toEqual(interpolateAlongPath([], 0.5));
        expect(interpolateAlongPathWorklet([IST], 0.5)).toEqual(interpolateAlongPath([IST], 0.5));
    });
});

describe('route geometry sanity', () => {
    it('starts and ends at the airports', () => {
        const wps = generateGreatCircleWaypoints(IST, JFK);
        expect(interpolateAlongPath(wps, 0).coord.latitude).toBeCloseTo(IST.latitude, 6);
        expect(interpolateAlongPath(wps, 1).coord.longitude).toBeCloseTo(JFK.longitude, 6);
    });

    it('never jumps more than one waypoint gap across the antimeridian', () => {
        const wps = generateGreatCircleWaypoints(SYD, LAX);
        let prev = interpolateAlongPath(wps, 0).coord;
        for (let i = 1; i <= 1000; i++) {
            const next = interpolateAlongPath(wps, i / 1000).coord;
            let dLon = Math.abs(next.longitude - prev.longitude);
            if (dLon > 180) dLon = 360 - dLon;
            expect(dLon).toBeLessThan(5);
            prev = next;
        }
    });

    it('computes bearings in [0, 360)', () => {
        expect(calculateBearing(IST, JFK)).toBeGreaterThanOrEqual(0);
        expect(calculateBearing(IST, JFK)).toBeLessThan(360);
        expect(calculateBearing({ latitude: 0, longitude: 0 }, { latitude: 1, longitude: 0 })).toBeCloseTo(0, 6);
        expect(calculateBearing({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 })).toBeCloseTo(90, 6);
    });
});

describe('flightDurationToSeconds', () => {
    // Pins the current formula: (distance / 900 km/h + band overhead) / 5, clamped to [5, 180] min.
    // The 45 min short-haul overhead / 5 = 9 min is the real floor; the 5 min clamp is unreachable.
    it('matches known city pairs', () => {
        const istJfk = haversineDistance(IST.latitude, IST.longitude, JFK.latitude, JFK.longitude);
        expect(istJfk).toBeGreaterThan(8000);
        expect(istJfk).toBeLessThan(8100);
        const expectedMin = ((istJfk / 900) * 60 + 75) / 5;
        expect(flightDurationToSeconds(istJfk)).toBe(Math.round(expectedMin * 60));
    });

    it('floors short hops at about 9 minutes and clamps very long routes to 180 minutes', () => {
        expect(flightDurationToSeconds(0)).toBe(9 * 60);
        expect(flightDurationToSeconds(1)).toBe(Math.round((((1 / 900) * 60 + 45) / 5) * 60));
        expect(flightDurationToSeconds(1_000_000)).toBe(180 * 60);
    });

    it('never gets shorter as distance grows', () => {
        let prev = 0;
        for (let km = 0; km <= 20000; km += 50) {
            const s = flightDurationToSeconds(km);
            expect(s).toBeGreaterThanOrEqual(prev);
            prev = s;
        }
    });
});
