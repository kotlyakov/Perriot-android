import test from 'node:test';
import assert from 'node:assert/strict';
import catalog from '../../src/content/apk-shop-catalog.js';
import {describeShopItem} from '../../src/content/shop-display.js';
import {consumableArtworkSvg,CONSUMABLE_ILLUSTRATIONS} from '../../src/content/consumable-illustrations.js';
import {collectionArtworkSvg} from '../../src/content/collection-illustrations.js';
import {createRun} from '../../src/core/run.js';
import {renderBlindSelect,removeBlindSelect} from '../../src/ui/blind-select.js';

test('all 32 booster descriptions state content, offered count and selection count',()=>{
 const packs=catalog.centres.filter(c=>c.set==='Booster');assert.equal(packs.length,32);
 const content={Arcana:'Таро',Celestial:'Планет',Standard:'игральные',Spectral:'Спектральные',Buffoon:'джокеров'};
 for(const pack of packs){
  const {description}=describeShopItem({entityId:pack.key});
  const size=pack.key.includes('_normal_')?(['Buffoon','Spectral'].includes(pack.kind)?2:3):(['Buffoon','Spectral'].includes(pack.kind)?4:5);
  assert.ok(description.includes(content[pack.kind]),pack.key);
  assert.ok(description.includes(`Предлагается карт: ${size}.`),pack.key);
  assert.ok(description.includes(`Выберите ${pack.key.includes('_mega_')?2:1}`),pack.key);
  assert.doesNotMatch(description,/предварительной версии/,pack.key);
 }
});

test('consumable engravings keep their approved scenes on full paper without an inset frame',()=>{
 for(const [id,plate] of Object.entries(CONSUMABLE_ILLUSTRATIONS)){
  const svg=consumableArtworkSvg(id);
  assert.ok(svg.includes(`<g data-engraving="${id}">${plate.scene}</g>`),id);
  const paper=svg.match(/<rect[^>]+>/)?.[0];
  assert.match(paper,/width="118" height="138"/,id);
  assert.doesNotMatch(paper,/stroke=/,id);
 }
});

class N{
 constructor(tag){this.tagName=tag;this.children=[];this.dataset={};this.style={};this.attrs={};}
 set textContent(value){this.text=String(value);this.children=[];}
 get textContent(){return(this.text??'')+this.children.map(n=>n.textContent).join('');}
 append(...nodes){this.children.push(...nodes);for(const node of nodes)node.parent=this;}
 setAttribute(key,value){this.attrs[key]=value;}
 getAttribute(key){return this.attrs[key];}
 querySelector(selector){return all(this).find(n=>n.id===selector.slice(1))??null;}
 querySelectorAll(){return [];}
 remove(){if(this.parent)this.parent.children=this.parent.children.filter(n=>n!==this);}
}
const all=node=>[node,...node.children.flatMap(all)];
test('skip reward buttons use the same artwork as their collection entry',()=>{
 const stage=new N('main');
 globalThis.document={createElement:tag=>new N(tag),getElementById:()=>stage,addEventListener(){}};
 globalThis.matchMedia=()=>({matches:true});
 const state=createRun('AAAAAAA1',{runId:'skip-art',money:4n,referenceRng:true,referenceShop:true});
 try{
  const view=renderBlindSelect(state,false,()=>{},()=>{});
  for(const id of ['small','big']){
   const stamp=view.querySelector('#tag_'+id),tagId=state.apkBlinds.tags[id];
   assert.equal(stamp.innerHTML,collectionArtworkSvg(tagId),tagId);
   assert.equal(stamp.textContent,'');assert.match(stamp.attrs['aria-label'],/описание награды/);
  }
 }finally{removeBlindSelect();delete globalThis.document;delete globalThis.matchMedia;}
});
