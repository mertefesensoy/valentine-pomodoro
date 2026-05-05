/**
 * FlyModeScreen.tsx
 *
 * The Fly Mode experience — a Valentine-themed Pomodoro timer where the
 * focus duration is determined by the great-circle distance between two
 * selected airports. An animated airplane marker travels along the geodesic
 * path on an Apple Maps MapView as the timer counts down.
 *
 * Architecture notes:
 * - react-native-maps Marker does NOT accept Reanimated animated values for
 *   the `coordinate` prop. Instead:
 *     • `useFrameCallback` drives progress + bearingSV at 60fps on the UI thread
 *     • `runOnJS` at MARKER_HZ (15 Hz) updates React state (markerCoord, bearingDeg)
 *       for the Marker coordinate prop and camera effects
 *     • The airplane ROTATION uses `useAnimatedStyle` — fully 60fps on UI thread
 * - Timer state lives in `useSessionClock` (via AppContext `session`). The fly
 *   slot's `endAt` is a `Date.now()` wall-clock epoch, so backgrounding has no
 *   effect on accuracy.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    View, Text, Pressable, StyleSheet, Platform,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, MapType, Region } from 'react-native-maps';
import Animated, {
    useSharedValue, useAnimatedStyle,
    runOnJS, useFrameCallback,
    interpolate, Extrapolation,
} from 'react-native-reanimated';
import FlySheet, { FlySheetRef } from '../components/FlySheet';
import FlyTimerPill from '../components/FlyTimerPill';
import { useResponsive } from '../hooks/useResponsive';
import { ValentineSpec } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import AirportPicker, { Airport } from '../components/AirportPicker';
import {
    haversineDistance, flightDurationToSeconds, formatFlightDuration,
    generateGreatCircleWaypoints, calculateBearing, findNearestAirport, LatLng,
    interpolateAlongPath,
} from '../utils/geoMath';
import { save, load, STORAGE_KEYS } from '../utils/storage';
import airportData from '../assets/data/airports.json';
import { formatTime } from '../utils/time';
import { useFlyModeAudio } from '../hooks/useFlyModeAudio';
import { useApp } from '../context/AppContext';
import { AdManager } from '../ads/AdManager';
import { AdPolicy } from '../ads/AdPolicy';
import { useNotifications } from '../hooks/useNotifications';
import LoveNoteCard from '../components/LoveNoteCard';
import * as Haptics from 'expo-haptics';
import type { CameraMode } from '../types';

// ─── Airport data ────────────────────────────────────────────────────────────

type AirportRecord = {
    name: string;
    city: string;
    country: string;
    coordinates: { latitude: number; longitude: number };
    /** 1 = large, 2 = medium — used for zoom-based marker visibility */
    tier?: number;
};


const AIRPORTS: Airport[] = Object.entries(airportData as Record<string, AirportRecord>).map(
    ([iata, data]) => ({ iata, ...data })
);

// ─── Airplane SVG icon ───────────────────────────────────────────────────────
// Top-down view, pointing north (up) at 0° bearing.
// The Animated.View wrapper applies Reanimated rotation, so this stays static.

function AirplaneSVG({ size = 32, color = '#FF4F8B' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
            <Path
                d="M16 2 L18.5 13 L30 17.5 L30 19.5 L18.5 17 L19 25 L23 27 L23 29 L16 27 L9 29 L9 27 L13 25 L13.5 17 L2 19.5 L2 17.5 L13.5 13 Z"
                fill={color}
            />
        </Svg>
    );
}

// ─── Compass rose ────────────────────────────────────────────────────────────
// The rose rotates by -heading so the pink N needle always points geographic north,
// regardless of how the user has rotated the map.

function CompassRose({ heading }: { heading: number }) {
    const rot = `rotate(${-heading}, 14, 14)`;
    return (
        <Svg width={28} height={28} viewBox="0 0 28 28">
            <Circle cx={14} cy={14} r={13} fill="rgba(247,243,240,0.96)" stroke={ValentineSpec.accentPrimary} strokeWidth={1.5} />
            {/* North needle — pink, points up */}
            <Path d="M14 3 L16 14 L14 11 L12 14 Z" fill={ValentineSpec.accentPrimary} transform={rot} />
            {/* South needle — muted gray, points down */}
            <Path d="M14 25 L16 14 L14 17 L12 14 Z" fill="#BBBBBB" transform={rot} />
        </Svg>
    );
}

// ─── Camera mode default ─────────────────────────────────────────────────────

const DEFAULT_CAMERA_MODE: CameraMode = 'followPlane';

const CYCLE_MODE: Record<CameraMode, CameraMode> = {
    followPlane: 'route',
    route: 'followPlane',
    free: 'followPlane',
};
const CAMERA_ICON: Record<CameraMode, string> = {
    followPlane: '✈️',
    route: '🗺',
    free: '🖐',
};
const MODE_LABEL: Record<CameraMode, string> = {
    followPlane: 'Following',
    route: 'Route',
    free: 'Free',
};
const VALID_MODES: CameraMode[] = ['followPlane', 'route', 'free'];

// ─── Plane animation constants ───────────────────────────────────────────────

// runOnJS cadence for react-native-maps Marker coordinate updates.
// Camera effects fire at the same cadence (they depend on markerCoord state).
// Reduce MARKER_HZ to 10 if the native bridge stalls on low-end devices.
const MARKER_HZ = 15;

// ─── UI-thread interpolation worklet ─────────────────────────────────────────
// Mirror of geoMath.ts:interpolateAlongPath — keep in sync with that function.
// Defined at module scope so the Reanimated Babel plugin instruments it before
// any useFrameCallback closure captures it.

function interpolateAlongPathWorklet(
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

// ─── Component ───────────────────────────────────────────────────────────────

export default function FlyModeScreen() {
    const { width, height, isLandscape } = useResponsive();
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();

    // Sheet animation state — sheetProgress 0=peek, 1=full
    const sheetProgress = useSharedValue(1);
    const flySheetRef = useRef<FlySheetRef>(null);
    const { settings, stats, loveNotes, session } = useApp();
    const { scheduleSessionEnd, cancelScheduled } = useNotifications();

    // Populated on mount when a saved session is restored; consumed once
    // flightData becomes available to reposition the plane at the correct point.
    const restoredRemainingRef = useRef<number | null>(null);

    // Heading update throttle — live compass during map rotation (10fps max)
    const headingThrottleRef = useRef(0);

    // Airport selection
    const [origin, setOrigin] = useState<Airport | null>(null);
    const [destination, setDestination] = useState<Airport | null>(null);

    // Map view state
    const mapRef = useRef<MapView>(null);

    // Visible map region — used for zoom-based airport marker culling
    const [mapRegion, setMapRegion] = useState<Region>({
        latitude: 20, longitude: 0,
        latitudeDelta: 140, longitudeDelta: 140,
    });

    // Computed flight data (memoized from selection)
    const flightData = useMemo(() => {
        if (!origin || !destination || origin.iata === destination.iata) return null;
        const distanceKm = haversineDistance(
            origin.coordinates.latitude, origin.coordinates.longitude,
            destination.coordinates.latitude, destination.coordinates.longitude,
        );
        const totalSeconds = flightDurationToSeconds(distanceKm);
        const waypoints = generateGreatCircleWaypoints(
            origin.coordinates, destination.coordinates, 100
        );
        return { distanceKm, totalSeconds, waypoints };
    }, [origin, destination]);

    // Timer state — derived from session clock (no local timer state)
    const flySlot = session.state.fly;
    const timerRunning = flySlot?.isRunning === true;
    const paused = flySlot !== null && flySlot !== undefined && !flySlot.isRunning;
    const isSessionActive = timerRunning || paused;

    // Display ms — live remaining for the fly slot
    const displayMs: number | null = flySlot
        ? (flySlot.isRunning && flySlot.endAt
            ? Math.max(0, flySlot.endAt - Date.now())
            : flySlot.pausedRemainingMs ?? (flightData ? flightData.totalSeconds * 1000 : null))
        : (flightData ? flightData.totalSeconds * 1000 : null);

    // Ad state
    const [isAdPending, setIsAdPending] = useState(false);
    const [flightComplete, setFlightComplete] = useState(false);

    // Love note shown after landing (null = hidden)
    const [landingLoveNote, setLandingLoveNote] = useState<string | null>(null);
    const lastLoveNoteRef = useRef<string | null>(null);

    // Map overlay state
    const [mapHeading, setMapHeading] = useState(0);
    const [cameraMode, setCameraMode] = useState<CameraMode>(DEFAULT_CAMERA_MODE);
    const [isGlobe, setIsGlobe] = useState(false);
    // Gates airport-dot render until AIRMap finishes its initial subview setup,
    // avoiding the early-mount race that crashes insertReactSubview:atIndex: on iOS.
    const [mapReady, setMapReady] = useState(false);

    // ── Restore airports from session clock on mount ───────────────────────
    // SESSION_CLOCK carries originIata/destinationIata in the fly slot extras.
    // Runs once when the slot loads (async from AsyncStorage).
    const flySlotRestoredRef = useRef(false);
    useEffect(() => {
        if (flySlotRestoredRef.current) return;
        const slot = session.state.fly;
        if (!slot?.originIata || !slot?.destinationIata) return;

        flySlotRestoredRef.current = true;
        const orig = AIRPORTS.find(a => a.iata === slot.originIata);
        const dest = AIRPORTS.find(a => a.iata === slot.destinationIata);
        if (orig) setOrigin(orig);
        if (dest) setDestination(dest);

        // Store paused remaining for marker restore below
        if (!slot.isRunning && slot.pausedRemainingMs != null) {
            restoredRemainingRef.current = slot.pausedRemainingMs;
        }
    }, [session.state.fly]); // eslint-disable-line react-hooks/exhaustive-deps

    // Persist camera mode + globe toggle in FLY_PREFS (independent of SESSION_CLOCK)
    useEffect(() => {
        load<{ cameraMode?: string; isGlobe?: boolean }>(STORAGE_KEYS.FLY_PREFS, {}).then(prefs => {
            if (prefs.cameraMode && VALID_MODES.includes(prefs.cameraMode as CameraMode)) {
                setCameraMode(prefs.cameraMode as CameraMode);
            }
            if (typeof prefs.isGlobe === 'boolean') setIsGlobe(prefs.isGlobe);
        }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        save(STORAGE_KEYS.FLY_PREFS, { cameraMode, isGlobe }).catch(() => {});
    }, [cameraMode, isGlobe]);

    // Mirror cameraMode into a SharedValue so Task 4's UI-thread frame callback
    // can read the current mode without a runOnJS round-trip per frame.
    // Written here on the JS thread whenever cameraMode state changes.
    const cameraModeSV = useSharedValue<string>(DEFAULT_CAMERA_MODE);
    useEffect(() => {
        cameraModeSV.value = cameraMode;
    }, [cameraMode, cameraModeSV]);

    // Reanimated progress (0 = origin, 1 = destination)
    const progressSV = useSharedValue(0);

    // Waypoints on the UI thread — written from JS when flightData changes.
    // The frame callback reads this directly without a runOnJS round-trip.
    const waypointsSV = useSharedValue<LatLng[]>([]);

    // Fly-slot SharedValues — mirror only the fly slot's clock fields so the frame
    // callback never accidentally reads Pomodoro's endAt when both slots coexist.
    const flyEndAtSV = useSharedValue<number>(Number.NEGATIVE_INFINITY);
    const flyDurationSV = useSharedValue<number>(0);
    const flyIsRunningSV = useSharedValue<boolean>(false);

    // Delta-time accumulator (ms) for the MARKER_HZ runOnJS throttle.
    const markerUpdateAccSV = useSharedValue(0);

    // Marker state (updated via runOnJS from the frame callback at MARKER_HZ)
    const [markerCoord, setMarkerCoord] = useState<LatLng | null>(null);
    const [bearingDeg, setBearingDeg] = useState(0);

    // bearingSV: written directly by the frame callback at 60fps for smooth rotation.
    // No JS-thread bridge effect — the frame callback owns it.
    const bearingSV = useSharedValue(0);

    // mapHeadingSV mirrors mapHeading so the animated style can read it on the UI thread.
    // Keeping it as a shared value prevents a stale-closure issue where useAnimatedStyle
    // captures the JS-thread mapHeading value at render time and doesn't update until
    // the next re-render.
    const mapHeadingSV = useSharedValue(0);
    useEffect(() => {
        mapHeadingSV.value = mapHeading;
    }, [mapHeading, mapHeadingSV]);

    // Plane rotation is *relative to the screen*, not absolute from north.
    // Formula:  bearingDeg − mapHeading
    //   • Chase mode (mapHeading = bearingDeg):  result = 0  → plane points straight up ✓
    //   • North-up   (mapHeading = 0):           result = bearingDeg              ✓
    //   • Free rotation:                         correctly relative to the screen  ✓
    const markerAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${bearingSV.value - mapHeadingSV.value}deg` }],
    }));

    // Sync waypoints to UI thread whenever flight changes
    useEffect(() => {
        waypointsSV.value = flightData?.waypoints ?? [];
    }, [flightData, waypointsSV]);

    // ── Marker + bearing restore after flightData is computed ──────────────
    // The frame callback does not run while paused (flyIsRunningSV === false), so
    // we write bearingSV directly here to position the plane icon immediately.
    useEffect(() => {
        if (!flightData || restoredRemainingRef.current === null) return;

        const totalMs = flightData.totalSeconds * 1000;
        const progress = Math.max(0, Math.min(1, 1 - (restoredRemainingRef.current / totalMs)));
        progressSV.value = progress;

        const { coord, bearing } = interpolateAlongPath(flightData.waypoints, progress);
        setMarkerCoord(coord);
        setBearingDeg(bearing);
        bearingSV.value = bearing;

        restoredRemainingRef.current = null;
    }, [flightData, progressSV, bearingSV]);

    // ── Sync fly-slot clock fields to UI-thread SharedValues ─────────────────
    // The frame callback reads flyEndAtSV / flyDurationSV / flyIsRunningSV so it
    // never accidentally reads the Pomodoro slot's endAt when both slots coexist.
    useEffect(() => {
        if (flySlot?.isRunning && flySlot.endAt && flySlot.durationMs) {
            flyEndAtSV.value = flySlot.endAt;
            flyDurationSV.value = flySlot.durationMs;
            flyIsRunningSV.value = true;
        } else {
            flyEndAtSV.value = Number.NEGATIVE_INFINITY;
            flyIsRunningSV.value = false;
            if (flySlot?.durationMs) flyDurationSV.value = flySlot.durationMs;
        }
    }, [flySlot, flyEndAtSV, flyDurationSV, flyIsRunningSV]);

    // ── Frame callback: plane position as a pure function of the clock ────────
    // Runs on the UI thread at 60fps. Computes progress from the fly slot's
    // wall-clock endAt, writes bearingSV instantly (60fps rotation), and calls
    // runOnJS at MARKER_HZ to update the Marker coordinate on the JS thread.
    //
    // Date.now() is used (not info.timestamp) because flyEndAtSV was written
    // with a Date.now() basis — they must share the same clock source.
    useFrameCallback((info) => {
        'worklet';
        if (!flyIsRunningSV.value || flyEndAtSV.value === Number.NEGATIVE_INFINITY || flyDurationSV.value <= 0) return;

        const now = Date.now();
        const remaining = Math.max(0, flyEndAtSV.value - now);
        const progress = Math.min(1, Math.max(0, (flyDurationSV.value - remaining) / flyDurationSV.value));
        progressSV.value = progress;

        const wps = waypointsSV.value;
        if (wps.length < 2) return;

        const { coord, bearing } = interpolateAlongPathWorklet(wps, progress);
        bearingSV.value = bearing;

        // Throttle runOnJS to MARKER_HZ — Marker coord needs JS-thread state but
        // bridging at 60fps wastes CPU and causes map jitter on low-end devices.
        //
        // Subtract the threshold rather than resetting to zero so residual time
        // (the overshoot past the threshold) carries into the next cycle.
        // Reset-to-zero discards that overshoot, causing ~5–10 ms of cumulative
        // phase drift over a 25-min session (still within the ±0.5 s spec, but
        // perceptible if you're watching the plane vs. the timer closely).
        const dt = info.timeSincePreviousFrame ?? 16.67;
        markerUpdateAccSV.value += dt;
        if (markerUpdateAccSV.value >= 1000 / MARKER_HZ) {
            markerUpdateAccSV.value -= 1000 / MARKER_HZ;
            runOnJS(setMarkerCoord)(coord);
            runOnJS(setBearingDeg)(bearing);
        }
    });

    // Mirror fly slot's notifId in a ref for unmount cancel (can't read state in cleanup)
    const flyNotifIdRef = useRef<string | null>(null);
    useEffect(() => {
        flyNotifIdRef.current = session.state.fly?.scheduledNotificationId ?? null;
    }, [session.state.fly?.scheduledNotificationId]);

    // ── onComplete subscriber for fly kind ──────────────────────────────────
    useEffect(() => {
        return session.onComplete((slot, kind) => {
            if (kind !== 'fly') return;
            flyNotifIdRef.current = null; // notification already fired

            setFlightComplete(true);

            if (settings.settings.haptics) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            }

            const minutes = Math.round((slot.durationMs ?? 0) / 60000);
            if (minutes > 0) {
                stats.incrementFocus(minutes);
            }

            if (settings.settings.showLoveNotes) {
                const note = loveNotes.pickRandomNote(lastLoveNoteRef.current);
                lastLoveNoteRef.current = note;
                setLandingLoveNote(note);
            }

            AdPolicy.recordSessionCompletion().then(() => {
                if (AdPolicy.shouldShowAd()) setIsAdPending(true);
            }).catch(console.warn);
        });
    }, [session.onComplete, settings.settings, stats, loveNotes]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Start
    const handleStart = useCallback(async () => {
        if (!flightData) return;
        const totalMs = flightData.totalSeconds * 1000;
        const endAt = Date.now() + totalMs;

        let notifId: string | null = null;
        if (settings.settings.notifications) {
            try {
                notifId = await Promise.race([
                    scheduleSessionEnd(endAt, '✈️ Landed!', 'Your flight focus session is complete 💗'),
                    new Promise<null>(resolve => setTimeout(() => resolve(null), 1000)),
                ]);
            } catch (e) {
                console.warn('Failed to schedule landing notification:', e);
            }
        }

        restoredRemainingRef.current = null;
        flySlotRestoredRef.current = true; // session will carry origin/dest; no re-restore needed
        setFlightComplete(false);
        progressSV.value = 0;
        markerUpdateAccSV.value = 0;
        setMarkerCoord(flightData.waypoints[0]);
        setBearingDeg(
            flightData.waypoints.length > 1
                ? calculateBearing(flightData.waypoints[0], flightData.waypoints[1])
                : 0
        );

        session.start({
            kind: 'fly',
            durationMs: totalMs,
            extras: {
                originIata: origin?.iata ?? null,
                destinationIata: destination?.iata ?? null,
                scheduledNotificationId: notifId,
            },
        });
    }, [flightData, origin, destination, progressSV, markerUpdateAccSV, scheduleSessionEnd, settings.settings.notifications, session]);

    // ── Pause
    const handlePause = useCallback(() => {
        const notifId = session.state.fly?.scheduledNotificationId ?? null;
        if (notifId) {
            cancelScheduled(notifId).catch(console.warn);
            session.setSlotExtras('fly', { scheduledNotificationId: null });
        }
        session.pause();
    }, [session, cancelScheduled]);

    // ── Resume
    const handleResume = useCallback(async () => {
        const slot = session.state.fly;
        if (!slot || slot.isRunning || slot.pausedRemainingMs === null) return;

        session.resume();

        if (settings.settings.notifications) {
            const endAt = Date.now() + slot.pausedRemainingMs;
            try {
                const notifId = await Promise.race([
                    scheduleSessionEnd(endAt, '✈️ Landed!', 'Your flight focus session is complete 💗'),
                    new Promise<null>(resolve => setTimeout(() => resolve(null), 1000)),
                ]);
                session.setSlotExtras('fly', { scheduledNotificationId: notifId });
            } catch (e) {
                console.warn('Failed to reschedule landing notification:', e);
            }
        }
    }, [session, scheduleSessionEnd, settings.settings.notifications]);

    // ── Reset
    const handleReset = useCallback(() => {
        const notifId = session.state.fly?.scheduledNotificationId ?? null;
        if (notifId) cancelScheduled(notifId).catch(console.warn);
        session.stop();

        waypointsSV.value = []; // clear UI-thread waypoints first — stops frame callback interpolating
        progressSV.value = 0;
        markerUpdateAccSV.value = 0;
        setMarkerCoord(null);
        setFlightComplete(false);
        setIsAdPending(false);
        setLandingLoveNote(null);
        setCameraMode(DEFAULT_CAMERA_MODE);
        restoredRemainingRef.current = null;
        flySlotRestoredRef.current = false;
    }, [session, cancelScheduled, progressSV, waypointsSV, markerUpdateAccSV]);

    // ── Pan/rotate: enter free mode so camera stops chasing the plane.
    // The cycle button exits free mode. This replaces the old 4-second
    // suppression timer with a first-class mode visible in the UI.
    const enterFreeMode = useCallback(() => {
        setCameraMode(prev => (prev === 'free' ? prev : 'free'));
    }, []);

    // ── Compass: snap map heading to north
    const handleNorthUp = useCallback(() => {
        mapRef.current?.animateCamera({ heading: 0 }, { duration: 400 });
        setMapHeading(0);
    }, []);

    // AppState background completion is handled by useSessionClock — no inline listener needed.

    // ── Throttle ref for route mode (4 Hz fitToCoordinates) ─────────────────
    const seeAllThrottleRef = useRef(0);

    // ── Camera: 'route' idle — fit origin + destination once ──────────────
    useEffect(() => {
        if (cameraMode !== 'route') return;
        if (isSessionActive) return; // while flying, the marker-based effect handles framing
        if (!origin || !destination) return;
        const panelW = Math.min(width * 0.42, 400);
        mapRef.current?.fitToCoordinates([origin.coordinates, destination.coordinates], {
            edgePadding: {
                top: insets.top + 60,
                right: isLandscape ? panelW + 24 : 40,
                bottom: isLandscape ? 40 : height * 0.48,
                left: 40,
            },
            animated: true,
        });
    }, [cameraMode, origin, destination, isSessionActive]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Camera: followPlane — follow the plane ─────────────────────────────
    useEffect(() => {
        if (!markerCoord) return;
        if (cameraMode !== 'followPlane') return;

        mapRef.current?.setCamera({
            center: markerCoord,
            heading: bearingDeg,
            pitch: 50,
            altitude: 500_000,
        });
        // Write SV synchronously — avoids the one-frame stale-heading lag
        // where markerAnimatedStyle reads mapHeadingSV before the useEffect mirror runs.
        mapHeadingSV.value = bearingDeg;
        setMapHeading(bearingDeg);
    }, [markerCoord, cameraMode, bearingDeg]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Camera: route — refit dynamically as plane moves (4 Hz throttle) ────
    useEffect(() => {
        if (cameraMode !== 'route') return;
        if (!markerCoord || !origin || !destination) return;
        const now = Date.now();
        if (now - seeAllThrottleRef.current < 250) return;
        seeAllThrottleRef.current = now;
        const panelW = Math.min(width * 0.42, 400);
        mapRef.current?.fitToCoordinates([origin.coordinates, markerCoord, destination.coordinates], {
            edgePadding: {
                top: insets.top + 60,
                right: isLandscape ? panelW + 24 : 40,
                bottom: isLandscape ? 40 : height * 0.48,
                left: 40,
            },
            animated: true,
        });
    }, [markerCoord, cameraMode]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Show interstitial ad after flight completion
    // Wait for any love note overlay to be dismissed first — never stack UI layers
    useEffect(() => {
        if (!isAdPending) return;
        if (timerRunning || paused) return; // safety gate
        if (landingLoveNote) return;        // wait for love note to close

        setIsAdPending(false);
        AdManager.showIfReady(() => {
            // onClose: ambient sound already stopped, nothing else to do
        });
    }, [isAdPending, timerRunning, paused, landingLoveNote]);

    // ── Cleanup on unmount ─────────────────────────────────────────────────
    // Session clock persists clock state automatically — no FLY_SESSION save needed.
    // Cancel landing notification so it doesn't fire while fly mode is paused.
    // progressSV and bearingSV are written via direct .value assignment (not animations),
    // so no cancelAnimation needed — the frame callback stops on unmount automatically.
    useEffect(() => {
        return () => {
            const notifId = flyNotifIdRef.current;
            if (notifId) cancelScheduled(notifId).catch(() => {});
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Ambient sound: plays during active (running, not paused) sessions
    useFlyModeAudio(
        'flyAmbient',
        timerRunning && !paused,
        settings.settings.flyModeSound
    );

    const mapType: MapType = isGlobe
        ? (Platform.OS === 'ios' ? 'satelliteFlyover' : 'satellite')
        : 'mutedStandard';

    const cycleCameraMode = useCallback(() => {
        if (settings.settings.haptics) Haptics.selectionAsync().catch(() => {});
        setCameraMode(prev => CYCLE_MODE[prev]);
    }, [settings.settings.haptics]);

    const toggleGlobe = useCallback(() => {
        if (settings.settings.haptics) Haptics.selectionAsync().catch(() => {});
        setIsGlobe(g => !g);
    }, [settings.settings.haptics]);

    // Picker row fades in as the sheet opens toward full (2-snap: 0=peek, 1=full)
    const pickerAnimatedStyle = useAnimatedStyle(() => ({
        opacity: interpolate(sheetProgress.value, [0.45, 0.75], [0, 1], Extrapolation.CLAMP),
        pointerEvents: sheetProgress.value > 0.5 ? 'auto' : 'none',
    } as any));

    // mapHint floats just above the peek strip (at progress=0) and above the full sheet (at progress=1)
    const mapHintAnimatedStyle = useAnimatedStyle(() => {
        const portraitBottom = interpolate(
            sheetProgress.value, [0, 1], [height * 0.12, height * 0.47],
            Extrapolation.CLAMP,
        );
        return { bottom: portraitBottom };
    });

    // mapControls column shifts left in landscape so it never overlaps the sheet.
    // At peek (progress=0): sits just left of the 32 px strip (PEEK_STRIP=32, gap=12 → right:44).
    // At full (progress=1): sits just left of the panel (panelW + 12).
    // In portrait the right value is fixed at 12.
    const mapControlsAnimatedStyle = useAnimatedStyle(() => {
        if (!isLandscape) return { right: 12 };
        const panelW = Math.min(width * 0.42, 400);
        const rightPos = interpolate(
            sheetProgress.value,
            [0, 1],
            [44, panelW + 12], // 44 = PEEK_STRIP(32) + gap(12)
            Extrapolation.CLAMP,
        );
        return { right: rightPos };
    });

    // ── Zoom-based airport markers ───────────────────────────────────────────
    // Shown when no session is running (both flat and globe modes).
    // Globe mode: tier-1 airports worldwide (no bounds check).
    // Flat mode: tier-threshold scales with zoom; bounded by viewport.
    // Capped at 120 to keep the bridge happy (sorted best-first before capping).
    const visibleAirportMarkers = useMemo(() => {
        if (isSessionActive) return []; // hidden during active flights

        const { latitude, longitude, latitudeDelta, longitudeDelta } = mapRegion;

        // Only 2 tiers exist now (tier-3 stripped from data).
        // Show tier-1 only at world/continent zoom; both tiers when zoomed in.
        const maxTier = latitudeDelta >= 40 ? 1 : 2;

        // Viewport bounding box with a 5% buffer
        const latBuffer = latitudeDelta * 0.05;
        const lonBuffer = longitudeDelta * 0.05;
        const minLat = latitude - latitudeDelta / 2 - latBuffer;
        const maxLat = latitude + latitudeDelta / 2 + latBuffer;
        const minLon = longitude - longitudeDelta / 2 - lonBuffer;
        const maxLon = longitude + longitudeDelta / 2 + lonBuffer;

        const filtered = AIRPORTS.filter(a => {
            if ((a.tier ?? 1) > maxTier) return false;
            const { latitude: aLat, longitude: aLon } = a.coordinates;
            return aLat >= minLat && aLat <= maxLat && aLon >= minLon && aLon <= maxLon;
        });

        // Sort tier-1 first; within same tier alphabetically by IATA
        filtered.sort((a, b) => {
            const td = (a.tier ?? 1) - (b.tier ?? 1);
            return td !== 0 ? td : a.iata.localeCompare(b.iata);
        });

        // Hard cap at 120 — beyond this MapKit bridge overhead noticeable
        return filtered.slice(0, 120);
    }, [mapRegion, isSessionActive]);

    const handleMapPress = useCallback((event: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
        if (isSessionActive) return;
        const { latitude, longitude } = event.nativeEvent.coordinate;
        const nearest = findNearestAirport(latitude, longitude, AIRPORTS);
        if (!origin || (origin && destination)) {
            // No origin yet, or both set → restart selection with new origin
            setOrigin(nearest);
            setDestination(null);
        } else {
            // Origin set but no destination → pick destination
            if (nearest.iata !== origin.iata) {
                setDestination(nearest);
            }
        }
    }, [isSessionActive, origin, destination]);

    return (
        <View style={styles.container}>
            {/* ── Map ─────────────────────────────────────────────────────── */}
            <MapView
                ref={mapRef}
                style={styles.map}
                mapType={mapType}
                // tintColor applies the Valentine accent to MapKit native controls
                tintColor={ValentineSpec.accentPrimary}
                // Explicit interaction permissions — rotateEnabled ensures the user
                // can freely rotate the map (we hide the native compass; use our own)
                rotateEnabled={true}
                pitchEnabled={true}
                showsCompass={false}  // hide MapKit's compass; CompassRose overlay replaces it
                userInterfaceStyle={isDark ? 'dark' : 'light'}
                initialRegion={{
                    latitude: 20, longitude: 0,
                    latitudeDelta: 120, longitudeDelta: 120,
                }}
                // Live heading update during rotation gesture (throttled to ~10fps).
                // onRegionChangeComplete fires only after the gesture settles; this
                // fires continuously so the CompassRose needle rotates in real-time.
                // Also enters free mode so camera stops chasing the plane while rotating.
                onRegionChange={async () => {
                    enterFreeMode();
                    const now = Date.now();
                    if (now - headingThrottleRef.current < 100) return;
                    headingThrottleRef.current = now;
                    const cam = await mapRef.current?.getCamera();
                    if (cam?.heading !== undefined) setMapHeading(cam.heading);
                }}
                // Track region for zoom-based airport dot rendering + final heading sync.
                // Clamp latitude to ±85 to prevent Mercator singularity near the poles.
                onRegionChangeComplete={async (region) => {
                    const safeLat = Math.max(-85, Math.min(85, region.latitude));
                    setMapRegion({ ...region, latitude: safeLat });
                    const cam = await mapRef.current?.getCamera();
                    if (cam?.heading !== undefined) setMapHeading(cam.heading);
                }}
                // Detect user pan — enters free mode so camera stops chasing the plane
                onPanDrag={enterFreeMode}
                // Map tap → nearest-airport selection (only when no session is active)
                onPress={isSessionActive ? undefined : handleMapPress}
                // Defer airport-dot mount until AIRMap is fully initialized; prevents
                // a 120-marker burst racing AIRMap._reactSubviews on first render.
                onMapReady={() => setMapReady(true)}
            >
                {/* Great circle polyline — Deep Romance Red */}
                {flightData && (
                    <Polyline
                        coordinates={flightData.waypoints}
                        strokeColor={ValentineSpec.accentSecondary}
                        strokeWidth={3}
                        lineDashPattern={undefined}
                    />
                )}

                {/* Origin marker */}
                {origin && (
                    <Marker
                        coordinate={origin.coordinates}
                        title={origin.iata}
                        description={origin.city}
                        pinColor={ValentineSpec.accentPrimary}
                    />
                )}

                {/* Destination marker */}
                {destination && (
                    <Marker
                        coordinate={destination.coordinates}
                        title={destination.iata}
                        description={destination.city}
                        pinColor={ValentineSpec.accentSecondary}
                    />
                )}

                {/* Animated airplane marker */}
                {markerCoord && (
                    <Marker coordinate={markerCoord} anchor={{ x: 0.5, y: 0.5 }} flat>
                        <Animated.View style={[styles.airplane, markerAnimatedStyle]}>
                            <AirplaneSVG size={32} color="#FFFFFF" />
                        </Animated.View>
                    </Marker>
                )}

                {/* ── Zoom-based airport dots (idle mode only) ─────────────── */}
                {/* filter BEFORE map — returning null inside a MapView child .map()
                    produces nil slots that crash AIRMap.insertReactSubview on iOS.
                    mapReady gate defers the up-to-120 dot burst until AIRMap's
                    internal _reactSubviews array is fully initialized. */}
                {mapReady && visibleAirportMarkers
                    .filter(airport =>
                        airport.iata !== origin?.iata &&
                        airport.iata !== destination?.iata,
                    )
                    .map((airport) => {
                        const tier = airport.tier ?? 1;
                        return (
                            <Marker
                                key={airport.iata}
                                coordinate={airport.coordinates}
                                anchor={{ x: 0.5, y: 0.5 }}
                                flat
                                tracksViewChanges={false}
                                onPress={() => {
                                    if (isSessionActive) return;
                                    if (!origin || (origin && destination)) {
                                        setOrigin(airport);
                                        setDestination(null);
                                    } else if (airport.iata !== origin.iata) {
                                        setDestination(airport);
                                    }
                                }}
                            >
                                <View style={[
                                    styles.airportDot,
                                    tier === 1 && styles.airportDotTier1,
                                    tier === 2 && styles.airportDotTier2,
                                    tier === 3 && styles.airportDotTier3,
                                ]} />
                            </Marker>
                        );
                    })}
            </MapView>

            {/* ── Map overlay controls: compass + view mode ───────────────── */}
            <Animated.View
                style={[styles.mapControls, { top: insets.top + 12 }, mapControlsAnimatedStyle]}
                pointerEvents="box-none"
            >
                {/* Compass — always visible; tap to snap north */}
                <Pressable
                    style={[styles.mapControlBtn, {
                        backgroundColor: isDark ? 'rgba(45,45,45,0.95)' : 'rgba(247,243,240,0.95)',
                        borderColor: `${ValentineSpec.accentPrimary}30`,
                    }]}
                    onPress={handleNorthUp}
                    accessibilityLabel="Reset map to north"
                    accessibilityRole="button"
                >
                    <CompassRose heading={mapHeading} />
                </Pressable>

                {/* Camera cycle button — only visible during active session */}
                {isSessionActive && markerCoord && (
                    <Pressable
                        style={[styles.mapControlBtn, styles.mapControlBtnGap, {
                            backgroundColor: isDark ? 'rgba(45,45,45,0.95)' : 'rgba(247,243,240,0.95)',
                            borderColor: `${ValentineSpec.accentPrimary}30`,
                        }]}
                        onPress={cycleCameraMode}
                        accessibilityLabel={`Camera mode: ${cameraMode}. Tap to cycle.`}
                        accessibilityRole="button"
                    >
                        <Text style={styles.mapControlIcon}>{CAMERA_ICON[cameraMode]}</Text>
                    </Pressable>
                )}
            </Animated.View>

            {/* ── Map tap hint banner — position tracks sheet in portrait ──── */}
            {!isSessionActive && (!origin || !destination) && (
                isLandscape ? (
                    <View
                        style={[styles.mapHint, {
                            bottom: undefined,
                            top: '40%',
                            right: Math.min(width * 0.42, 400) + 16,
                            alignSelf: undefined,
                        }]}
                        pointerEvents="none"
                    >
                        <Text style={styles.mapHintText}>
                            {!origin ? '✈️  Tap an airport dot to pick origin' : '📍 Tap an airport dot to pick destination'}
                        </Text>
                    </View>
                ) : (
                    <Animated.View style={[styles.mapHint, mapHintAnimatedStyle]} pointerEvents="none">
                        <Text style={styles.mapHintText}>
                            {!origin ? '✈️  Tap an airport dot to pick origin' : '📍 Tap an airport dot to pick destination'}
                        </Text>
                    </Animated.View>
                )
            )}

            {/* ── Floating timer pill — fades in at peek snap ──────────────── */}
            <FlyTimerPill
                sheetProgress={sheetProgress}
                displayMs={displayMs}
                onTap={() => flySheetRef.current?.expandTo('full')}
                topInset={insets.top}
                isLandscape={isLandscape}
                isDark={isDark}
            />

            {/* ── Swipeable dashboard ───────────────────────────────────────── */}
            <FlySheet
                ref={flySheetRef}
                sheetProgress={sheetProgress}
                isLandscape={isLandscape}
                viewportWidth={width}
                viewportHeight={height}
                bottomInset={insets.bottom}
                cardBgColor={colors.card}
                hapticsEnabled={settings.settings.haptics}
                headerControl={
                    <Pressable
                        onPress={toggleGlobe}
                        style={[styles.globeToggle, {
                            backgroundColor: isDark ? 'rgba(45,45,45,0.95)' : 'rgba(247,243,240,0.95)',
                            borderColor: `${ValentineSpec.accentPrimary}30`,
                        }]}
                        accessibilityLabel={isGlobe ? 'Switch to flat map' : 'Switch to globe map'}
                    >
                        <Text style={[styles.globeToggleText, { color: isDark ? '#EEE' : '#222' }]}>
                            {isGlobe ? '🗺 Flat' : '🌍 Globe'}
                        </Text>
                    </Pressable>
                }
            >
                {/* Timer display — visible at peek and full */}
                <View style={styles.timerRow}>
                    {flightComplete && !timerRunning ? (
                        <Text style={styles.landedText}>✈️  Landed!</Text>
                    ) : (
                        <Text style={styles.timerDigits}>
                            {displayMs !== null ? formatTime(displayMs) : '--:--'}
                        </Text>
                    )}
                </View>

                {/* Camera mode label — visible at peek snap */}
                <View style={styles.modeIndicatorStrip}>
                    <Text style={[styles.modeIndicatorText, { color: colors.textMuted }]}>
                        {MODE_LABEL[cameraMode]}{isGlobe ? ' · 🌍' : ''}
                    </Text>
                </View>

                {/* Airport pickers + flight info — fade in as sheet opens toward full */}
                <Animated.View style={pickerAnimatedStyle}>
                    <View style={styles.pickerRow}>
                        <AirportPicker
                            label="From"
                            airports={AIRPORTS}
                            selected={origin}
                            onSelect={setOrigin}
                        />
                        <View style={styles.arrowSpacer}>
                            <Text style={styles.arrow}>→</Text>
                        </View>
                        <AirportPicker
                            label="To"
                            airports={AIRPORTS}
                            selected={destination}
                            onSelect={setDestination}
                        />
                    </View>

                    {flightData && (
                        <View style={styles.flightInfo}>
                            <Text style={[styles.flightInfoText, { color: colors.textMuted }]}>
                                {Math.round(flightData.distanceKm).toLocaleString()} km
                                {'  ·  '}
                                {formatFlightDuration(flightData.totalSeconds)} focus
                            </Text>
                        </View>
                    )}
                </Animated.View>

                {/* Controls — visible when sheet is expanded */}
                <View style={styles.controls}>
                    {!timerRunning && !paused && (
                        <Pressable
                            style={[styles.primaryButton, !flightData && styles.disabledButton]}
                            onPress={handleStart}
                            disabled={!flightData}
                        >
                            <Text style={styles.primaryButtonText}>✈️  Start Flight</Text>
                        </Pressable>
                    )}
                    {timerRunning && !paused && (
                        <View style={styles.buttonRow}>
                            <Pressable style={styles.secondaryButton} onPress={handlePause}>
                                <Text style={styles.secondaryButtonText}>Pause</Text>
                            </Pressable>
                            <Pressable style={styles.ghostButton} onPress={handleReset}>
                                <Text style={[styles.ghostButtonText, { color: colors.text }]}>Reset</Text>
                            </Pressable>
                        </View>
                    )}
                    {paused && (
                        <View style={styles.buttonRow}>
                            <Pressable style={styles.primaryButton} onPress={handleResume}>
                                <Text style={styles.primaryButtonText}>Resume</Text>
                            </Pressable>
                            <Pressable style={styles.ghostButton} onPress={handleReset}>
                                <Text style={[styles.ghostButtonText, { color: colors.text }]}>Reset</Text>
                            </Pressable>
                        </View>
                    )}
                </View>
            </FlySheet>

            {/* ── Love note — shown after landing if enabled ───────────────── */}
            {landingLoveNote && (
                <LoveNoteCard
                    note={landingLoveNote}
                    onDismiss={() => setLandingLoveNote(null)}
                />
            )}
        </View>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    // Airplane marker wrapper (Reanimated rotation applied here)
    airplane: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Map tap hint banner — portrait position driven by mapHintAnimatedStyle; landscape uses inline overrides
    mapHint: {
        position: 'absolute',
        alignSelf: 'center',
        backgroundColor: ValentineSpec.accentPrimary + 'CC',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 7,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
    mapHintText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
    },
    pickerRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 12,
    },
    arrowSpacer: {
        paddingHorizontal: 6,
        paddingBottom: 10,
    },
    arrow: {
        fontSize: 18,
        color: ValentineSpec.accentPrimary,
        fontWeight: '700',
    },
    flightInfo: {
        alignItems: 'center',
        marginBottom: 8,
    },
    // color supplied inline (dark mode adaptive via colors.textMuted)
    flightInfoText: {
        fontSize: 13,
        fontWeight: '500',
    },
    timerRow: {
        alignItems: 'center',
        marginBottom: 16,
    },
    timerDigits: {
        fontSize: 52,
        fontWeight: '800',
        color: ValentineSpec.textPrimary,
        letterSpacing: 2,
        fontVariant: ['tabular-nums'],
    },
    landedText: {
        fontSize: 36,
        fontWeight: '800',
        color: ValentineSpec.accentPrimary,
        letterSpacing: 1,
        marginBottom: 16,
    },
    modeIndicatorStrip: {
        alignItems: 'center',
        marginBottom: 8,
    },
    modeIndicatorText: {
        fontSize: 12,
        fontWeight: '500',
        textTransform: 'capitalize',
        letterSpacing: 0.5,
    },
    controls: {
        alignItems: 'center',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    primaryButton: {
        backgroundColor: ValentineSpec.accentPrimary,
        borderRadius: 999,
        paddingHorizontal: 40,
        paddingVertical: 14,
    },
    disabledButton: {
        opacity: 0.4,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryButton: {
        backgroundColor: ValentineSpec.accentPrimary,
        borderRadius: 999,
        paddingHorizontal: 28,
        paddingVertical: 12,
    },
    secondaryButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    ghostButton: {
        borderRadius: 999,
        borderWidth: 1.5,
        borderColor: ValentineSpec.accentPrimary + '60',
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    // color supplied inline (dark mode adaptive via colors.text)
    ghostButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
    // ── Map overlay control buttons (compass + view mode) ──────────────────
    mapControls: {
        position: 'absolute',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 5,
        // top and right are set via mapControlsAnimatedStyle + inline insets
    },
    // backgroundColor + borderColor supplied inline (dark mode adaptive)
    mapControlBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.18,
        shadowRadius: 4,
        elevation: 4,
        borderWidth: 1,
    },
    mapControlBtnGap: {
        marginTop: 8,
    },
    mapControlIcon: {
        fontSize: 20,
    },
    globeToggle: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 14,
        borderWidth: 1,
    },
    globeToggleText: {
        fontSize: 12,
        fontWeight: '600',
    },
    // ── Airport dot markers (zoom-based visibility) ────────────────────────
    airportDot: {
        borderRadius: 999,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.7)',
    },
    airportDotTier1: {
        width: 11,
        height: 11,
        backgroundColor: ValentineSpec.accentPrimary,
        borderColor: '#FFFFFF',
        borderWidth: 2,
    },
    airportDotTier2: {
        width: 8,
        height: 8,
        backgroundColor: ValentineSpec.accentPrimary + 'BB',
        borderColor: 'rgba(255,255,255,0.8)',
    },
    airportDotTier3: {
        width: 6,
        height: 6,
        backgroundColor: ValentineSpec.accentPrimary + '77',
        borderColor: 'rgba(255,255,255,0.6)',
        borderWidth: 1,
    },
});
