import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{for(const [width,height] of [[1536,688],[915,412],[568,320]]){
 const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.PREVIEW_URL);await page.locator('#start_collection').click();
 const counts=await page.evaluate(async()=>{
  const {createProfile,collectionEntries}=await import('/src/core/profile.js'),{renderCollectionView}=await import('/src/ui/profile-screen.js');
  const p=createProfile(),entries=collectionEntries(p);p.unlocked=entries.map(e=>e.id);p.discovered=[...p.unlocked];
  window.completeCollection=renderCollectionView(p,undefined,{profileId:'complete-fixture',onNavigate:({view,set})=>{document.getElementById('dialog').dataset.window=view==='index'?'collection-index':'collection';document.getElementById('dialog').dataset.collectionSet=set??'';}});
  document.getElementById('dialog-body').replaceChildren(window.completeCollection);return Object.fromEntries([...new Set(entries.map(e=>e.set))].map(set=>[set,entries.filter(e=>e.set===set).length]));
 });
 let seen=0;
 for(const [set,count] of Object.entries(counts)){
  await page.locator('#collection_category_'+set).click();const pages=Number((await page.locator('#collection_page').innerText()).split('/')[1]),ids=new Set();
  for(let n=0;n<pages;n++){
   const rows=await page.locator('.collection-card').evaluateAll(cards=>cards.map(c=>{const b=c.getBoundingClientRect(),art=c.querySelector('.shop-art'),name=c.querySelector('.shop-card-name'),s=name&&getComputedStyle(name);return{id:c.dataset.entryId,hasArt:!!art?.querySelector('svg'),placeholder:!!c.querySelector('.shop-plate'),hidden:!!c.querySelector('.collection-lock,.collection-state-art'),fits:b.left>=-1&&b.top>=-1&&b.right<=innerWidth+1&&b.bottom<=innerHeight+1,nameFits:!name||(name.scrollWidth<=name.clientWidth+1&&name.scrollHeight<=name.clientHeight+1),nameVisible:!name||s.visibility==='visible'};}));
   for(const row of rows){assert.ok(row.hasArt&&!row.placeholder&&!row.hidden,`${set} actual art ${row.id}`);assert.ok(row.fits,`${set} card bounds ${row.id}`);assert.ok(row.nameFits&&row.nameVisible,`${set} name fits ${row.id}`);ids.add(row.id);}
   if(pages>1)await page.locator('#collection_next').click();
  }
  assert.equal(ids.size,count,set+' complete catalogue');seen+=ids.size;await page.evaluate(()=>window.completeCollection.back());
 }
 assert.deepEqual(errors,[]);console.log(`All12collectioncategories/${seen}identities paintings+names+pages ${width} PASS`);await page.close();
}}finally{await browser.close();}
