import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});const failures=[];
try{for(const [width,height] of [[1536,688],[915,412],[568,320]]){
 const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});await page.goto(process.env.PREVIEW_URL);
 const result=await page.evaluate(async()=>{
  const [{createRun},{renderShop},{showFlame}]=await Promise.all([import('/src/core/run.js'),import('/src/ui/shop-screen.js'),import('/src/ui/flame.js')]);
  document.getElementById('start_screen')?.remove();document.querySelector('dialog[open]')?.close();
  const s=createRun('visual-feedback',{runId:'visual-feedback',money:4n,referenceRng:true,referenceShop:true});s.phase='pack';s.packState={sourceEntityId:'p_standard_normal_1',choicesRemaining:1,cards:[]};
  const inks={spades:'rgb(40, 60, 83)',hearts:'rgb(187, 48, 52)',clubs:'rgb(20, 61, 57)',diamonds:'rgb(202, 80, 42)'};
  for(const [suit,prefix] of Object.entries({spades:'S',hearts:'H',clubs:'C',diamonds:'D'}))for(let rank=2;rank<=14;rank++)s.packState.cards.push({id:suit+rank,entityId:'base',set:'Base',frontKey:prefix+'_'+({10:'T',11:'J',12:'Q',13:'K',14:'A'}[rank]??rank),edition:'base'});
  renderShop(s,false);const colours=[];
  for(const [i,card]of s.packState.cards.entries()){const el=document.querySelectorAll('#pack_screen .playing-card')[i],suit=card.id.replace(/\d/g,'');const corner=el.querySelector('.corner');if(getComputedStyle(corner).color!==inks[suit])colours.push({id:card.id,corner:getComputedStyle(corner).color});const court=el.querySelector('.court-illustration>rect');if(court&&getComputedStyle(court).stroke!==inks[suit])colours.push({id:card.id,court:getComputedStyle(court).stroke});const pip=el.querySelector('.pip-art path');if(pip&&getComputedStyle(pip).fill!==inks[suit])colours.push({id:card.id,actual:getComputedStyle(pip).fill,expected:inks[suit]});}
  const diamond=document.querySelectorAll('#pack_screen .playing-card')[40];diamond.dataset.edition='negative';await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));if(getComputedStyle(diamond.querySelector('.pip-art')).filter==='none')colours.push({negative:'filter missing'});delete diamond.dataset.edition;diamond.dataset.enhancement='steel';await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));if(getComputedStyle(diamond.querySelector('.pip-art path')).fill!=='rgb(245, 236, 209)')colours.push({steel:'override missing'});
  showFlame(10n**80n,300n);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  const c=document.getElementById('score_flame'),r=c.getBoundingClientRect(),data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;const outside=[];
  const chips=document.getElementById('chips').getBoundingClientRect(),mult=document.getElementById('mult').getBoundingClientRect();
  for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const i=(y*c.width+x)*4;if(data[i+3]<8)continue;const box=x<c.width/2?chips:mult,px=r.left+(x+.5)*r.width/c.width;if(px<box.left-.01||px>box.right+.01)outside.push({x,y,px,left:box.left,right:box.right});}
  s.packState.cards=s.packState.cards.filter(c=>c.id.endsWith('3')&&!c.id.endsWith('13'));renderShop(s,false);return {colours,outside:outside.slice(0,5)};
 });
 if(result.colours.length)failures.push({width,colour:result.colours.slice(0,2)});if(result.outside.length)failures.push({width,flame:result.outside});
 console.log(JSON.stringify({width,colourFailures:result.colours.length,outside:result.outside}));await page.screenshot({path:`artifacts/gameplay-visual-${width}.png`});await page.close();
}assert.deepEqual(failures,[]);}finally{await browser.close();}
