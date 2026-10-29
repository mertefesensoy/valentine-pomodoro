/**
 * The 20 default love notes v1.3.1 shows when an install has no `love_notes`
 * key, frozen for the storage migration (Phase 1 task B2).
 *
 * D2 replaces DEFAULT_LOVE_NOTES with name-free notes for fresh installs. An
 * existing install that never edited its notes has no `love_notes` key, so it
 * would silently switch to the new set; the migrator writes *these* for it
 * instead, so Bengisu's install, and every other existing one, keeps its notes.
 *
 * Copied from the A3 fixture (src/__fixtures__/storage/v131.ts), which was
 * extracted from release/ios-1.3.0:src/constants/defaults.ts. A test asserts the
 * two stay equal. Never edit this list.
 */
export const V131_DEFAULT_LOVE_NOTES: readonly string[] = Object.freeze([
    "Bengisu, tiny focus — big love 💗",
    "I'm proud of you — truly.",
    "One pomodoro closer to your dreams",
    "Breathe in… breathe out… you've got this",
    "Focus now, hugs later 🫶",
    "Your effort is the cutest thing",
    "Gentle focus, strong heart 💗",
    "Small steps, big heart 💘",
    "May your focus be cozy and your breaks sweet",
    "Keep going, you're unstoppable",
    "I believe in you, always",
    "Every session brings you closer",
    "You make hard work look easy",
    "Pomodoro by pomodoro, you're shining",
    "Rest well, you've earned it 💗",
    "Your dedication is beautiful",
    "You're amazing, Bengisu",
    "You've got this 🌸",
    "Tiny victories, infinite love",
    "Break time = self-care time 💕",
]);
