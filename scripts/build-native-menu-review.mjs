import {bundledJokerArtwork} from './joker-review-source.mjs';
import {JOKER_IDENTITIES} from '../src/content/joker-identities.js';
import {SUPPORTED_JOKERS,originalJokerKey,handRecognitionOptions} from '../src/content/jokers.js';
import {readFile,writeFile} from 'node:fs/promises';
import catalogue from '../src/content/apk-shop-catalog.js';
import {createProfile,collectionEntries,deckUnlocked as nativeDeckUnlocked,stakeUnlocked as nativeStakeUnlocked} from '../src/core/profile.js';
import {nativeBlindTarget} from '../src/core/blind-progression.js';
import {ITEM7_JOKER_DEFAULTS} from '../src/core/joker-item7-lifecycle.js';
import {APK_HAND_NAMES} from '../src/core/apk-shop-state.js';
import {HANDS} from '../src/content/hands.js';
import {HAND_NAMES} from '../src/content/hand-names.js';
import {DECKS} from '../src/content/decks.js';
import {CHALLENGES,challengeUnlocked,challengeModeUnlocked} from '../src/content/challenges.js';
import {STAKES} from '../src/content/stakes.js';
import {APK_BLINDS_BY_ID} from '../src/content/apk-blinds.js';
import {APK_TAGS_BY_ID} from '../src/content/apk-tags.js';
import {describeShopItem,displayPlayingCard} from '../src/content/shop-display.js';
import {ENHANCEMENT_DESCRIPTIONS,EDITION_DESCRIPTIONS,SEAL_DESCRIPTIONS} from '../src/content/card-modifier-display.js';
const profile=createProfile(),entries=collectionEntries(profile,'13031990'),descriptions=Object.fromEntries(entries.map(e=>[e.id,describeShopItem({entityId:e.id})]));
const ordinaryEntries=collectionEntries(profile);const gates={decks:Object.fromEntries(Object.keys(DECKS).map(id=>[id,nativeDeckUnlocked(profile,id)])),stakes:Object.fromEntries(Object.keys(DECKS).map(id=>[id,STAKES.map(s=>nativeStakeUnlocked(profile,id,s.level))])),challenges:Object.fromEntries(CHALLENGES.map(c=>[c.id,challengeUnlocked(profile,c.id)])),challengeMode:challengeModeUnlocked(profile)};
const anteTargets=Array.from({length:16},(_,i)=>nativeBlindTarget(i+1).toString());
const jokerAliases=Object.fromEntries(SUPPORTED_JOKERS.map(id=>[id,originalJokerKey(id)]));
const data={ITEM7_JOKER_DEFAULTS,APK_HAND_NAMES,JOKER_IDENTITIES,jokerAliases,catalog:{centres:catalogue.centres.filter(c=>['Joker','Planet'].includes(c.set)).map(({key,set,rarity,handType})=>({key,set,rarity,handType}))},profile,entries,ordinaryEntries,gates,descriptions,anteTargets,HANDS,HAND_NAMES,DECKS,CHALLENGES,STAKES,APK_BLINDS_BY_ID,APK_TAGS_BY_ID,ENHANCEMENT_DESCRIPTIONS,EDITION_DESCRIPTIONS,SEAL_DESCRIPTIONS};
const imported=Object.keys(data).filter(k=>!['profile','entries','ordinaryEntries','gates','descriptions','anteTargets'].includes(k)).join(',');
async function module(name,functions){let s=await readFile('src/ui/'+name+'.js','utf8');s=s.replace(/^import .*;\n/gm,'').replace(/\bexport /g,'');return `(()=>{${s}\nreturn {${functions}};})()`;}
let css=(await Promise.all(['styles','start-screen','shop-screen','window-review','profile-review','challenge-review','card-materials','score-readability','collection-unlock','consumable-identity'].map(n=>readFile('web/'+n+'.css','utf8')))).join('\n');
css=css.replace('/web/fonts/Rubik.ttf','data:font/ttf;base64,'+(await readFile('web/fonts/Rubik.ttf')).toString('base64'));
const shopSource=await readFile('src/ui/shop-screen.js','utf8');
const artSource=shopSource.slice(shopSource.indexOf('export function artwork('),shopSource.indexOf('function ticketArtwork(')).replace('export ','');
// Both renderers share the same primitives already embedded by the Joker bundle.
const consumableSource=(await readFile('src/content/consumable-illustrations.js','utf8')).replace(/^import .*;\n/gm,'').replace(/\bexport /g,'');
const jokerModule=(await bundledJokerArtwork()).replace('return {jokerArtworkSvg};',`const {consumableArtworkSvg}=(()=>{${consumableSource};return {consumableArtworkSvg};})();return {jokerArtworkSvg,consumableArtworkSvg};`);
const template=await readFile('tools/previews/native-menu-template.html','utf8');
const boot=`(()=>{const root=document.getElementById('pierrot-native-review');const data=${JSON.stringify(data,(_,value)=>typeof value==='bigint'?String(value):value).replaceAll('<','\\u003c')};const {${imported}}=data;const profile=data.profile;const nativeBlindTarget=ante=>BigInt(data.anteTargets[ante-1]);const collectionEntries=(p,seed)=>seed==='13031990'?data.entries:data.ordinaryEntries;const describeShopItem=({entityId})=>data.descriptions[entityId]??{name:entityId,description:''};const isVerificationSeed=s=>s==='13031990';const deckUnlocked=(p,id,seed)=>isVerificationSeed(seed)||data.gates.decks[id],stakeUnlocked=(p,id,stake,seed)=>isVerificationSeed(seed)||data.gates.stakes[id]?.[stake-1],challengeModeUnlocked=(p,seed)=>isVerificationSeed(seed)||data.gates.challengeMode,challengeUnlocked=(p,id,seed)=>isVerificationSeed(seed)||data.gates.challenges[id];
const originalJokerKey=id=>jokerAliases[id]??id;
const {jokerArtworkSvg,consumableArtworkSvg}=${jokerModule};
const {collectionArtworkSvg}=${await module('../content/collection-illustrations','collectionArtworkSvg')};
const {installCardMaterials}=${await module('card-materials','installCardMaterials')};installCardMaterials(root);
const catalogue=catalog;const handRecognitionOptions=${handRecognitionOptions.toString()};const displayPlayingCard=${displayPlayingCard.toString()};
const {appendTooltipContents}=${await module('tooltip-text','appendTooltipContents')};
const {cardRelatedHelp}=${await module('../content/card-related-help','cardRelatedHelp')};
const {appendCardDescription}=${await module('card-description','appendCardDescription')};
const {createHandHelp}=${await module('hand-help','createHandHelp')};
const artwork=(()=>{const node=(tag,className,text)=>{const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n;};${artSource};return artwork;})();
const {showCardTooltip,dismissCardTooltip}=${await module('card-tooltip','showCardTooltip,dismissCardTooltip')};
const {slideWindow,cancelWindowMotion}=${await module('window-motion','slideWindow,cancelWindowMotion')};
const {GAME_SPEEDS,getGameSpeed,setGameSpeed}=${await module('game-speed','GAME_SPEEDS,getGameSpeed,setGameSpeed')};
const {animateSettingsPaper}=${await module('settings-paper','animateSettingsPaper')};
const {observeCollectionUnlocks,collectionLock,animateCollectionUnlock}=${await module('collection-unlock','observeCollectionUnlocks,collectionLock,animateCollectionUnlock')};
const menu=${await module('menu-windows','createOptionsView,createSettingsView,createRunInfoView,createEndView')};const profiles=${await module('profile-screen','renderProfileView,renderCollectionView')};const start=${await module('start-screen','renderStartScreen,removeStartScreen')};
const state={seed:'13031990',deckId:'red',money:100,roundNumber:1,discoveredHands:Object.keys(HANDS).slice(0,9),handLevels:{},stake:1,round:{blindId:'small',ante:1},apkBlinds:{},apkShop:{context:{usedVoucherIds:[]}}};
const dialog=root.querySelector('#dialog'),body=root.querySelector('#dialog-body'),footer=root.querySelector('#dialog-actions');let values={music:.18,effects:.55};
function open(title,node,back=main){cancelWindowMotion(dialog);dialog.inert=false;root.querySelector('#dialog-title').textContent=title;dialog.dataset.window=node.dataset.window??(node.classList.contains('profile-view')?'profile':'collection-index');body.replaceChildren(node);footer.replaceChildren();const b=document.createElement('button');b.textContent='Назад';b.onclick=back;if(back)footer.append(b);dialog.hidden=false;slideWindow(dialog);}
function options(){open('Меню',menu.createOptionsView({settings:()=>settings(options),menu:main,restart:setup,copySeed:()=>{}},{inRun:true,seeded:true,seed:state.seed}),main);}
function settings(back=main){open('Настройки',menu.createSettingsView({values,onVolume:(k,v)=>(values={...values,[k]:v})}),back);}
function collection(seed='13031990'){const view=profiles.renderCollectionView(profile,seed,{onNavigate:({view,set})=>{dialog.dataset.window=view==='index'?'collection-index':'collection';dialog.dataset.collectionSet=set??'';}});open('Коллекция',view,()=>{if(!view.back())main();});}
let playerName='Игрок';
function profileView(){open('Профиль игрока',profiles.renderProfileView(profile,{name:playerName,onRename:name=>playerName=name}),main);}
function party(){open('Партия',menu.createRunInfoView(state));}
function main(){if(!dialog.hidden){dialog.inert=true;slideWindow(dialog,true,()=>{dialog.hidden=true;dialog.inert=false;});}start.renderStartScreen({profile,savedState:state,hasSave:true,onContinue:options,onNew:options,onSettings:()=>settings(main),onCollection:collection,onProfile:profileView,profileName:playerName});}
function setup(){main();root.querySelector('#start_new').click();root.querySelector('#setup_new_tab').click();root.querySelector('#setup_seed_toggle').checked=true;root.querySelector('#setup_seed_toggle').dispatchEvent(new Event('change',{bubbles:true}));const seed=root.querySelector('#setup_seed');seed.value='13031990';seed.dispatchEvent(new Event('input',{bubbles:true}));}
const actions={options,party,settings:()=>settings(main),collection,'collection-locked':()=>collection(null),profile:profileView,main,setup,victory:()=>open('Победа',menu.createEndView(state,{restart:setup,menu:main,endless:options,copySeed:()=>{}},true),null),loss:()=>open('Поражение',menu.createEndView(state,{restart:setup,menu:main,copySeed:()=>{}},false),null)};const lockedButton=document.createElement('button');lockedButton.dataset.review='collection-locked';lockedButton.textContent='Закрытая коллекция';root.querySelector('.review-nav').append(lockedButton);root.querySelector('.review-nav').onclick=e=>actions[e.target.dataset.review]?.();
const box=root.querySelector('.review-stage');const resize=()=>{const scale=box.clientWidth/1536;box.style.height=688*scale+'px';root.querySelector('#stage').style.transform='scale('+scale+')';box.style.setProperty('--ui-scale',scale);};new ResizeObserver(resize).observe(box);resize();main();root.querySelector('#review-status').remove();})();`;
const out=template.replace('/*PRODUCT_CSS*/',()=>css).replace('/*BOOT*/',()=>boot);// The standalone review embeds original catalogue illustrations and their renderers.
// Keep a bounded 2 MB budget as those legitimate assets expand.
if(Buffer.byteLength(out)>2000000)throw Error('Too large '+Buffer.byteLength(out));await writeFile(process.env.NATIVE_MENU_OUTPUT??'artifacts/native-menu-review.html',out);console.log(Buffer.byteLength(out));
