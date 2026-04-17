import { useWindowDimensions } from 'react-native';

export interface ResponsiveInfo {
  width: number;
  height: number;
  isLandscape: boolean;
  isTablet: boolean;
  isShortViewport: boolean;
}

// isTablet uses the device's narrow dimension so it doesn't flip when rotating.
// A phone rotated to landscape stays a phone; a 7" tablet stays a tablet.
const TABLET_MIN_NARROW = 600;
const SHORT_VIEWPORT_MAX = 500;

export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();
  return {
    width,
    height,
    isLandscape: width > height,
    isTablet: Math.min(width, height) >= TABLET_MIN_NARROW,
    isShortViewport: height < SHORT_VIEWPORT_MAX,
  };
}
