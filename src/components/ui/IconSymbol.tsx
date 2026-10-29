// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

/**
 * SF Symbol → Material Icon for every symbol the app renders.
 * Only names listed here type-check, so a new icon on iOS fails the build until
 * it has an Android/web counterpart (a cast here once hid four missing tab icons).
 * - Material Icons: https://icons.expo.fyi
 * - SF Symbols: the SF Symbols app
 */
const MAPPING = {
  'heart.fill': 'favorite',
  'chart.bar.fill': 'bar-chart',
  'gearshape.fill': 'settings',
  'heart.text.square.fill': 'sticky-note-2',
} as const satisfies Record<string, MaterialIconName>;

export type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
