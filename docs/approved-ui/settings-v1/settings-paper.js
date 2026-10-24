// Only settings content changes; the window frame and tabs keep their position.
export async function animateSettingsPaper(body,leaving=false){
 if(!body.animate||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 body.classList.add('settings-paper');
 body.classList.toggle('settings-paper-burning',leaving);
 body.classList.toggle('settings-paper-unfolding',!leaving);
 const keyframes=leaving?[
  {opacity:1,filter:'sepia(0) brightness(1) blur(0px)','--paper-burn':'0%',transform:'translateY(0)'},
  {opacity:1,filter:'sepia(.85) brightness(1.55) blur(.3px)','--paper-burn':'22%',transform:'translateY(-2px)',offset:.35},
  {opacity:.7,filter:'sepia(1) brightness(.65) blur(1px)','--paper-burn':'67%',transform:'translateY(-8px)',offset:.75},
  {opacity:0,filter:'sepia(1) brightness(.4) blur(3px)','--paper-burn':'150%',transform:'translateY(-18px)'}
 ]:[
  {opacity:0,transform:'perspective(850px) rotateX(68deg) rotateZ(-13deg) skew(18deg,-12deg) scale(.12,.07)',filter:'brightness(.5)',clipPath:'polygon(20% 36%,48% 16%,82% 34%,67% 62%,84% 84%,42% 72%,13% 85%,29% 55%)'},
  {opacity:1,transform:'perspective(850px) rotateX(-24deg) rotateZ(5deg) skew(-8deg,4deg) scale(.62,.42)',filter:'brightness(.82)',clipPath:'polygon(4% 10%,49% 0,96% 9%,100% 55%,95% 96%,48% 100%,2% 93%,0 45%)',offset:.42},
  {opacity:1,transform:'perspective(850px) rotateX(8deg) rotateZ(-1deg) skew(2deg,0deg) scale(1.025,.96)',filter:'brightness(1.12)',clipPath:'polygon(0 0,50% 0,100% 0,100% 50%,100% 100%,50% 100%,0 100%,0 50%)',offset:.76},
  {opacity:1,transform:'perspective(850px) rotateX(0) rotateZ(0) skew(0,0) scale(1)',filter:'brightness(1)',clipPath:'polygon(0 0,50% 0,100% 0,100% 50%,100% 100%,50% 100%,0 100%,0 50%)'}
 ];
 const animation=body.animate(keyframes,{duration:leaving?116:152,easing:leaving?'ease-in':'cubic-bezier(.2,.65,.25,1)',fill:'both'});
 try{await animation.finished;}catch{}finally{animation.cancel();body.classList.remove('settings-paper-burning','settings-paper-unfolding');}
}
