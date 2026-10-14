// APK 1.0.1n Arcana creation; facts remain in the independently extracted catalogue.
import catalogue from '../content/apk-shop-catalog.js';
import {createApkShopContext} from './apk-shop.js';
import {nextApkRandom,nextApkSeed,createApkMathState,nextApkMathRandom,validateApkRng} from './apk-rng.js';
import {quoteShopCard} from './shop-pricing.js';

const centres=new Map(catalogue.centres.map(card=>[card.key,card]));
const pools=Object.fromEntries(['Tarot','Spectral'].map(set=>[set,catalogue.centres.filter(card=>card.set===set&&!card.wip&&!card.skip_pool&&!card.omit).sort((a,b)=>a.order-b.order)]));
export const supportsArcanaBooster=id=>centres.get(id)?.set==='Booster'&&centres.get(id)?.kind==='Arcana';
export function getArcanaBoosterConfig(id){
 if(!supportsArcanaBooster(id))throw new TypeError('Invalid Arcana booster identity');
 return {size:id.includes('_normal_')?3:5,choices:id.includes('_mega_')?2:1};
}

export function generateApkArcanaPack(rng,context,{boosterId,instancePrefix='arcana'}={}){
 validateApkRng(rng);context=createApkShopContext(context);
 const config=getArcanaBoosterConfig(boosterId);
 if(typeof instancePrefix!=='string'||!instancePrefix)throw new TypeError('Invalid Arcana instance prefix');
 let current=rng;
 const used=new Set([...context.ownedCentreIds,...context.usedCentreIds]);
 const showman=context.ownedCentreIds.includes('j_ring_master');
 const random=key=>{const next=nextApkRandom(current,key);current=next.rng;return next.value;};
 const element=(values,key)=>{
  const seed=nextApkSeed(current,key),next=nextApkMathRandom(createApkMathState(seed.value),values.length);
  current={...seed.rng,mathState:next.state};return values[next.value-1];
 };
 const available=card=>{
  if(!showman&&used.has(card.key)||card.key==='c_soul'||card.key==='c_black_hole'||context.bannedCentreIds.includes(card.key))return false;
  if(!context.unlockedCentreIds.includes(card.key)&&(context.lockedCentreIds.includes(card.key)||card.unlocked===false||card.start_locked))return false;
  if(card.enhancement_gate&&!context.enhancementIds.includes(card.enhancement_gate))return false;
  return !(card.no_pool_flag&&context.poolFlags[card.no_pool_flag]||card.yes_pool_flag&&!context.poolFlags[card.yes_pool_flag]);
 };
 const select=(set,append)=>{
  let values=pools[set].map(card=>available(card)?card.key:'UNAVAILABLE');
  if(values.every(id=>id==='UNAVAILABLE'))values=[set==='Tarot'?'c_strength':'c_incantation'];
  const key=set+append+context.ante;
  let id=element(values,key),resample=1;
  while(id==='UNAVAILABLE')id=element(values,key+'_resample'+(++resample));
  return id;
 };
 const cards=[];
 for(let index=0;index<config.size;index++){
  const spectral=context.usedVoucherIds.includes('v_omen_globe')&&random('omen_globe')>0.8;
  const set=spectral?'Spectral':'Tarot',append=spectral?'ar2':'ar1';
  let id;
  // The native outer guard suppresses both rare polls when Soul is banned.
  if(!context.bannedCentreIds.includes('c_soul')){
   if((!used.has('c_soul')||showman)&&random('soul_'+set+context.ante)>0.997)id='c_soul';
   // Spectral checks use the same key twice; Black Hole may replace a Soul hit.
   if(spectral&&(!used.has('c_black_hole')||showman)&&random('soul_'+set+context.ante)>0.997)id='c_black_hole';
  }
  if(!id||context.bannedCentreIds.includes(id))id=select(set,append);
  const centre=centres.get(id);
  for(const card of catalogue.centres)if(card.name===centre.name)used.add(card.key);
  // Card:init rotation/x/y, then the pack loop's synchronous materialization juice.
  // Card:juice_up uses raw math.random even when reduced_motion is true.
  for(let draw=0;draw<4;draw++){const next=nextApkMathRandom(current.mathState);current={...current,mathState:next.state};}
  const card={id:`${instancePrefix}_${index+1}`,entityId:id,originalKey:id,set:centre.set,edition:'base'};
  Object.assign(card,quoteShopCard({baseCost:BigInt(centre.cost??1),inflation:BigInt(context.inflation),discountPercent:BigInt(context.discountPercent),set:centre.set,name:centre.name,ante:BigInt(context.ante),astronomer:context.ownedCentreIds.includes('j_astronomer'),edition:{}}));
  cards.push(card);
 }
 return {cards,rng:current};
}
