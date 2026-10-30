import { LazyTab } from '../../src/components/LazyTab';
import LoveNotesScreen from '../../src/screens/LoveNotesScreen';

export default function NotesRoute() {
  return (
    <LazyTab name="notes">
      <LoveNotesScreen />
    </LazyTab>
  );
}
