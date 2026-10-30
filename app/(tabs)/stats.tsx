import { FreezeOnBlur } from '../../src/components/FreezeOnBlur';
import StatsScreen from '../../src/screens/StatsScreen';

export default function StatsRoute() {
  return (
    <FreezeOnBlur>
      <StatsScreen />
    </FreezeOnBlur>
  );
}
