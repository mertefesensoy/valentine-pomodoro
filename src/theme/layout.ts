/**
 * The Sticker Diary's layout scale (Phase 1 D1). DESIGN.md fixes the radii (8 / 14 / 22 / pill) and
 * left the spacing scale "to be resolved during implementation": it resolves here, on a 4 pt base.
 */
export const space = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 } as const;

/** 8 for small controls and chips, 14 for fields and list groups, 22 for sheets and large paper fields. */
export const radius = { s: 8, m: 14, l: 22, pill: 999 } as const;

/** The crisp paper edge (DESIGN.md › Shapes): one hairline-plus weight everywhere. */
export const edgeWidth = 1.5;

/** Touch targets (NFR-A11Y-002): at least 44 × 44 pt on iOS. */
export const minTarget = 44;
