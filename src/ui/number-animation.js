// Integer-only presentation. The committed game state is never interpolated.
const jobs=new WeakMap();
export function animateNumber(node,value,{animate=false,from,duration=220,format=String,onFrame}={}){
 const target=BigInt(value),old=from===undefined?BigInt(node.dataset.number??target):BigInt(from);
 const previous=jobs.get(node);if(previous){cancelAnimationFrame(previous.frame);previous.resolve();jobs.delete(node);}
 const paint=n=>{node.dataset.number=String(n);node.textContent=format(n);node.title=String(n);onFrame?.();};
 if(!animate || old===target || matchMedia('(prefers-reduced-motion: reduce)').matches){paint(target);return Promise.resolve();}
 paint(old);
 return new Promise(resolve=>{
   const job={resolve,frame:0},start=performance.now();jobs.set(node,job);
   function tick(now){const progress=Math.max(0,Math.min(1,(now-start)/duration)),units=BigInt(Math.floor((1-(1-progress)**3)*1000));paint(old+(target-old)*units/1000n);
     if(progress<1)job.frame=requestAnimationFrame(tick);else {paint(target);jobs.delete(node);resolve();}
   }
   job.frame=requestAnimationFrame(tick);
 });
}
export function animateCounters(before,after){
 for(const [id,key,kind] of [['hands_value','handsRemaining','chips'],['discards_value','discardsRemaining','mult']]){
   const difference=after[key]-before[key];if(!difference)continue;
   const node=document.getElementById(id);animateNumber(node,after[key],{animate:true,from:before[key],duration:320});
   const pop=document.createElement('span');pop.className='score-pop counter-pop '+kind;pop.textContent=(difference>0?'+':'')+difference;pop.dataset.counter=id;
   const region=node.parentElement;pop.style.left=parseFloat(region.style.left)+region.offsetWidth/2+'px';pop.style.top=parseFloat(region.style.top)-12+'px';document.getElementById('stage').append(pop);
   if(matchMedia('(prefers-reduced-motion: reduce)').matches){pop.remove();continue;}
   pop.animate([{opacity:1,translate:'0 0'},{opacity:1,translate:'0 -15px',offset:.6},{opacity:0,translate:'0 -27px'}],{duration:700,easing:'ease-out'}).finished.then(()=>pop.remove());
 }
}
