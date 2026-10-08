# Pierrot project bootstrap

Repository: `kotlyakov/Perriot-android` (private).

## Confirmed architecture from the provided project roadmap
- Deterministic JavaScript ES module game core, tested with Node `node:test`.
- HTML/CSS local UI and Kotlin Android WebView shell, built by Gradle.
- Android landscape layout; Russian UI; original art and audio.
- Balatro reference APK is for research only, not to be bundled into game assets.

## Missing in the repository (not yet implemented)
- Android/Gradle project source and wrapper.
- JavaScript game engine, UI and automated tests.
- Full `AGENTS.md` and `ROADMAP.md` source documents.
- Reproducible baseline of the previously approved 0.4.5 APK.

## Build gate
Do not claim an installable APK exists until GitHub Actions succeeds, `apksigner verify` and `zipalign -c` pass, and the user confirms installation on device. The existing CI workflow is a scaffold and currently requires project source.

## Next integration
Transfer original AGENTS/ROADMAP documents without silently modifying their contents, import approved working source, then validate the baseline before feature work.

## Source import policy
Import extracted first-party source files individually under `app/src/main/assets/web/` and `app/src/main/assets/src/`; do not commit ZIP archives. CI must build directly from tracked source files.
