import { FreezeOnBlur } from '../../src/components/FreezeOnBlur';
import LoveNotesScreen from '../../src/screens/LoveNotesScreen';

export default function NotesRoute() {
  return (
    <FreezeOnBlur>
      <LoveNotesScreen />
    </FreezeOnBlur>
  );
}
