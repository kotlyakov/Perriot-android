# Линии разработки

- `legacy/v0.4.5-working`: сохранённые проверенные исходники0.4.5, commit4ce6e7665c27112fdaf0dc880ce13b94c21af4be. Игровое поведение заморожено.
- `legacy/v0.4.4-approved`: утверждённые исходники0.4.4, commit ae7cba5d7effc3ab8d1343b01cffa3f87fc5baac.
- `apk-reference`: развитие по загруженному Balatro APK SHA2566236dc68a312d04295839cfbfd2699d4751877bdf162c3a4ce425481d28397bd. Сохраняет утверждённый UI «Пьеро»; APK — основной эталон механик.
- `main`: существующая база репозитория; не перезаписывается без проверенного PR.

Соседний чат называл основную линию main/apk-reference логически. Реальное имя apk-reference: Git запрещает одновременно refs/heads/main и refs/heads/main/apk-reference. Исходный APK/Lua/чужие ресурсы и приватный ключ не публикуются.
