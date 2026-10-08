import {enterRun} from './enter-run.mjs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE??(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright'));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try {
 for(const [width,height,dpr] of [[915,412,3.5],[568,320,2],[360,800,3],[1280,720,1],[1024,600,2],[412,915,3.5],[2400,1080,1]]) {
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,isMobile:true,hasTouch:true});const page=await context.newPage();
 await page.goto(process.env.PREVIEW_URL);await enterRun(page);await page.locator('#hand .playing-card').first().waitFor();
 const result=await page.evaluate(()=>({inner:[innerWidth,innerHeight],client:[document.documentElement.clientWidth,document.documentElement.clientHeight],visual:[visualViewport.width,visualViewport.height],stage:(()=>{const r=document.querySelector('#stage').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};})()}));
 assert.ok(Math.abs(result.stage.x-(width-result.stage.width)/2)<1 && Math.abs(result.stage.y-(height-result.stage.height)/2)<1,'Mobile stage not centered');
 assert.ok(Math.abs(result.stage.width/1536-result.stage.height/688)<.001,'Distorted aspect');
 assert.ok(Math.abs(result.stage.width-width)<1 || Math.abs(result.stage.height-height)<1,'Unused viewport');
 const controls=await page.locator('#play_hand,#discard,#sort_rank,#sort_suit,#deck,#options').evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect();return [r.x,r.y,r.right,r.bottom];}));
 for(const [x,y,right,bottom] of controls)assert.ok(x>=0 && y>=0 && right<=width+1 && bottom<=height+1,'Control outside viewport');
 assert.ok((await page.title()).includes('Пьеро'));
 console.log(`Mobile ${width}x${height} DPR${dpr}: fit/center/aspect/controls OK`);
 assert.ok(result.stage.right<=width+1 && result.stage.bottom<=height+1 && result.stage.x>=-1 && result.stage.y>=-1,'Mobile stage outside physical viewport');
 await page.locator('#hand .playing-card').first().tap();assert.equal(await page.locator('.selected').count(),1);
 await page.locator('#sort_suit').tap();assert.equal(await page.locator('.selected').count(),1);
 await page.setViewportSize({width:height,height:width});
 await page.waitForFunction(([w,h])=>{const r=document.querySelector('#stage').getBoundingClientRect();return r.right<=w+1 && r.bottom<=h+1 && Math.abs(r.width/1536-r.height/688)<.001;},[height,width]);
 await context.close();
 }
 console.log('Mobile layout checks passed');
} finally {await browser.close();}
