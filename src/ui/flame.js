export function logBigInt(value){if(value<=0n)return -Infinity;const s=value.toString(),n=Math.min(15,s.length);return Math.log10(Number(s.slice(0,n)))+s.length-n;}
export function flameHeight(score,target){if(!(score>target) || target<=0n)return 0;const log=logBigInt(score)-logBigInt(target);return 10+52*log/(log+2);}
let height=0,canvas=null,running=false;
// Pause GPU/CPU work when the page is backgrounded; resume only if flame is visible.
if(typeof document!=='undefined')document.addEventListener('visibilitychange',()=>{
 if(!document.hidden && height && !running){running=true;requestAnimationFrame(draw);}
});
export function showFlame(score,target){height=flameHeight(score,target);if(!canvas){canvas=document.createElement('canvas');canvas.id='score_flame';canvas.width=274;canvas.height=68;document.getElementById('calculation_panel').prepend(canvas);}canvas.hidden=!height;canvas.dataset.height=String(height);if(height && !running && !document.hidden){running=true;requestAnimationFrame(draw);}}

// Separate, clipped fire beds keep the multiplication sign clear.
const beds=[{left:3,right:114,seed:19,outer:'#039fea',middle:'#35c9ff',core:'#e5fcff'},
 {left:147,right:258,seed:73,outer:'#f24b3d',middle:'#ffad29',core:'#fff3aa'}];
function noise(seed){const x=Math.sin(seed*127.1+311.7)*43758.5453;return x-Math.floor(x);}
function contour(bed,time){
 const span=bed.right-bed.left,plumes=[];
 // Every plume is born, narrows, rises and disappears on its own schedule.
 // No fixed positions or repeated silhouette: overlapping plumes form one edge.
 for(let i=0;i<7;i++){
   const speed=.62+noise(bed.seed+i)*.65,clock=time*speed+noise(i+bed.seed*3)*8;
   const cycle=Math.floor(clock),age=clock-cycle,seed=bed.seed+i*37+cycle*113;
   const life=Math.sin(Math.PI*age),rise=Math.sin(Math.PI*Math.min(1,age*1.18));
   plumes.push({x:span*(.05+.9*noise(seed))+(age-.5)*(noise(seed+1)-.5)*22,
     width:3+noise(seed+2)*9+(1-age)*8,
     strength:(.4+.57*noise(seed+3))*life*rise,
     curl:Math.sin(time*1.4+i)*height*.08});
 }
 const points=[];
 for(let x=0;x<=span;x+=2){
   let crest=.025;
   for(const p of plumes){const dx=(x-p.x-p.curl)/p.width;crest+=p.strength*Math.exp(-Math.pow(Math.abs(dx),1.35)*1.4);}
   const edge=Math.min(1,x/7,(span-x)/7);
   const ripple=.025*Math.sin(x*.4-time*5)+.02*Math.sin(x*.19+time*3.8);
   points.push({x:bed.left+x,y:67-height*Math.max(.015,Math.min(1,(1-Math.exp(-crest*2.5)+ripple)*edge))});
 }
 return points;
}
function fillContour(ctx,points,bed,scale,shift,color,alpha){
 const gradient=ctx.createLinearGradient(0,67-height*scale,0,67);
 gradient.addColorStop(0,color+'70');gradient.addColorStop(.35,color+'d0');
 // Hot layers fade before the join; the opaque root is the score box colour.
 if(scale===1){gradient.addColorStop(Math.max(.35,1-10/Math.max(height,10)),color);gradient.addColorStop(1,color);}
 else {gradient.addColorStop(Math.max(.35,1-10/Math.max(height*scale,10)),color+'00');gradient.addColorStop(1,color+'00');}
 ctx.fillStyle=gradient;ctx.globalAlpha=alpha;ctx.beginPath();ctx.moveTo(bed.left,67);
 const adjusted=points.map(p=>({x:p.x+shift*(67-p.y)/Math.max(height,1),y:67-(67-p.y)*scale}));
 for(let i=0;i<adjusted.length-1;i++){
   const p=adjusted[i],next=adjusted[i+1];ctx.quadraticCurveTo(p.x,p.y,(p.x+next.x)/2,(p.y+next.y)/2);
 }
 ctx.lineTo(bed.right,67);ctx.closePath();ctx.fill();ctx.globalAlpha=1;
}
function risingWisps(ctx,bed,time){
 for(let i=0;i<4;i++){
   const clock=time*(.55+noise(bed.seed+i+91)*.6)+i*.37,age=clock-Math.floor(clock);
   const seed=bed.seed+i*41+Math.floor(clock)*151,life=Math.sin(Math.PI*age);
   const h=height*(.6+.4*noise(seed+5))*Math.sqrt(life),x=bed.left+8+noise(seed)*(bed.right-bed.left-16);
   const w=(3+noise(seed+1)*7)*(1-age*.5),wind=(noise(seed+2)-.5)*20+Math.sin(time*1.8+i)*5;
   for(const [scale,width,color,alpha] of [[1,1,bed.outer,.9],[.96,.68,bed.middle,.8],[.85,.22,bed.core,.72]]){
     const tip=x+wind,y=67-h*scale,spread=w*width;
     const g=ctx.createLinearGradient(0,y,0,67);g.addColorStop(0,color+'60');g.addColorStop(.22,color);g.addColorStop(.78,color+'00');g.addColorStop(1,color+'00');
     ctx.fillStyle=g;ctx.globalAlpha=alpha;ctx.beginPath();ctx.moveTo(x-spread,67);
     ctx.bezierCurveTo(x+wind*.2-spread,67-h*.35,tip-spread*.7,y+h*.34,tip,y);
     ctx.bezierCurveTo(tip+spread*.12,y+h*.2,x-wind*.25+spread,67-h*.45,x+spread,67);
     ctx.closePath();ctx.fill();
   }
 }
 ctx.globalAlpha=1;
}
function drawBed(ctx,bed,time){
 ctx.save();ctx.beginPath();ctx.rect(bed.left,5,bed.right-bed.left,62);ctx.clip();
 const points=contour(bed,time),middle=contour({...bed,seed:bed.seed+101},time-.14),hot=contour({...bed,seed:bed.seed+211},time-.3),sway=Math.sin(time*1.3+bed.seed)*2;
 // Soft colour boundaries rather than five identical outlined ornaments.
 ctx.filter='blur(.7px)';fillContour(ctx,points,bed,1,0,bed.outer,1);
 ctx.filter='blur(.45px)';fillContour(ctx,middle,bed,.72,sway,bed.middle,.8);
 ctx.filter='blur(.65px)';fillContour(ctx,hot,bed,.45,-sway,bed.core,.5+.32*height/62);
 ctx.filter='blur(.35px)';risingWisps(ctx,bed,time);ctx.filter='none';
 // Recolour only existing flame pixels: every tongue merges into the box root.
 ctx.globalCompositeOperation='source-atop';
 const root=ctx.createLinearGradient(0,45,0,58);root.addColorStop(0,bed.outer+'00');root.addColorStop(1,bed.outer);
 ctx.fillStyle=root;ctx.fillRect(bed.left,45,bed.right-bed.left,22);ctx.restore();
}
function draw(time){
 if(!height || document.hidden || !canvas.isConnected || canvas.hidden){running=false;return;}
 const ctx=canvas.getContext('2d');ctx.clearRect(0,0,274,68);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,t=reduced?1.3:time/1000;
 for(const bed of beds)drawBed(ctx,bed,t);
 if(!reduced)requestAnimationFrame(draw);else running=false;
}
