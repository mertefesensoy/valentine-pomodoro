import { LazyTab } from '../../src/components/LazyTab';
import SettingsScreen from '../../src/screens/SettingsScreen';

export default function SettingsRoute() {
  return (
    <LazyTab name="settings">
      <SettingsScreen />
    </LazyTab>
  );
}
