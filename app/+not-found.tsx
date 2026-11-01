import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { t } from '../src/i18n';
import { useTheme } from '../src/theme/useTheme';

// Any path that matches no route (Phase 1 B6; was src/navigation/screens/NotFound.tsx).
export default function NotFound() {
  const { tokens } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: tokens.page }]}>
      <Text style={{ color: tokens.ink }}>404</Text>
      <Link href="/" style={{ color: tokens.primaryInk }}>
        {t('notFound.home')}
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
});
