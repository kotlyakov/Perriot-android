# Independent review: conditional APK shop generator

Date: 2026-10-08. Scope: generator foundation, factual catalogue, six conditional native fixtures, and selected pool gates. This is not acceptance of a complete shop UI, all content effects, or full Android-game parity.

## Result

**PASS for the documented ordinary fresh-profile, seeded, ante-1 first-shop and no-purchase-reroll scenarios.** No blocking mismatch found in that scope. Expanded conditional inputs need the integration constraints below; validation observations were sent to the author while changes were still in progress.

## Independent evidence

- Read the private reference APK directly with Python zipfile; verified pool filtering, create-card ordering, shop type range construction, edition comparisons, sticker setters, used-name registration, pool construction, and booster weighting against `apk-shop.js`.
- Regenerated `apk-shop-catalog.js` with the pinned LuaJIT executable from the private APK. `cmp` found it byte-identical to the supplied catalogue.
- Independently reran `generate-shop-fixtures.py` with that runtime/APK. JIT and interpreter agreed; generated JSON was byte-identical to the checked-in six-case fixture. This corroborates reproducibility of the conditional adapter, not independence from its documented assumptions.
- Independently modified the temporary oracle inputs to Tarot-only rates and banned 20 of the 22 Tarot centres, retaining Empress and Strength. All six seed/motion cases matched the JS generator for first-shop cards, packs, reroll cards, and complete final keyed RNG state. This exercises actual full-position rejection sampling and subsequent duplicate exclusion rather than only a dense pool.
- `npm test`: 154 tests passed, zero failed (review run). Fixtures compare inventory, editions, costs, sell costs, native random values/final state, and keyed state; caller immutability also has a passing test.

## Confirmed details

The full raw factual pools are 150 Joker, 22 Tarot, 12 Planet, 18 Spectral, 32 Voucher, 32 Booster, and 8 Enhanced. Raw counts are not eligible-pool counts: rarity, fresh-profile locks, duplicate ownership, prerequisite vouchers, played hidden hands, enhancement gates, flags, and bans can exclude entries. The source's rarity pools retain unavailable positions; this implementation does likewise. Empty eligible pools use source fallback even when that fallback itself is banned, and rejection suffixes begin at `_resample2`.

Main-card ranges use the source's open lower and closed upper comparisons. Booster weighted comparisons include both endpoints and choose the earlier entry at an exact shared boundary. Edition comparisons and rarity thresholds are strict `>` in source order. Illusion's type poll precedes selection even when the selected set is not a playing card. The first forced Buffoon gate checks the normal1 ban only, including the source's normal2-ban exception. Voucher construction and its immediate motion-dependent draw precede that unkeyed Buffoon choice. Reroll animation consumption occurs after each constructed main card.

Within these fixtures, constructors consume the documented three immediate native draws, materials consume the immediate motion-dependent native choice, and Showman is checked through owned centres rather than merely offered shop cards. Caller RNG/context remain unmodified.

## Validation observations and integration constraints

The author's in-progress validation update now rejects unknown top-level fields, unknown rate names, unsupported modifier names, malformed IDs, and nonboolean flags. Earlier probes passing tags/modifiers silently are therefore resolved; they are not retained as current regressions.

At review time, remaining low-severity malformed-context probes were accepted: finite individual rates whose sum overflows (`Joker=1e308`, `Tarot=1e308`), unknown visible-hand names, unknown played-hand names, and a Joker ID in `usedVoucherIds`. The overflow causes an infinite type poll and can silently choose Tarot. These do not arise in the six supported fixtures; they were communicated for author correction. Recheck these after the author's final schema edits.

Future callers must preserve the stored voucher choice, first-shop-Buffoon flag, profile unlock state, actual played/visible-hand history, prices/rates, bought/opened booster-slot state, and exact RNG state across saves. An explicit absent voucher is supported with `voucherId:null`; it must not be silently reselected. The generator maintains newly constructed used-name flags only within its session, so an integrator must update persistent used-centre state and reconstruct it correctly after purchases/removals. Deriving it only from purchased cards would miss shop offers. Ownership and actual playing-card enhancement state must come from their separate game areas.

Tags, forced tutorial inventory, challenge/FTP paths, other shop effects, real profile meta, asynchronous game events, and device rendering are outside the verified path. Unsupported context is rejected where represented by explicit unknown fields; callers must not remove those fields and pretend their effects were applied. The source adapters omit rendering and full effect initialization, so offered entity IDs do not establish effect completeness.

No original source/art/APK was written by this reviewer into the project. This workspace has no `.git` directory, so repository commit-history verification was unavailable; temporary oracle outputs stayed outside the project. The catalogue/fixtures contain factual metadata and numerical outputs.

## Root follow-up after final author edits

The public choose/generate/reroll entries now revalidate context. A fresh root run of `node --test tests/core/*.test.js` passed 155/155, including the author-added regression for the overflow/unknown-hand/category probes above and occupied-voucher category checks. Those validation observations are resolved. The original six fixture results remain exact. This follow-up does not expand the conditional parity scope or claim run/UI integration.
