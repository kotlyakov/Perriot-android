# Conditional APK shop run/save checkpoint — 2026-10-08

Source commit: b20c1fafd0377337c6ee037ea5d6198261b49ae2.

Local:169 core tests passed; standalone preview export and JavaScript syntax checks passed. Independent review checked167 tests and360 additional transactions; two findings reproduced in regression tests then fixed (mandatory native inventory/centre metadata/areas and atomic rejection of unavailable next-blind transitions).

Actions runs37777930878 and37777937355: SUCCESS. Root inspected job113313400017 logs:169 passed,0 failed; all11 browser suites completed including shop-state cashout/reload at four resolutions and failed-write check; BUILD SUCCESSFUL in2m4s; APK signature/alignment verification and artifact upload completed. CI debug artifact is not a stable-signed user release.

The new shop-state browser suite checks cashout once, inventory persistence/reload and failure before committing storage at1536×688,915×412,568×320,360×800. Existing ten suites remain in the pipeline. Android pipeline compiles a fresh debug APK and verifies its signature/alignment.

Scope: original conditional producer connected to new runs, actual hand history, voucher selection, cashout shuffle, saved inventory/context/native RNG and rerolls. Full startup boss/tag sequence, effect handlers, native item buying, pack/voucher UI and next-blind lifecycle remain open. Shop UI is still the earlier placeholder; this checkpoint is not a new playable shop release. Original APK was not launched; physical Android installation was not tested. Stable user APK0.4.6 remains preserved.
