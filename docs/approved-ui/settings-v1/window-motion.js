// Individual translate keeps each window's existing centering and scale.
const motions=new WeakMap();
export function slideWindow(node,closing=false,done=()=>{}){
 motions.get(node)?.cancel();motions.delete(node);
 if(matchMedia('(prefers-reduced-motion: reduce)').matches){done();return;}
 const parent=node.parentElement,scale=parent?.offsetWidth?parent.getBoundingClientRect().width/parent.offsetWidth:1;
 const distance=(innerHeight-node.getBoundingClientRect().top+32)/(scale||1);
 const animation=node.animate(closing?[{translate:'0 0'},{translate:`0 ${distance}px`}]:[{translate:`0 ${distance}px`},{translate:'0 0'}],{duration:closing?260:420,easing:closing?'cubic-bezier(.4,0,1,1)':'cubic-bezier(.16,1,.3,1)',fill:'both'});
 motions.set(node,animation);
 animation.finished.then(()=>{if(motions.get(node)!==animation)return;motions.delete(node);animation.cancel();done();},()=>{});
}
export function cancelWindowMotion(node){motions.get(node)?.cancel();motions.delete(node);}
