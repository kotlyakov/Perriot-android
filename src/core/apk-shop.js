// Independently implemented conditional APK selection. Catalogue contains facts only.
import catalogue from '../content/apk-shop-catalog.js';
import {nextApkRandom,nextApkSeed,createApkMathState,nextApkMathRandom} from './apk-rng.js';
import {quoteShopCard} from './shop-pricing.js';
const centres=Object.fromEntries(catalogue.centres.map(c=>[c.key,c]));
const poolFor=set=>catalogue.centres.filter(c=>c.set===set && !c.wip && !c.skip_pool && !c.omit).sort((a,b)=>a.order-b.order);
const pools=Object.fromEntries(['Joker','Tarot','Planet','Spectral','Voucher','Booster','Enhanced'].map(set=>[set,poolFor(set)]));
const fallback={Joker:'j_joker',Tarot:'c_strength',Planet:'c_pluto',Spectral:'c_incantation',Voucher:'v_blank',Enhanced:'j_joker'};
const handNames=['High Card','Pair','Two Pair','Three of a Kind','Straight','Flush','Full House','Four of a Kind','Straight Flush','Five of a Kind','Flush House','Flush Five'];
const ordinaryHands=['Straight','Flush','Full House','Four of a Kind','Straight Flush','High Card','Pair','Two Pair','Three of a Kind'];
export function getApkShopCatalogCounts(){return Object.fromEntries(Object.entries(pools).map(([set,p])=>[set,p.length]));}
export function createApkShopContext(options={}){
 const context={ante:1,reducedMotion:false,playedHands:{},ownedCentreIds:[],usedCentreIds:[],usedVoucherIds:[],shopVoucherIds:[],bannedCentreIds:[],unlockedCentreIds:[],lockedCentreIds:[],enhancementIds:[],poolFlags:{},editionRate:1,inflation:0,discountPercent:0,mainSlots:2,boosterSlots:2,modifiers:{},rates:{Joker:20,Tarot:4,Planet:4,Base:0,Spectral:0},visibleHandOrder:ordinaryHands,...structuredClone(options)};
 const object=value=>value&&typeof value==='object'&&!Array.isArray(value);
 if(!object(options))throw new TypeError('Shop context must be an object');
 const supported=new Set(['ante','reducedMotion','playedHands','ownedCentreIds','usedCentreIds','usedVoucherIds','shopVoucherIds','bannedCentreIds','unlockedCentreIds','lockedCentreIds','enhancementIds','poolFlags','editionRate','inflation','discountPercent','mainSlots','boosterSlots','modifiers','rates','visibleHandOrder','tutorialShopSurcharge']);
 if(Object.keys(options).some(key=>!supported.has(key)))throw new TypeError('Unsupported shop context field');
 for(const field of ['ownedCentreIds','usedCentreIds','usedVoucherIds','shopVoucherIds','bannedCentreIds','unlockedCentreIds','lockedCentreIds','enhancementIds'])if(!Array.isArray(context[field])||context[field].some(id=>typeof id!=='string'||!centres[id]))throw new TypeError('Invalid '+field);
 for(const field of ['usedVoucherIds','shopVoucherIds'])if(context[field].some(id=>centres[id].set!=='Voucher'))throw new TypeError('Invalid voucher identity');
 if(context.enhancementIds.some(id=>centres[id].set!=='Enhanced'))throw new TypeError('Invalid enhancement identity');
 if(typeof context.reducedMotion!=='boolean'||context.tutorialShopSurcharge!==undefined&&typeof context.tutorialShopSurcharge!=='boolean')throw new TypeError('Invalid shop motion/tutorial flag');
 if(!object(context.playedHands)||Object.entries(context.playedHands).some(([hand,n])=>!handNames.includes(hand)||!Number.isSafeInteger(n)||n<0))throw new TypeError('Invalid played hands');
 if(!Array.isArray(context.visibleHandOrder)||!context.visibleHandOrder.length||context.visibleHandOrder.some(hand=>!handNames.includes(hand))||new Set(context.visibleHandOrder).size!==context.visibleHandOrder.length)throw new TypeError('Invalid visible hand order');
 if(!object(context.poolFlags)||Object.values(context.poolFlags).some(v=>typeof v!=='boolean'))throw new TypeError('Invalid pool flags');
 const modifierKeys=['all_eternal','enable_eternals_in_shop','enable_perishables_in_shop','enable_rentals_in_shop','booster_ante_scaling'];
 if(!object(context.modifiers)||Object.entries(context.modifiers).some(([key,value])=>!modifierKeys.includes(key)||typeof value!=='boolean'))throw new TypeError('Invalid or unsupported shop modifier');
 if(options.rates!==undefined&&(!object(options.rates)||Object.keys(options.rates).some(key=>!['Joker','Tarot','Planet','Base','Spectral'].includes(key))))throw new TypeError('Unknown shop type rate');
 context.rates={Joker:20,Tarot:4,Planet:4,Base:0,Spectral:0,...options.rates};
 if(!Number.isSafeInteger(context.ante)||context.ante<1)throw new RangeError('Invalid shop ante');
 for(const field of ['mainSlots','boosterSlots','inflation','discountPercent'])if(!Number.isSafeInteger(context[field])||context[field]<0)throw new RangeError(`Invalid ${field}`);
 if(context.discountPercent>100 || !Number.isFinite(context.editionRate) || context.editionRate<0 || Object.values(context.rates).some(rate=>!Number.isFinite(rate)||rate<0)||!Number.isFinite(Object.values(context.rates).reduce((a,b)=>a+b,0))||Object.values(context.rates).reduce((a,b)=>a+b,0)<=0)throw new RangeError('Invalid shop rates or pricing');
 return context;
}
function session(rng,context){
 let current=rng;const used=new Set([...context.ownedCentreIds,...context.usedCentreIds]);
 const random=key=>{const next=nextApkRandom(current,key);current=next.rng;return next.value;};
 const element=(values,key)=>{const seed=nextApkSeed(current,key);const next=nextApkMathRandom(createApkMathState(seed.value),values.length);current={...seed.rng,mathState:next.state};return values[next.value-1];};
 const unkeyed=(min,max)=>{const next=nextApkMathRandom(current.mathState,min,max);current={...current,mathState:next.state};return next.value;};
 const juice=()=>{if(!context.reducedMotion)unkeyed(2);};
 const has=id=>context.ownedCentreIds.includes(id);
 const available=c=>{
  let add=c.set==='Enhanced'||((has('j_ring_master')||!used.has(c.key)) && (c.rarity===4 || (context.unlockedCentreIds.includes(c.key)||(!context.lockedCentreIds.includes(c.key)&&c.unlocked!==false&&!c.start_locked))));
  if(add && c.set==='Voucher')add=!context.usedVoucherIds.includes(c.key)&&!context.shopVoucherIds.includes(c.key)&&(!c.requires||c.requires.every(id=>context.usedVoucherIds.includes(id)));
  if(add && c.set==='Planet'&&c.softlock)add=(context.playedHands[c.handType]??0)>0;
  if(add && c.enhancement_gate)add=context.enhancementIds.includes(c.enhancement_gate);
  if(['c_soul','c_black_hole'].includes(c.key))add=false;
  if(c.no_pool_flag&&context.poolFlags[c.no_pool_flag] || c.yes_pool_flag&&!context.poolFlags[c.yes_pool_flag] || context.bannedCentreIds.includes(c.key))add=false;
  return add;
 };
 const select=(set,append='')=>{
  let source=pools[set];let key=set+append;
  if(set==='Joker'){const poll=random('rarity'+context.ante+append);const rarity=poll>0.95?3:poll>0.7?2:1;source=source.filter(c=>c.rarity===rarity);key='Joker'+rarity+append;}
  key+=context.ante;
  let values=source.map(c=>available(c)?c.key:'UNAVAILABLE');
  if(values.every(v=>v==='UNAVAILABLE'))values=[fallback[set]];
  let id=element(values,key),resample=1;
  while(id==='UNAVAILABLE'){resample++;id=element(values,key+'_resample'+resample);}
  return id;
 };
 const edition=()=>{const poll=random('edisho'+context.ante);return poll>0.997?'negative':poll>1-0.006*context.editionRate?'polychrome':poll>1-0.02*context.editionRate?'holographic':poll>1-0.04*context.editionRate?'foil':'base';};
 const construct=(id,instanceId,{main=false,materialize=false,frontKey}={})=>{
  const c=centres[id];if(!c)throw new Error('Unknown APK centre '+id);
  const offer={id:instanceId,entityId:id,originalKey:id,set:c.set,edition:'base'};
  if(frontKey)offer.frontKey=frontKey;
  if(id==='j_todo_list')offer.toDoPokerHand=element(context.visibleHandOrder,'to_do');
  for(const centre of catalogue.centres)if(centre.name===c.name)used.add(centre.key);
  for(let i=0;i<3;i++)unkeyed();
  if(c.consumeable&&main || materialize)juice();
  if(main&&c.set==='Joker'){
   const m=context.modifiers;const poll=random('etperpoll'+context.ante);
   if((m.all_eternal||m.enable_eternals_in_shop&&poll>0.7)&&c.eternal_compat)offer.eternal=true;
   else if(m.enable_perishables_in_shop&&poll>0.4&&poll<=0.7&&c.perishable_compat)offer.perishable=true;
   if(m.enable_rentals_in_shop&&random('ssjr'+context.ante)>0.7)offer.rental=true;
   offer.edition=edition();
  }
  return reprice(offer);
 };
 const reprice=offer=>{
  const c=centres[offer.entityId];const edition=offer.edition==='base'?{}:{[offer.edition==='holographic'?'holo':offer.edition]:true};
  Object.assign(offer,quoteShopCard({baseCost:BigInt(c.cost??1),inflation:BigInt(context.inflation),discountPercent:BigInt(context.discountPercent),set:c.set,name:c.name,edition,ante:BigInt(context.ante),boosterAnteScaling:!!context.modifiers.booster_ante_scaling,tutorialShopSurcharge:!!context.tutorialShopSurcharge,astronomer:has('j_astronomer'),rental:!!offer.rental}));return offer;
 };
 const main=(prefix,reroll=false)=>Array.from({length:context.mainSlots},(_,index)=>{
  const total=Object.values(context.rates).reduce((a,b)=>a+b,0);const poll=random('cdt'+context.ante)*total;
  // Lua constructs its entire range table before inspecting any range.
  const illusion=context.usedVoucherIds.includes('v_illusion');const enhanced=illusion&&random('illusion')>0.6;
  let sum=0,type;
  for(const set of ['Joker','Tarot','Planet','Base','Spectral']){const rate=context.rates[set];if(poll>sum&&poll<=sum+rate){type=set;break;}sum+=rate;}
  if(!type)throw new Error('Shop type poll selected no range');
  if(type==='Base'&&enhanced)type='Enhanced';
  const id=type==='Base'?'c_base':select(type,'sho');
  let frontKey;
  if(['Base','Enhanced'].includes(type)){
   const ranks=['2','3','4','5','6','7','8','9','A','J','K','Q','T'];
   frontKey=element(['C','D','H','S'].flatMap(suit=>ranks.map(rank=>suit+'_'+rank)),'frontsho'+context.ante);
  }
  const offer=construct(id,`${prefix}_main_${index+1}`,{main:true,frontKey});
  if(['Base','Enhanced'].includes(type)&&illusion&&random('illusion')>0.8){const ep=random('illusion');offer.edition=ep>0.85?'polychrome':ep>0.5?'holographic':'foil';reprice(offer);}
  if(reroll)juice();return offer;
 });
 return {random,unkeyed,select,construct,main,usedHas:id=>used.has(id),get rng(){return current;}};
}
export function chooseApkVoucher(rng,context){context=createApkShopContext(context);const s=session(rng,context);return {voucherId:s.select('Voucher'),rng:s.rng};}
export function generateApkShop(rng,context,{voucherId,firstShopBuffoon=false,instancePrefix='shop'}={}){
 context=createApkShopContext(context);
 if(voucherId!==null&&centres[voucherId]?.set!=='Voucher')throw new TypeError('Stored voucherId required');
 const s=session(rng,context);const main=s.main(instancePrefix);
 const vouchers=voucherId===null?[]:[s.construct(voucherId,`${instancePrefix}_voucher`,{materialize:true})];
 const boosters=Array.from({length:context.boosterSlots},(_,index)=>{
  let id;
  if(!firstShopBuffoon&&!context.bannedCentreIds.includes('p_buffoon_normal_1')){firstShopBuffoon=true;id='p_buffoon_normal_'+s.unkeyed(1,2);}
  else{
   const candidates=pools.Booster.filter(c=>!context.bannedCentreIds.includes(c.key));
   if(!candidates.length)throw new RangeError('No eligible Booster packs');
   const poll=s.random('shop_pack'+context.ante)*candidates.reduce((sum,c)=>sum+(c.weight??1),0);
   let sum=0;id=candidates.find(c=>{sum+=c.weight??1;return sum>=poll&&sum-(c.weight??1)<=poll;}).key;
  }
  return s.construct(id,`${instancePrefix}_booster_${index+1}`,{materialize:true});
 });
 return {offers:{main,vouchers,boosters},rng:s.rng,firstShopBuffoon};
}
export function rerollApkShop(rng,context,{previousMain=[],instancePrefix='reroll'}={}){
 context=createApkShopContext(context);
 const removed=new Set(previousMain.map(o=>o.entityId));
 const retained=context.usedCentreIds.filter(id=>!removed.has(id)||context.ownedCentreIds.includes(id));
 const s=session(rng,{...context,usedCentreIds:retained});return {main:s.main(instancePrefix,true),rng:s.rng};
}

const telescopeHands=['Flush Five','Flush House','Five of a Kind','Straight Flush','Four of a Kind','Full House','Flush','Straight','Three of a Kind','Two Pair','Pair','High Card'];
export function generateApkCelestialPack(rng,context,{size,instancePrefix='celestial'}={}){
 context=createApkShopContext(context);
 if(![3,5].includes(size)||typeof instancePrefix!=='string'||!instancePrefix)throw new TypeError('Invalid Celestial pack options');
 const s=session(rng,context),showman=context.ownedCentreIds.includes('j_ring_master');
 let telescopePlanet=null;
 if(context.usedVoucherIds.includes('v_telescope')){
  let tally=0,hand=null;
  for(const candidate of telescopeHands)if(context.visibleHandOrder.includes(candidate)&&(context.playedHands[candidate]??0)>tally){hand=candidate;tally=context.playedHands[candidate];}
  telescopePlanet=pools.Planet.find(card=>card.handType===hand)?.key??null;
 }
 const cards=[];
 for(let index=0;index<size;index++){
  const forced=index===0?telescopePlanet:null;
  let id=forced;
  if(!forced){
   if((!s.usedHas('c_black_hole')||showman)&&s.random('soul_Planet'+context.ante)>0.997)id='c_black_hole';
  }
  if(!id||context.bannedCentreIds.includes(id))id=s.select('Planet','pl1');
  cards.push(s.construct(id,`${instancePrefix}_${index+1}`));
  // Card:open materializes every pack card; native juice_up always draws raw RNG.
  s.unkeyed();
 }
 return {cards,rng:s.rng};
}


// Forced Fool creation skips pool/edition selection, but retains native construction draws.
export function generateApkFoolCard(rng,context,{centreId,instanceId}={}){
 context=createApkShopContext(context);
 if(!['Tarot','Planet'].includes(centres[centreId]?.set)||centreId==='c_fool'||context.bannedCentreIds.includes(centreId)||typeof instanceId!=='string'||!instanceId)throw new TypeError('Unsupported Fool copy');
 // Card:juice_up consumes raw Math RNG even with reduced motion in this APK.
 const s=session(rng,{...context,reducedMotion:false}),card=s.construct(centreId,instanceId,{materialize:true});
 s.unkeyed(); // used_tarot:juice_up after emplacing the copy
 return {card,rng:s.rng};
}

// Emperor/High Priestess create in the owned area: no soulable or shop flags.
export function generateApkTarotConsumables(rng,context,{set,count,instancePrefix}={}){
 context=createApkShopContext(context);
 if(!['Tarot','Planet'].includes(set)||!Number.isInteger(count)||count<0||count>2||typeof instancePrefix!=='string'||!instancePrefix)throw new TypeError('Invalid generated consumables');
 const s=session(rng,{...context,reducedMotion:false}),cards=[];
 for(let index=0;index<count;index++){
  const id=s.select(set,set==='Tarot'?'emp':'pri');
  cards.push(s.construct(id,`${instancePrefix}:${index+1}`,{materialize:true}));
  s.unkeyed(); // used_tarot:juice_up after each card is emplaced.
 }
 return {cards,rng:s.rng};
}


// Seal callbacks: no soulable poll, no shop flags, no used-consumable juice.
// Boundary includes constructor + immediate materialization, excludes later visual events.
export function generateApkSealConsumables(rng,context,{requests,instancePrefix,instanceOffset=0}={}){
 context=createApkShopContext(context);
 if(!Number.isSafeInteger(instanceOffset)||instanceOffset<0||!Array.isArray(requests)||requests.length>10000||typeof instancePrefix!=='string'||!instancePrefix||requests.some(row=>!row||typeof row.sourceId!=='string'||!row.sourceId||!['Tarot','Planet'].includes(row.set)||row.set==='Planet'&&centres[row.centreId]?.set!=='Planet'))throw new TypeError('Invalid seal creation requests');
 const s=session(rng,{...context,reducedMotion:false}),cards=[];
 for(const [index,row]of requests.entries()){
  const forced=row.set==='Planet'&&!context.bannedCentreIds.includes(row.centreId)?row.centreId:null;
  const centreId=forced??s.select(row.set,row.set==='Tarot'?'8ba':'blusl');
  cards.push(s.construct(centreId,`${instancePrefix}:${instanceOffset+index+1}`,{materialize:true}));
 }
 return {cards,rng:s.rng};
}
