import test from 'node:test';import assert from 'node:assert/strict';
import {tooltipPlacement} from '../../src/ui/card-tooltip.js';
const bounds={left:0,top:0,right:915,bottom:412};
test('tooltip is adjacent to its card and flips at screen edges',()=>{
 const size={width:180,height:150};
 assert.deepEqual(tooltipPlacement({left:300,right:380,top:130,bottom:230},size,bounds),{left:390,top:130});
 assert.deepEqual(tooltipPlacement({left:800,right:880,top:300,bottom:400},size,bounds),{left:610,top:254});
 const position=tooltipPlacement({left:0,right:80,top:0,bottom:90},{width:910,height:400},bounds);
 assert.ok(position.left>=8&&position.top>=8);
});

test('top-row card descriptions open below the row instead of blocking the next card',()=>{
 const b={left:0,top:0,right:1536,bottom:688},card={left:600,right:704,top:20,bottom:163};
 const p=tooltipPlacement(card,{width:290,height:210},b);
 assert.equal(p.top,173);assert.ok(p.left>=8&&p.left+290<=1528);
});

test('overflowing tooltip allows a scroll gesture but a stationary tap still dismisses',async()=>{
 const {showCardTooltip,dismissCardTooltip}=await import('../../src/ui/card-tooltip.js');
 const listeners={},container={append(){}},doc={addEventListener:(type,fn)=>listeners[type]=fn,getElementById:()=>container};
 const card={ownerDocument:doc,dataset:{cardId:'long-card'},setAttribute(){},removeAttribute(){}};
 const tip={style:{},scrollHeight:600,clientHeight:200,contains(target){return target===this;},remove(){this.removed=true;}};
 showCardTooltip(tip,card);
 listeners.pointerdown({target:tip,clientX:100,clientY:100,pointerId:1,preventDefault(){}});
 assert.notEqual(tip.removed,true,'Touch down must allow native scrolling');
 assert.equal(typeof listeners.pointermove,'function','scroll drag is distinguished from a tap');
 listeners.pointermove({clientX:100,clientY:50,pointerId:1});listeners.pointerup({pointerId:1});
 assert.notEqual(tip.removed,true,'A scroll gesture preserves the tooltip');
 listeners.pointerdown({target:tip,clientX:100,clientY:100,pointerId:2,preventDefault(){}});
 listeners.pointerup({pointerId:2,preventDefault(){}});assert.equal(tip.removed,true,'Stationary tap dismisses');dismissCardTooltip();
});

test('any next interaction dismisses; same physical card does not reopen after render',async()=>{
 const {showCardTooltip,dismissCardTooltip}=await import('../../src/ui/card-tooltip.js');
 const listeners={},container={append(tip){tip.connected=true;}};
 const doc={addEventListener:(type,fn)=>listeners[type]=fn,getElementById:()=>container};
 const card=()=>({ownerDocument:doc,dataset:{cardId:'same-card'},setAttribute(){},removeAttribute(){}});
 const tip=()=>({style:{},contains(target){return target===this;},remove(){this.connected=false;}});
 const one=tip();assert.equal(showCardTooltip(one,card()),true);assert.equal(one.connected,true);
 listeners.pointerdown({});assert.equal(one.connected,false);assert.equal(showCardTooltip(tip(),card()),false);
 listeners.pointerdown({});const two=tip();assert.equal(showCardTooltip(two,card()),true);
 let prevented=false;listeners.keydown({key:'Escape',preventDefault(){prevented=true;}});assert.equal(two.connected,false);assert.equal(prevented,true);
 listeners.pointerdown({});const anchor=card();assert.equal(showCardTooltip(tip(),anchor),true);listeners.keydown({key:'Enter',target:anchor});listeners.click({detail:0,target:anchor});assert.equal(showCardTooltip(tip(),card()),false,'Keyboard click retains keydown dismissal through native click');
 listeners.pointerdown({});const popup=tip();showCardTooltip(popup,card());let stopped=false;listeners.pointerdown({target:popup,preventDefault(){}});listeners.click({detail:1,preventDefault(){},stopImmediatePropagation(){stopped=true;}});assert.equal(stopped,true,'Click on the removed popup must not activate a card underneath');
 dismissCardTooltip();
});
