import {cardMarkup,applyCardModifiers,SUITS} from './field.js';
import {gameDuration} from './game-speed.js';
export const reducedMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
export const cardFlightDuration=distance=>Math.max(180,Math.min(480,170+Math.sqrt(distance)*10));
export async function cardMotion(node,frames,options={}){
 if(!node||reducedMotion())return;
 const animation=node.animate(frames,{duration:gameDuration(300),easing:'ease-out',...options});
 // A rerender or navigation may cancel a presentation without canceling its committed action.
 try{await animation.finished;}catch{}
}
export function juiceCard(node,{multiply=false}={}){
 return cardMotion(node,[{scale:'1',rotate:'0deg'},{scale:multiply?'1.17':'1.09',rotate:'-4deg',offset:.22},{scale:'.97',rotate:'2.3deg',offset:.5},{scale:'1.025',rotate:'-1deg',offset:.73},{scale:'1',rotate:'0deg'}],{duration:gameDuration(multiply?430:320)});
}
function handCard(id){return [...document.querySelectorAll('#hand .playing-card')].find(n=>n.dataset.cardId===id);}
// Capture a static presentation copy in stage coordinates; never retain an interactive control.
function snapshot(node){
 if(!node)return null;
 const stage=document.getElementById('stage'),rect=node.getBoundingClientRect(),bounds=stage.getBoundingClientRect(),scale=bounds.width/stage.offsetWidth;
 const copy=node.cloneNode(true);copy.removeAttribute('id');copy.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));copy.setAttribute('aria-hidden','true');copy.tabIndex=-1;copy.disabled=true;
 Object.assign(copy.style,{position:'absolute',left:(rect.left-bounds.left)/scale+'px',top:(rect.top-bounds.top)/scale+'px',width:rect.width/scale+'px',height:rect.height/scale+'px',margin:'0',transform:'none',translate:'none',rotate:'none',scale:'none',transition:'none',pointerEvents:'none',zIndex:'90',visibility:'visible'});
 copy.classList.add('motion-copy');return copy;
}
export function prepareCardTransformation(ids,nextCards={}){
 const copies=ids.map(id=>({id,copy:snapshot(handCard(id))})).filter(row=>row.copy);
 return async()=>{
  if(reducedMotion())return;
  await Promise.all(copies.map(async({id,copy})=>{
   const target=handCard(id),nextCard=nextCards[id];if(!target&&!nextCard)return;const visibility=target?.style.visibility;if(target)target.style.visibility='hidden';document.getElementById('stage').append(copy);
   try{
    await cardMotion(copy,[{transform:'perspective(650px) rotateY(0deg)'},{transform:'perspective(650px) rotateY(90deg)'}],{duration:gameDuration(180),easing:'ease-in',fill:'forwards'});
    // The final pack choice clears the visible hand; its committed card still
    // supplies the new face, so the last transformation completes before removal.
    if(target){
     copy.innerHTML=target.innerHTML;copy.className=target.className+' motion-copy';
     for(const {name} of [...copy.attributes])if(name.startsWith('data-'))copy.removeAttribute(name);
     for(const {name,value} of target.attributes)if(name.startsWith('data-'))copy.setAttribute(name,value);
     copy.style.backgroundColor=getComputedStyle(target).backgroundColor;copy.style.color=getComputedStyle(target).color;
    }else{
     copy.innerHTML=cardMarkup(nextCard);copy.classList.remove('hidden-card','deck-back','selected');delete copy.dataset.deck;applyCardModifiers(copy,nextCard);copy.style.color=SUITS[nextCard.suit][1];
    }
    await cardMotion(copy,[{transform:'perspective(650px) rotateY(-90deg)'},{transform:'perspective(650px) rotateY(0deg)'}],{duration:gameDuration(230),easing:'cubic-bezier(.2,.8,.3,1)'});
   }finally{copy.remove();if(target)target.style.visibility=visibility;}
  }));
 };
}
export function shardFrames(index){
 const angle=index*2.3999632297,reach=45+(index%4)*23,x=Math.cos(angle)*reach,y=Math.sin(angle)*reach;
 return [{opacity:1,translate:'0 0',rotate:'0deg'},{opacity:1,translate:`${x*.55}px ${y-32}px`,rotate:`${index%2?-24:31}deg`,offset:.45},{opacity:0,translate:`${x}px ${y+100}px`,rotate:`${index*19-90}deg`}];
}
async function particles(copy,shatter){
 if(!copy||reducedMotion())return;
 const stage=document.getElementById('stage'),pieces=[];stage.append(copy);
 for(let i=0;i<12;i++){
  const fragment=copy.cloneNode(true);fragment.classList.add(shatter?'card-shard':'card-dust');
  const x=i%3*100/3,y=Math.floor(i/3)*25;
  fragment.style.clipPath=shatter?`polygon(${x}% ${y}%,${x+33.4}% ${y+3}%,${x+29}% ${y+25}%,${x}% ${y+22}%)`:`inset(${y}% ${100-x-33.4}% ${75-y}% ${x}%)`;
  if(!shatter)fragment.style.filter='sepia(.7) brightness(1.6)';stage.append(fragment);pieces.push(fragment);
 }
 copy.remove();
 try{await Promise.all(pieces.map((piece,i)=>cardMotion(piece,shatter?shardFrames(i):[{opacity:1,translate:'0 0',filter:'brightness(1)'},{opacity:.7,translate:`${i%2?1:-1*(i+5)}px -12px`,filter:'brightness(2)'},{opacity:0,translate:`${i%2?20:-20}px -55px`,filter:'brightness(2) blur(5px)',clipPath:'inset(100% 0 0 0)'}],{duration:gameDuration(shatter?560:470),delay:gameDuration(shatter?0:i*14),fill:'both'})));}
 finally{pieces.forEach(p=>p.remove());}
}
export async function shatterCard(node){
 if(!node)return;node.dataset.shattered='true';
 const copy=snapshot(node);node.style.visibility='hidden';await particles(copy,true);
}
export function prepareCardDissolve(ids){
 const copies=ids.map(id=>snapshot(handCard(id))).filter(Boolean);
 return ()=>Promise.all(copies.map(copy=>particles(copy,false)));
}
export async function dissolveCard(node){
 if(!node)return;
 const copy=snapshot(node);node.style.visibility='hidden';
 try{await particles(copy,false);}finally{node.remove();}
}
export function preparePackOpening(offerId){
 const wrap=[...document.querySelectorAll('[data-offer-id]')].find(n=>n.dataset.offerId===offerId&&n.dataset.kind==='booster');
 const copy=snapshot(wrap?.querySelector('.shop-card'));
 return async()=>{
  if(reducedMotion())return;
  const choices=[...document.querySelectorAll('#pack_screen .shop-card')],visibility=choices.map(n=>n.style.visibility);
  choices.forEach(n=>n.style.visibility='hidden');
  try{
   if(copy){
    const lid=copy.cloneNode(true);lid.classList.add('box-lid');lid.style.clipPath='inset(0 0 64% 0)';copy.style.clipPath='inset(36% 0 0 0)';document.getElementById('stage').append(copy,lid);
    try{await Promise.all([cardMotion(lid,[{translate:'0 0',rotate:'0deg',opacity:1},{translate:'-55px -115px',rotate:'-24deg',opacity:0}],{duration:gameDuration(350)}),cardMotion(copy,[{scale:'1',opacity:1},{scale:'1.08',opacity:1,offset:.25},{scale:'.85',opacity:0}],{duration:gameDuration(350)})]);}finally{copy.remove();lid.remove();}
   }
   await Promise.all(choices.map((node,i)=>{node.style.visibility=visibility[i];return cardMotion(node,[{opacity:0,translate:'0 45px',rotate:'-7deg',scale:'.8'},{opacity:1,translate:'0 -5px',rotate:'2deg',scale:'1.03',offset:.75},{opacity:1,translate:'0 0',rotate:'0deg',scale:'1'}],{duration:gameDuration(350),delay:gameDuration(i*75),fill:'backwards'});}));
  }finally{choices.forEach((n,i)=>n.style.visibility=visibility[i]);}
 };
}
