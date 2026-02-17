/**
 * Theme Color Tokens
 * Light and Dark theme definitions for Valentine Pomodoro
 */

export const LightTheme = {
    bg: '#FFF8F0',           // Warm cream background
    card: '#FFFFFF',         // White cards
    text: '#2D2D2D',         // Dark gray text
    textMuted: '#6B6B6B',    // Muted gray
    accent: '#E63946',       // Valentine red
    accentLight: '#FFB3BA',  // Light pink
    accentPurple: '#D4A5D9', // Lavender
    border: '#E0E0E0',       // Light border
    inputBg: '#FFFFFF',      // Input background (distinct from cards)
    surfaceTint: '#FFE8EC',  // Very light pink surface (skip button, segments)
    gradientA: ['#f3e8ff', '#d8b4fe', '#c4b5fd'] as const, // lilac → lavender → periwinkle
    gradientB: ['#ede9fe', '#c7d2fe', '#e9d5ff'] as const, // soft violet variation

    // NEW: vibrant variants (still pastel, but more alive)
    gradientA2: ['#f5d0fe', '#a78bfa', '#ddd6fe'] as const,
    gradientB2: ['#e9d5ff', '#c084fc', '#fbcfe8'] as const,
};

export const DarkTheme = {
    bg: '#1A1A1A',           // Dark background
    card: '#2D2D2D',         // Dark gray cards
    text: '#F5F5F5',         // Light text
    textMuted: '#A0A0A0',    // Muted light gray
    accent: '#FF6B7A',       // Softer red for dark mode
    accentLight: '#FF9AA2',  // Softer pink
    accentPurple: '#C197D2', // Softer lavender
    border: '#404040',       // Dark border
    inputBg: '#3A3A3A',      // Darker input background (distinct from cards)
    surfaceTint: '#2A2A2A',  // Dark tinted surface
    gradientA: ['#1b0b2e', '#5b21b6', '#c4b5fd'] as const, // deep violet → purple → lilac
    gradientB: ['#2e1065', '#7c3aed', '#e9d5ff'] as const, // richer "aurora" layer

    // NEW: richer neon-ish aurora (dark-friendly)
    gradientA2: ['#120726', '#8b5cf6', '#f5d0fe'] as const,
    gradientB2: ['#1f1147', '#a855f7', '#ddd6fe'] as const,
};

// Type helper to widen readonly tuples while preserving structure
type WidenGradients<T> = T extends readonly [infer A, infer B, infer C]
    ? readonly [A, B, C]
    : T;

export type ThemeColors = {
    bg: string;
    card: string;
    text: string;
    textMuted: string;
    accent: string;
    accentLight: string;
    accentPurple: string;
    border: string;
    inputBg: string;
    surfaceTint: string;
    gradientA: readonly [string, string, string];
    gradientB: readonly [string, string, string];
    gradientA2: readonly [string, string, string];
    gradientB2: readonly [string, string, string];
};
