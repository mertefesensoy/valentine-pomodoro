/**
 * Theme Resolver Hook
 * Returns current theme colors based on user preference and system settings
 */

import { useColorScheme } from 'react-native';
import { useApp } from '../context/AppContext';
import { LightTheme, DarkTheme, ThemeColors } from './tokens';

export function useTheme(): { colors: ThemeColors; isDark: boolean } {
    const systemScheme = useColorScheme();
    const { settings } = useApp();
    const { themeMode } = settings.settings;

    let isDark = false;

    if (themeMode === 'dark') {
        isDark = true;
    } else if (themeMode === 'light') {
        isDark = false;
    } else {
        // 'system' - follow device preference
        isDark = systemScheme === 'dark';
    }

    return {
        colors: isDark ? DarkTheme : LightTheme,
        isDark,
    };
}
