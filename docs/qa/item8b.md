# №8б — remaining packs and Spectral

20 October 2026. User selected №8б; №9 remains outside scope. Candidate APK0.4.41-preview/code54. Integration checkpoint; browser/Android CI and artifact verification pending.

Implemented all Standard, Buffoon and Spectral pack identities (normal/Jumbo/Mega), actual selection/capacity, retained Mega choices, physical playing cards with enhancement/edition/seal, Joker constructor order, target hand, skip/closure, and save/replay. Omen Globe Arcana uses the full original pool. All18Spectral effects now supported (11 newly implemented).

Independent source-derived generator oracle:4242cases, all pack identities, keyed streams and following raw draws, editions, enhancements, seals, rare inclusions and generation stickers. Spectral oracle:796cases, including24native add/remove passive boundaries. See spectral-native-contract.md for admitted callback boundaries and exclusions. Original private Lua/APK assets are not in source or release.

Persistence validates new physical identities, exact pack cardinality/family, modifier compatibility, creation order, initial/generated/extra hand draws, destruction provenance, permanent hand costs and signed underlying hand-size debt. Spectral uses retain an authenticated pre-use checkpoint across subsequent actions, including target IDs.

Independent review found an Important empty-hand softlock after consecutive Immolates. RED→GREEN regression verifies native next-frame refill without spending a hand/discard. Additional tests cover initial/after-discard Serpent refill, Heart without replacement poll, and empty-deck end-round callbacks; historical Bell choice is cleared on terminal empty-hand loss. Existing Hanged empty-deck behavior also uses the same round-ending path. No confirmed open Critical/Important findings from the review.

Fresh local full core:1439/1439PASS,0FAIL,0skip with private native sources. Android offline asset preparation and git diff --check PASS. Browser/Android CI pending. Do not treat this checkpoint as a completed release. Physical-device installation and complete original frame/event RNG parity are not claimed.
