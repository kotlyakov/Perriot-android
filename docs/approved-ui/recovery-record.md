# Пьеро — реестр утверждённого интерфейса

Обновлено: 24.10.2026 (Москва). Это реестр приёмки пользователем, а не отчёт тестов.

## Как продолжать из другого чата

1. Читать AGENTS.md → STATUS.md → этот реестр → паспорт нужного окна.
2. Сопоставить рабочую ветку и версию паспорта. Не считать старый STATUS или старый APK текущим дизайном.
3. Перед изменением окна сверять его элементы, состояния и переходы с паспортом. Сохранять утверждённые решения; менять их только по новому прямому поручению пользователя.
4. После явного «утверждаю» обновлять строку реестра, паспорт, связанные ID бэклога и STATUS. Сохранять версию эталона; новые изменения получают следующую версию и статус «на согласовании» до приёмки.
5. Тесты PASS не означают, что пользователь утвердил дизайн. Отсутствие замечаний тоже не означает приёмку.
6. Для нового окна заводить паспорт по TEMPLATE.md. Не оставлять свойства подразумеваемыми: указывать значение, ссылку на точный эталон либо «не согласовано».

## Реестр

| ID окна | Область | Версия | Приёмка | Что именно утверждено | Паспорт |
| --- | --- | --- | --- | --- | --- |
| settings | Настройки: Игра / Звук | v1, 24.10.2026 | УТВЕРЖДЕНО пользователем | Состав, текущий показ оформления, яркая ровная шкала скорости; истлевание116мс + разворачивание152мс; в сумме268мс | approved/settings-v1.md |
| home | Главное меню | v1,24.10.2026 | УТВЕРЖДЕНО пользователем отдельно | Текущая компоновка, цвета, надписи, внешняя кнопка профиля, постоянное дыхание; главный экран без входящего подъёма | approved/home-v1.md |
| profile | Профиль игрока | рабочий вариант | Полная приёмка в этом чате не зафиксирована | Требование имени до10символов сохраняется; это не приёмка всех деталей окна | У-46 |
| collection | Категории и страницы коллекции | рабочий вариант | Открыта | У-41–43 проверены технически; оформление подсказки У-40 остаётся открытым | BACKLOG.md |
| run-setup | Новая партия / продолжение / испытания | рабочий вариант | Открыта | Появление/уход снизу поручены; общий дизайн не объявлять утверждённым | BACKLOG.md |
| options | Внутриигровое меню | рабочий вариант | Открыта | Прямые требования об удалённых пунктах сохраняются | BACKLOG.md |
| play | Игровое поле | рабочий вариант | НЕ ПРИНЯТО | Пользователь указал несоответствие оригиналу, У-44 открыт | BACKLOG.md |
| run-info / end | Партия / победа / поражение | рабочий вариант | Полная приёмка не зафиксирована | Не объявлять утверждёнными по успешным тестам | BACKLOG.md |

Основание приёмки settings-v1: после демонстрации ускоренного в5раз перехода пользователь написал: «Отлично. Сохраняем. Утверждаем». У-48/У-49 приняты. Это не согласие на сборку APK, слияние веток или отправку исходников на GitHub.

## Доступность исходников

Репозиторий: kotlyakov/Perriot-android. Рабочая ветка feat/menu-motion. Утверждённый код:04694ae; паспорта добавлены следующим коммитом. Отправка на GitHub ранее остановлена автоматической проверкой; разрешение на повторную отправку не получено. Поэтому не предполагать, что удалённый репозиторий уже содержит этот вариант. Самостоятельный экспорт Pierrot_APPROVED_UI.md содержит паспорт и точные исходные выдержки для продолжения.

Отдельное основание home-v1: «Главное меню тоже утверждаем!» —24.10.2026. У-45 принят. Внутреннее окно профиля, коллекции, настройки новой партии и игровое поле не утверждены этим сообщением.


---

# Паспорт settings-v1 — Настройки

Статус: УТВЕРЖДЕНО пользователем 24.10.2026. Связанные задачи: У-48, У-49.
Эталон реализации04694ae, ветка feat/menu-motion. Снимки исходников: settings-v1/; не редактировать задним числом. Следующее изменение оформлять как v2.

## Границы приёмки

Утверждён показ settings-paper после ускорения бумажных переходов в5раз. Содержание, оформление и переходы ниже сохранять. Показ — отдельное компактное окно с настоящими функциями рендера настроек. Геометрия показа и игрового экрана различается явно (ниже). Это не утверждение о проверке на физическом Android и не приёмка всего главного меню.

## Состав и расположение элементов

Размеры игры — логические пиксели поля1536×688, масштабируются равномерно. Дробные доли масштабируются вместе с окном. Точный каскад CSS сохранён в settings-v1/window-review.css.

| Элемент / селектор | Текст, порядок, поведение | Расположение и размеры | Цвета и оформление |
| --- | --- | --- | --- |
| dialog.menu-dialog[data-window=settings] | Настройки; первая вкладка Игра | В игре центр50%/50%, translate(-50%,-50%) и --ui-scale; ширина900; высота по содержимому; padding14; рамка6; радиус18 | Фон #183332, рамка #899c98, текст #f0e5c8; тени 0 7px #526663,0 13px #102626,inset 0 0 0 4px #0e2425; Rubik |
| #dialog-title | Отдельный крупный заголовок не выводится | display:none | Не добавлять новый заголовок поверх вкладок |
| #dialog-body | Контейнер вкладок и содержимого | В игре padding24px 16px, min-height210, height:auto, радиус12 | Фон #16312e, внутренняя рамка inset 0 0 0 3px #0e2425 |
| .menu-window-tabs | Слева «Игра», справа «Звук»; «Графики» нет | Одна строка, одинаковая ширина, gap12; высота46; шрифт22 | Неактивная #bf4e43; активная #a2342e, outline2 #e0d5b8, тень0 4px #722f2b; текст #f0e5c8 |
| .native-settings | На Игра только блок скорости; на Звук только2регулятора | Вертикальная колонка, выравнивание по центру, gap8 | Фон содержимого прозрачный; виден фон контейнера |
| .settings-speed | Подпись «Скорость игры» | Блок550, подпись сверху по центру, шрифт20, gap12 | Текст #f0e5c8 |
| .settings-speed-track | Четыре кнопки:0,5×;1×;2×;4× | Четыре равные колонки, gap14, padding7px 0; общая горизонтальная ось | Полоса6px #74918a, радиус3, по вертикальному центру кнопок |
| #game_speed_0_5 / _1 / _2 / _4 | Выбрать реальную скорость; ровно одна aria-pressed=true | Каждая высотой44, шрифт24, padding0, радиус9 | Обычная #f59b05, текст #17332e, тень0 4px #985d00; выбранная #08b9f0, текст #102626, тень0 4px #066b89, outline3 #f0e5c8 с отступом2; без текстовой тени |
| .settings-speed-track button:focus-visible | Клавиатурный фокус отдельно от выбора | outline3, offset3 | #f0e5c8 |
| #audio_music | «Музыка», процент справа, ползунок ниже | Первая строка Звука, ширина550; grid1fr 70px, gap3; подпись19; input24высотой на всю ширину | Акцент ползунка #f59b05; отображается текущее значение, диапазон0–100% |
| #audio_effects | «Звуковые эффекты», процент справа, ползунок ниже | Вторая строка, та же геометрия | То же оформление; отдельное значение и сохранение |
| #dialog-actions button | В игре «Назад» | Под содержимым; на всю ширину, высота54, шрифт25 | #f59b05, текст #f0e5c8, тень0 5px #9c6512 |

У каждой строки звука подпись и процент находятся на первой линии, ползунок на второй. 0% выключает соответствующий канал. Музыка/эффекты сохраняются через существующие audioPreferences; ошибка записи не притворяется успехом. Скорость сохраняется под pierrot.game-speed; при отсутствии корректного значения1×. Она меняет длительности игровой презентации, не расчёт правил/RNG, не высоту звука и не длительность переходов настроек.

Полностью УДАЛЕНЫ: вкладка «Графика», общая громкость, тряска экрана, расположение кнопок розыгрыша/сброса, наклейки ставок, контрастные масти, переключатель уменьшенного движения. Не возвращать их серыми или disabled. Системная настройка prefers-reduced-motion продолжает учитываться без отдельного видимого переключателя.

## Показ, который утвердил пользователь

scripts/build-settings-review.mjs → /workspace/pierrot-settings-paper.html. Это демонстрационная обёртка, не отдельная реализация настроек.

В показе окно в нормальном потоке, ширина100%, максимум700px, padding14; вкладки имеют нижний отступ24. Контент padding14px 8px, min-height160; ширины блоков100%, максимум550; кнопки скорости48pxвысотой, шрифт22, gap12. #dialog-body padding14, min-height0. Кнопка Назад скрыта только в автономном показе. На ширине≤420: внешний padding10px 2px, окно padding10 и рамка4, тело padding10, вкладки20px, gapкнопок8. Внешний фон показа не является игровым фоном. Эти отличия не переносить случайно в глобальные CSS игры.

## События и анимации

| Событие | Что анимируется | Точное поведение | Длительность / кривая |
| --- | --- | --- | --- |
| Открыть настройки | В игре весь dialog | Подъём снизу за границей экрана в исходный центр; центрирование и масштаб сохраняются | 420мс, cubic-bezier(.16,1,.3,1) |
| Первое содержимое | Только .menu-window-content | Из скомканной бумаги разворачивается в плоскость; вкладки и рамка не сминаются | 152мс, cubic-bezier(.2,.65,.25,1) |
| Игра→Звук или Звук→Игра, фаза1 | Старое содержимое | Истлевание: отверстия растут из3центров, sepia/затемнение/размытие, подъём на18px, opacity→0 | 116мс, ease-in |
| Тот же переход, фаза2 | Новое содержимое | После завершения фазы1 заменяется DOM; новый лист разворачивается, складки исчезают | 152мс, cubic-bezier(.2,.65,.25,1) |
| Складки листа | ::after содержимого | Светлые/тёмные диагональные складки; opacity1 до28%, .55 на65%,0 вконце | 152мс, ease-out |
| Закрыть настройки | В игре весь dialog | Уход вниз за экран, затем фактическое закрытие | 260мс, cubic-bezier(.4,0,1,1) |

Переход вкладки итого268мс. Это в5раз быстрее первоначальных580+760мс; не возвращать прежние времена. Скорость игры0,5×…4× НЕ меняет этот эффект.

Разворачивание: старт perspective850px, rotateX68°, rotateZ−13°, skew(18°,−12°), scale(.12,.07), brightness.5, неровный восьмиточечный контур; на42% rotateX−24°, rotateZ5°, scale(.62,.42), brightness.82; на76% rotateX8°, rotateZ−1°, scale(1.025,.96), brightness1.12; вконце плоский прямоугольник scale1, brightness1. Точные полигоны и все кадры сохранены в settings-v1/settings-paper.js.

Истлевание: --paper-burn0%→22%на35%→67%на75%→150%; центры масок(12%,72%),(76%,14%),(92%,90%), mask-composite:intersect. Переход без отдельного огня/звука. Точные фильтры и маски сохранены в эталонных JS/CSS.

Во время перехода содержимое inert и aria-busy=true. Кнопки вкладок остаются доступными, быстрые переключения выполняются последовательно и завершаются последней выбранной вкладкой. Повторный клик по уже выбранной вкладке не запускает эффект. После перехода inert=false и aria-busy=false. При prefers-reduced-motion:reduce — смена сразу, без бумажного эффекта и без движения окна.

Подъём/уход окна — ранее заданное пользователем общее правило и текущая реализация. Компактный показ не демонстрировал весь игровой фон или кнопку Назад; это не отдельная полная приёмка этих областей. Бумажный переход Игра↔Звук принят явно.

## Проверка и воспроизведение

- node --test tests/core/native-menu-layout.test.js tests/core/game-speed.test.js —6PASS на утверждённом коде; проверены состав, рабочая скорость, очередность выхода/входа и быстрый выбор вкладок.
- node scripts/build-settings-review.mjs — генерация показа и проверка синтаксиса.
- Подтверждение пользователя есть. Браузерная автоматическая визуальная проверка/физический Android не выполнены. APK не собирать без нового поручения.
- Для точного восстановления использовать сохранённые файлы, а не пересказывать эффект приблизительно. Перечень SHA256 — settings-v1/SHA256SUMS.


---

# Паспорт окна <id>-v<номер>

Статус: на согласовании / утверждено / отклонено / заменено. Дата, источник явной приёмки, версия кода, задачи бэклога. Предыдущую версию не затирать.

## Границы приёмки

Какие части окна и состояния показаны и утверждены; какие не проверены или не согласованы. Отдельно геометрия автономного показа и продукта.

## Элементы

| ID / селектор | Текст / порядок | Видимость и состояния | Геометрия / адаптация | Цвета / рамки / тени | Шрифт | Действие / сохранение / ошибка |
| --- | --- | --- | --- | --- | --- | --- |

Каждый видимый элемент описать отдельной строкой. Указать удалённые элементы и условия, при которых нельзя их возвращать.

## Переходы

| Событие | Объект | Начало / промежуточные кадры / конец | Время / easing / задержка | Блокировка / отмена / быстрые клики | Reduced motion |
| --- | --- | --- | --- | --- | --- |

## Эталон и проверки

Точный снимок исходников/ресурсов и контрольные суммы; способ воспроизведения. Отдельно результат тестов, визуальная проверка, пользовательская приёмка, ограничения и следующий шаг.


---


## Точный эталон: settings-paper.js

```javascript
// Only settings content changes; the window frame and tabs keep their position.
export async function animateSettingsPaper(body,leaving=false){
 if(!body.animate||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 body.classList.add('settings-paper');
 body.classList.toggle('settings-paper-burning',leaving);
 body.classList.toggle('settings-paper-unfolding',!leaving);
 const keyframes=leaving?[
  {opacity:1,filter:'sepia(0) brightness(1) blur(0px)','--paper-burn':'0%',transform:'translateY(0)'},
  {opacity:1,filter:'sepia(.85) brightness(1.55) blur(.3px)','--paper-burn':'22%',transform:'translateY(-2px)',offset:.35},
  {opacity:.7,filter:'sepia(1) brightness(.65) blur(1px)','--paper-burn':'67%',transform:'translateY(-8px)',offset:.75},
  {opacity:0,filter:'sepia(1) brightness(.4) blur(3px)','--paper-burn':'150%',transform:'translateY(-18px)'}
 ]:[
  {opacity:0,transform:'perspective(850px) rotateX(68deg) rotateZ(-13deg) skew(18deg,-12deg) scale(.12,.07)',filter:'brightness(.5)',clipPath:'polygon(20% 36%,48% 16%,82% 34%,67% 62%,84% 84%,42% 72%,13% 85%,29% 55%)'},
  {opacity:1,transform:'perspective(850px) rotateX(-24deg) rotateZ(5deg) skew(-8deg,4deg) scale(.62,.42)',filter:'brightness(.82)',clipPath:'polygon(4% 10%,49% 0,96% 9%,100% 55%,95% 96%,48% 100%,2% 93%,0 45%)',offset:.42},
  {opacity:1,transform:'perspective(850px) rotateX(8deg) rotateZ(-1deg) skew(2deg,0deg) scale(1.025,.96)',filter:'brightness(1.12)',clipPath:'polygon(0 0,50% 0,100% 0,100% 50%,100% 100%,50% 100%,0 100%,0 50%)',offset:.76},
  {opacity:1,transform:'perspective(850px) rotateX(0) rotateZ(0) skew(0,0) scale(1)',filter:'brightness(1)',clipPath:'polygon(0 0,50% 0,100% 0,100% 50%,100% 100%,50% 100%,0 100%,0 50%)'}
 ];
 const animation=body.animate(keyframes,{duration:leaving?116:152,easing:leaving?'ease-in':'cubic-bezier(.2,.65,.25,1)',fill:'both'});
 try{await animation.finished;}catch{}finally{animation.cancel();body.classList.remove('settings-paper-burning','settings-paper-unfolding');}
}

```


---


## Точный эталон: window-motion.js

```javascript
// Individual translate keeps each window's existing centering and scale.
const motions=new WeakMap();
export function slideWindow(node,closing=false,done=()=>{}){
 motions.get(node)?.cancel();motions.delete(node);
 if(matchMedia('(prefers-reduced-motion: reduce)').matches){done();return;}
 const parent=node.parentElement,scale=parent?.offsetWidth?parent.getBoundingClientRect().width/parent.offsetWidth:1;
 const distance=(innerHeight-node.getBoundingClientRect().top+32)/(scale||1);
 const animation=node.animate(closing?[{translate:'0 0'},{translate:`0 ${distance}px`}]:[{translate:`0 ${distance}px`},{translate:'0 0'}],{duration:closing?260:420,easing:closing?'cubic-bezier(.4,0,1,1)':'cubic-bezier(.16,1,.3,1)',fill:'both'});
 motions.set(node,animation);
 animation.finished.then(()=>{if(motions.get(node)!==animation)return;motions.delete(node);animation.cancel();done();},()=>{});
}
export function cancelWindowMotion(node){motions.get(node)?.cancel();motions.delete(node);}

```


---


## Точный эталон: game-speed.js

```javascript
export const GAME_SPEEDS=[.5,1,2,4];
let speed=1;
try{const saved=Number(globalThis.localStorage?.getItem('pierrot.game-speed'));if(GAME_SPEEDS.includes(saved))speed=saved;}catch{}
export const getGameSpeed=()=>speed;
export function setGameSpeed(value){
 if(!GAME_SPEEDS.includes(value))throw Error('Недопустимая скорость');
 globalThis.localStorage?.setItem('pierrot.game-speed',String(value));speed=value;return speed;
}
// Presentation timing only: rules, RNG, audio pitch and window motion stay independent.
export const gameDuration=ms=>ms/speed;

```


---


## Точный эталон: window-review.css

```css
/* All review windows share the game's logical coordinate scale. */
dialog.menu-dialog{position:fixed;left:50%;top:50%;margin:0;transform:translate(-50%,-50%) scale(var(--ui-scale,1));transform-origin:center;width:1080px;height:620px;max-width:none;max-height:none;overflow:visible;border:7px solid #899c98;border-radius:22px;padding:20px 22px 16px;background:#183332;color:#f0e5c8;box-shadow:0 7px #526663,0 13px #102626,inset 0 0 0 4px #0e2425;font-family:Rubik,sans-serif;touch-action:manipulation}
dialog.menu-dialog[open]{display:flex;flex-direction:column;gap:12px}dialog.menu-dialog::backdrop{background:#263a37b8;backdrop-filter:blur(2px)}
.menu-dialog #dialog-title{font-size:32px;line-height:38px;text-align:center;margin:0;flex-shrink:0}.menu-dialog #dialog-body{height:452px;min-height:0;flex:1;overflow:visible;padding:10px;background:#102626;border-radius:12px;box-shadow:inset 0 3px #081e1e}.menu-dialog #dialog-actions{flex-shrink:0;display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:14px;min-height:58px}.menu-dialog #dialog-actions button{margin:0;width:100%;font-size:25px;height:54px;padding:7px 16px;background:#f59b05;box-shadow:0 5px #9c6512}
.menu-dialog button{font-family:inherit;cursor:pointer;line-height:1.15;border:0;border-radius:9px;color:#f0e5c8;text-shadow:1px 2px #102626;font-weight:700;box-shadow:0 4px #0a2121}.menu-dialog button:focus-visible{outline:3px solid #f0e5c8;outline-offset:2px}.menu-dialog button:disabled{opacity:.45;cursor:default}
.options-menu{height:100%;display:grid;grid-template-columns:1fr 1fr;align-content:center;gap:24px;padding:20px 110px}.options-menu button{margin:0;height:88px;font-size:30px;background:#3d8c79}.options-menu button:first-child{background:#f59b05}
.menu-window{height:100%;display:flex;flex-direction:column;gap:16px}.menu-window-tabs{display:flex;gap:12px;flex-shrink:0}.menu-window-tabs button{flex:1;height:51px;margin:0;font-size:23px;background:#3b7772;padding:8px}.menu-window-tabs [aria-selected=true]{background:#039fea;box-shadow:0 4px #07536a;outline:2px solid #b6d2c8}.menu-window-content{flex:1;min-height:0;padding:15px 20px;border-radius:10px;background:#244441;font-size:22px}.menu-window-content h2{font-size:29px;margin:8px 0 20px;text-align:center}.menu-note{font-size:19px!important;line-height:1.4;color:#d7c49a;margin:25px 0 0}.settings-summary{font-size:23px!important;line-height:1.5}.settings-row{display:grid;grid-template-columns:1fr 100px;gap:16px;margin:25px 0;font-size:26px}.settings-row input{grid-column:1/-1;grid-row:2;width:100%;height:30px;accent-color:#f59b05}.settings-row output{text-align:right}.run-hands{display:grid;grid-template-columns:1fr 1fr;gap:10px 20px}.run-hand{display:grid;grid-template-columns:1fr auto 45px 15px 30px;align-items:center;gap:6px;min-height:48px;padding:7px 10px;background:#102c2a;border-radius:8px;font-size:19px}.run-hand strong{font-size:19px}.run-hand span{font-size:16px}.run-blinds{height:100%;display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.run-blind{padding:16px 12px;background:#173733;border:4px solid #496b66;border-radius:12px;text-align:center}.run-blind h2{font-size:26px}.run-blind p{font-size:22px!important}.run-blind strong{display:block;margin-top:45px;font-size:20px}.run-vouchers{display:grid;grid-template-columns:1fr 1fr;gap:16px}.run-voucher{padding:12px;background:#102c2a;border-radius:8px}.run-voucher strong{font-size:22px}.run-voucher p{font-size:17px;line-height:1.35;margin:8px 0 0}.menu-paging{display:flex;align-items:center;justify-content:center;gap:20px;margin-top:15px}.menu-paging button{margin:0;font-size:26px;padding:3px 25px}.menu-empty{display:grid;place-items:center;height:85%;font-size:25px!important}
/* Native hierarchy uses screen-specific dimensions, not one universal panel. */
dialog.menu-dialog{height:auto;min-height:0;padding:14px;gap:12px;width:940px;border-width:6px;border-radius:18px}
.menu-dialog #dialog-title{display:none}
.menu-dialog #dialog-body{height:auto;min-height:0;flex:none;padding:16px;background:#16312e;box-shadow:inset 0 0 0 3px #0e2425}
.menu-dialog #dialog-actions{min-height:54px;gap:12px}.menu-dialog #dialog-actions:empty{display:none}
.menu-dialog #dialog-actions button{height:54px;margin:0;font-size:25px}
.menu-dialog[data-window=options]{width:660px}
.options-menu{display:flex;flex-direction:column;gap:13px;padding:8px 45px;height:auto}
.options-menu button{width:100%;height:51px;margin:0;font-size:26px;background:#c94b3e}
.options-menu button:first-child{background:#c94b3e}
.options-seed{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:10px;min-height:45px;font-size:20px}
.options-seed strong{padding:10px;border-radius:6px;background:#b54039;font-size:23px;text-align:center}
.options-seed button{font-size:17px;width:140px;height:42px;background:#087bad}
.menu-dialog[data-window=settings]{width:900px}.menu-dialog[data-window=settings] #dialog-body{height:508px}
.menu-window{gap:14px}.menu-window-content{padding:10px 14px;background:transparent}
.menu-window-tabs button{height:46px;font-size:22px;background:#bf4e43}
.menu-window-tabs [aria-selected=true]{background:#a2342e;outline:2px solid #e0d5b8;box-shadow:0 4px #722f2b}
.native-settings{display:flex;flex-direction:column;align-items:center;gap:13px}
.native-settings .settings-row{width:550px;display:grid;grid-template-columns:1fr 70px;gap:3px;margin:0;font-size:19px;text-align:center}
.native-settings .settings-row input{height:24px;grid-column:1/-1;width:100%}
.native-settings .settings-cycle{width:550px;display:flex;flex-direction:column;align-items:stretch;gap:5px;font-size:20px;text-align:center}
.settings-cycle>div{display:grid;grid-template-columns:48px 1fr 48px;align-items:center;gap:8px;background:#902f2c;border-radius:8px}
.settings-cycle button{height:31px;background:#bd493c;font-size:24px}.settings-cycle strong{font-size:18px}
.settings-toggle{display:flex;gap:12px;font-size:19px;align-items:center}.settings-toggle input{width:23px;height:23px;accent-color:#b54039}
.native-settings .menu-note{font-size:14px!important;line-height:1.2;margin:2px 0 0;text-align:center}
.menu-dialog[data-window=party]{width:1010px}.menu-dialog[data-window=party] #dialog-body{height:532px}
.run-hands{display:flex;flex-direction:column;gap:5px}
.run-hand{display:grid;grid-template-columns:92px minmax(0,1fr) minmax(90px,auto) 18px minmax(75px,auto) 18px 55px;gap:8px;min-height:29px;padding:3px 8px;background:#3b514b;font-size:18px}
.run-hand strong{font-size:19px}.run-hand .hand-level{background:#e8ddc0;color:#173d37;border:1px solid #f0e5c8;border-radius:5px;padding:4px;text-align:center;font-size:17px}
.run-hand .hand-chips,.run-hand .hand-mult{padding:4px 7px;border-radius:4px;text-align:right;background:#078abd;color:#f0e5c8;font-size:19px;overflow-wrap:anywhere}
.run-hand .hand-mult{background:#b34038;text-align:left}.run-hand .hand-played{text-align:center;background:#173d37;padding:5px;color:#edba76;border-radius:4px}
.run-blind{padding:8px;border-width:3px}.run-blind h2{font-size:23px;margin:5px 0 12px}.run-blind p{font-size:17px!important;margin:6px}.run-blind strong{margin:8px 0;font-size:20px}
.run-blind-token{font-size:44px;background:#214d48;border:5px dashed #a9b9a6;border-radius:50%;width:92px;height:92px;margin:10px auto;display:grid;place-items:center}.run-blind .run-blind-target{font-size:29px;color:#e05645}.run-blind-description{min-height:48px}
.menu-dialog[data-window=collection-index]{width:1030px}.menu-dialog[data-window=collection]{width:1040px}
.menu-dialog[data-window=profile]{width:720px}
.menu-dialog[data-window=end]{width:1160px}.menu-dialog[data-window=end] #dialog-body{height:570px;padding:8px}.end-window{display:grid;grid-template-columns:190px minmax(0,1fr);gap:15px;height:100%}
.end-mascot{align-self:center;justify-self:center;width:150px;height:210px;border:7px solid #d7c49a;border-radius:14px;background:#f0e5c8;color:#ad3c33;display:grid;place-items:center;font-size:95px;transform:rotate(-8deg);box-shadow:0 8px #102626}
.end-panel{display:flex;flex-direction:column;gap:12px}.end-heading{text-align:center;font-size:43px!important;margin:0!important;color:#ebc37b}.end-window[data-outcome=lost] .end-heading{color:#d95749}
.end-best{display:grid;grid-template-columns:1fr 1fr;gap:12px}.end-best .end-score{display:flex;flex-direction:column;align-items:center;gap:7px;font-size:20px}
.end-score{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:18px;min-height:38px}.end-score strong{background:#102626;border-radius:5px;padding:6px 10px;color:#e7bc7b;overflow-wrap:anywhere;max-width:75%}
.end-columns{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:18px}.end-counters,.end-progress{padding:8px;background:#23463f;border-radius:8px}.end-controls{display:flex;flex-direction:column;gap:13px;margin-top:12px}.end-controls button{height:56px;font-size:23px;background:#b74339;margin:0}
.end-panel>button{height:54px;background:#087bad;font-size:27px}.end-counters button{height:30px;font-size:17px;background:#087bad;margin:2px 0 0;width:100%}.end-note{font-size:14px;margin:0;text-align:center}
.menu-dialog[data-window=collection-index] #dialog-body{height:500px}
.menu-dialog[data-window=collection] #dialog-body{height:560px}
.menu-dialog[data-window=profile] #dialog-body{height:360px}
.collection-tooltip[hidden]{display:none!important}
.collection-grid[data-set=Blind] .collection-symbol{font-size:17px}
.collection-grid[data-set=Blind] .collection-card{gap:3px;padding:4px;line-height:1.05}
.native-settings{gap:8px;justify-content:center}.native-settings .settings-cycle{gap:3px;font-size:18px}.settings-cycle button{height:28px}
/* Reset the native modal's bottom inset before measuring content height. */
dialog.menu-dialog{right:auto;bottom:auto}
.options-menu>button{padding:6px 12px}.settings-cycle button{padding:0}
.end-score{min-height:30px;font-size:17px}.end-score strong{padding:3px 8px}.end-counters button{padding:2px 8px}
.used-voucher-groups{display:flex;flex-direction:column;justify-content:center;gap:18px;min-height:270px}.used-voucher-row{display:flex;justify-content:center;gap:16px}.used-voucher-family{position:relative;flex:0 1 155px;height:96px}.used-voucher-family button{position:absolute;left:calc(var(--voucher-index)*8px);top:calc(var(--voucher-index)*17px);width:calc(100% - 8px);height:72px;margin:0;padding:5px 8px;background:#e8ddc0;color:#193d34;border:3px dashed #bb9c5b;border-radius:8px;font-size:16px;text-shadow:none}.menu-window-content:has(.used-voucher-groups){position:relative}.voucher-tooltip{position:absolute;left:50%;bottom:10px;transform:translateX(-50%);width:430px;padding:15px;background:#24483f;border:3px solid #d7c49a;border-radius:10px;z-index:5}.voucher-tooltip[hidden]{display:none}.voucher-tooltip p{font-size:18px}.voucher-tooltip button{width:100%;height:35px;font-size:18px;padding:3px}

.menu-dialog[data-window=collection][data-collection-set=Joker]{width:720px}

.voucher-tooltip{pointer-events:none}.menu-window-content{position:relative}

/* Inactive game options read as inactive as a whole, including their captions. */
.native-settings .settings-speed{display:flex;flex-direction:column;gap:12px;width:550px;margin:0 0 6px;text-align:center;font-size:20px}
.settings-speed-track{position:relative;display:grid;grid-template-columns:repeat(4,1fr);align-items:center;gap:14px;padding:7px 0}
.settings-speed-track::before{content:"";position:absolute;inset:calc(50% - 3px) 0 auto;height:6px;background:#74918a;border-radius:3px;pointer-events:none}
.menu-dialog .settings-speed-track button{position:relative;height:44px;min-width:0;margin:0;padding:0;font-size:24px;background:#f59b05;color:#17332e;text-shadow:none;box-shadow:0 4px #985d00;opacity:1}
.menu-dialog .settings-speed-track button[aria-pressed=true]{background:#08b9f0;color:#102626;box-shadow:0 4px #066b89;outline:3px solid #f0e5c8;outline-offset:2px}
.menu-dialog .settings-speed-track button:focus-visible{outline:3px solid #f0e5c8;outline-offset:3px}

/* Settings now contain only controls the player can use. */
dialog.menu-dialog[data-window=settings] #dialog-body{height:auto;min-height:210px;padding:24px 16px}

@property --paper-burn{syntax:'<percentage>';inherits:false;initial-value:0%}
.settings-paper{position:relative;transform-origin:50% 50%;backface-visibility:hidden}
.settings-paper-burning{mask-image:radial-gradient(ellipse at 12% 72%,transparent calc(var(--paper-burn) - 1%),#000 var(--paper-burn)),radial-gradient(ellipse at 76% 14%,transparent calc(var(--paper-burn) - 1%),#000 var(--paper-burn)),radial-gradient(ellipse at 92% 90%,transparent calc(var(--paper-burn) - 1%),#000 var(--paper-burn));mask-composite:intersect}
.settings-paper-unfolding::after{content:"";position:absolute;inset:0;pointer-events:none;background:conic-gradient(from 25deg at 40% 45%,#10262600 0deg,#ecd6a755 40deg,#081e1e88 100deg,#10262600 160deg,#ecd6a766 240deg,#10262600 360deg),repeating-linear-gradient(118deg,transparent 0 16%,#f0e5c844 16.5%,#081e1e66 17%,transparent 18% 35%);animation:settings-paper-flatten 152ms ease-out both}
@keyframes settings-paper-flatten{0%,28%{opacity:1}65%{opacity:.55}100%{opacity:0}}
@media(prefers-reduced-motion:reduce){.settings-paper-unfolding::after{display:none}}

```


---


## Точный эталон: build-settings-review.mjs

```javascript
import {readFile,writeFile} from 'node:fs/promises';
const source=await readFile('src/ui/menu-windows.js','utf8');
const helpers=source.slice(source.indexOf('const el='),source.indexOf('export function handInfoRows'));
const tabs=source.slice(source.indexOf('export function tabbedWindow'),source.indexOf('// Source structure')).replace('export ','');
const settings=source.slice(source.indexOf('export function createSettingsView'),source.indexOf('export function createRunInfoView')).replace('export ','');
const paper=(await readFile('src/ui/settings-paper.js','utf8')).replace('export ','');
const font=(await readFile('web/fonts/Rubik.ttf')).toString('base64');
const css=await readFile('web/window-review.css','utf8');
const markup=`<div id="pierrot-settings-visible" class="viz-dotted-background">
<style>
@font-face{font-family:Rubik;src:url(data:font/ttf;base64,${font})}
${css}
#pierrot-settings-visible{box-sizing:border-box;padding:16px 8px;font-family:Rubik,sans-serif;color:#f0e5c8}
#pierrot-settings-visible dialog.menu-dialog{display:block;position:relative;inset:auto;margin:0 auto;transform:none;width:100%;max-width:700px;box-sizing:border-box;padding:14px}
#pierrot-settings-visible .menu-window-tabs{margin-bottom:24px}
#pierrot-settings-visible .native-settings{min-height:160px;box-sizing:border-box;padding:14px 8px}
#pierrot-settings-visible .settings-speed,#pierrot-settings-visible .settings-row{width:100%;max-width:550px;box-sizing:border-box}
#pierrot-settings-visible #dialog-body{padding:14px;min-height:0}
#pierrot-settings-visible .settings-speed-track{gap:12px}
#pierrot-settings-visible .settings-speed-track button{height:48px;font-size:22px}
#pierrot-settings-visible input[type=range]{accent-color:#f59b05;touch-action:pan-y}
#pierrot-settings-visible #dialog-actions{display:none}
@media(max-width:420px){#pierrot-settings-visible{padding:10px 2px}#pierrot-settings-visible dialog.menu-dialog{padding:10px;border-width:4px}#pierrot-settings-visible #dialog-body{padding:10px}#pierrot-settings-visible .menu-window-tabs button{font-size:20px}#pierrot-settings-visible .settings-speed-track{gap:8px}}
</style>
<dialog open class="menu-dialog" data-window="settings" aria-label="Настройки"><div id="dialog-body">
<section class="menu-window"><nav class="menu-window-tabs"><button aria-selected="true">Игра</button><button aria-selected="false">Звук</button></nav><div class="menu-window-content native-settings"><div class="settings-speed"><span>Скорость игры</span><div class="settings-speed-track"><button aria-pressed="false">0,5×</button><button aria-pressed="true">1×</button><button aria-pressed="false">2×</button><button aria-pressed="false">4×</button></div></div></div></section>
</div></dialog>
<script>
(()=>{const root=document.getElementById('pierrot-settings-visible');const GAME_SPEEDS=[.5,1,2,4];let speed=1;const getGameSpeed=()=>speed,setGameSpeed=value=>speed=value;
${helpers}
${paper}
${tabs}
${settings}
root.querySelector('#dialog-body').replaceChildren(createSettingsView());})();
</script>
</div>`;
await writeFile('/workspace/pierrot-settings-paper.html',markup);
new Function(markup.match(/<script>([\s\S]*?)<\/script>/)[1]);console.log('Settings preview generated; script syntax PASS');

```


---


## Точный эталон: SHA256SUMS

```
1b3a7437ba2af80e465e773ed60c5036d1ba6ace492d89046dbcf18fb31e4e88  Rubik.ttf
7cdf4596574b5fe85ad8745be273841ab9981c9cd3ef5566348fde7b6153f911  build-settings-review.mjs
c1465141101721828b1c2b348904f02c6a040c8aa5f62ad8428548ef0da0d751  game-speed.js
f1ef3395ec77a0f06f641207c6bb3d6ff51c4555327ab8e21bbe3668946f8ffd  menu-windows.js
3f7f0b54ca5cf7b5cb5a6e345a0383b01377e30771e11ffa719a91387ce229fe  settings-paper.js
7333fa6fe710cab64937e6ca2603ef4f9bb1fa25b088f5bc221057d4d0e8aafc  window-motion.js
051176b4ce8cd35f401a4df943546db3b062e08e5a3235014e3570f4d23a3baf  window-review.css

```


---


## Точный эталон функций настроек

```javascript
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const button=(id,label,action,cls='')=>{const b=el('button',cls,label);b.id=id;b.onclick=action;return b;};
export function tabbedWindow(items,draw,{paperMotion=false}={}){
 const root=el('section','menu-window'),tabs=el('nav','menu-window-tabs'),body=el('div','menu-window-content');root.append(tabs,body);
 for(const [id,label] of items)tabs.append(button('menu_tab_'+id,label,()=>select(id)));
 let active=null,wanted=null,moving=false;
 function paint(id){active=id;for(const b of tabs.children)b.setAttribute('aria-selected',String(b.id==='menu_tab_'+id));body.replaceChildren();draw(id,body);}
 async function select(id){
  wanted=id;
  if(moving||id===active)return;
  if(!paperMotion||!body.animate||matchMedia('(prefers-reduced-motion: reduce)').matches){paint(id);return;}
  moving=true;body.inert=true;body.setAttribute('aria-busy','true');
  try{
   do{if(active!==null)await animateSettingsPaper(body,true);paint(wanted);await animateSettingsPaper(body);}while(active!==wanted&&body.isConnected);
  }finally{moving=false;body.inert=false;body.setAttribute('aria-busy','false');}
 }

 select(items[0][0]);return root;
}
export function createSettingsView({values={music:.35,effects:.7},onVolume=()=>{},onNotice=()=>{}}={}){
 const view=tabbedWindow([['game','Игра'],['audio','Звук']],(tab,body)=>{
  body.classList.add('native-settings');
  function slider(key,label,value,enabled=false){const row=el('label','settings-row'),caption=el('span','',label),input=el('input'),out=el('output');input.id='audio_'+key;input.type='range';input.min=0;input.max=100;input.value=Math.round(value*100);input.disabled=!enabled;out.textContent=input.value+'%';if(!enabled)row.classList.add('settings-unavailable');row.append(caption,out,input);if(enabled)input.oninput=()=>{try{const next=onVolume(key,Number(input.value)/100);if(next)values=next;else values={...values,[key]:Number(input.value)/100};}catch{onNotice('Не удалось сохранить настройки звука');}input.value=Math.round(values[key]*100);out.textContent=input.value+'%';};body.append(row);}
  if(tab==='audio'){slider('music','Музыка',values.music,true);slider('effects','Звуковые эффекты',values.effects,true);}
  else{
   const speedRow=el('div','settings-speed'),caption=el('span','','Скорость игры'),track=el('div','settings-speed-track');track.setAttribute('role','group');track.setAttribute('aria-label','Скорость игры');
   function refreshSpeed(){for(const b of track.children)b.setAttribute('aria-pressed',String(Number(b.dataset.speed)===getGameSpeed()));}
   for(const value of GAME_SPEEDS){const b=button('game_speed_'+String(value).replace('.','_'),String(value).replace('.',',')+'×',()=>{try{setGameSpeed(value);refreshSpeed();}catch{onNotice('Не удалось сохранить скорость игры');}});b.dataset.speed=String(value);b.setAttribute('aria-label','Скорость '+String(value).replace('.',',')+'×');track.append(b);}
   refreshSpeed();speedRow.append(caption,track);body.append(speedRow);}
 },{paperMotion:true});view.dataset.window='settings';return view;
}

```


---

# Паспорт home-v1 — Главное меню

УТВЕРЖДЕНО пользователем 24.10.2026 отдельным сообщением: «Главное меню тоже утверждаем!». Принят текущий вариант с заметным дыханием. Связанные задачи: У-45; внешняя кнопка профиля У-43/46. Реализация главной900a061, текущий код04694ae; документация после9f8ae2d. Не переносить эту приёмку на содержимое открываемых окон, кроме отдельно принятого settings-v1.

## Компоновка и каждый элемент

Координаты логического поля1536×688: x/y от его левого верхнего угла, w/h ширина/высота. На экране масштабируется весь stage равномерно с сохранением пропорций; не пересчитывать позиции элементов независимо. Точный алгоритм — home-v1/layout.js. Шрифт Rubik, файл шрифта зафиксирован в соседнем settings-v1. Точный каскад — home-v1/styles.css и start-screen.css.

| Элемент / ID | Положение и размер | Цвет / шрифт / оформление | Поведение |
| --- | --- | --- | --- |
| .start-screen / #start_screen | inset0, весь stage, z-index70 | Фон #225449, текст #f0e5c8, Rubik; тонкие повторяющиеся радиальные линии и зелёное пятно; isolation:isolate, overflow:hidden | Основной экран. При открытии сам не выезжает снизу |
| .start-screen::before | inset−90, за содержимым z-index−1 | Зелёное свечение #76966688 у30%60%, радиальные линии #c4d2a920 у72%36%; pointer-events:none | Медленно движущийся декоративный фон |
| .start-logo | x368,y115,w800; центрированный текст «Пьеро» | Размер154, вес900, letter-spacing−5; тени0 7px #082b25 и4px 13px #082b2580 | Плавная пульсация без перемещения кнопок |
| .start-ornament | x1100,y130 | Знак ♠, размер130, цвет #d4bb86, opacity.3 | Декорация aria-hidden, медленное плавание |
| .start-menu | x469,y529,w598,h112 | Сетка202/147/202, gap11, padding8, фон #12292ad9, рамка4 #0e2425, радиус13, тень0 5px #102626 | Горизонтальная группа трёх кнопок |
| #start_new | Первая колонка, высота87 | «Играть», фон #039fea, размер31, line-height1.1 | Открывает настройку новой/сохранённой партии. Окно настройки не считается принятым этой приёмкой |
| #start_settings | Средняя колонка, высота76 | «Настройки», фон #f59b05, размер21 | Открывает утверждённые настройки settings-v1 напрямую |
| #start_collection | Третья колонка, высота87 | «Коллекция», фон #448d74, текст #f0e5c8, размер25 | Открывает категории коллекции; её содержимое имеет отдельный статус приёмки |
| #start_profile | x187,y545,w134,h96 | Фон #173d37, padding8px 10px, радиус9, тень0 4px #102626; flex-колонка, gap6, overflow:hidden | Кнопка «Профиль»; открывает профиль. Вся надпись внутри рамки |
| #start_profile span | Верх кнопки | «Профиль», размер18, вес700, line-height22, nowrap | Постоянная подпись |
| #start_profile strong | Под подписью, ширина100%, высота36, line-height36 | Текущее имя, фон #617d78, радиус8, размер18, nowrap/ellipsis | Ввод/сохранение имени максимум10символов. Это требование сохраняется отдельно от приёмки внутреннего окна профиля |
| #start_language | x1077,y561,w158,h74 | «Русский», размер22, фон #617d78, текст #f0e5c8, рамка9 #173d37, тень0 5px #102626 | Disabled, язык пока не переключается. Сохраняет обычную видимость opacity1/filter:none |

Общие кнопки: радиус9, вес800 (профиль700), тень0 5px #112522 и0 7px #071c18; текстовая тень1px 2px #0005. Нажатая доступная кнопка brightness1.16. Клавиатурный фокус outline3 #fff offset2; профиль outline3 #f0e5c8 offset4. Указанные исключения языка/профиля сохраняют цвет при disabled; не применять к ним случайно общее серое состояние.

## Анимации главной

| Объект | Цикл и easing | Кадры0%/100% | Кадр50% |
| --- | --- | --- | --- |
| Фон ::before | 8сек, ease-in-out, infinite | scale1 translate(−16px,10px), opacity.55 | scale1.14 translate(20px,−12px), opacity1 |
| Надпись Пьеро | 4,8сек, ease-in-out, infinite; origin50%55% | rotate−4° translateY4px scale.98 | rotate−2,6° translateY−10px scale1.055 |
| ♠ | 7сек, ease-in-out, infinite | rotate15° translateY0 | rotate23° translateY−16px |

Дыхание постоянно, кнопки/зоны нажатия не плавают. При prefers-reduced-motion:reduce все три декоративные анимации отключены. Эффект не зависит от игровой скорости. При появлении главного экрана входящего подъёма нет; подъём/уход относится к накладываемым окнам. Приёмка главной не означает приёмку каждого окна поверх неё.

## Эталон и продолжение

Точные исходники: home-v1/start-screen.js, start-screen.css, styles.css, layout.js; SHA256SUMS. Показ всей главной: NATIVE_MENU_OUTPUT=/workspace/pierrot-home-approved.html node scripts/build-native-menu-review.mjs (без NATIVE_MENU_INITIAL=settings). Генератор использует реальные функции рендера. Показ, путь в scratch и память чата не заменяют этот паспорт и зафиксированные исходники.

Визуальная приёмка пользователя подтверждена. Автоматическая браузерная проверка и физический Android не заявляются. APK по прежнему не собирать без нового поручения. Для новой правки сохранить v1 и создать v2 со статусом «на согласовании» до явной приёмки.

## Точный эталон home-v1/start-screen.css

```
/* Coordinates belong to the existing uniformly scaled 1536×688 game stage. */
.start-screen{position:absolute;inset:0;z-index:70;background:#225449;background-image:repeating-radial-gradient(ellipse at 72% 36%,transparent 0 28px,#afc1a40a 30px 31px,transparent 32px 58px),radial-gradient(ellipse at 22% 72%,#46664b55,transparent 65%);font-family:"Rubik",sans-serif;color:#f0e5c8}
.start-logo{position:absolute;left:368px;top:115px;width:800px;margin:0;text-align:center;font-size:154px;font-weight:900;letter-spacing:-5px;text-shadow:0 7px #082b25,4px 13px #082b2580;transform:rotate(-4deg)}
.start-ornament{position:absolute;left:1100px;top:130px;color:#d4bb86;font-size:130px;transform:rotate(15deg);opacity:.3}
.start-menu{position:absolute;left:469px;top:529px;width:598px;height:112px;display:grid;grid-template-columns:202px 147px 202px;gap:11px;align-items:center;padding:8px;background:#12292ad9;border:4px solid #0e2425;border-radius:13px;box-shadow:0 5px #102626}
.start-menu button{height:87px;font-size:31px;line-height:1.1;text-align:center;white-space:normal;padding:0 10px}
.start-menu #start_settings{height:76px;font-size:21px}.start-green{background:#448d74}
.start-setup{position:absolute;left:318px;top:44px;width:900px;height:594px;border:5px solid #d7c49a;border-radius:16px;background:#173d37;box-shadow:0 8px #082b25,0 15px 55px #0008;padding:16px 28px;text-align:center;z-index:2}
.start-setup h2{margin:0 0 10px;font-size:31px;font-weight:900}.start-tabs{display:flex;justify-content:center;gap:14px}.start-tabs button{height:44px;width:244px;font-size:22px}.start-tabs [aria-pressed=true]{outline:3px solid #f0e5c8;outline-offset:3px}
.start-deck-row{display:flex;align-items:center;justify-content:center;gap:44px;margin:17px 0 15px;height:148px}.start-deck-back{width:112px;height:156px;border:5px solid #f0e5c8;border-radius:7px;background:#ca3d2a;background-image:repeating-linear-gradient(45deg,transparent 0 7px,#f0e5c850 7px 8px,transparent 8px 14px);box-shadow:-4px 4px #b6bbad,-8px 8px #768779,-12px 12px #1a382d;display:grid;place-items:center;transform:rotate(-5deg);color:#f0e5c8;font-size:70px}.start-deck-back[data-deck=blue]{background-color:#087bad}.start-deck-info{width:366px;border:4px solid #0e2425;border-radius:10px;background:#12292ad9;overflow:hidden}.start-deck-info h3{font-size:26px;margin:12px 4px;font-weight:900}.start-deck-info p{margin:0 8px 8px;padding:17px 10px;background:#f0e5c8;color:#173d37;border-radius:7px;font-size:25px;line-height:1.25;font-weight:600}
.start-deck-choices{display:flex;justify-content:center;gap:14px}.start-deck-choices button{font-size:21px;height:47px;width:270px}.start-deck-choices [aria-pressed=true]{outline:3px solid #f0e5c8;outline-offset:3px}
.start-seed-label{display:flex;align-items:center;justify-content:center;gap:14px;margin:20px 0;font-size:18px}.start-seed-label input{width:275px;height:43px;border:3px solid #8d9d87;background:#f0e5c8;color:#173d37;border-radius:7px;font:500 19px "Rubik",sans-serif;padding:5px 10px;user-select:text;touch-action:manipulation}.start-setup-actions{display:grid;grid-template-columns:245px 1fr;gap:18px}.start-setup-actions button{height:54px;font-size:25px}
@media(prefers-reduced-motion:reduce){.start-screen,.start-setup{animation:none;transition:none}}

.start-menu #start_collection{font-size:25px;background:#448d74!important;opacity:1;color:#f0e5c8;filter:none}.start-profile{position:absolute;left:187px;top:545px;width:134px;height:96px;padding:8px 10px;background:#173d37;border-radius:9px;box-shadow:0 4px #102626;text-align:center}.start-profile span{display:block;font-size:21px;font-weight:700;margin-bottom:5px}.start-profile strong{display:grid;place-items:center;background:#617d78;border-radius:8px;font-size:22px;height:45px;box-shadow:0 4px #102626}.start-language{position:absolute;left:1077px;top:561px;width:158px;height:74px;background:#617d78!important;color:#f0e5c8!important;font-size:22px;opacity:1!important;filter:none!important;box-shadow:0 5px #102626;border:9px solid #173d37}

.start-deck-row{height:154px;margin:10px 0;gap:34px}.start-deck-info{width:450px}.start-deck-info h3{font-size:25px;margin:8px 4px}.start-deck-info p{padding:10px;font-size:21px;line-height:1.25}.start-deck-choices{align-items:center;gap:14px}.start-deck-choices button{width:56px;height:44px;font-size:34px;line-height:1}.start-deck-choices select{width:380px;height:44px;min-width:0;padding:4px 12px;border:3px solid #d7c49a;border-radius:8px;background:#f0e5c8;color:#173d37;font:600 21px "Rubik",sans-serif;touch-action:manipulation}.start-preview-access{font-size:14px;line-height:18px;margin:8px 0 0;color:#d7c49a}.start-seed-label{margin:12px 0}.start-deck-info p{min-height:72px;display:flex;align-items:center;justify-content:center}

.start-stake-settings{display:grid;grid-template-columns:42px 242px minmax(0,1fr);align-items:center;gap:12px;min-height:64px;margin:6px 0}.start-stake-chip{width:40px;height:40px;display:grid;place-items:center;border:5px dashed #f0e5c8;border-radius:50%;background:var(--stake-color,#e5dfcb);box-shadow:inset 0 0 0 2px #213d38,0 3px #102626;color:#fff;text-shadow:0 1px 2px #000,1px 0 2px #000;font-size:18px;font-weight:800}.start-stake-settings select{width:100%;height:42px;min-width:0;padding:4px 10px;border:3px solid #d7c49a;border-radius:8px;background:#f0e5c8;color:#173d37;font:600 19px "Rubik",sans-serif;touch-action:manipulation}.start-stake-description{margin:0;font-size:16px;line-height:19px;text-align:left;color:#f0e5c8}

/* Profile and collection use the same paper, green panels and Rubik as play. */
button.start-profile{border:0;color:#f0e5c8;font-family:inherit;font-weight:700;cursor:pointer;white-space:normal;margin:0;font-size:21px;min-height:0;line-height:1.15}.start-profile:focus-visible{outline:3px solid #f0e5c8;outline-offset:4px}.start-profile[disabled]{opacity:1;filter:none;cursor:default}
.start-deck-choices select option:disabled,.start-stake-settings select option:disabled{color:#74766c}
.profile-view,.collection-view{font-family:"Rubik",sans-serif;min-width:0;color:#f0e5c8}
.profile-slots,.profile-tabs{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:0 0 12px}.profile-view nav button{margin:0;flex:1;min-width:72px;padding:10px 8px;background:#448d74;color:#f0e5c8}.profile-view [aria-pressed=true]{outline:2px solid #f0e5c8;outline-offset:2px}.profile-tabs button{background:#617d78!important;font-size:14px}.profile-details{max-height:53dvh;overflow-y:auto;overflow-x:hidden;touch-action:pan-y;padding:4px}
.profile-progress-item{display:grid;grid-template-columns:1fr auto;gap:8px;padding:12px 10px;margin:8px 0;background:#12292a;border-radius:8px;font-size:15px}.profile-progress-item progress{grid-column:1/-1;width:100%;height:13px;accent-color:#d7c49a}.profile-note{color:#d7c49a;font-size:12px!important}.profile-stat-table td:last-child{text-align:right;font-weight:700}.profile-usage h3{font-size:17px;margin:12px 0 5px}.profile-usage td:last-child{text-align:right}.profile-usage p{color:#d7c49a}
.collection-controls{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}.collection-controls select{max-width:80%;min-width:0;height:39px;padding:4px 8px;background:#f0e5c8;color:#173d37;border:2px solid #d7c49a;border-radius:7px;font:600 16px "Rubik",sans-serif;touch-action:manipulation}.collection-controls strong{font-size:16px;white-space:nowrap}
.collection-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;min-height:211px;align-content:start}.collection-grid .collection-card{position:relative;height:101px;margin:0;padding:7px 4px;border:3px solid #d7c49a;border-radius:7px;background:#f0e5c8;color:#173d37;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font-size:12px;line-height:1.15;overflow:hidden;box-shadow:0 3px #082b25;white-space:normal;word-break:normal;overflow-wrap:anywhere}.collection-card strong{max-width:100%;max-height:44px;overflow:hidden}.collection-symbol{font-size:30px;color:#ab3934;line-height:1}.collection-card[data-discovered=false]{background:#49685e;color:#e0d3ae}.collection-card[data-discovered=false] .collection-symbol{color:#c5b385}.collection-card[data-unlocked=false]{border-color:#788d7d;background:#23463e}.collection-sticker{position:absolute;top:3px;right:3px;display:grid;place-items:center;width:22px;height:22px;background:var(--stake-color);color:white;border:3px dashed #f0e5c8;border-radius:50%;text-shadow:0 1px 2px #000;font-size:11px;font-weight:800}
.collection-paging{display:flex;align-items:center;justify-content:center;gap:20px;margin-top:10px}.collection-paging button{margin:0;width:56px;padding:4px;font-size:25px;line-height:1.15}.collection-paging span{font-size:16px}.collection-details{margin-top:12px;min-height:76px;padding:12px;background:#12292a;border-radius:8px;font-size:14px;line-height:1.35;overflow-wrap:anywhere}.collection-details p{margin:6px 0 0;font-size:13px}
@media(max-width:620px){.collection-grid{gap:5px;min-height:185px}.collection-grid .collection-card{height:90px;padding:5px 3px;font-size:10px;border-width:2px}.collection-symbol{font-size:25px}.collection-controls select{font-size:14px}.profile-view nav button{font-size:13px;padding:10px 5px}.profile-progress-item{font-size:13px}}

.start-tabs button{width:244px}.challenge-body{display:grid;grid-template-columns:325px minmax(0,1fr);gap:18px;height:360px;margin:15px 0}.challenge-list,.challenge-details{overflow-y:auto;overflow-x:hidden;touch-action:pan-y;scrollbar-width:thin;scrollbar-color:#d7c49a #12292a}.challenge-list{display:flex;flex-direction:column;gap:7px;padding:4px 8px 6px 4px}.challenge-list button{flex-shrink:0;width:100%;min-height:43px;height:auto;margin:0;padding:7px 10px;font-size:17px;line-height:1.2;text-align:left;white-space:normal;background:#448d74}.challenge-list button[data-unlocked=false]{background:#49685e;color:#d7c49a}.challenge-list button[aria-pressed=true]{outline:3px solid #f0e5c8;outline-offset:0}.challenge-details{padding:14px 18px;border:3px solid #0e2425;border-radius:9px;background:#12292ad9;text-align:left}.challenge-details h3{margin:0 0 8px;font-size:25px}.challenge-details h4{font-size:19px;margin:17px 0 7px;color:#d7c49a}.challenge-details p{font-size:17px;line-height:1.3;margin:6px 0;overflow-wrap:anywhere}.challenge-details .challenge-access{color:#d7c49a;font-size:15px}

/* Keep the label and a long player name inside the original profile button. */
button.start-profile{display:flex;flex-direction:column;align-items:stretch;justify-content:center;gap:6px;box-sizing:border-box;overflow:hidden}
.start-profile span{flex:none;line-height:22px;font-size:18px;white-space:nowrap;margin:0}
.start-profile strong{display:block;flex:none;width:100%;max-width:100%;height:36px;line-height:36px;font-size:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

/* Visible idle movement stays behind the controls, inside the home surface. */
.start-screen{isolation:isolate;overflow:hidden}
.start-screen::before{content:"";position:absolute;inset:-90px;z-index:-1;pointer-events:none;background:radial-gradient(ellipse at 30% 60%,#76966688,transparent 55%),repeating-radial-gradient(ellipse at 72% 36%,transparent 0 28px,#c4d2a920 30px 32px,transparent 34px 58px);transform-origin:72% 36%;animation:start-background-breathe 8s ease-in-out infinite}
.start-logo{transform-origin:50% 55%;animation:start-logo-breathe 4.8s ease-in-out infinite}
.start-ornament{animation:start-ornament-float 7s ease-in-out infinite}
@keyframes start-background-breathe{0%,100%{transform:scale(1) translate(-16px,10px);opacity:.55}50%{transform:scale(1.14) translate(20px,-12px);opacity:1}}
@keyframes start-logo-breathe{0%,100%{transform:rotate(-4deg) translateY(4px) scale(.98)}50%{transform:rotate(-2.6deg) translateY(-10px) scale(1.055)}}
@keyframes start-ornament-float{0%,100%{transform:rotate(15deg) translateY(0)}50%{transform:rotate(23deg) translateY(-16px)}}
@media(prefers-reduced-motion:reduce){.start-screen::before,.start-logo,.start-ornament{animation:none}}

```

## Точный эталон home-v1/styles.css

```
@font-face{font-family:"Rubik";src:url("/web/fonts/Rubik.ttf") format("truetype");font-weight:300 900;font-style:normal;font-display:swap}
:root{color-scheme:dark;font-family:"Rubik",sans-serif;font-weight:400;color:#f6f2df;background:#102421;font-synthesis:none;--tarot-color:#8b5aab;--planet-color:#377bb7;--spectral-color:#279cab}
[data-card-set=Tarot]{--card-type-color:var(--tarot-color)}[data-card-set=Planet]{--card-type-color:var(--planet-color)}[data-card-set=Spectral]{--card-type-color:var(--spectral-color)}
*{box-sizing:border-box}html,body{width:100%;height:100%;overflow:hidden}body{margin:0;overflow:hidden;touch-action:none;overscroll-behavior:none;user-select:none}
button{font:inherit;font-weight:800;color:inherit;border:0;cursor:pointer;touch-action:none;-webkit-tap-highlight-color:transparent;box-shadow:0 5px 0 #112522,0 7px 0 #071c18;border-radius:9px;text-shadow:1px 2px #0005}
button:active:not(:disabled){filter:brightness(1.16)}button:focus-visible{outline:3px solid #fff;outline-offset:2px}button:disabled{background:#484c49!important;color:#b2b4aa;cursor:default;filter:saturate(.35);opacity:.8}
#stage{position:absolute;width:1536px;height:688px;transform-origin:top left;overflow:hidden;background-color:#225449;background-image:repeating-radial-gradient(ellipse at 72% 36%,transparent 0 28px,#afc1a40a 30px 31px,transparent 32px 58px),radial-gradient(ellipse at 22% 72%,#46664b55,transparent 65%),repeating-linear-gradient(0deg,#ffffff02 0 1px,transparent 1px 4px)}
#stage:after{content:"";position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 100px #001e1844;z-index:0}
.fixed{position:absolute;z-index:1}#hud{border-left:3px solid #0787b3;border-right:3px solid #0787b3;background:#263336c2}
.panel{background:#12292ad9;border:4px solid #0e2425;border-radius:11px;box-shadow:0 4px #102626}
.title{background:#087bad;border:4px solid #096287;border-radius:11px;font-size:28px;text-align:center;font-weight:900;line-height:36px;white-space:nowrap;text-shadow:2px 3px #062e42}
.token{border-radius:50%;background:repeating-conic-gradient(#395997 0 10deg,#294579 10deg 20deg);border:5px double #6984ac;box-shadow:3px 5px #102332;display:grid;place-items:center;text-align:center;font-size:18px;font-weight:900;line-height:18px;transform:rotate(-4deg)}
.target{border-radius:9px;background:#101f20;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:2px;box-shadow:0 3px #071c1b}.target small{font-size:13px;font-weight:bold}.target strong{font-size:31px;color:#fc5348;line-height:33px;white-space:nowrap}
.chip-icon{display:inline-block;width:25px;height:25px;border:5px dashed #ddede1;border-radius:50%;background:#b8ccc9;vertical-align:middle;box-shadow:inset 0 0 0 2px #8aa9a7}
.score-line{display:flex;align-items:center;justify-content:space-around}.score-line>span{font-size:20px;line-height:19px;font-weight:bold}.score-line strong{font-size:36px;max-width:185px;white-space:nowrap}
.score-box{display:flex;align-items:center;justify-content:flex-end;padding-right:8px;border-radius:12px;font-size:43px;font-weight:900;box-shadow:0 5px #001c28;overflow:hidden;white-space:nowrap}.blue{background:#039fea}.red{background:#f24b3d}.orange{background:#f59b05}.cyan{color:#04a9eb}.scarlet{color:#ff5347}.gold{color:#f6c35d}.amber{color:#ffac05}
#times{position:absolute;display:grid;place-items:center;padding-bottom:3px;line-height:1;font-size:46px;font-weight:bold;color:#ff5247;z-index:1}#calculation_panel{text-align:center;padding:13px 7px}#hand_name{font-size:24px;font-weight:900;line-height:28px}#hand_level{font-size:15px}#run_info{font-size:20px;line-height:21px}#options{font-size:13px}
.counter{text-align:center;border-width:4px;line-height:21px}.counter>span{font-size:16px;font-weight:bold}.counter strong{display:block;font-size:36px;line-height:34px}.counter strong small{font-size:17px;color:#fff}
#money{display:grid;place-items:center;font-size:39px}#money strong{max-width:150px;overflow:hidden}#joker_region_inferred,#consumable_region_inferred{background:#122b261e;border-radius:10px;pointer-events:none}.slot-count{font-size:14px;font-weight:900;white-space:nowrap;line-height:15px;text-align:center}#hand_count{width:60px!important;left:783px!important}
#sort_panel{border:5px solid #d9e1d8;border-radius:14px;background:#143d39;box-shadow:0 3px #728c7b}#sort_label{font-size:17px;font-weight:bold;white-space:nowrap;text-align:center}#sort_rank,#sort_suit{font-size:13px}#play_hand,#discard{font-size:21px}
.playing-card{position:absolute;width:115px;height:144px;z-index:3;border:2px solid #c9c5b5;border-radius:7px;background:#f0e5c8;box-shadow:0 6px 0 #0c251ba6;transform-origin:50% 85%;padding:0;transition:top .12s,filter .12s;overflow:hidden;color:#143d39;text-shadow:none}
.playing-card.selected{border-color:#e8bb66;box-shadow:0 6px #0c251ba6,0 0 0 2px #dcb260}.playing-card.dragging{z-index:50!important;transition:none;opacity:.95}.playing-card .corner{position:absolute;top:4px;left:5px;font-size:17px;line-height:16px;font-weight:900;display:flex;flex-direction:column;align-items:center}.playing-card .bottom{top:auto;left:auto;bottom:4px;right:5px;transform:rotate(180deg)}.playing-card .face{position:absolute;left:26px;right:18px;top:10px;bottom:10px;width:71px;height:124px}
.deck-back{border:5px solid #f0e5c8;border-radius:7px;background:#ca3d2a;box-shadow:-4px 4px #b6bbad,-8px 8px #768779,-12px 12px #1a382d;color:#f0e5c8;overflow:hidden;background-image:repeating-linear-gradient(45deg,transparent 0 7px,#f0e5c850 7px 8px,transparent 8px 14px),repeating-linear-gradient(-45deg,transparent 0 7px,#f0e5c850 7px 8px,transparent 8px 14px)}.deck-back:before{content:"";position:absolute;inset:8px;border:3px double #f0e5c8;border-radius:38%}.deck-seal{position:absolute;left:19px;right:19px;top:34px;padding:10px 0;border:3px double #f0e5c8;background:#b83325;border-radius:50%;font-size:38px}
dialog{width:min(620px,90vw);max-height:88dvh;overflow:auto;background:#173d37;border:5px solid #d7c49a;border-radius:16px;color:#f0e5c8;padding:22px;box-shadow:0 15px 55px #0008;touch-action:pan-y}dialog::backdrop{background:#031713a8}dialog h1{font-size:23px;margin:0 0 16px}dialog p{font-size:15px;line-height:1.5}dialog button{font-size:16px;padding:13px 20px;background:#ed9e16;margin:8px 6px 0 0}dialog table{width:100%;border-collapse:collapse;font-size:14px}dialog td{padding:4px 6px;border-bottom:1px solid #ffffff15}dialog .deck-list{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;font-size:12px}dialog .deck-list span{padding:5px;background:#f0e5c8;color:#143d39;border-radius:3px}
#notice{position:fixed;top:max(8px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);border-radius:8px;background:#102d29ee;padding:8px 12px;max-width:90vw;text-align:center;font-size:14px;pointer-events:none;z-index:100}#notice:empty{display:none}@media(prefers-reduced-motion:reduce){.playing-card{transition:none}}

/* Input lock must not recolor the cards, including the final hand. */
.playing-card:disabled{background:#f0e5c8!important;color:inherit;filter:none;opacity:1;cursor:default}
.playing-card .corner span{width:16px;height:16px;display:block}.playing-card .corner svg{width:100%;height:100%;display:block}
.playing-card .pip-art{position:absolute;left:28px;top:14px;width:72px;height:114px;overflow:visible}
.playing-card .face{left:28px;top:14px;width:64px;height:112px;right:auto;bottom:auto}
#deck_count{left:1194px!important;top:656px!important;width:141px!important;height:19px!important;line-height:19px;font-size:18px}
.played-card{pointer-events:none;z-index:60!important;transition:none!important}

#chips_value,#mult_value,#round_score_value,#times,.score-pop{font-family:inherit;font-variant-numeric:tabular-nums}
#chips_value,#mult_value{position:relative;z-index:3;font-weight:700}#round_score_value{font-size:33px}
.playing-card .pip-art{left:50%;transform:translateX(-50%)}.playing-card .face{left:50%;transform:translateX(-50%)}
.dealing{visibility:hidden}.score-pop{position:absolute;pointer-events:none;z-index:75;font-size:25px;font-weight:400;text-shadow:1px 2px #0d2424;white-space:nowrap;transform:translateX(-50%)}
.score-pop.chips{color:#09aeff}.score-pop.mult{color:#ff5549}.score-pop.multiply{font-weight:800}
#score_flame{position:absolute;left:0;top:0;width:100%;height:68px;pointer-events:none;opacity:.68;z-index:0}#hand_name,#hand_level{position:relative;z-index:2}


.sort-active{outline:2px solid #ffe69e;outline-offset:-4px}
/* Deck reference1000029731: logical canvas1536x709, modal1090x650. */
dialog.deck-dialog{position:fixed;left:50%;top:50%;margin:0;width:1090px;height:650px;max-width:none;max-height:none;padding:0;overflow:hidden;transform:translate(-50%,-50%) scale(var(--deck-scale,1));transform-origin:center;border:5px solid #becbca;border-radius:21px;background:#345052;box-shadow:0 8px #677c79,0 12px #172f32;touch-action:none}
dialog.deck-dialog::backdrop{background:#223a37a6;backdrop-filter:blur(2px)}.deck-dialog #dialog-title{display:none}.deck-view{position:relative;width:1080px;height:576px}.deck-tabs{position:absolute;top:23px;left:394px;display:flex;gap:9px}.deck-dialog .deck-tabs button{position:relative;width:143px;height:47px;background:#f14b42;margin:0;padding:0;font-size:26px}.deck-tabs button[aria-selected=true]:before{content:"";position:absolute;left:60px;top:-26px;border-left:9px solid transparent;border-right:9px solid transparent;border-top:18px solid #f14b42;filter:drop-shadow(0 3px #19312e)}
.deck-stats{position:absolute;left:24px;top:90px;width:250px;height:419px;border:6px solid #142e30;border-radius:16px;background:#203c3e;overflow:hidden}.deck-info{position:absolute;left:2px;top:0;width:172px;height:137px;border-radius:10px;background:#345052;text-align:center}.deck-info strong{font-size:28px;display:block;line-height:38px;white-space:nowrap}.deck-info p{margin:0 8px;background:#f6f1df;color:#182f31;border-radius:8px;padding:14px 0;font-size:24px;line-height:26px;height:84px}.deck-info em{color:#f14b42;font-style:normal}.deck-base{position:absolute;left:0;top:141px;width:174px;height:266px;border:5px solid #52696a;border-radius:15px;text-align:center}.deck-base>strong{color:#f14b42;font-size:23px;line-height:30px}.deck-categories{display:flex;justify-content:space-evenly}.deck-categories div,.deck-suits div{display:flex;flex-direction:column;align-items:center;gap:2px}.deck-categories span,.deck-suits span{width:34px;height:36px;background:#abbcbc;border-radius:10px;color:#344e52;font-size:33px;line-height:36px}.deck-categories b,.deck-suits b{font-size:24px;line-height:27px}.deck-suits{display:grid;grid-template-columns:50px 50px;justify-content:center;gap:12px 0;margin-top:14px}.deck-ranks{position:absolute;left:179px;top:0;width:59px;display:flex;flex-direction:column;gap:2px}.deck-ranks div{height:29px;display:flex;justify-content:space-between;align-items:center}.deck-ranks span{background:#3d565a;color:#abbcbc;border-radius:50%;width:27px;height:25px;line-height:25px;text-align:center;font-size:22px}.deck-ranks b{font-size:25px;width:23px;text-align:center}
.deck-grid{position:absolute;left:287px;top:90px;width:770px;height:420px;border:6px solid #132d2f;border-radius:14px;background:#223a3c;display:flex;flex-direction:column;gap:0;overflow:hidden;padding:0}.deck-row{position:relative;height:100px;flex-shrink:0;width:760px}.deck-card{position:absolute;width:79px;height:100px;transform-origin:50% 85%;border-radius:4px}.deck-card .card-scale{left:0;top:0;width:115px;height:144px;transform:scale(.687);transform-origin:top left;box-shadow:0 4px #152d3180}.deck-card.used{filter:grayscale(.7) brightness(.6);opacity:.52}.deck-dialog #dialog-actions{position:absolute;left:9px;right:9px;bottom:12px}.deck-dialog #dialog-actions button{width:100%;height:46px;margin:0;padding:0;background:#f5a000;font-size:27px;box-shadow:0 5px #927124}
.deck-dialog{top:calc(50% - 15px * var(--deck-scale,1))!important}.deck-info strong{font-size:21px}.deck-info p{font-size:20px;line-height:23px;padding:18px 0}.deck-base>strong{font-size:20px}

/* Approved Rubik hierarchy: one family for every screen and score. */
button{font-weight:700}.title{font-weight:800;font-size:26px}.token{font-weight:700;font-size:15px}.playing-card .corner{font-weight:700}#hand_name{font-weight:750;font-size:21px}#hand_level{font-weight:400}.deck-info strong{font-weight:750;font-size:19px}.deck-base>strong{font-weight:700;font-size:18px}.deck-tabs button{font-weight:650;font-size:20px!important}.deck-info p{font-weight:500;font-size:18px;padding:17px 0;line-height:23px}.deck-ranks span{font-size:18px}.deck-ranks b{font-size:22px}.deck-categories b,.deck-suits b{font-size:21px}.deck-dialog #dialog-actions button{font-weight:700;font-size:24px}#run_info{font-size:16px;font-weight:700;line-height:20px}#options{font-size:12px;font-weight:650}#sort_label{font-size:16px;font-weight:600}#sort_rank,#sort_suit{font-size:12px;font-weight:650}#play_hand,#discard{font-size:19px;font-weight:700}.counter>span{font-size:14px;font-weight:600}.score-line>span{font-size:18px;font-weight:600}#chips_value,#mult_value,#round_score_value{font-weight:650}.score-pop{font-weight:400}.score-pop.multiply{font-weight:800}
#sort_label{font-size:14px;line-height:17px}
.deck-categories svg,.deck-suits svg{width:28px;height:28px;display:block;margin:4px auto}.deck-seal svg{display:block;width:38px;height:38px;margin:auto}
/* User-approved HUD alignment: numbers face the multiplication sign. */
#chips{justify-content:flex-end;padding-left:0;padding-right:8px}#mult{justify-content:flex-start;padding-left:8px;padding-right:0}#run_info,#options{font-size:14px;font-weight:700;line-height:20px}

#hand .playing-card{transition:left .16s ease-out,top .16s ease-out,transform .16s ease-out}
#hand .playing-card.dragging{transition:none;transform:rotate(0deg)!important;opacity:1;box-shadow:0 15px 8px #0c251b80}
.card-tip{position:absolute;width:180px;z-index:90;pointer-events:none;border:3px solid #c9c5b5;border-radius:9px;background:#263e3e;padding:5px;box-shadow:0 5px #0c251ba6;text-align:center;color:#263e3e;font-size:19px;line-height:24px}
.card-tip>.tooltip-title,.card-tip>p{display:block;background:#f4efdf;border-radius:5px;padding:5px;margin:0}.card-tip p{margin-top:4px}.tooltip-effect{display:inline;font-weight:800}.tooltip-chips{color:#09aeff}.tooltip-mult{color:#ff5549}
@media(prefers-reduced-motion:reduce){#hand .playing-card{transition:none}}

/* Explicit centering avoids default button padding squeezing Russian labels. */
#run_info,#options,#play_hand,#discard,#sort_rank,#sort_suit{display:flex;align-items:center;justify-content:center;text-align:center;padding:0}
#run_info{font-size:22px;line-height:26px}
#options{font-size:20px;line-height:24px;flex-direction:column;gap:5px}
#options::before{content:"⚙";font-size:30px;line-height:30px}
#blind_token span{font-size:11px;line-height:13px;white-space:pre-line}
#sort_rank,#sort_suit{font-size:11.5px;line-height:18px}
.counter-pop{font-weight:800;font-size:29px}
#score_flame{opacity:1}
#hand_name,#hand_level{background:#12292a;border-radius:4px}
#hand_name{width:max-content;max-width:100%;margin:auto}

[hidden]{display:none!important}
#post_round{left:515px;top:214px;width:594px;height:474px;padding:0;z-index:7;background:#173132}
#cashout{position:absolute;left:94px;top:15px;width:398px;height:56px;font-size:23px}
.payout-blind{position:absolute;left:16px;right:18px;top:99px;height:82px;display:flex;align-items:center;gap:20px;border-bottom:3px dotted #b5c7bd;padding-bottom:14px}
.payout-blind .token{width:61px;height:62px;flex-shrink:0;font-size:11px;line-height:13px;white-space:pre-line}
.payout-target{display:flex;flex-direction:column;font-size:16px;text-align:center}.payout-target strong{font-size:34px}
.payout-blind>.gold{margin-left:auto;font-size:30px}
.payout-row{position:absolute;left:16px;right:18px;top:191px;display:flex;align-items:center;gap:16px;font-size:19px}.payout-row>strong:first-child{width:62px;text-align:center;font-size:37px;color:#04a9eb}.payout-row>.gold{margin-left:auto;font-size:27px}.payout-interest{top:280px}.payout-interest>strong:first-child{color:#f6c35d}
#shop_entry{padding:22px;text-align:center}#shop_entry h2{font-size:30px;font-weight:750}#shop_entry p{font-size:21px;line-height:1.5}.shop-scope{color:#bdcec5;margin-top:55px}

.deck-back[data-deck=blue]{background-color:#087bad}.deck-back[data-deck=blue] .deck-seal{background:#06668f}


.playing-card.boss-debuffed{background:#b7ada0}.playing-card.boss-debuffed .corner,.playing-card.boss-debuffed>svg{opacity:.45}.debuff-stamp{position:absolute;left:4px;right:4px;top:65px;transform:rotate(-12deg);padding:3px 0;border:2px solid #9e3831;background:#e4d4b9d9;color:#9e3831;font-size:14px;line-height:18px;font-weight:900;pointer-events:none}
.playing-card[data-enhancement]::after{position:absolute;left:31px;right:31px;bottom:5px;border-radius:10px;padding:2px;background:#234b47;color:#f0e5c8;font-size:11px;line-height:14px;font-weight:900;pointer-events:none}.playing-card[data-enhancement=mult]::after{content:'+4 MULT';background:#c54d54}.playing-card[data-enhancement=bonus]::after{content:'+30';background:#3c80ad}
.playing-card[data-enhancement=lucky]::after{content:'1/5 · 1/15';background:#7b5aa3}
.playing-card[data-enhancement=wild]::after{content:'ВСЕ МАСТИ';background:linear-gradient(90deg,#b84242,#c99535,#3f9360,#486eae)}
.playing-card[data-enhancement=steel]::after{content:'×1.5 В РУКЕ';background:linear-gradient(135deg,#8499a4,#40515b);color:#fff}
.playing-card[data-enhancement=glass]::after{content:'×2 · 1/4';background:linear-gradient(135deg,#bce8ec,#5d99a3);color:#17383d;text-shadow:0 1px #fff8}
.playing-card[data-enhancement=stone]{background:linear-gradient(145deg,#ded7c8,#89877d 48%,#4c5352);border-color:#343b3c}.playing-card[data-enhancement=stone]::after{content:'+50';background:#3c80ad;color:#fff}.stone-face{position:absolute;inset:4px 22px 19px;width:70px;height:124px;filter:drop-shadow(0 3px 2px #2228)}
.playing-card[data-enhancement=gold]{background:linear-gradient(145deg,#fff7cb,#d7a82f 52%,#8d5c10);border-color:#6f470c}.playing-card[data-enhancement=gold]::after{content:'$3 В КОНЦЕ';background:#9b6918;color:#fff7cb}
.played-card.shattering{border-color:#d9fbff;box-shadow:0 0 0 2px #a7e4e9,0 0 24px #d9fbff;clip-path:polygon(0 0,46% 0,52% 19%,100% 5%,100% 43%,78% 51%,100% 74%,91% 100%,49% 87%,18% 100%,0 71%,24% 48%,0 31%)}


.tooltip-money{color:#c78b15}


/* Hidden hand cards use the owned deck artwork without any face metadata. */
.playing-card.hidden-card{border:5px solid #f0e5c8;box-shadow:0 6px 0 #0c251ba6}
.playing-card.hidden-card.selected{border-color:#e8bb66;box-shadow:0 6px #0c251ba6,0 0 0 2px #dcb260}
.playing-card.hidden-card:disabled{background:#ca3d2a!important;background-image:repeating-linear-gradient(45deg,transparent 0 7px,#f0e5c850 7px 8px,transparent 8px 14px),repeating-linear-gradient(-45deg,transparent 0 7px,#f0e5c850 7px 8px,transparent 8px 14px)!important}
.playing-card.hidden-card[data-deck=blue]:disabled{background-color:#087bad!important}

/* Own printed deck backs share the same colour in setup, pile and hidden cards. */
[data-deck=red]{--deck-color:#ca3d2a}[data-deck=blue]{--deck-color:#087bad}[data-deck=yellow]{--deck-color:#b78a20}[data-deck=green]{--deck-color:#368862}[data-deck=black]{--deck-color:#272d36}[data-deck=magic]{--deck-color:#784fa3}[data-deck=nebula]{--deck-color:#344287}[data-deck=ghost]{--deck-color:#8b9699}[data-deck=abandoned]{--deck-color:#765b42}[data-deck=checkered]{--deck-color:#a8424b}[data-deck=zodiac]{--deck-color:#5360a1}[data-deck=painted]{--deck-color:#ad5b8b}[data-deck=anaglyph]{--deck-color:#327d82}[data-deck=plasma]{--deck-color:#a45ca7}[data-deck=erratic]{--deck-color:#887447}
.deck-back[data-deck],.start-deck-back[data-deck]{background-color:var(--deck-color,#ca3d2a)}.deck-back[data-deck]:not([data-deck=red]):not([data-deck=blue]) .deck-seal{background-color:var(--deck-color,#ad3828)}
.playing-card.hidden-card[data-deck]:disabled{background-color:var(--deck-color,#ca3d2a)!important}
.deck-back[data-deck=checkered],.start-deck-back[data-deck=checkered]{background-image:conic-gradient(#f0e5c855 25%,transparent 0 50%,#f0e5c855 0 75%,transparent 0);background-size:28px 28px}.deck-back[data-deck=plasma],.start-deck-back[data-deck=plasma]{background-image:repeating-radial-gradient(ellipse at center,#f0e5c850 0 3px,transparent 4px 14px)}.deck-back[data-deck=painted],.start-deck-back[data-deck=painted]{background-image:repeating-linear-gradient(145deg,#f0e5c850 0 3px,transparent 4px 17px),linear-gradient(135deg,transparent 30%,#36886299 30% 50%,#b78a2099 50% 70%,#087bad99 70%)}.deck-back[data-deck=anaglyph],.start-deck-back[data-deck=anaglyph]{background-image:repeating-linear-gradient(60deg,#d25d5580 0 5px,transparent 5px 15px,#45b5c880 15px 20px,transparent 20px 30px)}

.payout-bonus-list{position:absolute;left:16px;right:18px;top:191px;bottom:14px;overflow:auto}.payout-bonus-list .payout-row{position:static;min-height:45px;margin-bottom:4px}.payout-bonus-list .payout-joker>strong:first-child{color:#f6c35d}
/* Printing finishes and wax seals are independent of the card enhancement. */
.playing-card[data-edition]::before{content:"";position:absolute;inset:0;z-index:2;border-radius:5px;pointer-events:none}
.playing-card[data-edition=foil]::before{background:repeating-linear-gradient(125deg,#a7d7e91a 0 5px,#e8ffff70 6px,#376b8738 8px 13px);box-shadow:inset 0 0 0 3px #bad6e6aa;mix-blend-mode:screen}
.playing-card[data-edition=holographic]::before{background:linear-gradient(125deg,#df69ba50,#73cfdb55 30%,#f3d78366 55%,#8c88e955 80%,#df69ba50);box-shadow:inset 0 0 0 3px #dabdf5aa;mix-blend-mode:hard-light}
.playing-card[data-edition=polychrome]::before{background:conic-gradient(from 40deg,#ef789970,#f2d57275,#78d68b65,#7bd0ef75,#ab8ee570,#ef789970);box-shadow:inset 0 0 0 3px #faf0bbaa;mix-blend-mode:hard-light}
.playing-seal{position:absolute;right:7px;top:45px;z-index:3;display:grid;place-items:center;width:25px;height:25px;border:3px double #fff0c3;border-radius:50%;background:#a33f38;color:#fff2cf;font-size:18px;line-height:20px;font-weight:800;box-shadow:1px 2px 0 #3b2518aa;pointer-events:none}
.playing-seal[data-seal=gold]{background:#ac791d}.playing-seal[data-seal=blue]{background:#397aa6}.playing-seal[data-seal=purple]{background:#86519b}.boss-debuffed .playing-seal{opacity:.45}

.deck-info.extended-deck-info strong{font-size:16px;line-height:19px;min-height:38px;white-space:normal;display:flex;align-items:center;justify-content:center;padding:0 3px}.deck-info.extended-deck-info p{font-size:13px;line-height:15px;padding:4px;overflow:auto;touch-action:pan-y}

/* Audio controls share the existing settings dialog; no field geometry changes. */
.audio-settings label{display:flex;justify-content:space-between;gap:12px;font-size:17px;margin-top:18px}
.audio-settings output{color:#edb956;font-variant-numeric:tabular-nums}
.audio-settings input[type=range]{display:block;width:100%;height:44px;margin:0;accent-color:#ed9e16;cursor:pointer;touch-action:pan-x}
.audio-settings .audio-note{font-size:13px;opacity:.85}
button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #f5d371;outline-offset:3px}
/* Ink overlays move without changing the card's hitbox or rank placement. */
.playing-card[data-edition]::before{background-size:220% 220%;animation:edition-ink 7s ease-in-out infinite alternate}
@keyframes edition-ink{from{background-position:0% 15%}to{background-position:100% 85%}}
@media(prefers-reduced-motion:reduce){.playing-card[data-edition]::before{animation:none}}
@media(max-height:480px){
 dialog.audio-dialog{padding:12px 20px;max-height:94dvh}
 .audio-dialog h1{font-size:20px;margin-bottom:6px}
 .audio-dialog p{font-size:13px;line-height:1.35;margin:6px 0}
 .audio-settings label{font-size:15px;margin-top:6px}
 .audio-dialog #dialog-actions button{margin-top:4px;padding:10px 16px}
}

```

## Точный эталон home-v1/layout.js

```
// UI-NORMAL-ANDROID19: source1536x688, manual bounds ±5px; not parity acceptance.
export const LAYOUT={
 hud:[150,0,292,688],blind_panel:[157,30,274,202],blind_title:[165,30,266,45],blind_token:[174,117,81,84],blind_target:[260,114,161,85],
 round_score:[157,236,274,56],calculation_panel:[157,295,274,135],chips:[164,362,111,57],times:[275,362,33,57],mult:[308,362,111,57],
 run_info:[157,446,122,96],options:[157,552,122,98],hands:[286,445,66,61],discards:[360,445,68,61],money:[286,518,142,62],ante:[286,592,66,63],round:[360,592,68,63],
 joker_region_inferred:[469,20,681,146],joker_count:[475,172,28,14],consumable_region_inferred:[1210,20,212,146],consumable_count:[1293,172,28,14],
 hand_count:[798,542,31,15],play_hand:[551,564,163,85],sort_panel:[719,562,211,89],sort_label:[745,571,160,17],sort_rank:[733,590,89,42],sort_suit:[829,590,89,42],discard:[935,564,163,85],deck:[1208,491,113,148],deck_count:[1265,644,44,13],
};
export function installLayout() {
 for(const [id,[x,y,w,h]] of Object.entries(LAYOUT))Object.assign(document.getElementById(id).style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px'});
 const stage=document.getElementById('stage');
 function resize(){
   // Mobile innerWidth can include the unscaled stage's overflow (1536px).
   // The root client box is the actual available viewport, independent of content.
   const width=document.documentElement.clientWidth,height=document.documentElement.clientHeight;
   if(!width || !height)return;
   const scale=Math.min(width/1536,height/688);
   document.documentElement.style.setProperty("--ui-scale",scale);
   document.documentElement.style.setProperty("--deck-scale",Math.min(width/1536,height/709));
   Object.assign(stage.style,{transform:`scale(${scale})`,left:(width-1536*scale)/2+'px',top:(height-688*scale)/2+'px'});
 }
 new ResizeObserver(resize).observe(document.documentElement);
 window.visualViewport?.addEventListener('resize',resize);
 addEventListener('resize',resize);resize();
}

```

## Точный эталон home-v1/SHA256SUMS

```
43869749f11863074a30c32d5b861e30749c9ef386051c0d4ee037994997767e  layout.js
7cf251d0c8a0049b84fbc8affe4a7e77304a6ec4170f3bf22a5dd3ff863581a3  start-screen.css
9aaaa56673f9e460440abe0eed175d91f5b150b79c2ab9ec6e794f3d96c58fc5  start-screen.js
f9ee6c119f7f4e6cc7ea4b1156bb6e78be6af3195ff200c8ac842b2701af25a3  styles.css

```
