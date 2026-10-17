# Fool Tarot implementation plan

1. Record the exact APK `The Fool` availability, event ordering and forced-card creation rules.
2. Add failing core tests for missing history, successful copy, full slots, duplicate centres, debuff, collision rejection and save/reload.
3. Implement the smallest deterministic core effect without advancing keyed selection RNG (preserve native constructor Math draws) or changing unrelated state.
4. Expose truthful Russian UI text and an official Chromium use/reload scenario.
5. Update parity, roadmap, progress, STATUS and preview versions; run core/export/assets locally.
6. Publish an isolated PR, require full Chromium + fresh Android/package CI, then merge only on success.

Boundary: this block implements `c_fool` only. Targeted Tarot cards, random generators, profiles and remaining consumables stay open.

Execution 10.10: resumed existing draft. RED→GREEN: native pricing/Math draws; negative capacity; banned rejection; malformed context. 320 core and local UI PASS. Independent QA completed. Ruling: keep banned combined-pool fallback and deferred sound RNG explicit gaps; unavailable challenge cases must not be approximated. Review/status/official CI required before merge.
