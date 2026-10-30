# Contributing

How work is done in this repo, by the owner and by every Claude session. The [documentation map](docs/README.md) shows where everything else lives.

## The sequence for every change

1. **Plan first.** For anything non-trivial, write the plan before code: a phase plan, or a task in the current one. No code changes without a documented plan.
2. **Branch** from `master` (or, until v1.4.0 ships, from `rehaul/v2`). See [BRANCHING.md](docs/process/BRANCHING.md).
3. **Implement**, citing requirement IDs from the [SRS](docs/srs/SRS.md).
4. **Test.** Tests state what they cover (`// covers: FR-TMR-005`). Guard tests get a mutation check ([test strategy](docs/testing/TEST-STRATEGY.md)).
5. **Document.** Write an implementation record from [`docs/implementations/_TEMPLATE.md`](docs/implementations/_TEMPLATE.md) and add any new doc to the map. If the change made a significant choice, add an ADR ([`docs/architecture/adr/`](docs/architecture/adr/README.md)).
6. **Update status** in the [roadmap](docs/roadmap/ROADMAP.md) and, when the change is user-visible, under "Unreleased" in [CHANGELOG.md](CHANGELOG.md).
7. **Check:**
   ```bash
   node scripts/docs/check-docs.mjs --write   # regenerate backlinks + traceability, then commit what it changed
   npm run typecheck && npm run lint && npm test && node scripts/docs/check-docs.mjs
   ```
8. **Commit.**

## Commits

[Conventional Commits](https://www.conventionalcommits.org/), as the history already uses:

```
feat(b2): migrate AsyncStorage to MMKV once, flag written last (FR-MIG-002)
fix(android): keep Room database constructors under R8
docs: SRS v1.0
build: upgrade to Expo SDK 58
test(a3): v1.3.1 storage fixtures
chore(release): version 1.4.0
```

- The scope is optional: a plan task id (`b2`), an area (`android`), or omitted.
- The body explains **why**.
- Cite requirement and ADR IDs.
- **Commit only your own paths: `git commit -- <paths>`** (add new files first with `git add <paths>`). Never use `git add -A` / `commit -a`, and never a bare `git commit` in a checkout another session shares. The index is shared, so a bare `git commit` also commits whatever the other session has staged. This happened on 2026-10-30 (`1904173`, undone before it was pushed). `git commit -- <paths>` commits exactly those paths and leaves everything else staged.

## Gates and permissions

- **Never skip a GATE** in a plan. Device checks are part of "done".
- **The owner's explicit go-ahead is required for:**
  - pushing
  - EAS builds and TestFlight submissions
  - App Store submission
  - creating accounts or store products
  - changing repository settings (such as GitHub Pages)
  - publishing GitHub Releases

## Licence

The repository is licensed FSL-1.1-ALv2, with the brand files under CC BY-ND 4.0 and the names and marks reserved ([LICENSE.md](LICENSE.md), [TRADEMARKS.md](TRADEMARKS.md)).

**Outside contributions need a contributor licence agreement (CLA) before they are merged.** Under FSL, whoever offers code is its licensor. Without an agreement, a contributor's code would stay theirs, under terms the owner's own app could break. No CLA is set up yet, so open an issue before starting a pull request.

## Environment notes

- **The repo lives in OneDrive.** OneDrive can turn old files into cloud placeholders that Metro (SDK 56+) can't see. If Metro says an existing file is missing, rewrite that file's bytes; moving the repo out of OneDrive is the durable fix.
- **No Mac.** iOS builds and device checks go through EAS and TestFlight only.
- **Measure bundles** only with `npx expo export --platform ios --platform android --dump-sourcemap`.
