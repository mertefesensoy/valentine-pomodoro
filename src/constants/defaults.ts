// Default settings
export const DEFAULT_SETTINGS = {
    durations: {
        focus: 25,
        shortBreak: 5,
        longBreak: 15,
    },
    longBreakEvery: 4,
    notifications: true,
    sound: true,
    haptics: true,
    showLoveNotes: true,
    themeMode: 'system' as const,
    animationsEnabled: true,
    flyModeSound: true, // Ambient cabin sound during Fly Mode sessions
    // Classic's layout (Phase 1 D1): The Ring by default, so existing installs, which have
    // no stored value, keep the Ring; the merge in settingsStore fills it in.
    classicLayout: 'ring' as const,
};

// The default love notes for a fresh install (FR-NTE-002; D2 Notes contract): 20, as in v1, with no
// personal names, in English and Turkish. Drafts for the owner's copy review. An existing install
// keeps its own notes: the storage migration writes v1.3.1's set (legacyLoveNotes.ts) for any
// install that never edited them, so these reach fresh installs only. Notes are user text, so the
// emoji check allows the few emoji here.
export const DEFAULT_LOVE_NOTES: string[] = [
    "Tiny focus, big love 💗",
    "I'm proud of you, truly.",
    "One session closer to your dreams.",
    "Breathe in, breathe out. You've got this.",
    "Focus now, hugs later 🫶",
    "Your effort is the cutest thing.",
    "Gentle focus, strong heart.",
    "Small steps still count. This one did.",
    "May your focus be cozy and your breaks sweet.",
    "Keep going, you're doing great.",
    "I believe in you, always.",
    "Every session brings you closer.",
    "Look at you, getting it done.",
    "Session by session, you're shining.",
    "Rest well, you've earned it 💗",
    "Your dedication is beautiful.",
    "Be proud of the work you just did.",
    "You've got this 🌸",
    "Tiny victories, endless love.",
    "Break time is self-care time. Enjoy it.",
];

export const DEFAULT_LOVE_NOTES_TR: string[] = [
    "Minik odak, kocaman sevgi 💗",
    "Seninle gerçekten gurur duyuyorum.",
    "Hayallerine bir oturum daha yaklaştın.",
    "Derin bir nefes al, ver. Bunu başarabilirsin.",
    "Şimdi odak, sarılmalar sonra 🫶",
    "Emeğin dünyanın en tatlı şeyi.",
    "Sakin odak, güçlü kalp.",
    "Küçük adımlar da sayılır. Bu da saydı.",
    "Odağın sıcacık, molaların tatlı olsun.",
    "Devam et, harika gidiyorsun.",
    "Sana her zaman inanıyorum.",
    "Her oturum seni biraz daha yaklaştırıyor.",
    "Şuna bak, işini bitiriyorsun.",
    "Oturum oturum parlıyorsun.",
    "İyi dinlen, bunu hak ettin 💗",
    "Kararlılığın çok güzel.",
    "Az önce yaptığın işle gurur duy.",
    "Sen bunu yaparsın 🌸",
    "Küçük zaferler, sonsuz sevgi.",
    "Mola, kendine iyi bakma zamanı. Tadını çıkar.",
];

/** The default notes in the app's language. */
export function defaultLoveNotes(language: 'en' | 'tr'): string[] {
    return language === 'tr' ? DEFAULT_LOVE_NOTES_TR : DEFAULT_LOVE_NOTES;
}

// Fallback love note (when list is empty)
export const FALLBACK_LOVE_NOTE = "Tiny focus, big love 💗";
const FALLBACK_LOVE_NOTE_TR = "Minik odak, kocaman sevgi 💗";

/** The note shown when the list is empty, in the app's language. */
export function fallbackLoveNote(language: 'en' | 'tr'): string {
    return language === 'tr' ? FALLBACK_LOVE_NOTE_TR : FALLBACK_LOVE_NOTE;
}
