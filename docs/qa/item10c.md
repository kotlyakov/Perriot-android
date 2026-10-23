# Item10c — profile, unlocks, collection and statistics, 22.10.2026

Implemented locally on feat/item10c-profile, based on apk-reference e4d12f8. Candidate0.4.45-preview/code58. The shipped0.4.44 remains the latest APK.

Three independent profiles store current/backup runs, native unlock/discovery/career/usage/deck/Joker win-loss statistics, high scores and stickers. Profile metadata and run bytes commit in one AtomicFile/localStorage replacement. All existing save state encodings remain strict. Legacy run eligibility is unknown and conservatively imported as seeded, with no invented historical wins. Empty-profile recovery, concurrent writers, disk-full rollback and prototype-name run IDs have regressions.

Native factual77-condition catalog and independent event handlers follow uploaded1.0.1n source. Ordinary/seeded/challenge exclusions, actual rounds rather than blind slots, final pack-choice counters, paid rerolls, debuff/suit/royal rules, gross scoring earnings, temporary money peaks, Hook forced discards and abandon/endless/resume idempotence have coverage. Challenges themselves remain10d. New setup gates decks/stakes; menu has collection12categories with paging, profile selection and statistics in existing styles. Gold random starting seed excludes already Gold-winning Legendary selections only when some but not all5have Gold victories; explicit seeds remain unchanged.

## Executed verification

- Baseline1533PASS/0FAIL/2private-source skips.
- Final full `npm test`:1604total,1602PASS,0FAIL,2optional private-source skips.
-69profile checks include threshold matrix, both independent reviewer regressions, storage, generation/replay and seed helpers. Reviewers independently verified139real action/save/replay transitions; no remaining confirmed Critical/Important in reviewed areas.
-200native `get_first_legendary` predictions executed with supplied private original functions in local LuaJIT2.1.1703358377 and matched JS. Generator and numerical-ID fixtures committed; original Lua/APK excluded.
-`npm run android:assets`, Android XML/security static checks, preview export, JS syntax and git diff--check PASS.

## Pending platform checks and blocker

Local Playwright Chromium downloads returned empty/truncated archives; no real browser test was executed. New profile desktop/touch checks and updated retained suites are ready in CI, including profile switching, gates, ordinary progress/reload, pending-victory menu closure and empty-profile backup recovery. Fresh Android compilation, apksigner/zipalign, APK comparison and screenshot review have NOT run. No physical Android or complete frame/event RNG parity is claimed.

Two git-push attempts were rejected by automatic approval review. The actual existing remote is public; end-user authorization to publish these committed changes must be explicit. Connector confirmed repository owner and connected user both kotlyakov. No visibility change, public copy or API workaround attempted. PR creation before push failed422 invalid head and did not create a PR. Changes remain committed locally; CI cannot run until push is allowed. The next step is user approval for pushing feat/item10c-profile to the existing public repository, then PR/browser/Android/APK verification.10c is implemented but NOT technically completed as a deliverable until those checks pass.10d not started.
