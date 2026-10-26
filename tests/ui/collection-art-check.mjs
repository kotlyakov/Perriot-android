import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{
 const page=await browser.newPage({viewport:{width:1200,height:900},deviceScaleFactor:1});
 await page.goto(process.env.PREVIEW_URL??'http://127.0.0.1:4173');
 await page.evaluate(async()=>{
  const {collectionArtworkSvg,COLLECTION_ART_IDS}=await import('/src/content/collection-illustrations.js');
  const {collectionEntries,createProfile}=await import('/src/core/profile.js');
  const entries=collectionEntries(createProfile()).filter(e=>COLLECTION_ART_IDS.includes(e.id));
  document.body.innerHTML='';document.head.querySelectorAll('link,style').forEach(n=>n.remove());
  const style=document.createElement('style');style.textContent='*{box-sizing:border-box}body{margin:0;padding:22px;background:#223d3b;color:#f1e6c7;font-family:Georgia,serif}h1{font-size:24px;margin:0 0 20px}section{display:grid;grid-template-columns:repeat(8,1fr);gap:18px}article{background:#38514b;padding:8px;min-width:0;text-align:center}svg{display:block;width:100%;height:150px}p{font-size:10px;height:25px;margin:8px 0 0;overflow-wrap:anywhere}';document.head.append(style);
  window.artGallery={entries,collectionArtworkSvg};
 });
 await mkdir('artifacts',{recursive:true});
 for(const set of ['Booster','Voucher','Back','Enhanced','Seal','Edition','Tag','Blind']){
  const ids=await page.evaluate(set=>{
   const {entries,collectionArtworkSvg}=window.artGallery,rows=entries.filter(e=>e.set===set);document.body.innerHTML=`<h1>${set} · ${rows.length} original plates</h1><section>${rows.map(e=>`<article data-id="${e.id}">${collectionArtworkSvg(e.id)}<p>${e.id}</p></article>`).join('')}</section>`;return rows.map(e=>e.id);
  },set);
  await page.screenshot({path:`artifacts/collection-art-${set}.png`,fullPage:true});
  // Raster scans inspect the actual painted SVG extent, including transformed icons.
  const images=await page.locator('article > svg').evaluateAll(async nodes=>Promise.all(nodes.map(async svg=>{
   const xml=new XMLSerializer().serializeToString(svg),img=new Image();img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(xml);await img.decode();
   const canvas=document.createElement('canvas');canvas.width=236;canvas.height=276;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,236,276);const pixels=ctx.getImageData(0,0,236,276).data;
   let painted=0,edge=0;for(let y=0;y<276;y++)for(let x=0;x<236;x++){const a=pixels[(y*236+x)*4+3];if(a){painted++;if(x===0||y===0||x===235||y===275)edge++;}}
   return {id:svg.dataset.collectionArt,painted,edge};
  })));
  assert.equal(images.length,ids.length);
  for(const img of images){assert.ok(img.painted>6000,`${img.id}: substantial visible illustration`);assert.equal(img.edge,0,`${img.id}: artwork stays inside viewBox`);}
  console.log(`${set}: ${ids.length} plates rasterized, bounded, gallery saved`);
 }
}finally{await browser.close();}
