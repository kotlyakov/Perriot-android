import test from 'node:test';
import assert from 'node:assert/strict';
import {viewportLayout,LAYOUT} from '../../src/ui/layout.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<.00001,`${a} ≠ ${b}`);
test('approved wide drawing and home keep their existing scale and position',()=>{
 assert.deepEqual(viewportLayout(1536,688),{scale:1,uiScale:1,left:0,top:0,profile:'native-room'});
 for(const [w,h] of [[1536,864],[915,412],[568,320],[320,568]]){const d=viewportLayout(w,h,{home:true});near(d.scale,Math.min(w/1536,h/688));assert.equal(d.profile,'home');}
});
test('16:9 uses the APK room unit and its narrow-branch vertical origin',()=>{
 const d=viewportLayout(1536,864),unit=1536/22.6;near(d.scale,unit/(688/12.4));near(d.top,(864-688*d.scale)/2+.2*unit);
 near(LAYOUT.hud[2]*d.scale,357.6834739666598);assert.ok(LAYOUT.hud[0]*d.scale+d.left>0);assert.ok(LAYOUT.hud[0]*d.scale+d.left<15);
 assert.equal(d.uiScale,1);
});
test('visible controls stay inside all supported landscape viewport profiles',()=>{
 for(const [w,h] of [[1536,688],[1536,864],[915,412],[568,320]]){const d=viewportLayout(w,h);for(const id of ['run_info','options','sort_rank','sort_suit','play_hand','discard','deck','deck_count','hands','discards','ante','round']){const [x,y,width,height]=LAYOUT[id];assert.ok(x*d.scale+d.left>=-1,id);assert.ok(y*d.scale+d.top>=-1,id);assert.ok((x+width)*d.scale+d.left<=w+1,id);assert.ok((y+height)*d.scale+d.top<=h+1,id);}}
});
test('portrait keeps the entire horizontal game usable instead of clipping its cards',()=>{const d=viewportLayout(320,568);assert.equal(d.profile,'portrait-fit');near(d.scale,320/1536);near(d.left,0);assert.ok(d.top>0);});
