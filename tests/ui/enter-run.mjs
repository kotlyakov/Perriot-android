/** Enter the real startup menus without mutating app state or save fixtures. */
export async function enterRun(page,{startBlind=true}={}) {
 await page.waitForFunction(()=>document.querySelector('#start_screen,#hand .playing-card,#post_round,dialog[open],#select_small'));
 // Recovery and unavailable-save dialogs must retain their original test semantics.
 if(await page.locator('dialog[open]').count())return;
 if(await page.locator('#start_screen').count()){
  await page.locator('#start_new').click();
  await page.locator('#setup_continue_tab').waitFor();
  if(await page.locator('#setup_continue_tab').isEnabled())await page.locator('#setup_continue_tab').click();
  await page.locator('#setup_play').click();
  await page.locator('#start_screen').waitFor({state:'detached'});
 }
 // Continue a saved reward/shop unchanged; select only an actual pending blind.
 if(startBlind && await page.locator('#select_small').count())await page.locator('#select_small').click();
}


