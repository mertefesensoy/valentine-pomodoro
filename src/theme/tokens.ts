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
};

export type ThemeColors = typeof LightTheme;
