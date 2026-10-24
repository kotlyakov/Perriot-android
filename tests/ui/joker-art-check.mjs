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
  const ink=card.querySelector('.shop-art,.print-plate')?.getBoundingClientRect(),label=name.getBoundingClientRect(),style=getComputedStyle(name);
  if(out.length||name.scrollHeight>name.clientHeight+1)return[card.dataset.entryId+' title overflow'];
  if(!ink||ink.left>r.left+4||ink.top>r.top+4||ink.right<r.right-4||ink.bottom<r.bottom-4)return[card.dataset.entryId+' artwork must fill the card'];
  if(label.top<ink.top||label.bottom>ink.bottom||parseFloat(style.webkitTextStrokeWidth)<1.5||style.backgroundColor!=='rgba(0, 0, 0, 0)')return[card.dataset.entryId+' name must be outlined over the artwork'];
  return[];
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
   const first=page.locator('.collection-card').first();await first.click();await page.locator('#collection_details').waitFor({state:'visible'});assert.equal(await page.locator('#collection_details strong').first().textContent(),JOKER_IDENTITIES[actual[0].id].name);assert.equal(await page.locator('#collection_details button').count(),0);await page.locator('#dialog').click({position:{x:8,y:8}});assert.equal(await page.locator('#collection_details').count(),0);
   await page.screenshot({path:`artifacts/joker-game-${width}-page-${p+1}.png`});
  }
  assert.equal(new Set(seen).size,150);
  // Shared artwork also handles legacy inventory identities and retains editions.
  const alias=await page.evaluate(async()=>{const {artwork}=await import('/src/ui/shop-screen.js');return artwork({entityId:'joker_joker'},'owned').dataset.jokerId;});assert.equal(alias,'j_joker');
  if(width===1536){
   await page.evaluate(async()=>{
    const [{artwork},{JOKER_IDENTITIES},{describeShopItem}]=await Promise.all([import('/src/ui/shop-screen.js'),import('/src/content/joker-identities.js'),import('/src/content/shop-display.js')]);
    const fixture=document.createElement('div');fixture.id='joker_shop_names_fixture';fixture.style.cssText='position:absolute;left:0;top:0;width:1200px;display:grid;grid-template-columns:repeat(10,104px);gap:8px;z-index:99990';
    for(const id of Object.keys(JOKER_IDENTITIES)){const card=document.createElement('button');card.className='shop-card';card.dataset.entryId=id;card.style.cssText='position:relative;width:104px;height:143px';const name=document.createElement('span');name.className='shop-card-name';name.textContent=describeShopItem({entityId:id}).name;card.append(artwork({entityId:id},'owned'),name);fixture.append(card);}document.body.append(fixture);
   });
   await titleBounds(page,'#joker_shop_names_fixture .shop-card','.shop-card-name');await page.locator('#joker_shop_names_fixture').evaluate(n=>n.remove());
   await page.locator('#dialog-actions button').click();await page.locator('#dialog-actions button').click();
   await page.evaluate(async()=>{const {artwork}=await import('/src/ui/shop-screen.js');const wrap=document.createElement('div');wrap.id='joker_edition_fixture';wrap.style.cssText='position:fixed;left:20px;top:20px;width:104px;height:143px;z-index:99999';const card=document.createElement('button');card.className='shop-card shop-owned-card';card.dataset.cardSet='Joker';card.append(artwork({entityId:'j_joker'},'owned'));wrap.append(card);document.body.append(wrap);});
   const card=page.locator('#joker_edition_fixture .shop-card'),b=await card.boundingBox();const clip={x:b.x+20,y:b.y+20,width:60,height:70};
   const plain=await page.screenshot({clip,animations:'disabled'});
   for(const edition of ['foil','holographic','polychrome','negative']){
    await card.evaluate((n,value)=>n.dataset.edition=value,edition);
    const modified=await page.screenshot({clip,animations:'disabled'});assert.equal(plain.equals(modified),false,edition+' must visibly change the opaque individual engraving');
    await card.screenshot({path:`artifacts/joker-edition-${edition}.png`,animations:'disabled'});
   }
  }
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
  await page.locator('.joker-page:not([hidden]) .gallery-joker').first().focus();await page.keyboard.press('ArrowLeft');assert.equal(await page.locator('output').textContent(),'8 / 10');await page.keyboard.press('ArrowRight');assert.equal(await page.locator('output').textContent(),'9 / 10');
  const area=page.locator('.gallery-pages'),a=await area.boundingBox();await page.mouse.move(a.x+a.width*.8,a.y+45);await page.mouse.down();await page.mouse.move(a.x+a.width*.2,a.y+45,{steps:5});await page.mouse.up();assert.equal(await page.locator('output').textContent(),'10 / 10');assert.equal(await page.locator('#joker_gallery_details').count(),0);await page.locator('.gallery-prev').click();
  await page.locator('.joker-page:not([hidden]) .gallery-joker').first().click();await page.locator('#joker_gallery_details').waitFor({state:'visible'});assert.equal(await page.locator('#joker_gallery_details button').count(),0);await page.locator('.gallery-heading').click();assert.equal(await page.locator('#joker_gallery_details').count(),0);
  await page.close();console.log(`Standalone all150 names and paging ${width}px PASS`);
 }
 assert.deepEqual(errors,[]);
}finally{await browser.close();}
