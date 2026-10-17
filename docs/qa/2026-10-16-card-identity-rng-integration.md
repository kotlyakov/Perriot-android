# Numbered item4 integration — 0.4.35-preview/code48

Source417e30351ae9bf76389e12f22d20e1c85cba2368, tree9d4f8acb57fd7aede0639ca914af541d33420150. All27 changed blobs match the local reviewed commit e3d39a5. Base f1e3d6c3c00ca817f0db67700861cb289723ccaa, target apk-reference. PR31: https://github.com/kotlyakov/Perriot-android/pull/31

Local full command with LUAJIT_BIN, NATIVE_APK_ASSETS, NATIVE_LUAJIT:984PASS/0FAIL/0SKIP. Standard full command with LUAJIT_BIN only:983PASS0skip. Native source is private and absent from public-facing CI checkout; do not confuse CI's expected private-source skip with the local no-skip native result.

Independent review: docs/qa/2026-10-16-card-identity-rng-review.md,84targetedPASS, no open Critical/Important. Generated Glass ID substitution, Hook career/reseed ordering, Hanged+Psychic rejected-hand reload found and fixed; checks repeated. Source generators compile. Identity oracle3seeds and354scoring cases regenerated independently; compressed output byte-identical (JIT/interpreter identical). Phase-only Stone oracle1407cases is supplemental evidence, not a substitute for the executed evaluate_play body.

CI38853367669: https://github.com/kotlyakov/Perriot-android/actions/runs/38853367669 — SUCCESS.983total/982PASS/1expected private-source skip;39 actual Chromium suites. New physical-copy identity/Death/score/reload1536×688 and915×412 PASS. Fresh Gradle BUILD SUCCESSFUL; APK v2 signature and alignment verified. PR31 merged d95975988b7c92f0b1c2e2e9c7afad1d4c8f12a5. Source417e303, tested synthetic merge c469ed0 and actual merge compare with zero changed files. APK artifact12025704512 ZIPsha2564f211a03820e14c96b785657f9b4747ec1e05207217a669da4a2bb5b89d20f10 verified on download. APKsha25615b14f90a8432f1d443106e4a8187a3e69b8ce0952efa2b88073b94f0792c8f2 matched SHA256SUMS; build.txt records CI38853367669/c469ed0. Debug signature; installation/update unverified. Build artifacts are from the tested PR tree, not a claimed post-merge rerun.

Action scope: synchronous authoritative play-score-v1; legacy scores retain old replay semantics without invented historical raw draws. Render previews remain pure. Cloud9 frame scheduling, original selection-preview side effects and Mark/Plant setup callbacks are explicitly not whole-APK parity proofs; П-RNG-STONE remains open for full event/frame parity. No new content,53/150Jokers. Item5 not started. Physical Android installation/update is not checked.


Status: numbered item4 engine dependency complete; proposed item5 awaits user. General full frame/event parity remains open as specified above.
