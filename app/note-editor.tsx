import { NoteEditor } from '../src/screens/notes/NoteEditor';

// `/note-editor`: a love note to write or edit, as a native form sheet at the large detent
// (D2 Notes contract). The Notes tab opens it with `?index=` for an existing note, or without
// for a new one.
export default function NoteEditorRoute() {
  return <NoteEditor />;
}
