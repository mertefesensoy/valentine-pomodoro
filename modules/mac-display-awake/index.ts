import { requireOptionalNativeModule } from 'expo';

// The JavaScript side of the local module MacDisplayAwake (1.5.2): keeps a
// Mac's display on while a session runs, for the iPhone and iPad app on a Mac.
// The native side does nothing unless ProcessInfo.isiOSAppOnMac is true, so
// these calls are safe on every iPhone and iPad. Where the module isn't linked
// (Android, the web, Jest) they do nothing at all.
// Record: docs/implementations/2026-11-15-v152-mac.md.

type MacDisplayAwakeNative = {
    hold(): void;
    release(): void;
};

const native = requireOptionalNativeModule<MacDisplayAwakeNative>('MacDisplayAwake');

/** A session wants the display on. Idempotent. */
export function holdMacDisplay(): void {
    native?.hold();
}

/** No session wants it any more. Idempotent. */
export function releaseMacDisplay(): void {
    native?.release();
}
