import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{
 const page=await browser.newPage({viewport:{width:1200,height:700}});
 await page.goto(process.env.PREVIEW_URL);
 await page.addStyleTag({content:await readFile('web/card-materials.css','utf8')});
 const setup=await page.evaluate(async()=>{
  const {installCardMaterials}=await import('/src/ui/card-materials.js');
  const {cardMarkup}=await import('/src/ui/field.js');
  const {jokerArtworkSvg}=await import('/src/ui/joker-art.js');
  const fixture=document.createElement('div');fixture.id='material-fixture';fixture.style.cssText='position:fixed;inset:0;z-index:99999;background:#25453d;display:flex;align-content:start;gap:15px;flex-wrap:wrap;padding:20px';document.body.append(fixture);
  for(const edition of ['base','foil','holographic','polychrome','negative']){
   const card=document.createElement('button');card.className='playing-card';card.dataset.edition=edition;card.dataset.seal='gold';card.style.cssText='position:relative;left:auto;top:auto;flex:none';card.innerHTML=cardMarkup({rank:12,suit:'hearts',seal:'gold'});fixture.append(card);
  }
  for(const enhancement of ['steel','glass','gold','bonus','mult','wild','lucky']){
   const card=document.createElement('button');card.className='playing-card';card.dataset.enhancement=enhancement;card.style.cssText='position:relative;left:auto;top:auto;flex:none';card.innerHTML=cardMarkup({rank:7,suit:'clubs'});fixture.append(card);
  }
  for(const id of ['j_satellite','j_hologram']){
   const card=document.createElement('button');card.className='shop-card';card.style.cssText='position:relative;left:auto;top:auto;width:115px;height:160px';card.innerHTML='<div class="shop-art joker-illustration">'+jokerArtworkSvg(id)+'</div>';fixture.append(card);
  }
  window.stopMaterials=installCardMaterials(fixture);
  return {cards:fixture.children.length};
 });
 assert.equal(setup.cards,14);
 const foil=page.locator('#material-fixture [data-edition=foil]');
 await page.waitForFunction(()=>document.querySelectorAll('#material-fixture .card-material-layer').length===26);
 assert.equal(await page.locator('#material-fixture [data-edition=base] .card-material-layer').count(),0);
 const initial=await foil.screenshot();await page.waitForTimeout(300);const later=await foil.screenshot();assert.notDeepEqual(initial,later,'Foil must visibly animate with elapsed time');
 const box=await foil.boundingBox();await page.mouse.move(box.x+10,box.y+10);
 const first=await foil.evaluate(n=>getComputedStyle(n.querySelector('.material-light')).backgroundImage);
 await page.mouse.move(box.x+box.width-10,box.y+box.height-10);
 const last=await foil.evaluate(n=>getComputedStyle(n.querySelector('.material-light')).backgroundImage);
 assert.notEqual(first,last,'Pointer position must change actual foil reflection');
 const result=await page.evaluate(()=>{
  const fixture=document.getElementById('material-fixture'),get=e=>fixture.querySelector(`[data-edition=${e}]`);
  return {
   negativeFilter:getComputedStyle(get('negative').querySelector('.face')).filter,
   negativeShine:getComputedStyle(get('negative').querySelector('.material-light')).mixBlendMode,
   editions:['foil','holographic','polychrome'].map(e=>getComputedStyle(get(e).querySelector('.material-light')).backgroundImage),
   seals:[...fixture.querySelectorAll('.playing-seal')].map(n=>({clip:getComputedStyle(n).clipPath,animation:getComputedStyle(n,'::after').animationName})),
   art:[...fixture.querySelectorAll('[data-animated-art]')].map(n=>getComputedStyle(n.querySelector('svg>g')).animationName),
   decorative:[...fixture.querySelectorAll('.card-material-layer')].every(n=>n.getAttribute('aria-hidden')==='true'&&getComputedStyle(n).pointerEvents==='none')
  };
 });
 assert.match(result.negativeFilter,/invert\(1\)/);assert.equal(result.negativeShine,'screen');assert.equal(new Set(result.editions).size,3);
 assert.ok(result.seals.every(n=>n.clip.startsWith('polygon(')&&n.animation==='material-drift'));
 assert.deepEqual(result.art,['art-orbit','art-hologram']);assert.ok(result.decorative);
 await mkdir('artifacts',{recursive:true});await page.screenshot({path:'artifacts/card-materials.png'});
 // Mutation/re-render must restore exactly two layers, and reverting edition removes them.
 await foil.evaluate(n=>{n.innerHTML='<span>Reprinted face</span>';});
 await page.waitForFunction(()=>document.querySelectorAll('#material-fixture [data-edition=foil] .card-material-layer').length===2);
 await foil.evaluate(n=>{n.dataset.edition='base';});
 await page.waitForFunction(()=>document.querySelectorAll('#material-fixture [data-edition=base] .card-material-layer').length===0);
 await page.emulateMedia({reducedMotion:'reduce'});
 assert.equal(await page.locator('#material-fixture [data-edition=holographic] .material-light').evaluate(n=>getComputedStyle(n).animationName),'none');
 assert.equal(await page.locator('#material-fixture [data-animated-art=j_satellite] svg>g').evaluate(n=>getComputedStyle(n).animationName),'none');
 await page.setViewportSize({width:915,height:412});
 await page.locator('#material-fixture').evaluate(n=>{n.style.width='1200px';n.style.height='700px';n.style.transform='scale(.72)';n.style.transformOrigin='top left';});
 const mobileBounds=await page.locator('#material-fixture').evaluate(n=>[...n.children].map(c=>{const b=c.getBoundingClientRect();return {right:b.right,bottom:b.bottom};}));
 assert.ok(mobileBounds.every(b=>b.right<=915&&b.bottom<=412),'Material sample cards fit landscape phone viewport');
 await page.screenshot({path:'artifacts/card-materials-915.png'});
 await page.evaluate(()=>window.stopMaterials());
 console.log('Card materials PASS: time, pointer, negative art/shine, editions, improvements, wax, two animated scenes, redraw, reduced motion.');
}finally{await browser.close();}
