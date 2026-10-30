import { FreezeOnBlur } from '../../src/components/FreezeOnBlur';
import TimerScreen from '../../src/screens/TimerScreen';

// `/`: Classic, with the Fly switch.
export default function TimerRoute() {
  return (
    <FreezeOnBlur>
      <TimerScreen />
    </FreezeOnBlur>
  );
}
