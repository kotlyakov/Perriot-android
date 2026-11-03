// Two frames let the browser paint the press before synchronous game/save work.
// No game state or success animation changes until persistence has succeeded.
export async function paintActionFeedback(element){
 if(element?.isConnected)element.classList.add('action-pending');
 await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 return ()=>element?.classList.remove('action-pending');
}
