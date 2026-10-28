// Exercise actual pointer capture and the shared drop regions, on mouse or touch.
export async function dragShopAction(page,id,action='use',touch=false,duringDrag){
 const card=page.locator(`.shop-choice[data-offer-id="${id}"] .shop-card`),box=await card.boundingBox(),stage=await page.locator('#stage').boundingBox(),scale=stage.width/1536;
 const inventory=await card.evaluate(el=>['owned','consumable'].includes(el.closest('.shop-choice').dataset.kind));
 const from={x:box.x+box.width*.5,y:box.y+box.height*.5},position=action==='buy'?[850,105]:action==='sell'?[1300,105]:[1300,410],to={x:stage.x+position[0]*scale,y:stage.y+position[1]*scale};
 if(touch){
  const cdp=await page.context().newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...from,id:1}]});if(inventory)await page.locator('#shop_sell_zone:visible').waitFor();await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...to,id:1}]});await page.locator('#shop_'+action+'_zone.is-over').waitFor();await duringDrag?.();/* Chromium CDP: a real drag needs time to settle before release (instant flick suppresses the next tap). */await page.waitForTimeout(100);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
 }else{await page.mouse.move(from.x,from.y);await page.mouse.down();if(inventory)await page.locator('#shop_sell_zone:visible').waitFor();await page.mouse.move(to.x,to.y,{steps:6});await page.locator('#shop_'+action+'_zone.is-over').waitFor();await duringDrag?.();await page.mouse.up();}
 // The app paints press feedback before applying an action on the next frame.
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
}
