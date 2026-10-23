import catalog from '../content/apk-shop-catalog.js';
import {PROFILE_UNLOCKS} from '../content/profile-unlocks.js';
import {CHALLENGE_BY_ID} from '../content/challenges.js';
import {DECKS} from '../content/decks.js';
import {APK_BLINDS} from '../content/apk-blinds.js';
import {APK_TAGS} from '../content/apk-tags.js';
import {originalJokerKey,handRecognitionOptions} from '../content/jokers.js';
import {evaluateHand} from './hands.js';
import {APK_HAND_NAMES} from './apk-shop-state.js';
import {isCardFace} from './card-faces.js';
import {isCardSuit} from './card-suits.js';
import {isBossCardDebuffed} from './boss-effects.js';

const visibleSets=new Set(['Joker','Tarot','Planet','Spectral','Voucher','Booster','Enhanced','Edition']);
const centres=catalog.centres.filter(c=>visibleSets.has(c.set)&&!c.omit);
const rows=[...centres.map(c=>({id:c.key,set:c.set,name:c.name,order:c.order??0})),...Object.entries(DECKS).map(([id,c],order)=>({id:'b_'+id,set:'Back',name:c.name,order})),...APK_BLINDS.map(c=>({id:c.id,set:'Blind',name:c.name,order:c.order})),...APK_TAGS.map(c=>({id:c.id,set:'Tag',name:c.name,order:c.order})),...['base','foil','holo','polychrome','negative'].map((id,order)=>({id:'e_'+id,set:'Edition',name:id,order})),...['red','gold','blue','purple'].map((id,order)=>({id:'seal_'+id,set:'Seal',name:id,order}))];
const ids=new Set([...catalog.centres.map(c=>c.key),...rows.map(c=>c.id)]);
const byId=Object.fromEntries(centres.map(c=>[c.key,c]));
const LEGENDARY=['j_caino','j_triboulet','j_yorick','j_chicot','j_perkeo'];
const CAREER=['c_round_interest_cap_streak','c_dollars_earned','c_shop_dollars_spent','c_tarots_bought','c_planets_bought','c_playing_cards_bought','c_vouchers_bought','c_tarot_reading_used','c_planetarium_used','c_shop_rerolls','c_cards_played','c_cards_discarded','c_losses','c_wins','c_rounds','c_hands_played','c_face_cards_played','c_jokers_sold','c_cards_sold','c_single_hand_round_streak'];
const safe=n=>Number.isSafeInteger(n)&&n>=0;
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const own=(obj,id)=>Object.hasOwn(obj,id);
function assert(ok){if(!ok)throw new TypeError('Invalid profile');}
function increment(obj,key,amount=1){assert(safe(amount));obj[key]=Math.min(Number.MAX_SAFE_INTEGER,(own(obj,key)?obj[key]:0)+amount);}
const nativeId=j=>originalJokerKey(j?.entityId)??j?.entityId;
const unique=values=>[...new Set(values)];
const highest=wins=>Math.max(0,...(wins??[]).flatMap((count,i)=>count?[i+1]:[]));
const enhancementId=card=>card.enhancement?'m_'+card.enhancement:null;
const editionId=card=>({foil:'e_foil',holographic:'e_holo',holo:'e_holo',polychrome:'e_polychrome',negative:'e_negative'})[card.edition];
export function createProfile(){return {version:1,unlocked:unique([...centres.filter(c=>c.unlocked!==false&&!c.start_locked).map(c=>c.key),'b_red']),discovered:unique([...centres.filter(c=>c.start_discovered).map(c=>c.key),'b_red']),career:Object.fromEntries(CAREER.map(key=>[key,0])),highScores:{hand:'0',mostMoney:'0',furthestAnte:0,furthestRound:0,winStreak:0,currentStreak:0,bossStreak:0},completedChallenges:[],deckWins:{},jokerWins:{},deckLosses:{},jokerLosses:{},usage:{jokers:{},vouchers:{},consumables:{},decks:{},hands:{}},runs:{}};}
export function validateProfile(p){
 assert(object(p)&&p.version===1&&Object.keys(p).every(k=>['version','unlocked','discovered','career','highScores','deckWins','jokerWins','deckLosses','jokerLosses','usage','runs','completedChallenges'].includes(k)));
 if(own(p,'completedChallenges'))assert(Array.isArray(p.completedChallenges)&&new Set(p.completedChallenges).size===p.completedChallenges.length&&p.completedChallenges.every(id=>typeof id==='string'&&own(CHALLENGE_BY_ID,id)));
 for(const field of ['unlocked','discovered'])assert(Array.isArray(p[field])&&new Set(p[field]).size===p[field].length&&p[field].every(id=>typeof id==='string'&&ids.has(id)));
 assert(object(p.career)&&CAREER.every(k=>safe(p.career[k]))&&Object.keys(p.career).every(k=>CAREER.includes(k)));
 assert(object(p.highScores)&&['hand','mostMoney'].every(k=>typeof p.highScores[k]==='string'&&/^\d{1,10000}$/.test(p.highScores[k]))&&['furthestAnte','furthestRound','winStreak','currentStreak','bossStreak'].every(k=>safe(p.highScores[k]))&&Object.keys(p.highScores).length===7);
 for(const [field,valid] of [['deckWins',id=>own(DECKS,id)],['jokerWins',id=>byId[id]?.set==='Joker'],['deckLosses',id=>own(DECKS,id)],['jokerLosses',id=>byId[id]?.set==='Joker']]){assert(object(p[field]));for(const [id,wins] of Object.entries(p[field]))assert(valid(id)&&Array.isArray(wins)&&wins.length===8&&wins.every(safe));}
 assert(object(p.usage)&&Object.keys(p.usage).length===5);for(const category of ['jokers','vouchers','consumables','decks','hands']){assert(object(p.usage[category]));for(const [id,count] of Object.entries(p.usage[category]))assert((category==='decks'?own(DECKS,id):category==='hands'?own(APK_HAND_NAMES,id):ids.has(id))&&safe(count));}
 assert(object(p.runs));for(const [id,run] of Object.entries(p.runs)){assert(id.length>0&&id.length<=120&&object(run)&&safe(run.revision)&&typeof run.seeded==='boolean'&&typeof run.challenge==='boolean'&&typeof run.won==='boolean'&&typeof run.lost==='boolean'&&safe(run.maxJokers)&&safe(run.bossStreak)&&safe(run.rounds)&&object(run.handUsage)&&Object.entries(run.handUsage).every(([k,n])=>own(APK_HAND_NAMES,k)&&safe(n))&&Object.keys(run).every(k=>['revision','seeded','challenge','won','lost','maxJokers','bossStreak','rounds','handUsage'].includes(k)));}
 return p;
}
export function deckUnlocked(p,id){return own(DECKS,id)&&p.unlocked.includes('b_'+id);}
export function stakeUnlocked(p,id,stake){return deckUnlocked(p,id)&&Number.isInteger(stake)&&stake>=1&&stake<=8&&(stake===1||highest(p.deckWins[id])>=stake-1);}
export function legendaryWinIds(p){return LEGENDARY.filter(id=>(p.jokerWins[id]?.[7]??0)>0);}
export function profileRunContext(p){return {unlockedCentreIds:p.unlocked.filter(id=>own(byId,id)),lockedCentreIds:centres.filter(c=>!p.unlocked.includes(c.key)).map(c=>c.key)};}
function conditionText(id){
 const c=PROFILE_UNLOCKS[id];if(!c)return '';const x=c.extra;
 if(c.hidden)return 'Получите этого легендарного джокера из карты «Душа».';
 const simple={c_losses:'Проиграйте партий',c_hands_played:'Сыграйте рук',c_face_cards_played:'Сыграйте фигурных карт',c_jokers_sold:'Продайте джокеров',c_cards_sold:'Продайте карт',c_shop_dollars_spent:'Потратьте в магазине долларов',c_shop_rerolls:'Обновите магазин раз',c_tarot_reading_used:'Используйте коробочек Таро',c_planetarium_used:'Используйте планетных коробочек',c_cards_played:'Сыграйте карт',c_cards_discarded:'Сбросьте карт',c_tarots_bought:'Купите карт Таро',c_planets_bought:'Купите планет',c_playing_cards_bought:'Купите игральных карт'};
 if(simple[c.type])return `${simple[c.type]}: ${x}.`;
 if(c.type==='discover_amount')return c.amount?`Обнаружьте ${c.amount} предметов коллекции.`:c.tarot_count?`Обнаружьте все ${c.tarot_count} карты Таро.`:`Обнаружьте все ${c.planet_count} планет.`;
 if(c.type==='win_deck')return `Победите с колодой «${DECKS[c.deck.slice(2)].name}».`;
 if(c.type==='win_stake')return `Победите на ставке ${c.stake}.`;
 if(c.type==='ante_up')return `Достигните Анте ${c.ante}.`;
 if(c.type==='chip_score')return `Наберите ${c.chips} очков за одну руку.`;
 if(c.type==='win')return `Победите за ${c.n_rounds} раундов или меньше.`;
 if(c.type==='win_no_hand')return `Победите, ни разу не сыграв комбинацию «${c.extra}».`;
 if(c.type==='modify_deck')return x.suit?`Соберите ${x.count} карт масти ${{Hearts:'червы',Diamonds:'бубны',Spades:'пики',Clubs:'трефы'}[x.suit]}.`:x.tally?`Соберите ${x.count} улучшенных карт.`:`Соберите ${x.count} карт с улучшением «${{m_wild:'Дикая',m_glass:'Стеклянная'}[x.e_key]}».`;
 const descriptions={j_troubadour:'Выиграйте 5 раундов подряд за одну руку.',j_certificate:'Получите Золотую карту с Золотой печатью.',j_throwback:'Продолжите сохранённую партию.',j_hanging_chad:'Победите босса старшей картой.',j_seeing_double:'Сыграйте руку с четырьмя семёрками треф.',j_ticket:'Сыграйте пять Золотых карт.',j_matador:'Победите босса за одну руку без сбросов.',j_hit_the_road:'Сбросьте пять валетов за один раз.',j_brainstorm:'Сбросьте роял-флеш.',j_satellite:'Накопите $400.',j_shoot_the_moon:'Сыграйте все червы колоды за один раунд.',j_bootstraps:'Получите двух полихромных джокеров.',j_invisible:'Победите, ни разу не имея больше четырёх джокеров.',j_blueprint:'Победите в партии.',v_liquidation:'Получите 10 билетов за одну партию.',v_glow_up:'Получите пять джокеров с покрытиями.',v_money_tree:'Получите максимальные проценты 10 раундов подряд.',v_antimatter:'Купите Пустой билет 10 раз.',v_retcon:'Обнаружьте 25 блайндов.',v_palette:'Уменьшите размер руки до 5 карт.'};
 return descriptions[id]??'';
}
export function collectionEntries(p){return rows.map(row=>({...row,unlocked:p.unlocked.includes(row.id)||(!PROFILE_UNLOCKS[row.id]&&row.set!=='Back'),discovered:['Enhanced','Seal'].includes(row.set)||p.discovered.includes(row.id),condition:conditionText(row.id),sticker:row.set==='Joker'?highest(p.jokerWins[row.id]):row.set==='Back'?highest(p.deckWins[row.id.slice(2)]):0}));}
function addWin(map,id,stake,fill=false){const wins=map[id]??Array(8).fill(0);increment(wins,stake-1);if(fill)for(let i=0;i<stake;i++)if(!wins[i])wins[i]=1;map[id]=wins;}
function discover(profile,id){if(ids.has(id)&&!profile.discovered.includes(id))profile.discovered.push(id);if(LEGENDARY.includes(id)&&!profile.unlocked.includes(id))profile.unlocked.push(id);}
function totalDiscovered(profile){return rows.filter(r=>!['Enhanced','Seal'].includes(r.set)&&profile.discovered.includes(r.id)).length;}
function isRoyal(cards,state){if(cards.length<4)return false;const evaluated=evaluateHand(cards.map((card,i)=>({...card,id:card.id??String(i)})),{...handRecognitionOptions(state.jokers??[]),isCardDebuffed:card=>isBossCardDebuffed(state,card)});return evaluated.handId==='straight_flush'&&Math.min(...cards.map(c=>c.rank))===10;}
function moneyPeak(n,events=[]){return events.filter(e=>e.type==='money_changed').flatMap(e=>[e.before,e.after]).filter(v=>typeof v==='bigint').reduce((max,v)=>v>max?v:max,n.money);}
function recordHighScores(p,n,run,events=[]){
 p.highScores.hand=String(BigInt(p.highScores.hand)>BigInt(n.lastScore?.score??0)?p.highScores.hand:BigInt(n.lastScore?.score??0));
 const peak=moneyPeak(n,events);p.highScores.mostMoney=String(BigInt(p.highScores.mostMoney)>peak?p.highScores.mostMoney:peak);
 p.highScores.furthestAnte=Math.max(p.highScores.furthestAnte,n.round?.ante??0);p.highScores.furthestRound=Math.max(p.highScores.furthestRound,run.rounds);
}
// Native usage tables are intentionally updated in seeded/challenge games,
// whereas career, discoveries, wins and unlocks are excluded in those modes.
function recordExcludedUsage(p,prev,n,events,started){
 if(started)increment(p.usage.decks,n.deckId);
 for(const e of events){
  if(e.type==='hand_played'&&n.lastScore?.handId)increment(p.usage.hands,n.lastScore.handId);
  if(e.type==='round_won')for(const j of n.jokers??[])increment(p.usage.jokers,nativeId(j));
  if(e.type==='voucher_redeemed')increment(p.usage.vouchers,e.voucherId);
  if(e.type==='consumable_used')increment(p.usage.consumables,e.entityId);
 }
}
export function updateProfile(profile,previousState,nextState,events=[],context={}){
 validateProfile(profile);if(!nextState)return profile;
 const p=structuredClone(profile),id=nextState.runId;assert(typeof id==='string'&&id.length>0&&id.length<=120&&safe(nextState.revision));
 let run=own(p.runs,id)?p.runs[id]:null;
 if(run&&nextState.revision<=run.revision){if(nextState.revision===run.revision&&context.continued&&!run.seeded&&!run.challenge&&!p.unlocked.includes('j_throwback')){p.unlocked.push('j_throwback');return p;}return profile;}
 const started=!run;run??={revision:-1,seeded:context.seeded===true,challenge:!!nextState.challengeId||!!context.challenge,won:false,lost:false,maxJokers:0,bossStreak:0,rounds:0,handUsage:{}};
 run.revision=nextState.revision;run.maxJokers=Math.max(run.maxJokers,previousState?.jokers?.length??0,nextState.jokers?.length??0);Object.defineProperty(p.runs,id,{value:run,writable:true,enumerable:true,configurable:true});
 if(started&&context.abandonedRunId&&own(p.runs,context.abandonedRunId)){const old=p.runs[context.abandonedRunId];if(!old.seeded&&!old.challenge&&!old.won)p.highScores.currentStreak=0;}
 for(const event of events)if(event.type==='round_started')increment(run,'rounds');
 if(run.seeded||run.challenge){
  if(run.challenge&&own(CHALLENGE_BY_ID,nextState.challengeId)&&!run.won&&nextState.winPending===true&&nextState.phase==='round_won'&&nextState.round?.ante===8&&nextState.round.blindId==='boss'&&events.some(e=>e.type==='round_won')){
   run.won=true;p.completedChallenges??=[];if(!p.completedChallenges.includes(nextState.challengeId))p.completedChallenges.push(nextState.challengeId);
  }
  recordExcludedUsage(p,previousState??nextState,nextState,events,started);if(!run.seeded)recordHighScores(p,nextState,run,events);return validateProfile(p);}
 const prev=previousState??nextState,n=nextState;
 if(started)increment(p.usage.decks,n.deckId);
 const inc=(key,amount=1)=>increment(p.career,key,amount);
 const owned=[...(n.jokers??[]),...(n.consumables??[])];
 discover(p,'b_'+n.deckId);
 for(const card of owned){discover(p,nativeId(card));const edition=editionId(card);if(edition)discover(p,edition);else discover(p,'e_base');}
 for(const card of Object.values(n.cards??{})){const enhanced=enhancementId(card);if(enhanced)discover(p,enhanced);if(card.seal)discover(p,'seal_'+card.seal);}
 const roundWin=events.some(e=>e.type==='round_won'),played=events.find(e=>e.type==='hand_played'),discarded=events.find(e=>e.type==='cards_discarded');
 const playedCards=(played?.cardIds??[]).map(id=>prev.cards?.[id]).filter(Boolean),discardedCards=(discarded?.cardIds??[]).map(id=>prev.cards?.[id]).filter(Boolean);
 if(played){inc('c_hands_played');inc('c_cards_played',played.cardIds.length);inc('c_face_cards_played',playedCards.filter(c=>isCardFace(c,prev.jokers??[],{debuffed:isBossCardDebuffed(prev,c)})).length);if(n.lastScore?.handId){increment(run.handUsage,n.lastScore.handId);increment(p.usage.hands,n.lastScore.handId);}}
 if(discarded)inc('c_cards_discarded',discarded.cardIds.length);
 if(roundWin){discover(p,n.round.blindId==='boss'?n.apkBlinds?.bossId:'bl_'+n.round.blindId);if(n.round.blindId==='boss'){run.bossStreak++;p.highScores.bossStreak=Math.max(p.highScores.bossStreak,run.bossStreak);}p.career.c_single_hand_round_streak=n.round.handsPlayed===1?p.career.c_single_hand_round_streak+1:0;for(const j of n.jokers??[])increment(p.usage.jokers,nativeId(j));
  const quote=n.cashoutQuote?.quote;if(quote&&n.money>=5n&&n.deckId!=='green'){const cap=(n.apkShop?.context?.usedVoucherIds??[]).includes('v_money_tree')?20n:(n.apkShop?.context?.usedVoucherIds??[]).includes('v_seed_money')?10n:5n;p.career.c_round_interest_cap_streak=n.money/5n>=cap?p.career.c_round_interest_cap_streak+1:0;}
 }
 for(const e of events){
  if(e.type==='money_changed'&&e.reason!=='scoring'&&typeof e.delta==='bigint'&&e.delta>0n)inc('c_dollars_earned',Number(e.delta>BigInt(Number.MAX_SAFE_INTEGER)?BigInt(Number.MAX_SAFE_INTEGER):e.delta));
  if(e.type==='score_money'&&typeof e.amount==='bigint'&&e.amount>0n)inc('c_dollars_earned',Number(e.amount>BigInt(Number.MAX_SAFE_INTEGER)?BigInt(Number.MAX_SAFE_INTEGER):e.amount));
  if(e.type==='round_started')inc('c_rounds');
  if(e.type==='cards_forced_discarded')inc('c_cards_discarded',e.cardIds.length);
  if(['blind_skipped','tag_added','tag_pack_queued'].includes(e.type))discover(p,e.tagId);
  if(e.type==='shop_rerolled'){if(BigInt(e.cost??0)>0n)inc('c_shop_rerolls');inc('c_shop_dollars_spent',Number(e.cost??0));}
  if(e.type==='voucher_redeemed'){discover(p,e.voucherId);increment(p.usage.vouchers,e.voucherId);inc('c_vouchers_bought');inc('c_shop_dollars_spent',Number(e.cost??0));}
  if(e.type==='booster_opened'){discover(p,e.entityId);const offer=prev.shop?.boosters?.find(o=>o.id===e.offerId);if(offer)inc('c_shop_dollars_spent',Number(offer.cost));}
  if(e.type==='shop_card_bought'){const offer=prev.shop?.main?.find(o=>o.id===e.offerId);inc('c_shop_dollars_spent',Number(e.cost??0));const set=byId[offer?.originalKey??offer?.entityId]?.set;if(set==='Tarot')inc('c_tarots_bought');if(set==='Planet')inc('c_planets_bought');if(offer?.playingCard||offer?.set==='Base'||set==='Default'||set==='Enhanced')inc('c_playing_cards_bought');}
  if(e.type==='joker_sold'){inc('c_jokers_sold');inc('c_cards_sold');}
  if(e.type==='owned_card_sold'){inc('c_cards_sold');if(e.area==='jokers')inc('c_jokers_sold');}
  if(e.type==='cash_out'&&typeof e.total==='bigint'&&e.total>0n)inc('c_dollars_earned',Number(e.total>BigInt(Number.MAX_SAFE_INTEGER)?BigInt(Number.MAX_SAFE_INTEGER):e.total));
  if(e.type==='pack_card_used'&&events.some(e=>e.type==='booster_closed')){if(prev.packState?.sourceEntityId?.startsWith('p_arcana'))inc('c_tarot_reading_used');if(prev.packState?.sourceEntityId?.startsWith('p_celestial'))inc('c_planetarium_used');}
  if(e.type==='consumable_used'){discover(p,e.entityId);increment(p.usage.consumables,e.entityId);}
 }
 const win=!!n.winPending&&!run.won;
 if(win){run.won=true;inc('c_wins');p.highScores.currentStreak++;p.highScores.winStreak=Math.max(p.highScores.winStreak,p.highScores.currentStreak);addWin(p.deckWins,n.deckId,n.stake??1,true);for(const j of n.jokers??[])addWin(p.jokerWins,nativeId(j),n.stake??1);}
 if(n.phase==='game_over'&&!run.won&&!run.lost){run.lost=true;inc('c_losses');p.highScores.currentStreak=0;addWin(p.deckLosses,n.deckId,n.stake??1);for(const j of n.jokers??[])addWin(p.jokerLosses,nativeId(j),n.stake??1);}
 recordHighScores(p,n,run,events);
 const cards=Object.values(n.cards??{}),jokers=n.jokers??[],vouchers=n.apkShop?.context?.usedVoucherIds??[];
 const highestStake=Math.max(0,...Object.values(p.deckWins).map(highest));
 // Native handlers run after their corresponding event; persistent predicates
 // are safe to re-evaluate, while transient hand/discard/win rules stay gated.
 for(const [key,c] of Object.entries(PROFILE_UNLOCKS)){
  if(p.unlocked.includes(key))continue;let unlocked=false;const x=c.extra;
  if(c.type.startsWith('c_'))unlocked=p.career[c.type]>=x;
  else if(c.type==='discover_amount')unlocked=c.amount?totalDiscovered(p)>=c.amount:c.tarot_count?centres.filter(c=>c.set==='Tarot'&&p.discovered.includes(c.key)).length>=c.tarot_count:centres.filter(c=>c.set==='Planet'&&p.discovered.includes(c.key)).length>=c.planet_count;
  else if(c.type==='win_deck')unlocked=highest(p.deckWins[c.deck.slice(2)])>0;
  else if(c.type==='win_stake')unlocked=highestStake>=c.stake;
  else if(c.type==='ante_up')unlocked=(n.round?.ante??0)>=c.ante;
  else if(c.type==='money')unlocked=moneyPeak(n,events)>=BigInt(x);
  else if(c.type==='chip_score')unlocked=!!played&&BigInt(n.lastScore?.score??0)>=BigInt(c.chips);
  else if(c.type==='win')unlocked=win&&run.rounds<=c.n_rounds;
  else if(c.type==='win_no_hand')unlocked=win&&!(run.handUsage[Object.keys(APK_HAND_NAMES).find(id=>APK_HAND_NAMES[id]===x)]??0);
  else if(c.type==='win_custom')unlocked=win&&(key==='j_blueprint'||run.maxJokers<=4);
  else if(c.type==='modify_deck')unlocked=cards.filter(card=>x.suit?card.suit===x.suit.toLowerCase():x.tally?!!card.enhancement:enhancementId(card)===x.e_key).length>=x.count;
  else if(c.type==='modify_jokers')unlocked=jokers.filter(j=>j.edition==='polychrome').length>=x.count;
  else if(c.type==='have_edition')unlocked=jokers.filter(j=>editionId(j)).length>=x;
  else if(c.type==='double_gold')unlocked=cards.some(card=>card.enhancement==='gold'&&card.seal==='gold');
  else if(c.type==='continue_game')unlocked=context.continued===true;
  else if(c.type==='blank_redeems')unlocked=(p.usage.vouchers.v_blank??0)>=x;
  else if(c.type==='run_redeem')unlocked=vouchers.length>=x;
  else if(c.type==='blind_discoveries')unlocked=APK_BLINDS.filter(b=>p.discovered.includes(b.id)).length>=x;
  else if(c.type==='min_hand_size')unlocked=n.round?.handSize<=x;
  else if(c.type==='interest_streak')unlocked=p.career.c_round_interest_cap_streak>=x;
  else if(c.type==='round_win')unlocked=roundWin&&(key==='j_troubadour'?p.career.c_single_hand_round_streak>=x:key==='j_hanging_chad'?n.round.blindId==='boss'&&n.lastScore?.handId==='high_card':n.round.blindId==='boss'&&n.round.handsPlayed===1&&(n.round.discardsUsed??0)===0);
  else if(c.type==='hand_contents')unlocked=!!played&&(key==='j_ticket'?playedCards.filter(card=>card.enhancement==='gold').length>=5:playedCards.filter(card=>card.rank===7&&card.enhancement!=='stone'&&isCardSuit(card,'clubs',{jokers:prev.jokers??[],debuffed:isBossCardDebuffed(prev,card)})).length>=4);
  else if(c.type==='discard_custom')unlocked=!!discarded&&(key==='j_hit_the_road'?discardedCards.filter(card=>card.rank===11&&card.enhancement!=='stone').length>=5:key==='j_brainstorm'&&isRoyal(discardedCards,prev));
  else if(c.type==='play_all_hearts')unlocked=!!played&&[...(n.hand??[]),...(n.drawPile??[])].every(id=>n.cards[id]?.suit!=='hearts'||n.cards[id]?.enhancement==='stone');
  if(unlocked){p.unlocked.push(key);if(key.startsWith('b_'))discover(p,key);}
 }
 return validateProfile(p);
}
