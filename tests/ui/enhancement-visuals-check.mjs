import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{for(const [width,height] of [[1536,688],[915,412],[568,320]]){
 const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});await page.goto(process.env.PREVIEW_URL);await page.locator('#start_collection').click();
 await page.evaluate(async()=>{
  const {createProfile,collectionEntries}=await import('/src/core/profile.js'),{renderCollectionView}=await import('/src/ui/profile-screen.js');const p=createProfile();p.unlocked=collectionEntries(p).map(e=>e.id);p.discovered=[...p.unlocked];const root=renderCollectionView(p,undefined,{profileId:'enhance-fixture',onNavigate:()=>{document.getElementById('dialog').dataset.window='collection';}});document.getElementById('dialog-body').replaceChildren(root);root.querySelector('#collection_category_Enhanced').click();
 });
 assert.equal(await page.locator('[data-enhancement-art]').count(),7);
 const result=await page.evaluate(async()=>{
  const rows=[];for(const svg of document.querySelectorAll('.collection-illustration>svg')){
   const key=svg.dataset.collectionArt.slice(2);if(key==='stone')continue;
   const image=new Image();image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(svg));await image.decode();const canvas=document.createElement('canvas');canvas.width=118;canvas.height=138;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,118,138);rows.push({key,top:[...ctx.getImageData(16,11,15,15).data],bottom:[...ctx.getImageData(87,111,15,15).data]});
  }return rows;
 });
 for(const row of result){assert.deepEqual(row.top,result[0].top,row.key+' top rank unobscured');assert.deepEqual(row.bottom,result[0].bottom,row.key+' bottom rank unobscured');}
 await page.screenshot({path:`artifacts/enhancement-collection-${width}.png`});
 const report=await page.evaluate(async()=>{
  const {cardMarkup,applyCardModifiers,SUITS}=await import('/src/ui/field.js');document.getElementById('dialog').close();const fixture=document.createElement('section');fixture.style.cssText='position:fixed;inset:0;width:915px;height:412px;transform-origin:top left;z-index:9999;background:#24483f;display:flex;gap:15px;flex-wrap:wrap;padding:20px;align-content:start';fixture.style.transform=`scale(${Math.min(innerWidth/915,innerHeight/412)})`;document.body.append(fixture);
  const samples=['bonus','mult','wild','glass','steel','gold','lucky'].map(enhancement=>({enhancement,rank:7,suit:'hearts'})).concat([{enhancement:'wild',rank:12,suit:'spades',edition:'negative'},{enhancement:'glass',rank:14,suit:'diamonds',edition:'negative'},{enhancement:'steel',rank:13,suit:'clubs',edition:'foil'},{enhancement:'lucky',rank:14,suit:'hearts',edition:'negative'}]);
  for(const sample of samples){const key=sample.enhancement;const node=document.createElement('button');node.className='playing-card';node.style.cssText='position:relative;left:auto;top:auto';node.style.color=SUITS[sample.suit][1];node.dataset.testEnhancement=key;applyCardModifiers(node,sample);node.innerHTML=cardMarkup(sample);fixture.append(node);}await new Promise(requestAnimationFrame);
  return [...fixture.children].map(n=>{const ranks=[...n.querySelectorAll('.corner')],layers=[...n.querySelectorAll('.card-material-layer')];const bg=getComputedStyle(n).backgroundImage;n.disabled=true;return{key:n.dataset.enhancement,overlay:getComputedStyle(n,'::after').content,wild:n.querySelectorAll('[data-wild-symbol]').length,front:ranks.every(c=>parseInt(getComputedStyle(c).zIndex)>Math.max(0,...layers.map(l=>parseInt(getComputedStyle(l).zIndex)))),bg,disabledBg:getComputedStyle(n).backgroundImage};});
 });
 for(const r of report){assert.equal(r.overlay,'none');assert.ok(r.front);assert.equal(r.bg,r.disabledBg,'Material survives busy state');}assert.equal(report.find(r=>r.key==='wild').wild,9);assert.notEqual(report.find(r=>r.key==='steel').bg,report.find(r=>r.key==='glass').bg);
 await page.screenshot({path:`artifacts/enhancement-playing-${width}.png`});await page.close();console.log(`Clean enhancement faces, clear ranks, distinct glass/steel, wild orbs and clover ${width} PASS`);
}}finally{await browser.close();}
