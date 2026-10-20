// Remaining APK packs. Selection and construction share the native shop session.
import catalogue from '../content/apk-shop-catalog.js';
import {createApkShopContext,session} from './apk-shop.js';
import {validateApkRng} from './apk-rng.js';

const centres=new Map(catalogue.centres.map(c=>[c.key,c]));
const kinds=['Standard','Buffoon','Spectral'];
const fronts=['C','D','H','S'].flatMap(suit=>['2','3','4','5','6','7','8','9','A','J','K','Q','T'].map(rank=>suit+'_'+rank));
export const supportsRemainingBooster=id=>centres.get(id)?.set==='Booster'&&kinds.includes(centres.get(id)?.kind);
export function getRemainingBoosterConfig(id){
 if(!supportsRemainingBooster(id))throw new TypeError('Invalid remaining booster identity');
 const kind=centres.get(id).kind;
 return {size:id.includes('_normal_')?(kind==='Standard'?3:2):(kind==='Standard'?5:4),choices:id.includes('_mega_')?2:1,kind};
}
export function generateApkRemainingPack(rng,context,{boosterId,instancePrefix='pack'}={}){
 validateApkRng(rng);context=createApkShopContext(context);
 const {size,kind}=getRemainingBoosterConfig(boosterId);
 if(typeof instancePrefix!=='string'||!instancePrefix)throw new TypeError('Invalid pack instance prefix');
 const s=session(rng,context),cards=[];
 const showman=(context.activeCentreIds??context.ownedCentreIds).includes('j_ring_master');
 for(let index=0;index<size;index++){
  let id,frontKey;
  if(kind==='Standard'){
   id=s.random('stdset'+context.ante)>0.6?s.select('Enhanced','sta'):'c_base';
   frontKey=s.element(fronts,'frontsta'+context.ante);
  }else if(kind==='Buffoon')id=s.select('Joker','buf');
  else{
   if(!context.bannedCentreIds.includes('c_soul')){
    if((!s.usedHas('c_soul')||showman)&&s.random('soul_Spectral'+context.ante)>0.997)id='c_soul';
    if((!s.usedHas('c_black_hole')||showman)&&s.random('soul_Spectral'+context.ante)>0.997)id='c_black_hole';
   }
   if(!id||context.bannedCentreIds.includes(id))id=s.select('Spectral','spe');
  }
  const card=s.construct(id,`${instancePrefix}_${index+1}`,{frontKey});
  if(kind==='Standard'){
   card.set=id==='c_base'?'Base':'Enhanced';
   if(id!=='c_base')card.enhancement=id.slice(2);
   const poll=s.random('standard_edition'+context.ante),rate=context.editionRate*2;
   card.edition=poll>1-0.006*rate?'polychrome':poll>1-0.02*rate?'holographic':poll>1-0.04*rate?'foil':'base';
   if(s.random('stdseal'+context.ante)>0.8){const seal=s.random('stdsealtype'+context.ante);card.seal=seal>0.75?'red':seal>0.5?'blue':seal>0.25?'gold':'purple';}
   s.reprice(card);
  }else if(kind==='Buffoon'){
   const centre=centres.get(id),m=context.modifiers,poll=s.random('packetper'+context.ante);
   if((m.all_eternal||m.enable_eternals_in_shop&&poll>0.7)&&centre.eternal_compat)card.eternal=true;
   if(!card.eternal&&m.enable_perishables_in_shop&&poll>0.4&&poll<=0.7&&centre.perishable_compat)card.perishable=true;
   if(m.enable_rentals_in_shop&&s.random('packssjr'+context.ante)>0.7)card.rental=true;
   card.edition=s.edition('edibuf'+context.ante);s.reprice(card);
  }
  // Synchronous start_materialize juice, independent of reduced-motion settings.
  // Edition/seal animation events and audio are queued outside this boundary.
  s.unkeyed();cards.push(card);
 }
 return {cards,rng:s.rng};
}
