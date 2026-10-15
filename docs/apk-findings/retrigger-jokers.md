# Retrigger Joker source research — extracted APK only

Research date: 2026-10-15. Read-only research; no production changes or commits. Private source root: `/workspace/scratch/2c556ddf4f1c/reference-apk/assets/`. All native file:line references below are relative to that root. Source navigation index: `docs/apk-findings/remaining-joker-source-index.md`; implementation context read: `src/core/score.js`, `src/content/jokers.js`, `src/core/run.js`, `src/core/cashout.js`. Those files are changing under the implementer; observations below describe the interface inspected, not a review of concurrent changes.

## Source identity and centre facts

`globals.lua:1-3` identifies this extraction as **1.0.1n-FULL [M]**. Treat the actual extracted functions/configuration as authoritative; neither the marker alone nor current wiki balance supplies missing values. In particular, **this APK has Hanging Chad `extra=2`**, meaning two additional evaluations, three total without other retriggers (`game.lua:492`, `card.lua:3355-3361`). Do not substitute a remembered older value of 1. This is an extracted-APK fact, not an inference about historical patch chronology.

| Key | Additional evaluations | Eligibility | Rarity / cost | Native centre / calculation |
|---|---:|---|---|---|
| `j_mime` | 1 | Held card has a nonempty own evaluated effect, or at least one individual Joker effect; applies during scoring and separately at end of round | Uncommon / $5 | `game.lua:390`; `card.lua:3390-3397`, `2880-2890` |
| `j_dusk` | 1 | Scoring card, native `current_round.hands_left == 0` exactly | Uncommon / $5 | `game.lua:399`; `card.lua:3363-3369` |
| `j_hack` | 1 | Scoring card whose native `get_id()` is 2, 3, 4 or 5 | Uncommon / $6 | `game.lua:408`; `card.lua:3377-3387` |
| `j_sock_and_buskin` | 1 | Scoring card whose native `is_face()` succeeds | Uncommon / $6 | `game.lua:486`; `card.lua:3347-3354` |
| `j_hanging_chad` | 2 | Identity equals `scoring_hand[1]`, after scoring-set construction and positional sort | Common / $4 | `game.lua:492`; `card.lua:3355-3362` |

All five centres are Blueprint-compatible, Perishable-compatible and Eternal-compatible in these rows. Mime/Dusk/Hack are initially unlocked; Sock and Buskin initially locked, unlock condition career face cards played >=300; Hanging Chad initially locked, unlock condition round win with High Card. Dusk carries a hidden empty unlock-condition record despite unlocked=true. No repeat counters, per-round charge limits, or ability mutations occur in these five calculation branches. `extra` is copied from the centre into the ability (`card.lua:277-297`); it is the number of *additional* evaluations.

Rank predicates: `get_id()` returns a random negative identifier for Stone rather than its printed rank (`card.lua:958-963`). Thus Hack excludes Stone. Ordinary faces are J/Q/K (11/12/13); `is_face()` also checks an active Pareidolia and refuses debuffed cards unless explicitly called from a boss (`card.lua:965-970`; active-Joker search `functions/misc_functions.lua:906-919`). Under Pareidolia even Stone can satisfy `is_face()`; do not permanently encode Sock as a raw numeric-rank test once Pareidolia is admitted. Hanging Chad can repeat a scoring Stone; its predicate does not require a rank or face.

## Exact native contexts and three different loops

`eval_card` dispatch is defined at `functions/common_events.lua:583-659`. `repetition_only=true` evaluates only the card seal and returns immediately (`587-593`). Joker evaluations use `cardarea` identifying the **playing card's area**, not necessarily the Joker's own physical area. This matters for repeat eligibility.

| Native call | Context fields beyond area | Source |
|---|---|---|
| Scored card seal repeat query | `repetition_only=true`, `repetition=true`, `cardarea=G.play`, `full_hand=G.play.cards`, `scoring_hand`, `scoring_name=text`, `poker_hands` | `functions/state_events.lua:690` |
| Scored Joker repeat query, once per Joker | Same scored context except no `repetition_only`; `other_card=scoring_hand[i]` | `functions/state_events.lua:699` |
| Scored own effects, on every evaluation | `cardarea=G.play`, `full_hand`, `scoring_hand`, **`poker_hand=text`** | `functions/state_events.lua:713` |
| Scored Joker individual effects, every evaluation | `individual=true`, `cardarea=G.play`, `full_hand`, `scoring_hand`, `scoring_name=text`, `poker_hands`, `other_card` | `functions/state_events.lua:716` |
| Held own effects, every evaluation | `cardarea=G.hand`, `full_hand`, `scoring_hand`, `scoring_name=text`, `poker_hands` | `functions/state_events.lua:819` |
| Held Joker individual effects, every evaluation | Same held context plus `individual=true`, `other_card=G.hand.cards[i]` | `functions/state_events.lua:823` |
| Held seal repeat query | Same held context plus `repetition_only=true`, `repetition=true`, `card_effects=effects` | `functions/state_events.lua:834` |
| Held Joker repeat query | Same held context plus `repetition=true`, `other_card`, `card_effects=effects` | `functions/state_events.lua:844` |
| End-round own effects, every evaluation | Direct `get_end_of_round_effect()` call, no arguments | `functions/state_events.lua:201` |
| End-round Joker individual query | `cardarea=G.hand`, `other_card`, `individual=true`, `end_of_round=true` | `functions/state_events.lua:204` |
| End-round seal repeat query | `end_of_round=true`, `cardarea=G.hand`, `repetition=true`, `repetition_only=true` | `functions/state_events.lua:213` |
| End-round Joker repeat query | `cardarea=G.hand`, `other_card`, `repetition=true`, `end_of_round=true`, `card_effects=effects` | `functions/state_events.lua:223` |

### Scored loop

1. Native builds scoring cards from poker recognition, adds all Stone cards, or uses every played card with active Splash, then sorts by horizontal position (`functions/state_events.lua:593-621`). This final order defines Chad's first card. Non-scoring played cards never get these repeat queries.
2. For each scoring card, update per-rank `cards_played` once (except Stone), then check debuff. A debuffed scoring card skips the entire repeat/evaluation loop (`669-685`). It remains in `scoring_hand`: if first card is debuffed, Chad does **not** move to the next card.
3. For an eligible card start with one original evaluation, append Red-seal repetitions, then append each Joker's repetitions in Joker order (`687-705`). The queue is additive, built once before evaluating the card. Repeated evaluations do not discover more repetitions. Several Jokers or duplicate instances contribute independently.
4. Complete every queued evaluation for the current card before advancing to the next scoring card. Each evaluation recalculates own effects first and every Joker's individual effects in Joker order; it then clears `lucky_trigger` and applies those effects in that order (`706-723`). No independent Joker-main phase or Joker edition is repeated by these five.
5. Own scored evaluation obtains chips, +Mult, xMult, play dollars, own Joker result and playing-card edition, in that sequence (`functions/common_events.lua:595-625`). Effects apply chips, +Mult, play dollars, dollars, extra callback/modifiers, xMult, edition (`functions/state_events.lua:723-797`). A playing-card edition, when eventually supported, is repeated on every scored evaluation. A Joker's own edition remains in its later once-per-Joker phase (`898-964`).

Examples from the queue rules: first scoring face with Chad + Sock has 1+2+1=4 evaluations; with Red also 5. A first scoring 2 with Chad + Hack on the final native hand has 1+2+1+1=5 evaluations. These totals are arithmetic consequences of the source loop, not integrated runtime fixtures.

### Held scoring loop

Native iterates held cards in current hand order. For each card, build one original queue entry; **first evaluate own effects and all individual held Joker effects**, then discover repetitions only on the original entry (`functions/state_events.lua:805-851`). Recalculate those effects for each repeat; do not replay a frozen effect result. Own held effects precede held Joker effects on each pass; dollars, h_mult, x_mult and messages are applied in that order per effect (`853-891`).

A held Red seal is admitted only if the original effect array has a nonempty first table or more than one table (`834-839`). Mime uses exactly the same effect-presence predicate inside its Joker branch (`card.lua:3390-3397`). **Nonempty metadata/message effects count**, not only score-changing numeric effects. Multiple Mimes add repetitions; Mime does not repeat another Mime's repetition query.

Steel supplies own held xMult=1.5 (`game.lua:653`, `card.lua:1012-1015`, `functions/common_events.lua:627-642`), so Mime repeats Steel. Existing held Baron, Shoot the Moon and Raised Fist individual effects also qualify a plain card (`card.lua:3275-3343`); Mime repeats their per-card evaluation. A Gold card has no own scoring-time held dollars effect, so Gold alone does not qualify during scoring. A Gold King with Baron can still qualify through Baron. Own playing-card editions are not evaluated in this held scoring path (`functions/common_events.lua:627-642`).

Order-sensitive example: held Steel Queen with Shoot the Moon and one Mime applies x1.5 then +13 twice. Starting Mult4 gives 41.5. With Red seal it applies the pair three times, giving 75.25. A blanket multiplier on the final held result is incorrect.

Held cards are not globally skipped by the native loop on debuff: their own held getters return zero (`card.lua:1007-1015`), while Baron/Moon/Fist can return a debuff message (`3275-3343`). A Mime can therefore enqueue repetitions of that message; it does not restore the numeric benefit. Red itself is disabled by debuff (`2245-2255`). All five Joker calculation functions return nil immediately if that Joker is debuffed (`2294-2306`). The scored loop's outer debuff guard, held effect getters, and Joker's own debuff guard are distinct mechanisms.

### End of round, Gold, and dependent seal effects

The end-round pass first evaluates each Joker's generic end_of_round effect once and performs Rental/Perishable bookkeeping (`functions/state_events.lua:99-110`), determines game over, then runs held-card end-round effects only on the surviving/winning branch (`124-142`, `192-254`), before clearing the hand (`258`). A future Perishable Mime must have its resulting debuff state respected by the later held repeat query. Generic end-round Joker effects, and later `calculate_dollar_bonus` cashout rewards, are not repeated by Mime.

For each held card end-round uses the same original-first effect-array discovery pattern, Red first, Jokers in order, one discovery only (`192-230`). It reruns `get_end_of_round_effect()` and individual end-round Joker calculations for every queued pass; applies h_dollars/extra (`232-253`). Mime has a separate `end_of_round` repetition branch (`card.lua:2877-2890`), required because that context takes precedence over the normal repetition branch.

Gold own held payout is $3 (`game.lua:655`, `card.lua:1034-1040`); debuffed cards return an empty effect table. Gold+Mime pays $6; Gold+Red+Mime pays $9; Gold+Red+two Mimes pays $12. Steel does **not** multiply score again at end of round: only the end-round getter is used. Gold payouts occur before interest is computed (`functions/state_events.lua:201-244`, `1212-1223`); do not defer Mime's extra Gold payout until after taking the cashout money snapshot. Golden Joker and Cloud9 bonuses are evaluated separately once (`1196-1203`) and must not be duplicated.

Blue seal is a real dependency for later seal support: the original end-round getter schedules a Planet matching last_hand_played, sets an effect marker and reserves consumable buffer capacity (`card.lua:1041-1064`). That marker makes the original card eligible for Mime, but each subsequent getter checks capacity again. Repetitions can create more Planets only while capacity permits; do not infer guaranteed count from queue length. Red seal always returns one repetition when asked with repetition=true and card is not debuffed (`card.lua:2245-2255`); scored Red needs no effect-presence check, held scoring/end-round Red does. Gold seal adds $3 per **scored** evaluation through play dollars (`1069-1089`), a separate mechanic from Gold enhancement.

## RNG, Glass, and counters

- Lucky +Mult and Lucky dollars each reroll on every scored evaluation (`card.lua:985-998`, `1069-1089`; `functions/common_events.lua:601-614`). Individual Jokers observe the resulting lucky_trigger for that pass, then it is cleared (`functions/state_events.lua:714-721`). Preserve draw order: both own rolls happen before individual Joker effects. Hiker/Lucky Cat/Wee/Photograph and other unsupported individual Jokers consequently need future integration with the repeated per-card path (`card.lua:3070-3107`). Do not multiply one Lucky result by repeat count.
- Glass x2 is part of each own scored evaluation (`game.lua:652`, `card.lua:1000-1005`), but **shatter is tested once per scoring card after all scored, held and independent Joker phases**, not once per evaluation (`functions/state_events.lua:967-994`). Its probability is normal/4 and debuffed Glass skips that roll. Thus Glass + Chad alone applies x2 three times (x8) and still makes one shatter roll. Removal-Joker notifications happen after the destruction list is built (`995-1017`). None of these five independently repeats a destruction hook.
- Native decrements hands_left before scoring (`functions/state_events.lua:496`; queued immediate mutation `functions/common_events.lua:154-189`), so Dusk sees 0 on the last available hand. It does not mean “a hand that wins the blind.” The inspected JS `scoreHand` receives the pre-play counter and `run.js` decrements later; equivalent Dusk eligibility at that public boundary is handsRemaining===1, unless the scorer contract is explicitly changed. Validate the chosen phase with both standalone scoring and PLAY_HAND fixtures; avoid changing existing Acrobat's pre-play convention by accident.
- Native global/current-round hands_played increment once after evaluate_play (`functions/state_events.lua:533-545`); hand-type played/played_this_round once before score (`595-597`); per-card base.times_played and career/round cards-played count once on playing all selected cards (`494-504`); scoring-rank history once before debuff/repetition (`669-674`). Repeats do not spend hands/discards, increment these counters, redraw, retrigger hand-before/after phases, or alter the scoring set.

## Minimal implementation interface and truthful batch boundary

The inspected scorer has one scored pass and one held pass, existing scored/held content handlers, exact arithmetic, Lucky/Glass draw reports, and later independent/edition phases. Its entry guard refuses all playing-card seals and nonbase editions; neither is a prerequisite to supporting these five within the admitted state space. Keep unsupported seals/editions fail-closed unless their complete lifecycle is included. Their native interactions above remain acceptance criteria for the later support batch.

Smallest useful truthful first batch: **Dusk, Hack, Sock and Buskin, Hanging Chad**, with one explicit scored-card repetition queue, additive source attribution, full own+individual reevaluation per pass, untouched once-per-card Glass destruction and once-per-hand phases. This needs no new unsupported Joker, seal or edition enabled. Sock uses an active face predicate on admitted ordinary cards; reserve its Pareidolia interaction for when Pareidolia is enabled. Blueprint/Brainstorm can remain unsupported; their native delegation already uses the same repetition context (`card.lua:2307-2335`). Seltzer shares the play repetition branch but adds depletion lifecycle and is not needed in this batch (`3370-3376`, source index points to its after behavior at3604).

To truthfully admit **Mime as well**, include both held scoring repetition and end-round held repetition, including existing Gold payout before interest/snapshot capture. Enabling it only in score.js is incomplete even with no seals supported. Reuse a small per-card repetition representation across the three contexts if useful, but preserve different discovery timing and eligibility; no general-purpose effect language is required.

Minimum scorer inputs/results for this batch: played/scoring card identity and order, held card identity/order, Joker identity/order/debuff state, explicit counter phase, and an effect-presence notion for the original held pass (including messages). Trace each evaluation/source separately while preserving existing score effects; snapshot/provenance must include held order and round counter when Mime/Dusk affects score. Existing cashout settlement needs ordered per-card Gold repeats and money-before-interest captured after them. Repeated Lucky results must contribute every roll and money event to authoritative validation/replay; repeat count does not duplicate cards in glassRolls or scoringCardIds. Unsupported content/modifier admission remains explicit.

High-value integrated fixtures: first scoring card debuffed with Chad (no reassignment); Stone first with Chad; disjoint/non-scoring low card with Hack; Dusk pre-play1 vs2 and early win; additive two sources and reversed Joker order traces; Lucky draws separately on every pass; Glass three score evaluations and one shatter roll; Steel plus held +Mult noncommutativity; Mime with Baron/Moon/Fist; Gold+Mime $6 before interest boundary; debuffed Mime and Gold; save/reload/replay with Lucky or Gold repetition provenance; later Red/Mime addition and Pareidolia Stone-face cases.

## Executed independent checks and limits

Command executed successfully:

`/workspace/scratch/2c556ddf4f1c/toolchains/LuaJIT/src/luajit /tmp/showdown-retrigger-research.lua`

Result: **34 assertions passed** on pinned LuaJIT 2.1.1700008891. The temporary harness loads the original complete card.lua with an inert class constructor; extracts and loads original eval_card and find_joker functions directly from the private files; reads centre rows from original game.lua; builds minimal card/area/global adapters. No source blocks or original assets are copied into this report or committed.

Original function checks executed: Hack ranks2/3/4/5 yes,6/A/Stone no; Sock J/Q/K yes,10/A no; Sock with Pareidolia+Stone yes; Dusk native hands_left0 yes,1/-1 no; Chad native config2/first Stone yes/second card after debuffed first no; Mime empty no, Steel numeric effect yes, separate Joker message yes, end-round Gold yes, own debuff no; Red repeat1 and debuff suppression; native Steel held x1.5, Gold end-round $3, no Gold own scoring-held effect, debuffed Gold empty.

Four additional assertions use a **source-derived function-level adapter**, not the original state_events loops: Steel+Red+Mime total3; Gold+Red+Mime end-round total3; Gold+Red+two Mimes total4; plain King+Baron+Mime total2. The 34 total includes these four. They confirm native individual function composition under minimal stubs; they do **not** prove the integrated native event pipeline, APK execution, JS implementation, RNG parity or persisted/replay behavior. Original scoring/held/end-round loops, Glass destruction, Lucky draw sequencing and lifecycle counters were read and attributed above, not executed as a full game. No production tests or build were run for this research-only task.

## Follow-up preflight: Stone raw RNG is load-bearing for this batch

Root source recheck2026-10-15: `card.lua:958–962` returns a negative **unkeyed integer** draw from100 through1000000 for each non-vampired Stone get_id call. `is_face` at965–970 caches exactly one get_id result. The Hack repetition predicate at3377–3382 calls get_id separately in four short-circuit alternatives: an admitted Stone fails all four, consuming **four** integer draws per active Hack query. Sock calls is_face once, consuming **one** per active Sock query. Debuffed Jokers return before those predicates, and the outer debuffed scoring-card guard prevents the query entirely. These are source-read call counts, not newly executed full-loop fixtures.

Consequently semantic exclusion of Stone without raw draws cannot satisfy the next batch's exact final raw RNG contract. This preexisting known Stone gap becomes an explicit prerequisite within the new scored-retrigger batch wherever its extracted-loop fixtures exercise these predicates. Test Stone with Hack/Sock alone and together, duplicate/order/debuff cases, and mixed later Lucky/Glass reseeding. Use original-loop facts to establish all other getter calls before choosing the smallest chronological RNG result/snapshot interface; do not invent a total whole-hand call count from these isolated predicates. Native vampired transitions remain unsupported until their lifecycle is implemented.
