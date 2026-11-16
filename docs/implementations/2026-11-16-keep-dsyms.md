# 2026-11-16 — Keep each production build's dSYMs

**Status:** Done in the repository. `eas.json` and RELEASE.md are changed, committed on the owner's "Commit, open PR, turn on auto fix, wait for the CI to go green then merge it" (2026-11-16). It takes effect from the next EAS production build, and no 1.5.x build is rebuilt. That the zip uploads is checked on that build ([§6](#6-verification)).
**Branch:** `chore/keep-dsyms`, cut from `c745569` (`master`, the merge of the crash reports audit, PR #45)

---

## 1. Problem / Motivation

[The crash reports audit](2026-11-15-crash-reports-audit.md) found that **EAS throws away every build's debug symbols.**
- Build 67's log shows fastlane's gym zipping six dSYMs into `ios/build/ValentinePomodoro.app.dSYM.zip`.
- Builds 64–67 list no build-artifacts archive, and Expo's build uploads one only when `buildArtifactPaths` is set.

So the app's own frames in any crash log from 1.5.0, 1.5.1 or 1.5.2 can never be turned back into function names and lines.

A dSYM matches only the build that made it, by UUID, so it has to be kept when the build runs.

**The owner's answer to the audit's Q1 (2026-11-16):** "Yes, from next build". 1.5.2 (build 67) isn't rebuilt for it.

## 2. What Changed

| File | Change |
|------|--------|
| `eas.json` | The production profile's `ios` section gets `"buildArtifactPaths": ["ios/build/*.dSYM.zip"]`, so EAS uploads gym's dSYM zip as the build's artifacts archive. |
| `docs/process/RELEASE.md` | After each production build: check that the build page offers the dSYM zip, download it before EAS expires it, and keep it with the release. |
| `docs/implementations/2026-11-16-keep-dsyms.md` | This record. |
| `docs/README.md` | Its index row. |

## 3. Implementation Approach

- **The option:** `buildArtifactPaths` is a common build-profile option in eas-cli's own schema (`@expo/eas-json`, `CommonBuildProfileSchema`, "artifacts"). It takes a list of paths or globs, relative to the project root, and EAS uploads the matches as one archive for the build.
- **Why the `ios` section:** the profile builds iOS only, and the glob names an iOS path, so it sits under `production.ios`. That keeps any future Android build from looking for it.
- **The path:** build 67's log has `zip -r '/Users/expo/workingdir/build/ios/build/ValentinePomodoro.app.dSYM.zip' *.dSYM`, and the project root there is `/Users/expo/workingdir/build`. The glob `ios/build/*.dSYM.zip` therefore matches that file. It still has to be seen on the first build that has it ([§6](#6-verification)).
- **Expiry:** an EAS build's files expire. The JSON `eas build` returned for build 66 had an `expirationDate` (2026-12-15) 30 days after its `createdAt` (2026-11-15). So the release step downloads the zip and keeps it with the release, not on EAS.
- **Where to keep it:** in the owner's own storage, named by version and build number, for example `ValentinePomodoro-1.5.3-68.dSYM.zip`.
  - The repository is public and its source is public too, so the symbols reveal nothing new.
  - Even so, the release step doesn't publish them. A GitHub Release attachment is left to the owner.

## 4. Mathematical / Statistical Details

None. It's a configuration change.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| From the next build | Rebuild 1.5.2 now | The owner's choice. A rebuild costs an EAS build and a repeat of the iPhone check, for one version's symbols. |
| `production.ios` only | The whole profile, or every profile | Only store builds can produce crash reports worth reading. Preview and development builds aren't released. |
| Keep the zip outside EAS | Rely on the build page | EAS expires a build's files after 30 days, and a crash can surface months later. |
| No GitHub Release attachment by default | Attach it to every release | It's the owner's call to publish anything, even from a public repository. |

## 6. Verification

- [x] `eas.json` parses, and eas-cli resolves the production profile with the new key (`eas config --platform ios --profile production --json`; §6.1).
- [ ] **On the next production build** (after 1.5.2):
  - `eas build:view <id> --json` lists a `buildArtifactsUrl`;
  - the downloaded zip holds `ValentinePomodoro.app.dSYM` and the prebuilt frameworks' dSYMs;
  - `llvm-dwarfdump --uuid` on the app's DWARF file matches the build.

  Until then, that the glob catches the file is plausible, not proven.

### 6.1 The config check (2026-11-16)

- `eas.json` parses as JSON.
- `eas config --platform ios --profile production --json` resolves `buildArtifactPaths: ["ios/build/*.dSYM.zip"]`, with `autoIncrement: true` and `distribution: store` unchanged.
- `node scripts/docs/check-docs.mjs --write`, then `node scripts/docs/check-docs.mjs`: §6.2.

### 6.2 The docs check (2026-11-16)

- **Before `--write`:** 188 docs, 109 requirements, 1 error: RELEASE.md's backlinks block, which now links this record.
- **`--write`:** 1 block rewritten.
- **The check after it:** 188 docs, 109 requirements, 0 errors.

## 7. Related Docs

- [The crash reports audit](2026-11-15-crash-reports-audit.md), §3.1 and Q1.
- [The release process](../process/RELEASE.md).
- [1.5.2 on the Mac](2026-11-15-v152-mac.md): its build-log reading is how the dSYM zip's path was found.
