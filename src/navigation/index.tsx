import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStaticNavigation, StaticParamList } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';

import TimerScreen from '../screens/TimerScreen';
import StatsScreen from '../screens/StatsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LoveNotesScreen from '../screens/LoveNotesScreen';
import { NotFound } from './screens/NotFound';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';

const HomeTabs = createBottomTabNavigator({
  screens: {
    Timer: {
      screen: TimerScreen,
      options: {
        title: 'Timer',
        headerShown: false,
        tabBarIcon: ({ color }) => <IconSymbol size={28} name="heart.fill" color={color} />,
      },
    },
    Stats: {
      screen: StatsScreen,
      options: {
        title: 'Stats',
        headerShown: false,
        tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
      },
    },
    Settings: {
      screen: SettingsScreen,
      options: {
        title: 'Settings',
        headerShown: false,
        tabBarIcon: ({ color }) => <IconSymbol size={28} name="gearshape.fill" color={color} />,
      },
    },
    LoveNotes: {
      screen: LoveNotesScreen,
      options: {
        title: 'Notes',
        headerShown: false,
        tabBarIcon: ({ color }) => <IconSymbol size={28} name="heart.text.square.fill" color={color} />,
      },
    },
  },
  screenOptions: {
    headerShown: false,
    tabBarButton: HapticTab,
    tabBarBackground: TabBarBackground,
    tabBarStyle: Platform.select({
      ios: {
        // Use a transparent background on iOS to show the blur effect
        position: 'absolute' as const,
      },
      default: {},
    }),
  },
});

const RootStack = createNativeStackNavigator({
  screens: {
    HomeTabs: {
      screen: HomeTabs,
      options: {
        headerShown: false,
      },
    },
    NotFound: {
      screen: NotFound,
      options: {
        title: '404',
      },
      linking: {
        path: '*',
      },
    },
  },
});

export const Navigation = createStaticNavigation(RootStack);

type RootStackParamList = StaticParamList<typeof RootStack>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList { }
  }
}
