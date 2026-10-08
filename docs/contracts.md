# Контракт ядра — первая рабочая редакция

07.10.2026. План: `docs/superpowers/plans/2026-10-07-scoring-run.md`. Формат промежуточный, версионируется; это не заявление полного покрытия всех сущностей.

`CardInstance`: `{id:string, rank:2..14, suit:'clubs'|'diamonds'|'hearts'|'spades'}`; Base modifiers по умолчанию. Один ID принадлежит ровно одной карте. Одинаковые rank/suit с разными ID допустимы.

`JokerInstance`: `{id:string, entityId:string}`. Порядок массива определяет позицию. Сейчас поддерживаются `joker_joker`, `joker_sly_joker`, `joker_clever_joker`, `joker_splash`; неизвестный эффект не превращается в no-op.

`EffectContext`: выбранная комбинация, played cards и scoring IDs; число chips/mult, текущая фаза и source ID в трассе. В этой редакции подсчёт целочисленный; held/retrigger/копирование и другие контексты подключаются после проверки правил.

`GameState`: schemaVersion=1; runId; seed; revision (safe nonnegative integer); phase; deckId; cards (объект id→CardInstance); hand/drawPile/discardPile (массивы ID); jokers; handLevels (12 численных уровней); discoveredHands; rng={deck,effects}; money (BigInt); round={blindId,ante,target:BigInt,score:BigInt,handsRemaining,discardsRemaining,handSize}; lastScore=null/ScoreResult.

Первая фаза `blind_selection`; `START_BLIND` начинает Small Ante1. `PLAY_HAND`/`DISCARD` с cardIds 1..5 доступны в `playing`. Достигнутая цель даёт `round_won`; исчерпанные руки без цели — `game_over`. Выплата/магазин/следующий блайнд пока не подключены: не придумывать переходы при открытых payout правилах.

`GameAction`: `{type, expectedRevision, cardIds?}`. expectedRevision обязателен и равен state.revision; успешное действие увеличивает revision один раз. Устаревший повтор даёт STALE_ACTION; UI создаёт действия по текущему состоянию, не угадывает будущую версию.

`dispatch(state,action)->{state,events,error}`. При отказе state — тот же объект, events=[], error={code,message}. RNG/баланс/счётчики/порядок не меняются. При успехе новые изменённые данные не разделяют mutable экземпляры с исходным state. Исключения реализации не выдавать за корректное действие.

`GameEvent`: discriminated `type`; score_step включает phase, sourceId, operation, before/after chips/mult; score_total — итог; cards_drawn — ID; hand_played/discarded — ID; round_started/won/lost — состояние. События не требуют случайности при отображении.

`scoreHand(state,playedCards)->ScoreResult`: handId,isRoyal,scoringCardIds,chips:BigInt,mult:BigInt,score:BigInt,trace:GameEvent[]. Читает handLevels/jokers, не меняет их и RNG. Только проверенная Base ветвь; неподдержанные modifiers явно отвергаются.

`SaveData`: `{format:'card-cascade-save',version:1,state:JSONValue}`. Поля BigInt кодируются как строго десятичные строки по схеме; произвольные tagged objects не интерпретируются. deserialize проверяет каталоги/ID/порядок/фазы/RNG/значения до использования. Полный атомарный Android write/backup — следующий блок, не готовая функция в этой редакции.

`createRun(seed,{runId,deckId='red',money})`: money передаётся явно, пока стартовый баланс не подтверждён; red/blue — единственные проверенные начальные колоды. Не принимать произвольную seed-строку за обещание одинаковых магазинов оригинала.

Границы первой схемы: seed 1..1000 UTF-16 units, runId1..120; JSON≤2MiB, decimal fields≤4096 symbols. Счётчики импортируемого Red/Blue без modifiers не превышают стартовые4/5 hands и4/3 discards. Активная фаза должна иметь играбельную руку и завершённый добор; held≥handSize допускается. Этот формат поддерживает только описанный срез, не импорт сохранений оригинала; при добавлении изменения уровней/джокеров между раундами потребуется сохранить исторический контекст lastScore и пересмотреть валидацию трассы.
