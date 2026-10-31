import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {enterRun} from './enter-run.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{
 for(const [width,height] of [[1536,688],[915,412]]){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(process.env.PREVIEW_URL);await enterRun(page,{startBlind:false});await page.evaluate(()=>document.fonts.ready);
  const result=await page.evaluate(async()=>{
   const {appendCardDescription}=await import('/src/ui/card-description.js');
   const {artwork}=await import('/src/ui/shop-screen.js');
   const stage=document.getElementById('stage');
   const tip=document.createElement('aside');tip.className='shop-tooltip';
   appendCardDescription(tip,{entityId:'c_wheel_of_fortune',set:'Tarot',edition:'base'});
   Object.assign(tip.style,{left:'530px',top:'80px'});stage.append(tip);
   const main=tip.querySelector('.tooltip-main'),side=tip.querySelector('.tooltip-modifiers');
   const mainBox=main.getBoundingClientRect(),sideBox=side.getBoundingClientRect();
   const body=main.querySelector('.tooltip-body').getBoundingClientRect();
   const cards=[];
   for(const [index,[id,set]] of [['c_fool','Tarot'],['c_earth','Planet'],['c_soul','Spectral']].entries()){
    const card=document.createElement('button');card.className='shop-card';card.dataset.cardSet=set;card.append(artwork({entityId:id}));
    Object.assign(card.style,{left:(530+index*140)+'px',top:'400px',width:'115px',height:'155px'});stage.append(card);
    cards.push({id,border:getComputedStyle(card).borderTopWidth,paper:card.querySelector('svg>rect').getAttribute('fill'),stroke:card.querySelector('svg>rect').getAttribute('stroke')});
   }
   return {mainHeight:mainBox.height,sideHeight:sideBox.height,bottomGap:mainBox.bottom-body.bottom,align:getComputedStyle(tip).alignItems,tags:[...document.querySelectorAll('.blind-tag')].map(n=>({art:n.querySelector('svg')?.dataset.collectionArt,text:n.textContent})),cards};
  });
  assert.equal(result.align,'start');assert.ok(result.sideHeight>result.mainHeight+10,JSON.stringify(result));assert.ok(result.bottomGap<5,JSON.stringify(result));
  assert.equal(result.tags.length,2);assert.ok(result.tags.every(tag=>tag.art?.startsWith('tag_')&&tag.text.length<10));
  for(const card of result.cards){assert.equal(card.border,'0px');assert.equal(card.stroke,null);}
  assert.equal(result.cards[0].paper,'#ed9b50');assert.equal(result.cards[1].paper,'#6ec8e7');
  assert.deepEqual(errors,[]);console.log(JSON.stringify({width,height,...result,passed:true}));
  await context.close();
 }
}finally{await browser.close();}
