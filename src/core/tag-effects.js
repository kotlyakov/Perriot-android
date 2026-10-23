import catalogue from '../content/apk-shop-catalog.js';
import {APK_TAGS_BY_ID} from '../content/apk-tags.js';
import {generateApkEffectCards,session,createApkShopContext} from './apk-shop.js';
import {currentApkShopContext} from './apk-shop-state.js';
import {consumeItem7DoubleTags} from './joker-double-tags.js';
import {nextApkMathRandom} from './apk-rng.js';
import {changeHandSize} from './hand-size.js';
import {stampJokerCreationOrdinals,hasJokerSpace} from './shop.js';

const deferred=new Set(['tag_investment','tag_voucher','tag_uncommon','tag_rare','tag_negative','tag_foil','tag_holo','tag_polychrome','tag_coupon','tag_juggle','tag_d_six']);
const packIds=new Set(['tag_charm','tag_meteor','tag_standard','tag_buffoon','tag_ethereal']);
const editions={tag_negative:'negative',tag_foil:'foil',tag_holo:'holographic',tag_polychrome:'polychrome'};
const fixedPacks={tag_standard:'p_standard_mega_1',tag_buffoon:'p_buffoon_mega_1',tag_ethereal:'p_spectral_normal_1'};
const centres=new Map(catalogue.centres.map(c=>[c.key,c]));
const rares=catalogue.centres.filter(c=>c.set==='Joker'&&c.rarity===3);
export function validateTagState(state){
 for(const [field,allowed]of [['pendingTags',deferred],['pendingTagPacks',packIds]])if(Object.hasOwn(state,field)&&(!Array.isArray(state[field])||state[field].length>10000||state[field].some(id=>!allowed.has(id))))throw new TypeError('Invalid '+field);
 if(Object.hasOwn(state,'activeTagHandSize')&&(!Number.isSafeInteger(state.activeTagHandSize)||state.activeTagHandSize<3||state.activeTagHandSize>30000||state.activeTagHandSize%3))throw new TypeError('Invalid active tag hand size');
 if(Object.hasOwn(state,'pendingDoubleTags')&&(!Number.isSafeInteger(state.pendingDoubleTags)||state.pendingDoubleTags<0||state.pendingDoubleTags>10000))throw new TypeError('Invalid Double tag queue');
 return true;
}
function consume(state,tagId,events){
 const index=(state.pendingTags??[]).indexOf(tagId);if(index<0)return false;
 state.pendingTags.splice(index,1);if(!state.pendingTags.length)delete state.pendingTags;
 events?.push({type:'tag_triggered',tagId});return true;
}
function rawVariant(state){const draw=nextApkMathRandom(state.rng.apk.mathState,1,2);state.rng.apk={...state.rng.apk,mathState:draw.state};return draw.value;}
export function queueTagReward(state,tagId,events=[]){
 if(!APK_TAGS_BY_ID[tagId])throw new TypeError('Unknown tag');
 validateTagState(state);
 const repeats=consumeItem7DoubleTags(state,tagId,events);
 if((state.pendingTags?.length??0)+(state.pendingTagPacks?.length??0)+repeats>10000)throw new RangeError('Tag queue limit exceeded');
 for(let index=0;index<repeats;index++){
  if(deferred.has(tagId)){state.pendingTags??=[];state.pendingTags.push(tagId);events.push({type:'tag_added',tagId});}
  else if(fixedPacks[tagId]||tagId==='tag_charm'||tagId==='tag_meteor'){
   state.pendingTagPacks??=[];state.pendingTagPacks.push(tagId);events.push({type:'tag_pack_queued',tagId});
  }else if(tagId==='tag_top_up'){
   for(let slot=0;slot<2;slot++){
    if(!hasJokerSpace(state))break;
    const generated=generateApkEffectCards(state.rng.apk,currentApkShopContext(state),{set:'Joker',count:1,instancePrefix:`topup:${state.revision+1}:${index}:${slot}`,append:'top',rarity:0});
    const card=generated.cards[0];state.rng.apk=generated.rng;stampJokerCreationOrdinals(state,[card]);state.jokers.push(card);
    events.push({type:'joker_created',sourceId:'tag_top_up',jokerId:card.id,joker:structuredClone(card)});
   }
  }
 }
 return repeats;
}
export function takeTagPack(state){
 const tagId=state.pendingTagPacks?.shift();if(!tagId)return null;
 if(!state.pendingTagPacks.length)delete state.pendingTagPacks;
 if(!packIds.has(tagId))throw new TypeError('Invalid tag pack');
 return fixedPacks[tagId]??`${tagId==='tag_charm'?'p_arcana':'p_celestial'}_mega_${rawVariant(state)}`;
}
export function applyTagRoundStart(state,events=[]){
 let count=0;while(consume(state,'tag_juggle',events))count++;
 if(count){const delta=3*count;state.activeTagHandSize=(state.activeTagHandSize??0)+delta;changeHandSize(state,delta);events.push({type:'tag_hand_size_changed',delta});}
}
export function applyTagRoundEnd(state,events=[]){
 if(state.activeTagHandSize){const delta=-state.activeTagHandSize;changeHandSize(state,delta);delete state.activeTagHandSize;events.push({type:'tag_hand_size_changed',delta});}
}
export function getTagInvestmentBonus(state){return state.round?.blindId==='boss'?25n*BigInt((state.pendingTags??[]).filter(id=>id==='tag_investment').length):0n;}
export function consumeTagInvestment(state,events=[]){if(state.round?.blindId==='boss')while(consume(state,'tag_investment',events));}
export function applyTagShopStart(state,events=[]){
 // One D6 per shop; additional D6 tags wait for later shops.
 if(consume(state,'tag_d_six',events))state.shop.rerollBase=0n;
}
export function createTagShopHooks(state,events=[]){
 const ante=currentApkShopContext(state).ante;
 return {
  create(s,instanceId){
   for(const tagId of [...(state.pendingTags??[])]){
    if(!['tag_rare','tag_uncommon'].includes(tagId))continue;
    consume(state,tagId,events);
    if(tagId==='tag_rare'&&new Set(state.jokers.filter(j=>centres.get(j.entityId)?.rarity===3).map(j=>j.entityId)).size>=rares.length){events.push({type:'tag_unavailable',tagId});continue;}
    const append=tagId==='tag_rare'?'rta':'uta',id=s.select('Joker',append,tagId==='tag_rare'?1:.9);
    const card=s.construct(id,instanceId,{main:true,editionKey:`edi${append}${ante}`});card.couponed=true;card.cost=0n;return card;
   }
   return null;
  },
  modify(s,card){
   if(card.set!=='Joker'||card.edition!=='base')return;
   const tagId=(state.pendingTags??[]).find(id=>editions[id]);if(!tagId)return;
   consume(state,tagId,events);card.edition=editions[tagId];s.reprice(card);card.couponed=true;card.cost=0n;
  }
 };
}
export function applyTagShopFinal(state,events=[]){
 // Each Voucher tag expands this shop before Coupon's final pass. Extra vouchers
 // are paid and use the native unqualified Voucher_fromtag stream.
 const count=(state.pendingTags??[]).filter(id=>id==='tag_voucher').length;
 if(count){
  for(let index=0;index<count;index++){
   const s=session(state.rng.apk,createApkShopContext(currentApkShopContext(state)));
   consume(state,'tag_voucher',events);
   const id=s.select('Voucher','_fromtag',undefined,false,{noAnte:true});
   state.shop.vouchers.push(s.construct(id,`tag_voucher:${state.revision}:${index}`,{materialize:true}));
   state.rng.apk=s.rng;
  }
 }
 // One Coupon per shop. Any additional copies wait rather than disappearing.
 if(consume(state,'tag_coupon',events))for(const card of [...state.shop.main,...state.shop.boosters]){card.couponed=true;card.cost=0n;}
}
