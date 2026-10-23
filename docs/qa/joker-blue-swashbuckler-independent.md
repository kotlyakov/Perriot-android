# Independent review — Blue Joker and Swashbuckler

Reviewed 2026-10-14 against local `6225d41` (upstream `951858b`) and the supplied APK. Scope: Joker registration/effects, scoring snapshots, persistence, Hook discard-prefix ordering and descriptions. Concurrent Four Fingers changes in `hands.js` are excluded. No production code edited by this reviewer.

## Source findings

- Blue Joker adds two chips per card remaining in the actual draw pile at independent scoring time, before refill (`card.lua:3890–3896`). It excludes held/discarded/played cards; empty pile adds nothing.
- Swashbuckler sums stored sell values of every other owned Joker regardless of position, excluding itself. Multiple Swashbucklers count each other; editions influence the stored value, without a second derived price (`card.lua:3977–3983,4243–4250`). Exact BigInt accumulation preserves large values and rejects missing/negative/non-BigInt other sell values.
- Hook forced discards now precede played-card cleanup in the stored discard sequence. Its pre-scoring snapshot includes already forced-discarded cards, matching native press-play before evaluation.
- Blue replay retains ordered historical draw/discard piles, held identities and counters. It checks a complete disjoint card partition (including restored shattered Glass), correct remaining draw prefix/suffix for each RNG mode, previous discard prefix, surviving played-card boundary and later DISCARD cardinality. It compares the complete replay trace rather than accepting a saved raw count.
- Descriptions clearly specify draw pile before refill and other Jokers' sale value.

## Review findings

The complete partition alone does not prove the pre-PLAY draw count. Independent coherent forgery:

1. Start an ordinary run with Blue Joker: pre-PLAY hand has eight cards and draw pile has 44.
2. Play one card; the actual draw pile becomes 43.
3. Build a forged scoring context by removing one actual held identity from the historical hand and prepending it to the historical draw pile (normal RNG; append for APK).
4. Regenerate the score/trace coherently and update the accumulated score.

**Corrected:** the initial loader accepted historical draw count 45 and held count six, yielding two extra chips. Ordinary pre-PLAY fullness now accounts for Hook forced discards and the exact active Hanged shortfall. The original coherent forgery is independently rejected in both draw directions.

**Corrected:** a historical Hanged destruction suffix alone allowed reintroducing a marker already consumed by a previous PLAY. Independent reproduction previously accepted draw 43 versus actual 42. The new shortfall epoch binds creation revision, blind/ante and historical hands-remaining counter, records the consuming action, and rejects both previous-PLAY and DISCARD reuse. Independent original consumed-marker reproduction now rejects; active shortfall, later DISCARD and old active-marker migration tests pass.

**Corrected:** Serpent originally exempted ordinary fullness without enforcing its exact three-card refill. Independent valid Serpent reproduction: pre-hand eight/draw 44; PLAY one produces hand ten/draw 41; move one true held identity into the historical draw pile and replay coherently. Loader originally accepted historical draw 45, implying four draws. Exact refill consumption now rejects this independent reproduction, while won/lost PLAY skips initial refill and exhausted piles cap the draw count.

**Corrected:** Hanged one → PLAY → Hanged one gives a fresh active shortfall of one and a historical destruction suffix of two. A coherent snapshot originally claimed both old and new destroyed identities as the active shortfall, moved one held card into before-draw and inflated Blue by two chips. The epoch now stores the complete active identity list; live and scoring markers must equal that list. Independent original extended-suffix forgery now rejects. Both honest Hanged → PLAY sequences independently save/reload successfully.

This finding concerns structural save consistency; it does not require authenticated full action history or protection against arbitrary coherent edits to every field.

## Verification so far

- Blue/Swashbuckler + Hook + stacked native Joker suites: **11/11 passed**.
- Independently exercised Blue + Glass PLAY/reload then DISCARD/reload: **24 cases passed** across both RNG modes, including **six shattered cards**.
- Independent coherent held-to-draw overcount: **accepted before remediation**.
- No browser/Android or GitHub operations performed.

## Expanded recognition and cashout review

- Four Fingers/Shortcut: inspected native Flush/Straight threshold, repeated single-rank gaps, duplicate-rank membership, independent Straight/Flush union and Royal display. Options are wired through scoring, Arm and save replay; UI preview uses the same scorer. Independently reran the complete source-function oracle with actual APK assets and pinned LuaJIT: **370/370 passed**, no skips. Existing Stone raw-random consumption remains explicitly disclosed as a broader RNG parity limitation.
- Golden/Cloud 9: exact end-round bonus helpers match native `calculate_dollar_bonus` and Cloud tally. Bonuses join the quote without funding its interest base. Losing hands do not pay; cashout consumes the quote and a second request cannot pay it again.
- **Corrected cashout integrity finding:** a fresh Cloud quote row could be raised from four to 10,000 with a matching total and be paid. Earning provenance now stores source identities, physical nine-card identities and earning revision; rows are recomputed and a fresh quote is compared to current exact context. Independent original inflation now rejects.
- **Corrected fresh-context downgrade:** lowering earning revision and adding an owned non-nine ID to the context originally bypassed the fresh comparison. The current quote requires its earning revision to equal current revision while the winning `lastScore` survives. Supported subsequent round-won mutations clear that score. Independent downgrade reproduction now rejects.
- Independently exercised actual and legacy win → Hanged → Cloud sale → reload → CASH_OUT. Both retain and pay the original **$14** quote, including the original interest base and source bonus after mutation. Stored provenance deliberately proves structural consistency, not authenticated arbitrary plaintext history.
- Blue/Hanged/cashout suites before the final exact-identity regression: **40/40 passed**, including actual native cashout-method checks, no skips.
- Final fresh full suite: `npm test` — **864/864 passed**, zero failures/skips; captured at `/tmp/pierrot-independent-expanded-final.log`.

## Final verdict

No unresolved Critical or Important defect found in the final reviewed checkpoint. Independent reproductions confirmed correction of ordinary/Serpent draw overcounts, consumed/extended Hanged shortfall reuse, inflated cashout rows and fresh-context revision downgrade. Valid historical snapshots, native recognition and frozen post-win payout mutations remain verified. Source/core review supports proceeding with the checkpoint publication and separately owned UI/Android checks; no complete game parity or authenticated arbitrary plaintext-history guarantee is claimed.
