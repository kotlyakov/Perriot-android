# Approved card tooltips implementation plan

Goal: implement У-40 from the approved tooltips-v1 passport without altering game state or other approved screens.
Spec: docs/approved-ui/approved/tooltips-v1.md.
Architecture: retain shared card-tooltip interaction/placement; add one renderer for structured card details, reuse safe formatter and content metadata in field, shop and collection. Keep artwork and gameplay unchanged.
Tech stack: existing native DOM/CSS, Node tests, Playwright.

## Constraints and review focus
- Preserve main/settings/joker artwork from feat/menu-motion at 2fdf4fc; apk-reference is an older base.
- No tooltip sale button or sale price on collection/playing cards; hide sale label when forbidden.
- Dynamic values must reflect actual fields, including zero and fractional coefficients; do not sample RNG to display them.
- Hidden/locked entries must not leak their abilities or base rank.
- Bound the whole group after measuring, including stage letterboxing, safe areas and smaller collection container scale.
- Keep next-tap dismissal, drag cancellation, keyboard and save/RNG behavior.

## Task 1 — semantic rendering
- [x] Add failing model tests for modifiers, accumulated bonuses, statuses, sale suppression and concealed details.
- [x] Implement src/ui/card-description.js; integrate field.js, shop-screen.js and profile-screen.js.
- [x] Add scoped styling in existing web stylesheet; use horizontal attached windows, fallback compact layout.
- [x] Run model tests and existing formatter/content tests.

## Task 2 — bounds and verification
- [x] Add failing browser regression for rendered headings/statuses/seals/sale and boundaries.
- [x] Adapt shared placement to choose side or stacked layout, cap by available dimensions and remeasure after fonts.
- [x] Verify mouse/touch 1536×688, 915×412, 568×320 plus narrow viewport, large values and all four seals.
- [x] Run core suite, tooltip/collection/shop/drag regressions; inspect screenshots.
- [x] Review diff independently; record results, update У-40 and next proposed У-44. Commit and publish feature branch/PR within existing authorization; never claim unbuilt APK.
