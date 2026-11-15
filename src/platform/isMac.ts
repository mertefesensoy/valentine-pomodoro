import * as Device from 'expo-device';
import { Platform } from 'react-native';

/**
 * True only when the iPhone and iPad app runs on a Mac with Apple silicon
 * ("Designed for iPad", 1.5.2). expo-device reports `DESKTOP` exactly when
 * `ProcessInfo.isiOSAppOnMac` is true (expo-device's DeviceModule.swift), so
 * this is false on every iPhone and iPad, on Android and on the web.
 *
 * - **Inputs:** the platform, and expo-device's device type.
 * - **Output:** a boolean.
 * - **Side effects:** none.
 * - **Invariant:** it doesn't change while the app runs, so a tree that
 *   branches on it never remounts.
 *
 * Apple asks for this check to be a last resort: only the Mac banner reads it
 * (record: docs/implementations/2026-11-15-v152-mac.md).
 */
export function detectMac(platformOS: string, deviceType: Device.DeviceType | null): boolean {
    return platformOS === 'ios' && deviceType === Device.DeviceType.DESKTOP;
}

/** Read once, at start-up. */
export const IS_MAC: boolean = detectMac(Platform.OS, Device.deviceType);
