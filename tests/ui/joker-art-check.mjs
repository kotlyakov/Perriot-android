import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {JOKER_IDENTITIES} from '../../src/content/joker-identities.js';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true});
const errors=[];
async function titleBounds(page,selector,titleClass){
 const bad=await page.locator(selector).evaluateAll((cards,cls)=>cards.flatMap(card=>{
  const name=card.querySelector(cls);if(!name)return [card.dataset.entryId+' missing title'];
  const r=card.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(name);
  const out=[...range.getClientRects()].filter(b=>b.left<r.left+.4||b.right>r.right-.4||b.top<r.top||b.bottom>r.bottom-.4);
  const ink=card.querySelector('.shop-art,.print-plate')?.getBoundingClientRect();
  return out.length||name.scrollHeight>name.clientHeight+1||ink&&name.getBoundingClientRect().top<ink.bottom-.6?[card.dataset.entryId+' title overflow/overlap']:[];
 }),titleClass);assert.deepEqual(bad,[]);
}
try{
 for(const [width,height,touch]of [[1536,688,false],[915,412,true],[568,320,true]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:touch,reducedMotion:'reduce'}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.PREVIEW_URL);await page.evaluate(()=>document.fonts.ready);
  await page.locator('#start_collection').click();await page.locator('#collection_category_Joker').click();assert.equal(await page.locator('.collection-card[data-card-state=unseen] .joker-illustration').count(),0);
  await page.locator('#dialog-actions button').click();await page.locator('#dialog-actions button').click();
  await page.locator('#start_new').click();await page.locator('#setup_seed_toggle').check();await page.locator('#setup_seed').fill('13031990');await page.locator('#setup_play').click();await page.locator('#select_small').waitFor();
  await page.locator('#options').click();await page.locator('#options_menu').click();await page.locator('#start_collection').click();await page.locator('#collection_category_Joker').click();
  const seen=[];
  for(let p=0;p<10;p++){
   await page.locator('#collection_page_select').evaluate((n,value)=>{n.value=value;n.dispatchEvent(new Event('change',{bubbles:true}));},String(p));
   assert.equal(await page.locator('.collection-card .joker-illustration svg').count(),15);
   const actual=await page.locator('.collection-card').evaluateAll(ns=>ns.map(n=>({id:n.dataset.entryId,title:n.querySelector('.collection-joker-name')?.textContent,art:n.querySelector('.joker-illustration')?.dataset.jokerId})));
   for(const row of actual){assert.equal(row.title,JOKER_IDENTITIES[row.id].name);assert.equal(row.art,row.id);seen.push(row.id);}
   await titleBounds(page,'.collection-card','.collection-joker-name');
   const first=page.locator('.collection-card').first();await first.click();await page.locator('#collection_details').waitFor({state:'visible'});assert.equal(await page.locator('#collection_details strong').first().textContent(),JOKER_IDENTITIES[actual[0].id].name);assert.equal(await page.locator('#collection_details button').count(),0);await page.locator('#dialog-title').click();assert.equal(await page.locator('#collection_details').count(),0);
   await page.screenshot({path:`artifacts/joker-game-${width}-page-${p+1}.png`});
  }
  assert.equal(new Set(seen).size,150);
  // Shared artwork also handles legacy inventory identities and retains editions.
  const alias=await page.evaluate(async()=>{const {artwork}=await import('/src/ui/shop-screen.js');return artwork({entityId:'joker_joker'},'owned').dataset.jokerId;});assert.equal(alias,'j_joker');
  await context.close();console.log(`Game all150 titles, art, aliases and tooltips ${width}x${height} PASS`);
 }
 const built=spawnSync(process.execPath,['scripts/build-joker-review.mjs'],{encoding:'utf8'});assert.equal(built.status,0,built.stderr);
 const html=await readFile('artifacts/joker-collection-review.html','utf8');
 for(const width of [320,390,736]){
  const page=await browser.newPage({viewport:{width,height:1100},hasTouch:width<736,reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));await page.setContent(html);await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('.gallery-joker').count(),150);
  for(let p=0;p<10;p++){
   assert.equal(await page.locator('.joker-page:not([hidden]) .gallery-joker').count(),15);
   await titleBounds(page,'.joker-page:not([hidden]) .gallery-joker','.gallery-joker-name');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   if(p===0||p===9)await page.screenshot({path:`artifacts/joker-gallery-${width}-page-${p+1}.png`});
   if(p<9)await page.locator('.gallery-next').click();
  }
  assert.equal(await page.locator('.gallery-next').isDisabled(),true);await page.locator('.gallery-prev').click();assert.equal(await page.locator('output').textContent(),'9 / 10');
  await page.locator('.joker-page:not([hidden]) .gallery-joker').first().click();await page.locator('#joker_gallery_details').waitFor({state:'visible'});assert.equal(await page.locator('#joker_gallery_details button').count(),0);await page.locator('.gallery-heading').click();assert.equal(await page.locator('#joker_gallery_details').count(),0);
  await page.close();console.log(`Standalone all150 names and paging ${width}px PASS`);
 }
 assert.deepEqual(errors,[]);
}finally{await browser.close();}
