import { FreezeOnBlur } from '../../src/components/FreezeOnBlur';
import SettingsScreen from '../../src/screens/SettingsScreen';

export default function SettingsRoute() {
  return (
    <FreezeOnBlur>
      <SettingsScreen />
    </FreezeOnBlur>
  );
}
