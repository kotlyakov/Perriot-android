# Fool Tarot 0.4.15/code28 verification

Source head: 0824c96a08161567a1eb23e83f9433a13accffcf. PR #12 merge: 0b4078f071f14ccf5f2c0c9bf44014f98adbbcd4. Actions37992249865 SUCCESS.

- Core320/320 PASS, including13 Fool-focused cases.
- Full23 local UI suites PASS with research Chromium; official Chromium full23 suites PASS in Actions.
- Export and offline assets PASS.
- Fresh Android Gradle compilation PASS; apksigner verification and zipalign PASS; CI debug APK artifact11646535465 uploaded.
- Independent native-source QA checked negative slot removal, forced-key bypass, delayed history, pricing and five direct raw Math draws. Malformed context regression was reproduced RED and fixed GREEN. Old unsupported-card fixtures now use Magician instead of the implemented Fool.
- Desktop/touch/full slots/disabled history/doubleclick/copy/use/reload/write failure covered; mobile screenshot inspected.

Scoped gaps: banned forced key needs exact combined-pool fallback; deferred sound/event RNG and discovery/profile remain open. No original Lua/art/audio added. CI debug APK is an intermediate build; physical Android installation/runtime and user acceptance were not performed. Full manifest parity remains incomplete.
