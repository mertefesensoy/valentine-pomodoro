/**
 * True for a plain JSON object: not null, not an array, not a primitive.
 *
 * The stores hydrate during StoreGate's render (Phase 1 B3), so a stored value
 * of the wrong type must fall back to the defaults instead of throwing there.
 * Before B3 the same throw happened inside an async load, where it was only an
 * unhandled rejection; during render it would stop the app from starting.
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
