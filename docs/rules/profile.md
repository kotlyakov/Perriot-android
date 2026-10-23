# Profile, collection and unlock accounting — item10c

Scope: uploaded Balatro 1.0.1n APK SHA2566236dc68a312d04295839cfbfd2699d4751877bdf162c3a4ce425481d28397bd. Original Lua remains a private reference, never a shipped asset. `src/content/profile-unlocks.js` contains factual conditions/thresholds (77 entries, including already unlocked and hidden legendary entries), independently implemented by `src/core/profile.js`.

## Public contract

`createProfile()` returns version1 plain serializable profile. `validateProfile(profile)` returns the same object or throws. `updateProfile(profile,previousState,nextState,events,context)` returns a new profile without mutating inputs, or the original profile for repeated/stale run revisions. State codec and profile store atomically persist it outside the strict game rules state.

Persistent data: unlocked/discovered identities; native career counters; exact decimal best-hand/most-money records; furthest entered round/ante and current/best win streak and boss streak; eight stake counters for deck/Joker wins/losses; deck/Joker/consumable/voucher/hand usage. Per-run ledger stores revision, seeded/challenge eligibility, actual entered rounds (not blind-slot number), maximum simultaneous Jokers, played combinations and once-only win/loss flags. Run IDs including prototype property names remain safe own properties.

`context.seeded` and `context.challenge` are registered once with a run; later calls retain eligibility. `context.continued` permits an unlock-only update at the same revision for explicit Continue. `context.abandonedRunId` resets the current victory streak when an unfinished ordinary run is replaced, without inventing a loss.

`profileRunContext(profile)` supplies strict native shop pool unlocked/locked IDs; `deckUnlocked` and `stakeUnlocked` gate setup. Higher stakes require the preceding victory on that same deck. `legendaryWinIds(profile)` returns the five native Legendary IDs with a **Gold** win only, for automatic random Gold-seed filtering. `collectionEntries(profile)` supplies identity/category/name, availability, discovery, Russian unlock hint and highest-stake sticker. Enhanced cards and seals are always inspectable; their identities do not inflate native discovery totals.

## Native source anchors

- `assets/game.lua:483–528,610–643`: locked Jokers, upgraded vouchers and all15 deck conditions. Blue20/Yellow50/Green75/Black100 discovered items; Red→Magic, Blue→Nebula, Yellow→Ghost, Green→Abandoned, Black→Checkered; global stake wins2/3/4/5/7 open Zodiac/Painted/Anaglyph/Plasma/Erratic.
- `assets/functions/common_events.lua:1185–1659`: unlock dispatch, seeded/challenge guard, per-condition predicates and discovery of newly unlocked backs. `1918–1936`: discovery exclusions.
- `assets/functions/misc_functions.lua:1024–1130,1179–1267`: high scores, exact-stake Joker wins, lower-stake synthesized deck wins, loss/usage tables. `1279–1426`: max-sticker progress and discovery totals. `1447–1452`: career counters exclude seeded and challenge.
- `assets/functions/state_events.lua:1–23,135–174`: actual win accounting, blind discovery on victory, single-hand round streak and boss streak. `414,452`: forced Hook discard career accounting; `494–507`: cards played/face counters. `1212–1224`: capped-interest streak.
- `assets/functions/button_callbacks.lua:1913–1920`: abandoned run clears current streak. `2370–2378`: Arcana/Celestial use counters increment once only when using the final choice closes the pack; opening, skipping and the first Mega choice do not increment. `2519–2560`: purchases. `2628–2630`: career rounds count entered rounds. `2954–2957`: only **paid** rerolls count toward career rerolls.
- `assets/card.lua:306,423–427,566–583`: double-gold condition, ownership discovery, edition discovery after the early playing-card return. Physical playing-card editions do not discover Joker edition entries. Five entries include base edition.

## Important distinctions

Career/unlocks/discovery/deck wins/Joker wins exclude both seeded and challenge games. Native usage tables still update in these modes. High scores exclude seeded games; challenge high-score updates remain possible, while challenge boss/victory streaks do not progress. Challenges themselves remain item10d.

The native `won` flag may be true on a losing win-Ante boss. Profile victory uses the verified `winPending` transition; the run ledger prevents acknowledgement/endless/resume from granting a second victory. Losing after a recorded victory does not invalidate that victory.

Scoring earnings use positive `score_money` events, independently of the scoring aggregate `money_changed` event marked `reason:'scoring'`. This preserves gross earnings when Tooth/Ox losses and positive Gold/Lucky/Joker rewards occur together. Cash-out totals count explicitly. Temporary money peaks from event before/after balances remain eligible for Satellite and the most-money record before Rental payments.

Seeing Double, face-card statistics and royal-discard unlocks reuse the actual suit/face/debuff/hand-recognition helpers. They preserve Smeared, Four Fingers, Shortcut and debuffed Wild behavior instead of printed-card shortcuts.

## Verification and limits

Targeted suites: `node --test tests/core/profile*.test.js`; explicit source-threshold matrix plus event, exclusion, idempotence, resume, discovery, storage and reviewer regressions. Native Lua execution of this new profile module has not been performed; source inspection and independently specified source conditions are the evidence. Existing native RNG/scoring oracle fixtures remain separate. Full frame/event RNG parity and physical Android tests are not claimed. Platform achievements/service integration and challenge execution are outside item10c.
