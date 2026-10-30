import { LazyTab } from '../../src/components/LazyTab';
import TimerScreen from '../../src/screens/TimerScreen';

// `/`: Classic, with the Fly switch.
export default function TimerRoute() {
  return (
    <LazyTab name="index">
      <TimerScreen />
    </LazyTab>
  );
}
