import {readFile,writeFile} from 'node:fs/promises';
import {createProfile,collectionEntries,deckUnlocked as nativeDeckUnlocked,stakeUnlocked as nativeStakeUnlocked} from '../src/core/profile.js';
import {nativeBlindTarget} from '../src/core/blind-progression.js';
import {HANDS} from '../src/content/hands.js';
import {HAND_NAMES} from '../src/content/hand-names.js';
import {DECKS} from '../src/content/decks.js';
import {CHALLENGES,challengeUnlocked,challengeModeUnlocked} from '../src/content/challenges.js';
import {STAKES} from '../src/content/stakes.js';
import {APK_BLINDS_BY_ID} from '../src/content/apk-blinds.js';
import {APK_TAGS_BY_ID} from '../src/content/apk-tags.js';
import {describeShopItem} from '../src/content/shop-display.js';
import {ENHANCEMENT_DESCRIPTIONS,EDITION_DESCRIPTIONS,SEAL_DESCRIPTIONS} from '../src/content/card-modifier-display.js';
const profile=createProfile(),entries=collectionEntries(profile,'13031990'),descriptions=Object.fromEntries(entries.map(e=>[e.id,describeShopItem({entityId:e.id})]));
const ordinaryEntries=collectionEntries(profile);const gates={decks:Object.fromEntries(Object.keys(DECKS).map(id=>[id,nativeDeckUnlocked(profile,id)])),stakes:Object.fromEntries(Object.keys(DECKS).map(id=>[id,STAKES.map(s=>nativeStakeUnlocked(profile,id,s.level))])),challenges:Object.fromEntries(CHALLENGES.map(c=>[c.id,challengeUnlocked(profile,c.id)])),challengeMode:challengeModeUnlocked(profile)};
const anteTargets=Array.from({length:16},(_,i)=>nativeBlindTarget(i+1).toString());
const data={profile,entries,ordinaryEntries,gates,descriptions,anteTargets,HANDS,HAND_NAMES,DECKS,CHALLENGES,STAKES,APK_BLINDS_BY_ID,APK_TAGS_BY_ID,ENHANCEMENT_DESCRIPTIONS,EDITION_DESCRIPTIONS,SEAL_DESCRIPTIONS};
const imported=Object.keys(data).filter(k=>!['profile','entries','ordinaryEntries','gates','descriptions','anteTargets'].includes(k)).join(',');
async function module(name,functions){let s=await readFile('src/ui/'+name+'.js','utf8');s=s.replace(/^import .*;\n/gm,'').replace(/\bexport /g,'');return `(()=>{${s}\nreturn {${functions}};})()`;}
let css=(await Promise.all(['styles','start-screen','window-review','profile-review','challenge-review'].map(n=>readFile('web/'+n+'.css','utf8')))).join('\n');
css=css.replace('/web/fonts/Rubik.ttf','data:font/ttf;base64,'+(await readFile('web/fonts/Rubik.ttf')).toString('base64'));
const template=await readFile('tools/previews/native-menu-template.html','utf8');
const boot=`(()=>{const root=document.getElementById('pierrot-native-review');const data=${JSON.stringify(data).replaceAll('<','\\u003c')};const {${imported}}=data;const profile=data.profile;const nativeBlindTarget=ante=>BigInt(data.anteTargets[ante-1]);const collectionEntries=(p,seed)=>seed==='13031990'?data.entries:data.ordinaryEntries;const describeShopItem=({entityId})=>data.descriptions[entityId]??{name:entityId,description:''};const isVerificationSeed=s=>s==='13031990';const deckUnlocked=(p,id,seed)=>isVerificationSeed(seed)||data.gates.decks[id],stakeUnlocked=(p,id,stake,seed)=>isVerificationSeed(seed)||data.gates.stakes[id]?.[stake-1],challengeModeUnlocked=(p,seed)=>isVerificationSeed(seed)||data.gates.challengeMode,challengeUnlocked=(p,id,seed)=>isVerificationSeed(seed)||data.gates.challenges[id];
const menu=${await module('menu-windows','createOptionsView,createSettingsView,createRunInfoView,createCustomizeView,createEndView')};const profiles=${await module('profile-screen','renderProfileView,renderCollectionView,renderStatsView')};const start=${await module('start-screen','renderStartScreen,removeStartScreen')};
const state={seed:'13031990',deckId:'red',money:100,roundNumber:1,discoveredHands:Object.keys(HANDS).slice(0,9),handLevels:{},stake:1,round:{blindId:'small',ante:1},apkBlinds:{},apkShop:{context:{usedVoucherIds:[]}}};
const dialog=root.querySelector('#dialog'),body=root.querySelector('#dialog-body'),footer=root.querySelector('#dialog-actions');let values={music:.18,effects:.55};
function open(title,node,back=options){start.removeStartScreen();root.querySelector('#dialog-title').textContent=title;dialog.dataset.window=node.dataset.window??(node.classList.contains('stats-view')?'stats':node.classList.contains('profile-view')?'profile':'collection-index');body.replaceChildren(node);footer.replaceChildren();const b=document.createElement('button');b.textContent='Назад';b.onclick=back;footer.append(b);dialog.hidden=false;}
function options(){open('Меню',menu.createOptionsView({settings,collection,stats:statsView,menu:main,restart:setup,deck:()=>open('Настройка колоды',menu.createCustomizeView()),copySeed:()=>{}},{inRun:true,seeded:true,seed:state.seed}),main);}
function settings(){open('Настройки',menu.createSettingsView({values,onVolume:(k,v)=>(values={...values,[k]:v})}));}
function collection(){const view=profiles.renderCollectionView(profile,'13031990',{onNavigate:({view})=>dialog.dataset.window=view==='index'?'collection-index':'collection'});open('Коллекция',view,()=>{if(!view.back())options();});}
function statsView(){const view=profiles.renderStatsView(profile);open('Статистика',view,()=>{if(!view.back())options();});}
function profileView(){open('Профиль',profiles.renderProfileView(profile,{onSelect:()=>profileView()}));}
function party(){open('Партия',menu.createRunInfoView(state));}
function main(){dialog.hidden=true;start.renderStartScreen({profile,savedState:state,hasSave:true,onContinue:options,onNew:options,onSettings:options,onCollection:collection,onProfile:profileView});}
function setup(){main();root.querySelector('#start_new').click();root.querySelector('#setup_new_tab').click();root.querySelector('#setup_seed_toggle').checked=true;root.querySelector('#setup_seed_toggle').dispatchEvent(new Event('change',{bubbles:true}));const seed=root.querySelector('#setup_seed');seed.value='13031990';seed.dispatchEvent(new Event('input',{bubbles:true}));}
const actions={options,party,settings,collection,profile:profileView,stats:statsView,main,setup,victory:()=>open('Победа',menu.createEndView(state,{restart:setup,menu:main,endless:options,copySeed:()=>{}},true)),loss:()=>open('Поражение',menu.createEndView(state,{restart:setup,menu:main,copySeed:()=>{}},false))};root.querySelector('.review-nav').onclick=e=>actions[e.target.dataset.review]?.();
const box=root.querySelector('.review-stage');const resize=()=>{const scale=box.clientWidth/1536;box.style.height=688*scale+'px';root.querySelector('#stage').style.transform='scale('+scale+')';box.style.setProperty('--ui-scale',scale);};new ResizeObserver(resize).observe(box);resize();options();root.querySelector('#review-status').remove();})();`;
const out=template.replace('/*PRODUCT_CSS*/',()=>css).replace('/*BOOT*/',()=>boot);if(Buffer.byteLength(out)>1000000)throw Error('Too large '+Buffer.byteLength(out));await writeFile(process.env.NATIVE_MENU_OUTPUT??'artifacts/native-menu-review.html',out);console.log(Buffer.byteLength(out));
