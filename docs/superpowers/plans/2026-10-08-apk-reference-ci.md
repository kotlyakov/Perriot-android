# APK reference and CI Implementation Plan

> Use superpowers:executing-plans or subagent-driven-development.

**Goal:** сохранить проверенную0.4.5 и получить отдельную APK-driven линию с настоящей удалённой сборкой.
**Architecture:** существующиеJScore/UI и KotlinWebView; Git objects через подключённый GitHub, sourcecheckpoint без gamechanges, isolatedAPKbranch.
**Tech Stack:** Node24/Playwright, Gradle8.13/JDK17/AndroidSDK36/buildtools35.
**Spec:** BRANCHES.md, APK_REFERENCE_SPEC.md, APK_TRACEABILITY.md, REPOSITORY_RULES.md.

## Global Constraints
Утверждённый UI сохраняется; исходные APK/Lua/assets и ключ не коммитятся; main и чужие ветки не перезаписываются. Не заявлятьустановку/deviceparity без проверки.

## Review Focus
Состояниеcheckpoint точно045; CIпуть android/; browserimports доступны внеruntime; freshcompile безcachednative; подпись CIотличается отstablepreview при отсутствиисекрета.

## Task1 checkpoint
- [x] Получить актуальный mainSHA/tree.
- [x] Создать дерево из сохранённого045ZIP, сохранить в legacy/v0.4.5-working; проверитьref/core100.

## Task2 APKline
- [x] Перенести APK_REFERENCE_SPEC/APK_TRACEABILITY и независимо сверенные docs/apk-findings.
- [x] Создать apk-reference отcheckpoint, проверитьremoteSHA/tree.

## Task3 CI
- [x] Проверить workflow/launcher независимымQA.
- [x] ОпубликоватьизолированныйPR, дождатьсяbuild/node/UIchecks.
- [x] Приошибке изучитьjoblogs, исправитьпричину и повторить.
- [x] Скачатьartifact и проверитьофициальнойподписью/CRC/assetcontent; privatekeyнепубликовать.

## Task4 следующаяреализация
Полныймагазин реализуетсяпослеcatalog/lifecycle/RNGtrace; не заменятьслучайныйпул сокращённымвыдуманным. Каждаямеханика имеетAPKsymbol→spec→test→implementation.

## Ledger08.10.2026
Task1/2/3 complete: исходники045 сохранены; изолированная APKветка; Actions37762538941 success; стабильная подпись и28assetbytecheck/CRC/alignment.
Task4 in progress: pricequotationimplemented,9newtestsRED(missingmodule)→GREEN; npmtest109/109.
Ruling: gameUI/canonicalshopstate не меняются доcatalog/RNG/lifecycletrace; pure price module подготовлен отдельно, без выдуманного ассортимента.
