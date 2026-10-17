import test from 'node:test';
import assert from 'node:assert/strict';
import * as shop from '../../src/ui/shop-screen.js';

test('cancelled shop card overshoots along flight and settles with distance-dependent inertia',()=>{
 assert.equal(typeof shop.shopReturnFrames,'function','Return trajectory must be derived from drag displacement');
 const peaks=[];
 for(const [dx,dy] of [[120,0],[350,0],[-120,0],[0,180],[250,180]]){
  const frames=shop.shopReturnFrames(dx,dy),length=Math.hypot(dx,dy);
  const points=frames.map(f=>f.translate.split(' ').map(parseFloat));
  assert.deepEqual(points[0],[dx,dy]);assert.deepEqual(points.at(-1),[0,0]);
  assert.ok(points.every(([x,y])=>Math.abs(x*dy-y*dx)/length<.001),'Stay along trajectory');
  const projection=points.map(([x,y])=>(x*dx+y*dy)/length);
  const firstCross=projection.findIndex(v=>v<0),secondCross=projection.findIndex((v,i)=>i>firstCross&&v>0);
  assert.ok(Math.min(...projection)<-length*.025,'Pass home');assert.ok(secondCross>firstCross,'Swing back');
  const peak=-Math.min(...projection);assert.ok(Math.max(...projection.slice(secondCross))<peak,'Decay');peaks.push(peak);
 }
 assert.ok(peaks[1]>peaks[0]*2,'Longer flight has larger inertia');
 assert.ok(shop.shopReturnFrames(0,0).every(f=>f.translate==='0px 0px'));
});
