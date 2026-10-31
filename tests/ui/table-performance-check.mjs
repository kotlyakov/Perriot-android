import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {enterRun} from './enter-run.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{const page=await browser.newPage({viewport:{width:915,height:412}});await page.goto(process.env.PREVIEW_URL);await enterRun(page);await page.waitForFunction(()=>document.querySelector('#hand .playing-card')&&!document.getElementById('sort_rank').disabled);await page.waitForTimeout(500);const cdp=await page.context().newCDPSession(page);
async function sample(){const events=[];const listener=r=>events.push(...r.value);cdp.on('Tracing.dataCollected',listener);await cdp.send('Tracing.start',{categories:'devtools.timeline',transferMode:'ReportEvents'});await page.waitForTimeout(1200);const ended=new Promise(r=>cdp.once('Tracing.tracingComplete',r));await cdp.send('Tracing.end');await ended;cdp.off('Tracing.dataCollected',listener);const paints=events.filter(e=>e.name==='Paint');return {paints:paints.length,paintMs:paints.reduce((n,e)=>n+(e.dur??0)/1000,0),totalPaintPixels:paints.reduce((n,e)=>{const c=e.args?.data?.clip;if(!c)return n;return n+Math.min(915,Math.max(c[0],c[2],c[4],c[6])-Math.min(c[0],c[2],c[4],c[6]))*Math.min(412,Math.max(c[1],c[3],c[5],c[7])-Math.min(c[1],c[3],c[5],c[7]));},0)};}
const moving=await sample();await page.addStyleTag({content:'#stage,#stage::before{animation:none!important}'});await page.waitForTimeout(200);const paused=await sample();console.log(JSON.stringify({moving,paused}));assert.ok(moving.paints<10,'The breathing table must not repaint the full field every animation frame');
}finally{await browser.close();}
