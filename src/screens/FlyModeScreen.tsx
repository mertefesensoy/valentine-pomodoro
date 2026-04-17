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
 *     • `useSharedValue` holds the progress (0→1)
 *     • `useAnimatedReaction` watches for changes and calls runOnJS to update
 *       React state (marker coordinate + bearing) ~once per second
 *     • The airplane ROTATION uses `useAnimatedStyle` — fully 60fps on UI thread
 * - Timer is driven by a fixed `targetEndTime` UNIX timestamp so backgrounding
 *   the app has zero effect on accuracy
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    View, Text, Pressable, StyleSheet, AppState, AppStateStatus, Platform,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, MapType, Camera, Region } from 'react-native-maps';
import Animated, {
    useSharedValue, useAnimatedStyle, withTiming,
    useAnimatedReaction, runOnJS, cancelAnimation,
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
} from '../utils/geoMath';
import airportData from '../assets/data/airports.json';
import { formatTime } from '../utils/time';
import { save, load, STORAGE_KEYS } from '../utils/storage';
import { useFlyModeAudio } from '../hooks/useFlyModeAudio';
import { useApp } from '../context/AppContext';
import { AdManager } from '../ads/AdManager';
import { AdPolicy } from '../ads/AdPolicy';
import { useNotifications } from '../hooks/useNotifications';
import LoveNoteCard from '../components/LoveNoteCard';
import * as Haptics from 'expo-haptics';

// ─── Airport data ────────────────────────────────────────────────────────────

type AirportRecord = {
    name: string;
    city: string;
    country: string;
    coordinates: { latitude: number; longitude: number };
    /** 1 = large, 2 = medium — used for zoom-based marker visibility */
    tier?: number;
};

/** Persisted to AsyncStorage when the user switches modes mid-flight.
 *  Restored when FlyModeScreen remounts so the session can be resumed. */
type FlySessionSave = {
    originIata: string;
    destinationIata: string;
    remainingMs: number;
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

// ─── View mode ───────────────────────────────────────────────────────────────

type ViewMode = 'overview' | 'chase' | 'route';

const VIEW_MODE_CYCLE: ViewMode[] = ['overview', 'chase', 'route'];
const VIEW_MODE_ICONS: Record<ViewMode, string> = {
    overview: '🗺',
    chase: '✈️',
    route: '🛣',
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function FlyModeScreen() {
    const { width, height, isLandscape } = useResponsive();
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();

    // Sheet animation state — sheetProgress 0=peek, 1=full
    const sheetProgress = useSharedValue(1);
    const flySheetRef = useRef<FlySheetRef>(null);
    const { settings, stats, loveNotes } = useApp();
    const { scheduleSessionEnd, cancelScheduled } = useNotifications();

    // Tracks the scheduled "flight landed" notification so we can cancel it on reset/pause
    const notifIdRef = useRef<string | null>(null);

    // Unmount guard — prevents state updates firing after FlyModeScreen unmounts
    const isMountedRef = useRef(true);
    useEffect(() => { return () => { isMountedRef.current = false; }; }, []);

    // Snapshot ref — always holds the latest reactive values so the
    // save-on-unmount cleanup effect can read them without stale closures.
    const snapshotRef = useRef<{
        timerRunning: boolean;
        paused: boolean;
        origin: Airport | null;
        destination: Airport | null;
    }>({ timerRunning: false, paused: false, origin: null, destination: null });

    // Populated on mount when a saved session is restored; consumed once
    // flightData becomes available to reposition the plane at the correct point.
    const restoredRemainingRef = useRef<number | null>(null);

    // Heading update throttle — live compass during map rotation (10fps max)
    const headingThrottleRef = useRef(0);

    // User pan interaction flag — suppresses camera following for 4s after pan
    const userInteractingRef = useRef(false);
    const interactionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Airport selection
    const [origin, setOrigin] = useState<Airport | null>(null);
    const [destination, setDestination] = useState<Airport | null>(null);

    // Map view state
    const [isGlobe, setIsGlobe] = useState(false);
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

    // Timer state
    const [timerRunning, setTimerRunning] = useState(false);
    const [remainingMs, setRemainingMs] = useState<number | null>(null);

    // Ad state
    const [isAdPending, setIsAdPending] = useState(false);
    const [flightComplete, setFlightComplete] = useState(false);

    // Love note shown after landing (null = hidden)
    const [landingLoveNote, setLandingLoveNote] = useState<string | null>(null);
    const lastLoveNoteRef = useRef<string | null>(null);

    // Map overlay state
    const [mapHeading, setMapHeading] = useState(0);
    const [viewMode, setViewMode] = useState<ViewMode>('overview');

    // Ref so async handleFlightComplete can read flightData without deps
    const flightDataRef = useRef(flightData);
    useEffect(() => { flightDataRef.current = flightData; }, [flightData]);

    // Keep snapshot in sync so the unmount cleanup always reads fresh values
    useEffect(() => {
        snapshotRef.current = { timerRunning, paused, origin, destination };
    }, [timerRunning, paused, origin, destination]);

    // ── Restore saved session on mount ─────────────────────────────────────
    // Runs once. If a mid-flight session was saved (mode switch while active),
    // pre-load the airports, mark as paused, and store remaining time.
    // After flightData is computed (below), the plane is repositioned correctly.
    useEffect(() => {
        load<FlySessionSave | null>(STORAGE_KEYS.FLY_SESSION, null).then(saved => {
            if (!saved || saved.remainingMs <= 0) return;
            const orig = AIRPORTS.find(a => a.iata === saved.originIata);
            const dest = AIRPORTS.find(a => a.iata === saved.destinationIata);
            if (!orig || !dest) return;

            setOrigin(orig);
            setDestination(dest);
            setPaused(true);
            pausedRemainingRef.current = saved.remainingMs;
            setRemainingMs(saved.remainingMs);
            restoredRemainingRef.current = saved.remainingMs; // triggers position restore

            save(STORAGE_KEYS.FLY_SESSION, null).catch(() => {}); // clear immediately
        });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Marker + bearing restore after flightData is computed ──────────────
    // When a session is restored, flightData isn't available yet on mount.
    // This effect fires once flightData is ready and positions the plane at
    // the exact saved progress point with the correct bearing.
    // This also fixes Issue 1: the nose always faces the right direction
    // when chase view is opened on a restored session.
    useEffect(() => {
        if (!flightData || restoredRemainingRef.current === null) return;

        const wps = flightData.waypoints;
        const totalMs = flightData.totalSeconds * 1000;
        const progress = Math.max(0, Math.min(1, 1 - (restoredRemainingRef.current / totalMs)));

        waypointsRef.current = wps;
        progressSV.value = progress;

        if (wps.length >= 2) {
            const exactIdx = Math.min(progress * (wps.length - 1), wps.length - 1);
            const lowerIdx = Math.min(Math.floor(exactIdx), wps.length - 2);
            const upperIdx = lowerIdx + 1;
            const fraction = exactIdx - lowerIdx;
            let lonDiff = wps[upperIdx].longitude - wps[lowerIdx].longitude;
            if (lonDiff > 180)  lonDiff -= 360;
            if (lonDiff < -180) lonDiff += 360;
            setMarkerCoord({
                latitude:  wps[lowerIdx].latitude  + fraction * (wps[upperIdx].latitude  - wps[lowerIdx].latitude),
                longitude: wps[lowerIdx].longitude + fraction * lonDiff,
            });
            setBearingDeg(calculateBearing(wps[lowerIdx], wps[upperIdx]));
        }

        restoredRemainingRef.current = null; // consumed — won't run again
    }, [flightData, progressSV]);

    const targetEndTimeRef = useRef<number>(0);
    const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Reanimated progress (0 = origin, 1 = destination)
    const progressSV = useSharedValue(0);

    // Marker state (updated via runOnJS from Reanimated reaction)
    const [markerCoord, setMarkerCoord] = useState<LatLng | null>(null);
    const [bearingDeg, setBearingDeg] = useState(0);

    // Bearing — snaps instantly (at 10fps updates, 600ms smoothing caused
    // the plane SVG to visually lag behind the map heading in chase mode).
    const bearingSV = useSharedValue(0);
    useEffect(() => {
        bearingSV.value = bearingDeg;
    }, [bearingDeg, bearingSV]);

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

    // ── Animated reaction: progress → marker coordinate (JS thread via runOnJS)
    const waypointsRef = useRef<LatLng[]>([]);
    useEffect(() => {
        waypointsRef.current = flightData?.waypoints ?? [];
    }, [flightData]);

    const updateMarkerFromProgress = useCallback((progress: number) => {
        // Guard: do not update state on an unmounted component
        if (!isMountedRef.current) return;

        const wps = waypointsRef.current;
        if (wps.length < 2) return;

        // Sub-waypoint linear interpolation — exactIdx is fractional (e.g. 42.7)
        // so the marker position is always precisely correct between waypoints,
        // giving continuous movement rather than discrete jumps every ~24 s.
        const exactIdx = Math.min(progress * (wps.length - 1), wps.length - 1);
        const lowerIdx = Math.min(Math.floor(exactIdx), wps.length - 2);
        const upperIdx = lowerIdx + 1;
        const fraction = exactIdx - lowerIdx; // 0.0 → 1.0 between adjacent waypoints

        // Normalise longitude difference to the short path across ±180°.
        // Without this, Pacific routes (e.g. SYD→LAX) briefly teleport the
        // marker to the prime meridian when interpolating lon=+179 → lon=-179.
        let lonDiff = wps[upperIdx].longitude - wps[lowerIdx].longitude;
        if (lonDiff > 180) lonDiff -= 360;
        if (lonDiff < -180) lonDiff += 360;

        setMarkerCoord({
            latitude:  wps[lowerIdx].latitude  + fraction * (wps[upperIdx].latitude  - wps[lowerIdx].latitude),
            longitude: wps[lowerIdx].longitude + fraction * lonDiff,
        });
        setBearingDeg(calculateBearing(wps[lowerIdx], wps[upperIdx]));
    }, []);

    // Throttle to ~10fps: only call runOnJS every 6th Reanimated frame.
    // withTiming fires at ~60fps; 60 bridge calls/sec is unnecessary for a map marker.
    const frameCountSV = useSharedValue(0);
    useAnimatedReaction(
        () => progressSV.value,
        (progress) => {
            frameCountSV.value = (frameCountSV.value + 1) % 6; // every 6th frame ≈ 10fps
            if (frameCountSV.value === 0) {
                runOnJS(updateMarkerFromProgress)(progress);
            }
        },
    );

    // ── Flight completion: haptic + stats + love note + ad
    const handleFlightComplete = useCallback(async () => {
        setFlightComplete(true);
        notifIdRef.current = null; // notification already fired (or flight ended in foreground)
        // Clear saved session — flight completed naturally, not paused mid-way
        save(STORAGE_KEYS.FLY_SESSION, null).catch(() => {});

        // Impact haptic on landing (respects user setting)
        if (settings.settings.haptics) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }

        // Record focus minutes into the shared stats pool (same as Pomodoro sessions)
        const minutes = Math.round((flightDataRef.current?.totalSeconds ?? 0) / 60);
        if (minutes > 0) {
            stats.incrementFocus(minutes);
        }

        // Show a love note after landing (same pattern as Pomodoro)
        if (settings.settings.showLoveNotes) {
            const note = loveNotes.pickRandomNote(lastLoveNoteRef.current);
            lastLoveNoteRef.current = note;
            setLandingLoveNote(note);
        }

        await AdPolicy.recordSessionCompletion();
        if (AdPolicy.shouldShowAd()) {
            setIsAdPending(true);
        }
    }, [stats, loveNotes, settings.settings.haptics]);

    // ── Ticker: updates remaining time and Reanimated progress
    const startTick = useCallback((totalMs: number) => {
        if (tickRef.current) clearInterval(tickRef.current);
        tickRef.current = setInterval(() => {
            const now = Date.now();
            const remaining = Math.max(0, targetEndTimeRef.current - now);
            setRemainingMs(remaining);
            const elapsed = totalMs - remaining;
            progressSV.value = withTiming(
                Math.min(elapsed / totalMs, 1),
                { duration: 950 }
            );
            if (remaining === 0) {
                if (tickRef.current) clearInterval(tickRef.current);
                setTimerRunning(false);
                void handleFlightComplete();
            }
        }, 1000);
    }, [progressSV, handleFlightComplete]);

    // ── Start
    const handleStart = useCallback(() => {
        if (!flightData) return;
        // Clear any stale pause/restore state so this is always a fresh flight.
        pausedRemainingRef.current = 0;
        restoredRemainingRef.current = null;
        setPaused(false);
        const totalMs = flightData.totalSeconds * 1000;
        const endAt = Date.now() + totalMs;
        targetEndTimeRef.current = endAt;
        setRemainingMs(totalMs);
        setFlightComplete(false);
        progressSV.value = 0;
        setMarkerCoord(flightData.waypoints[0]);
        setBearingDeg(
            flightData.waypoints.length > 1
                ? calculateBearing(flightData.waypoints[0], flightData.waypoints[1])
                : 0
        );
        setTimerRunning(true);
        startTick(totalMs);

        // Schedule a "Landed!" push notification for when the flight completes —
        // this fires even if the app is backgrounded.
        if (settings.settings.notifications) {
            scheduleSessionEnd(endAt, '✈️ Landed!', 'Your flight focus session is complete 💗').then(id => {
                notifIdRef.current = id;
            });
        }
    }, [flightData, progressSV, startTick, scheduleSessionEnd, settings.settings.notifications]);

    // ── Pause / Resume
    const pausedRemainingRef = useRef<number>(0);
    const [paused, setPaused] = useState(false);

    const handlePause = useCallback(() => {
        if (tickRef.current) clearInterval(tickRef.current);
        pausedRemainingRef.current = Math.max(0, targetEndTimeRef.current - Date.now());
        setPaused(true);
        // Cancel the landing notification while paused (timing is now wrong)
        cancelScheduled(notifIdRef.current).then(() => { notifIdRef.current = null; });
    }, [cancelScheduled]);

    const handleResume = useCallback(() => {
        if (!flightData) return;
        const totalMs = flightData.totalSeconds * 1000;
        const endAt = Date.now() + pausedRemainingRef.current;
        targetEndTimeRef.current = endAt;
        setPaused(false);
        setTimerRunning(true);
        startTick(totalMs);
        // Reschedule the notification with the new end time
        if (settings.settings.notifications) {
            scheduleSessionEnd(endAt, '✈️ Landed!', 'Your flight focus session is complete 💗').then(id => {
                notifIdRef.current = id;
            });
        }
    }, [flightData, startTick, scheduleSessionEnd, settings.settings.notifications]);

    // ── Reset
    const handleReset = useCallback(() => {
        if (tickRef.current) clearInterval(tickRef.current);
        waypointsRef.current = []; // clear first — prevents stale reaction re-setting marker
        setTimerRunning(false);
        setPaused(false);
        setRemainingMs(null);
        setMarkerCoord(null);
        setFlightComplete(false);
        setIsAdPending(false);
        setLandingLoveNote(null);
        setViewMode('overview');
        progressSV.value = 0;
        restoredRemainingRef.current = null; // discard any pending restore
        // Clear saved session — user explicitly abandoned the flight
        save(STORAGE_KEYS.FLY_SESSION, null).catch(() => {});
        // Cancel any pending landing notification
        cancelScheduled(notifIdRef.current).then(() => { notifIdRef.current = null; });
    }, [progressSV, cancelScheduled]);

    // ── Pan gesture: sets a flag that suppresses camera following for 4 s.
    // This allows the user to freely explore the map during chase/route modes
    // without the camera snapping back every 100ms.
    const handlePanDrag = useCallback(() => {
        userInteractingRef.current = true;
        if (interactionTimerRef.current) clearTimeout(interactionTimerRef.current);
        interactionTimerRef.current = setTimeout(() => {
            userInteractingRef.current = false;
        }, 4000);
    }, []);

    // ── Compass: snap map heading to north
    const handleNorthUp = useCallback(() => {
        mapRef.current?.animateCamera({ heading: 0 }, { duration: 400 });
        setMapHeading(0);
    }, []);

    // ── View mode: cycle overview → chase → route → overview
    const cycleViewMode = useCallback(() => {
        setViewMode((prev) => {
            const idx = VIEW_MODE_CYCLE.indexOf(prev);
            return VIEW_MODE_CYCLE[(idx + 1) % VIEW_MODE_CYCLE.length];
        });
    }, []);

    // ── AppState background sync
    // When the app returns to foreground, remainingMs recalculates from
    // targetEndTime so the timer (and airplane position) snap to the correct
    // position instantly — no drift possible.
    // If the flight completed while backgrounded, handleFlightComplete fires here
    // so stats, haptics, love note, and ad are never missed.
    useEffect(() => {
        const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
            if (state === 'active' && timerRunning && !paused && flightData) {
                const totalMs = flightData.totalSeconds * 1000;
                const remaining = Math.max(0, targetEndTimeRef.current - Date.now());
                setRemainingMs(remaining);
                const elapsed = totalMs - remaining;
                progressSV.value = Math.min(elapsed / totalMs, 1);
                if (remaining === 0) {
                    if (tickRef.current) clearInterval(tickRef.current);
                    setTimerRunning(false);
                    void handleFlightComplete(); // ← was missing — fires stats/haptic/ad
                }
            }
        });
        return () => sub.remove();
    }, [timerRunning, paused, flightData, progressSV, handleFlightComplete]);

    // ── View mode: 'overview' → fit full route once when mode switches
    useEffect(() => {
        if (viewMode !== 'overview') return;
        if (!flightData?.waypoints || flightData.waypoints.length < 2) return;
        const panelW = Math.min(width * 0.42, 400);
        mapRef.current?.fitToCoordinates(flightData.waypoints, {
            edgePadding: {
                top: insets.top + 60,
                right: isLandscape ? panelW + 24 : 40,
                bottom: isLandscape ? 40 : height * 0.58,
                left: 40,
            },
            animated: true,
        });
    }, [viewMode, flightData, height, insets.top]);

    // ── View mode: 'chase' / 'route' → camera follows plane
    // • Chase: instant setCamera so the plane never lags behind its heading
    // • Route: gentle 300ms animation (slower-moving overview)
    // • Skipped entirely while the user is panning (userInteractingRef guard)
    useEffect(() => {
        if (!markerCoord || viewMode === 'overview') return;
        if (userInteractingRef.current) return; // user is panning — let them explore

        const cam = {
            center: markerCoord,
            heading: bearingDeg,
            pitch: viewMode === 'chase' ? 50 : 20,
            altitude: viewMode === 'chase' ? 500_000 : 2_500_000,
        };

        if (viewMode === 'chase') {
            mapRef.current?.setCamera(cam);          // instant — no lag
            // Immediately sync mapHeading so the compass and plane-rotation formula
            // don't have to wait for the async onRegionChange → getCamera() round-trip.
            setMapHeading(bearingDeg);
        } else {
            mapRef.current?.animateCamera(cam, { duration: 300 }); // route: gentle
        }
    }, [markerCoord, viewMode, bearingDeg]);

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

    // ── Cleanup on unmount — cancel Reanimated animations so their UI-thread
    // callbacks don't fire after the component is gone (crash prevention).
    useEffect(() => {
        return () => {
            cancelAnimation(progressSV);
            cancelAnimation(bearingSV);
            if (tickRef.current) clearInterval(tickRef.current);
            if (interactionTimerRef.current) clearTimeout(interactionTimerRef.current);
        };
    }, [progressSV, bearingSV]);

    // ── Save session on unmount if flight is active ────────────────────────
    // When the user switches modes mid-flight, FlyModeScreen unmounts.
    // We save origin/destination/remainingMs so the session can be resumed
    // next time FlyModeScreen mounts (mode switch back to Fly Mode).
    // Uses snapshotRef (always current) — empty deps so this only fires on unmount.
    useEffect(() => {
        return () => {
            const { timerRunning, paused, origin, destination } = snapshotRef.current;
            if (!timerRunning && !paused) return;
            if (!origin || !destination) return;
            const remaining = paused
                ? pausedRemainingRef.current
                : Math.max(0, targetEndTimeRef.current - Date.now());
            if (remaining <= 0) return;
            save(STORAGE_KEYS.FLY_SESSION, {
                originIata: origin.iata,
                destinationIata: destination.iata,
                remainingMs: remaining,
            } as FlySessionSave).catch(() => {});
            cancelScheduled(notifIdRef.current).catch(() => {});
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Ambient sound: plays during active (running, not paused) sessions
    useFlyModeAudio(
        'flyAmbient',
        timerRunning && !paused,
        settings.settings.flyModeSound
    );

    // ── Globe camera configuration
    // altitude > 10,000,000 m is required for MapKit to render the full 3D sphere
    const globeCamera: Camera = {
        center: { latitude: 20, longitude: 0 },
        pitch: 0,
        heading: 0,
        altitude: 20_000_000,
        zoom: 1,
    };

    const mapType: MapType = isGlobe
        ? (Platform.OS === 'ios' ? 'satelliteFlyover' : 'satellite')
        : 'mutedStandard';

    const displayMs = remainingMs ?? (flightData ? flightData.totalSeconds * 1000 : null);

    // Picker row fades in from mid snap upward (progress ≈0.49 at mid)
    const pickerAnimatedStyle = useAnimatedStyle(() => ({
        opacity: interpolate(sheetProgress.value, [0.38, 0.58], [0, 1], Extrapolation.CLAMP),
        pointerEvents: sheetProgress.value > 0.45 ? 'auto' : 'none',
    } as any));

    // mapHint floats just above the top of the sheet
    const mapHintAnimatedStyle = useAnimatedStyle(() => {
        const portraitBottom = interpolate(
            sheetProgress.value, [0, 1], [height * 0.08, height * 0.57],
            Extrapolation.CLAMP,
        );
        return { bottom: portraitBottom };
    });

    // ── Map tap selection: disabled during active sessions
    const isSessionActive = timerRunning || paused;

    // ── Zoom-based airport markers ───────────────────────────────────────────
    // Shown when no session is running (both flat and globe modes).
    // Globe mode: tier-1 airports worldwide (no bounds check).
    // Flat mode: tier-threshold scales with zoom; bounded by viewport.
    // Capped at 120 to keep the bridge happy (sorted best-first before capping).
    const visibleAirportMarkers = useMemo(() => {
        if (isSessionActive) return []; // hidden during active flights

        // Globe mode: show tier-1 airports across the whole world
        if (isGlobe) {
            return AIRPORTS.filter(a => (a.tier ?? 1) === 1);
        }

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
    }, [mapRegion, isSessionActive, isGlobe]);

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
                camera={isGlobe ? globeCamera : undefined}
                initialRegion={isGlobe ? undefined : {
                    latitude: 20, longitude: 0,
                    latitudeDelta: 120, longitudeDelta: 120,
                }}
                // Live heading update during rotation gesture (throttled to ~10fps).
                // onRegionChangeComplete fires only after the gesture settles; this
                // fires continuously so the CompassRose needle rotates in real-time.
                onRegionChange={async () => {
                    const now = Date.now();
                    if (now - headingThrottleRef.current < 100) return;
                    headingThrottleRef.current = now;
                    const cam = await mapRef.current?.getCamera();
                    if (cam?.heading !== undefined) setMapHeading(cam.heading);
                }}
                // Clamp latitude (globe) + track region for airport markers + compass
                onRegionChangeComplete={async (region) => {
                    if (isGlobe) {
                        const clamped = Math.max(-85, Math.min(85, region.latitude));
                        if (clamped !== region.latitude) {
                            mapRef.current?.setCamera({
                                center: { latitude: clamped, longitude: region.longitude },
                            });
                        }
                    }
                    // Update visible region for zoom-based airport dot rendering
                    setMapRegion(region);
                    // Final heading sync after gesture settles
                    const cam = await mapRef.current?.getCamera();
                    if (cam?.heading !== undefined) setMapHeading(cam.heading);
                }}
                // Detect user pan — suppresses camera following for 4 s
                onPanDrag={handlePanDrag}
                // Map tap → nearest-airport selection (only when no session is active)
                onPress={isSessionActive ? undefined : handleMapPress}
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
                {visibleAirportMarkers.map((airport) => {
                    // Skip airports that are already selected (they have dedicated pins)
                    if (airport.iata === origin?.iata || airport.iata === destination?.iata) return null;
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
            <View
                style={[styles.mapControls, { top: insets.top + 12 }]}
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

                {/* View mode — only visible during active session */}
                {isSessionActive && markerCoord && (
                    <Pressable
                        style={[styles.mapControlBtn, styles.mapControlBtnGap, {
                            backgroundColor: isDark ? 'rgba(45,45,45,0.95)' : 'rgba(247,243,240,0.95)',
                            borderColor: `${ValentineSpec.accentPrimary}30`,
                        }]}
                        onPress={cycleViewMode}
                        accessibilityLabel={`Map view: ${viewMode}`}
                        accessibilityRole="button"
                    >
                        <Text style={styles.mapControlIcon}>{VIEW_MODE_ICONS[viewMode]}</Text>
                    </Pressable>
                )}
            </View>

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
                onTap={() => flySheetRef.current?.expandTo(isLandscape ? 'full' : 'mid')}
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
                headerControl={
                    <Pressable
                        style={[styles.globeToggle, {
                            backgroundColor: isDark
                                ? `${colors.card}CC`
                                : `${ValentineSpec.backgroundSecondary}80`,
                            borderColor: `${ValentineSpec.accentPrimary}40`,
                        }]}
                        onPress={() => setIsGlobe((v) => !v)}
                    >
                        <Text style={[styles.globeToggleText, { color: colors.text }]}>
                            {isGlobe ? '🗺 Flat' : '🌍 Globe'}
                        </Text>
                    </Pressable>
                }
            >
                {/* Airport pickers + flight info — fade out below mid snap */}
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

                {/* Timer display — always visible */}
                <View style={styles.timerRow}>
                    {flightComplete && !timerRunning ? (
                        <Text style={styles.landedText}>✈️  Landed!</Text>
                    ) : (
                        <Text style={styles.timerDigits}>
                            {displayMs !== null ? formatTime(displayMs) : '--:--'}
                        </Text>
                    )}
                </View>

                {/* Controls — always visible */}
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
    // Globe / flat toggle button — lives inside FlySheet's header control slot
    // backgroundColor + borderColor supplied inline (dark mode adaptive)
    globeToggle: {
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderWidth: 1,
    },
    // color supplied inline (dark mode adaptive)
    globeToggleText: {
        fontSize: 13,
        fontWeight: '600',
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
        right: 12,
        flexDirection: 'column',
        alignItems: 'center',
        // top is set inline via insets
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
