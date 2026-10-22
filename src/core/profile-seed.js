import catalogue from '../content/apk-shop-catalog.js';
import {createApkMathState,nextApkMathRandom,predictApkSeed} from './apk-rng.js';
const legendaries=catalogue.centres.filter(c=>c.set==='Joker'&&c.rarity===4).sort((a,b)=>a.order-b.order).map(c=>c.key);
export function firstLegendary(seed){
 const roll=nextApkMathRandom(createApkMathState(predictApkSeed('Joker4',seed)),1,legendaries.length);
 return legendaries[roll.value-1];
}
export function chooseProfileSeed({seed,stake=1,wonIds=[],randomSeed}){
 if(seed!==undefined)return seed;
 const won=new Set(wonIds.filter(id=>legendaries.includes(id))),filter=stake===8&&won.size>0&&won.size<legendaries.length;
 // A broken entropy source must fail explicitly rather than freeze the UI.
 for(let attempt=0;attempt<10000;attempt++){const candidate=randomSeed();if(!filter||!won.has(firstLegendary(candidate)))return candidate;}
 throw Error('Unable to generate an eligible Gold seed');
}
