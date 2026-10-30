import { LazyTab } from '../../src/components/LazyTab';
import StatsScreen from '../../src/screens/StatsScreen';

export default function StatsRoute() {
  return (
    <LazyTab name="stats">
      <StatsScreen />
    </LazyTab>
  );
}
