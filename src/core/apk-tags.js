import {APK_TAGS,APK_TAGS_BY_ID} from '../content/apk-tags.js';
import catalogue from '../content/apk-shop-catalog.js';
import {nextApkSeed,createApkMathState,nextApkMathRandom} from './apk-rng.js';

// A fixed observed hand order for new runs. Native Lua pairs order can vary
// between processes; parity requires supplying that process's observed order.
const ordinaryHands=['Straight','Flush','Full House','Four of a Kind','Straight Flush','High Card','Pair','Two Pair','Three of a Kind'];
const handNames=new Set(catalogue.centres.filter(c=>c.set==='Planet').map(c=>c.handType));
const centreIds=new Set([...catalogue.centres.map(c=>c.key),'e_foil','e_holo','e_polychrome','e_negative']);
export function createApkTagContext(options={}){
 if(!options||typeof options!=='object'||Array.isArray(options)||Object.keys(options).some(k=>!['ante','discoveredCentreIds','bannedKeys','visibleHandOrder'].includes(k)))throw new TypeError('Invalid tag context');
 const context={ante:1,discoveredCentreIds:[],bannedKeys:[],visibleHandOrder:ordinaryHands,...structuredClone(options)};
 if(!Number.isSafeInteger(context.ante)||context.ante<1)throw new RangeError('Invalid tag ante');
 for(const [field,valid] of [['discoveredCentreIds',id=>centreIds.has(id)],['bannedKeys',id=>Object.hasOwn(APK_TAGS_BY_ID,id)],['visibleHandOrder',id=>handNames.has(id)]]){
  const values=context[field];if(!Array.isArray(values)||values.some(id=>typeof id!=='string'||!valid(id))||new Set(values).size!==values.length||values.length>10000)throw new TypeError('Invalid '+field);
 }
 if(!context.visibleHandOrder.length)throw new TypeError('No visible orbital hands');
 return structuredClone(context);
}
export function getApkTagPool(context){
 const c=createApkTagContext(context);
 const pool=APK_TAGS.map(t=>t.minAnte<=c.ante&&(!t.requires||c.discoveredCentreIds.includes(t.requires))&&!c.bannedKeys.includes(t.id)?t.id:'UNAVAILABLE');
 return pool.every(id=>id==='UNAVAILABLE')?['tag_handy']:pool;
}
function element(rng,values,key){
 const seed=nextApkSeed(rng,key),draw=nextApkMathRandom(createApkMathState(seed.value),values.length);
 return {value:values[draw.value-1],rng:{...seed.rng,mathState:draw.state}};
}
export function chooseApkTag(rng,context){
 const c=createApkTagContext(context),pool=getApkTagPool(c),key='Tag'+c.ante;
 let selected=element(rng,pool,key),attempt=1;
 while(selected.value==='UNAVAILABLE')selected=element(selected.rng,pool,key+'_resample'+(++attempt));
 return {tagId:selected.value,rng:selected.rng};
}
export function chooseApkOrbitalHand(rng,context){
 const c=createApkTagContext(context),selected=element(rng,c.visibleHandOrder,'orbital');
 return {hand:selected.value,rng:selected.rng};
}
