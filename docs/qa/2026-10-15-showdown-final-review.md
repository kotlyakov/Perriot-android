# Numbered item 2 — independent whole-branch review

Date: 2026-10-15. Review only; no implementation, commit, publication, merge, or work on numbered item 3.

## Scope and verdict

Reviewed the integrated delta from `83a2a4f832011ff1df47a9670bfba1098fdc9037` (0.4.33 / validated 53-Joker baseline) through `1555314653760ca154de52515deb90bec748f589` (0.4.34 source). Worktree HEAD at assignment was `8acfa43`, containing later documentation only. Root separately established that all 42 changed code/test/config/fixture blobs match published PR29 source `28cdbf935dc50525b9505ec4d63424a6b39f363d`; this reviewer did not independently retrieve GitHub publication state.

**No Critical or Important defect found by this whole-branch review. Numbered item 2 source review is COMPLETE. Source is eligible for separately selected item 3, conditional on the remaining CI, visual, and device gates. This is not approval of the entire CI pipeline or a fully released game.**

Read the repository instructions, APK reference specification, showdown implementation plan and native findings. Examined the production changes, fixture generator, focused tests, existing-test adjustments, standalone exporter, browser runner and CI trigger change. Independently traced the cross-feature lifecycle rather than relying solely on the prior task reviews.

## Integrated findings

No blocking finding requiring a path/trigger/fix entry was demonstrated.

- Heart choice occurs after continuing play scoring, not before it; discard does not re-arm it. Recognition, scored/held/independent and edition effects honor the disabled Joker, while inventory quantities still include it. Score-time identity is replayed separately from the next draw identity. Glass-to-Heart authentication handles the later raw RNG state, zero Jokers and terminal plays. Sale clears the removed identity and invalidates `lastScore` without an eager replacement poll.
- Bell validates forced selection in core as well as UI. Saved choice provenance uses the original physical-card pool, including supported Hanged destruction and Tarot transformations; terminal play clears forced selection without another poll. Glass replay binds subsequent poll count and final RNG. Empty native pools produce explicit atomic rejection rather than a fabricated card.
- Acorn performs three shuffles, each from canonical creation order, after the deck shuffle in the extracted native callback order. Hidden presentation suppresses name, artwork, edition, tooltip and sale-price disclosure, including the drag copy. Reorder retains mechanical identity; sale removes its hidden reference; victory/disable reveals without undoing order.
- Leaf applies card debuffs while leaving base hand recognition/scoring and active Joker effects available. Only accepted Joker sale disables it. Vessel disable divides the current native target, can settle the round through the shared success path and retains completed-target provenance in shop/pack saves. Earned payout context remains frozen across later sale/disable/inventory changes, including Water/Needle counters and Serpent's short-hand/terminal-refill provenance.
- Victory is durable before payout, locks routed actions and acknowledges once with revision guarding. Save failure retains pending victory and retry; acknowledgement persists before closing. Escape/Back paths preserve pending dialogs. Existing cashout creates the next shop exactly once; later showdown wins do not notify again.
- Endless uses native binary64 target arithmetic and multiplier/division rounding before conversion to BigInt. NaN is target-only, validates against the computed expected target and remains unordered/unwinnable through play, loss and reload. Ordinary money/score fields remain finite. Shared ESM cycles use stable exported module identities. The CI change restricts push branches while retaining pull-request/manual triggers and existing jobs.

## Nonblocking observations

- Low priority, `src/ui/app.js:101,108`: loss/settings copy still says 32 Jokers, version 0.4.22 and unavailable final bosses. Trigger: open these existing informational screens in 0.4.34. Expected: accurate preview capabilities; actual: stale text despite playable showdowns and 53 supported Jokers. Minimal fix: update the two informational strings during the separately authorized presentation/integration work. The strings largely predate this delta; this does not block mechanics review.
- Default `git diff --check BASE HEAD` reports five CSV records (`docs/content-manifest.csv:224–228`) because they have CRLF endings. Repeating with `core.whitespace=cr-at-eol` passes. This is documentation line-ending hygiene, not a runtime regression.

## Independent executable evidence

Ran:

```sh
node --test tests/core/showdown-heart.test.js tests/core/showdown-bell-acorn.test.js tests/core/showdown-leaf-vessel.test.js tests/core/showdown-oracle.test.js tests/core/victory-endless.test.js tests/core/endless-targets.test.js tests/core/export.test.js
```

Result: **104 tests, 104 PASS, 0 FAIL, 0 SKIP**, exit 0. This includes integrated save/reload, native target/choice fixtures, frozen cashout, victory/Endless, and standalone cyclic ESM linking/evaluation. The export test's native Node ESM exercise is not a replacement for actual Chromium.

Independently regenerated native fixtures:

```sh
python3 scripts/reference-rng/generate-showdown-fixtures.py --assets /workspace/scratch/2c556ddf4f1c/reference-apk/assets --luajit /workspace/scratch/2c556ddf4f1c/toolchains/LuaJIT/src/luajit --output /tmp/showdown-final-review-fixtures.json
cmp scripts/reference-rng/showdown-fixtures.json /tmp/showdown-final-review-fixtures.json
```

Generator reported `PASS native showdown hooks and Antes1–39; JIT/interpreter equal`; comparison exited 0, byte-identical. Original APK assets were read externally and were not copied into the repository. Also ran exact-range `git diff --check`; CRLF-aware form passed as described above.

## Known gates and limitations

- Missing creation ordinals on legacy owned Jokers intentionally block Heart/Acorn admission rather than guess native creation order; migration remains separately tracked. The supported physical deck model and 53/150 Joker slice are explicit existing scope limits, not newly discovered regressions.
- Native Ante39 NaN and its unwinnable comparisons are an intentional documented source decision. Durable tagged JSON deliberately avoids the original packer's dropped-target corruption. Neither behavior is a new accidental overflow finding.
- Profile wins/unlocks/stakes, remaining content and complete setup/end-round Joker hooks remain unfinished existing subsystems. A win overlay does not establish their completion.
- No new full 967-test run, complete 38-browser-suite run, Android build, or Android/device execution was performed by this reviewer. Root-provided evidence records local 967/967 PASS; CI38761923466 core966 PASS/one private-oracle skip and real Chromium desktop/mobile victory-Endless PASS, followed by the separate typography `null.getBoundingClientRect` failure that stops later full-pipeline gates. Earlier CI38688716888 covers the prior source checkpoint and does not certify the current entire pipeline.
- No local Chromium install/launch or VM UI substitute was attempted. Visual acceptance, actual Android Back/WebView/device behavior and complete native event-manager parity remain distinct gates. Extracted native callbacks with explicit adapters prove their stated contract, not full APK gameplay.

Only this report was written by the reviewer; root owns current status documentation and further numbered-work decisions.
