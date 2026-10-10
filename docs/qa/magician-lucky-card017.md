# Magician and Lucky Card QA — 0.4.17-preview

## Scope

- `c_magician` selects one or two distinct cards currently in hand and replaces their enhancement with `m_lucky`.
- A scoring, non-debuffed Lucky Card independently rolls the APK-compatible keyed `lucky_mult` and `lucky_money` streams, in that order.
- A successful Mult roll (1 in 5) adds 20 Mult. A successful money roll (1 in 15) adds $20.
- Score preview remains pure; an accepted play commits both RNG streams and the money payout exactly once.
- Save replay validates the Lucky rolls, payout trace and RNG state before and after scoring.
- UI exposes the target-selection flow, Lucky marker and per-card gold money feedback.

## Native-reference fixtures

- `LUCKY0018`: first Mult roll `0.16233118421935533`, first money roll `0.04223758985756576`; both effects trigger.
- `MONEY0016`: first Mult roll `0.7969492796318125` misses, first money roll `0.05199472695143137` triggers.
- Non-scoring and boss-debuffed Lucky cards do not consume either stream.
- Multiple scoring Lucky cards consume both streams in played-card order; Splash makes otherwise non-scoring cards eligible.

## Automated verification

- Core: 338/338 tests passed with `npm test`.
- Browser: 25/25 suites passed with the repository Playwright runner, covering desktop, touch/mobile, save/reload, write failures and the complete accumulated UI regression set.
- Preview export and `git diff --check` passed.
- Independent review regressions cover Lucky combined with Eye/Mouth history, Hook's separate keyed stream and rejection of non-Lucky fields forged into Lucky RNG snapshots.

## Deliberately out of scope

- Lucky Cat and Oops! All 6s Joker effects.
- Retriggers, Red Seal interactions and other not-yet-implemented card modifiers.
- Profile discovery/collection progress and native audiovisual timing.
- Remaining Tarot, enhancement, edition, seal and broader manifest-parity work.

This is a tested preview increment, not a claim of full Balatro parity.
