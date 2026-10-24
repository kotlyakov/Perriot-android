// Original Pierrot colour-print vocabulary. Local coordinates, flat inks, no external art.
export const P='#fff1d6', I='#20213f', R='#f04452', B='#3285ed', G='#ffc34a', S='#a9c9de';
export const V='#9460d5', T='#24bdba', O='#ff873f', Y='#ffe15c', L='#82cb63', K='#ec72af';
export const group=(x,y,s,body,angle=0)=>`<g transform="translate(${x} ${y}) rotate(${angle}) scale(${s})">${body}</g>`;
export const path=(d,fill='none',stroke=I,w=2)=>`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
export const rect=(x,y,w,h,fill=P,r=2,stroke=I,sw=2)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
export const circle=(x,y,r,fill=P,stroke=I,w=2)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${w}"/>`;
export const ellipse=(x,y,rx,ry,fill=P,stroke=I,w=2)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${w}"/>`;
export const line=(x1,y1,x2,y2,c=I,w=2)=>path(`M${x1} ${y1}L${x2} ${y2}`,'none',c,w);
export const text=(x,y,value,size=12,c=I)=>`<text x="${x}" y="${y}" fill="${c}" font-family="Georgia,serif" font-weight="bold" font-size="${size}" text-anchor="middle">${value}</text>`;
export function hatch(x,y,w,h,n=5,c=I){return Array.from({length:n},(_,i)=>line(x+w*i/n,y+h,x+w*(i+1)/n,y,c,.7)).join('');}
export function rays(x,y,r=21,n=8,c=G){return Array.from({length:n},(_,i)=>{const a=i*Math.PI*2/n;return line(x+Math.cos(a)*r,y+Math.sin(a)*r,x+Math.cos(a)*(r+5),y+Math.sin(a)*(r+5),c,1.4)}).join('');}
export const spark=(x,y,s=1,c=R)=>group(x,y,s,path('M0 -17L4 -5L15 -8L8 1L16 8L5 8L1 20L-4 7L-15 9L-8 0L-13 -8L-3 -5Z',c)+path('M0 -9L1 1L-3 7','none',P,1));
export const star=(x,y,s=1,c=R)=>group(x,y,s,path('M0 -23L6 -7L23 -7L10 3L15 20L0 10L-15 20L-10 3L-23 -7L-6 -7Z',c));
export function suit(kind,x,y,s=1,c){const red=kind==='h'||kind==='d';const color=c||(red?R:I);const forms={h:'M0 12C-5 6 -16 -1 -12 -9C-9 -15 -2 -14 0 -8C2 -14 9 -15 12 -9C16 -1 5 6 0 12Z',d:'M0 -16L12 0L0 16L-12 0Z',s:'M0 -16C-4 -9 -15 -4 -12 4C-10 10 -3 8 0 5L-4 15L4 15L0 5C3 8 10 10 12 4C15 -4 4 -9 0 -16Z',c:'M-3 5C-14 12 -19 -3 -8 -5C-16 -17 4 -22 5 -10C18 -12 20 5 9 7L2 4L6 15L-4 15L0 5Z'};return group(x,y,s,path(forms[kind]||forms.s,color,color,1.2)+path('M-5 -4L-2 -8','none',P,.8));}
export function card(x,y,rank='A',kind='s',s=1,angle=0,fill=P){return group(x,y,s,rect(-13,-20,26,40,fill,2)+rect(-10,-17,20,34,'none',1,I,.6)+text(-7,-9,rank,7,kind==='h'||kind==='d'?R:I)+suit(kind,0,3,.47)+line(6,15,9,12,I,.6),angle);}
export function cards(x,y,ranks=['A','A'],kind='s',s=.8,gap=22){return ranks.map((r,i)=>card(x+i*gap,y,r,kind,s)).join('');}
export function coin(x,y,s=1){return group(x,y,s,circle(0,0,10,G)+circle(0,0,6,'none',P,1)+path('M-2 -5L2 -5L-1 0L3 0L-2 5','none',I,1.5)+path('M-7 3L-5 6','none',P,1));}
export function chips(x,y,n=3,s=1){return group(x,y,s,Array.from({length:n},(_,i)=>{const yy=-i*5;return path(`M-13 ${yy-3}V${yy+2}Q0 ${yy+8} 13 ${yy+2}V${yy-3}`,B)+ellipse(0,yy-3,13,4,B)+line(-7,yy,-7,yy+3,P,.9)+line(5,yy+1,5,yy+4,P,.9)}).join(''));}
export function token(x,y,s=1,c=B){return group(x,y,s,circle(0,0,12,c)+circle(0,0,8,'none',P,.8)+path('M-4 -4H5L2 -7M5 -4V3L1 5H-5L-2 8','none',P,1.6));}
export const flame=(x,y,s=1)=>group(x,y,s,path('M0 21C-24 18 -22 0 -13 -9C-12 0 -6 0 -5 -9L2 -26C5 -12 17 -9 12 1C20 -2 22 -9 21 -11C31 5 20 25 0 21Z',R)+path('M-1 17C-13 12 -7 1 0 -6C-1 3 11 7 6 16Z',G,I,1.3)+path('M-14 4L-12 11M14 5L12 12','none',P,1));
export const crown=(x,y,s=1,c=G)=>group(x,y,s,path('M-17 -8L-13 9H13L17 -8L7 -2L0 -14L-7 -2Z',c)+rect(-13,9,26,5,c,1)+circle(-17,-9,2,c)+circle(0,-15,2,c)+circle(17,-9,2,c)+path('M-7 3L-5 7M5 3L7 7','none',P,1));
export function face(x,y,s=1,role='K',color=G){return group(x,y,s,path('M-15 25Q-15 10 -7 10H7Q15 10 15 25Z',color)+path('M-8 -9Q-12 2 -6 9Q0 16 6 9Q12 2 8 -9Z',P)+path('M-10 -4Q-14 -15 -4 -17Q10 -19 11 -5L5 -9L-4 -5Z',I)+line(-5,0,-3,0)+line(3,0,5,0)+path('M-3 7Q0 9 3 7','none',I,1)+path('M-9 12L0 21L9 12M-6 19L-7 24M6 19L7 24','none',I,1)+ (role==='J'?path('M-13 -13L-11 -24L0 -19L10 -23L14 -12Z',R):crown(0,-19,.65,color))+text(0,33,role,8));}
export function portrait(x,y,s=1,rank='K',color=B){return group(x,y,s,rect(-17,-30,34,61,color,2)+rect(-14,-27,28,55,P,1)+face(0,-3,.77,rank,rank==='Q'?R:G));}
export const mask=(x,y,s=1,c=P)=>group(x,y,s,path('M-19 -20Q0 -27 19 -20L16 7Q11 23 0 27Q-11 23 -16 7Z',c)+path('M-15 -10Q-9 -15 -4 -10M4 -10Q9 -15 15 -10','none',I,2)+ellipse(-9,-5,3,2,I)+ellipse(9,-5,3,2,I)+path('M0 -6L-3 6H2M-7 15Q0 9 7 15','none',I,1.5)+path('M-13 1L-11 7M11 1L9 7','none',R,1.2));
export const palm=(x,y,s=1)=>group(x,y,s,path('M-25 18L-13 8L-18 -1Q-19 -7 -14 -6L-2 3L16 -3Q24 -5 25 0L8 8L22 4Q28 5 24 10L9 18L-4 23L-15 31Z',P)+path('M-10 11L0 14L11 8M-14 16L-5 20','none',I,1));
export const basket=(x,y,s=1,closed=false)=>group(x,y,s,path('M-20 -15L-14 20H14L20 -15Z',S)+ellipse(0,-15,21,6,closed?S:P)+path('M-12 -8L-8 14M0 -8V15M12 -8L8 14','none',I,1.2)+path('M-14 7H14','none',P,1)+ (closed?rect(-23,-20,46,7,I,1):''));
export const arrow=(d,c=R,w=3)=>path(d,'none',c,w);
export const arrowHead=(x,y,angle=0,c=R)=>group(x,y,1,path('M-5 -5L3 0L-5 5',c,c,1),angle);
export const ground=(y=115)=>path(`M13 ${y}Q45 ${y-3} 103 ${y}`,'none',I,1)+hatch(22,y+1,74,4,13,I);
export const seal=(x,y,s=1,c=R)=>group(x,y,s,path('M0 -26L6 -22L13 -23L17 -17L24 -13L23 -5L28 0L23 7L24 15L16 18L12 25L4 23L-2 27L-8 22L-16 23L-19 16L-26 11L-23 3L-27 -4L-21 -10L-21 -18L-13 -20L-7 -26Z',c)+circle(0,0,19,'none',P,1.2));
export const tarot=(x,y,s=1,angle=0)=>group(x,y,s,rect(-15,-25,30,50,B,2)+rect(-11,-21,22,42,P,1)+star(0,-4,.4,G)+path('M-8 13Q0 1 8 13L0 18Z',I)+circle(0,-4,4,P),angle);
export const box=(x,y,s=1,open=false)=>group(x,y,s,path('M-22 -7L0 -15L22 -7L20 20L0 28L-20 20Z',G)+path('M0 0V28M-21 -7L0 0L21 -7','none',I,2)+hatch(-17,5,12,14,4)+ (open?path('M-22 -7L-29 -23L-5 -29L0 -15M22 -7L29 -22L5 -28L0 -15',P):path('M-22 -7L0 -15L22 -7L0 0Z',P))+path('M-4 -12L-4 23M4 -12L4 23','none',R,3));
export const press=(x,y,s=1)=>group(x,y,s,rect(-27,-29,54,8,S,1)+rect(-23,-21,7,45,I,1)+rect(16,-21,7,45,I,1)+rect(-30,24,60,9,S,1)+rect(-19,4,38,9,S,1)+path('M0 -21V-4M-15 -9H15M0 -4L-6 3H6Z',S)+circle(0,-13,3,G)+hatch(-25,26,50,4,9));
export const gear=(x,y,s=1)=>group(x,y,s,path('M-7 -25H7L9 -18L16 -15L22 -17L29 -5L23 0L23 8L28 12L21 24L14 21L7 25L5 31H-9L-10 24L-17 21L-23 24L-30 12L-24 7L-24 -1L-29 -6L-22 -18L-16 -15L-9 -18Z',S)+circle(0,3,15,I)+circle(0,3,8,P)+path('M-5 -21L5 -21M18 -9L21 -4M-21 12L-18 17','none',P,1));
export const banana=(x,y,s=1,angle=0)=>group(x,y,s,path('M-24 -24C-28 7 -11 32 10 27C26 23 33 4 28 -14L22 -18C22 1 12 15 0 9C-12 4 -16 -6 -17 -24Z',G)+path('M-19 -18C-21 9 -7 26 9 22C20 20 26 8 26 -6M-24 -24L-24 -29L-17 -29L-17 -24','none',I,2)+path('M-12 3Q-4 15 6 15','none',P,1.4),angle);
export const die=(x,y,s=1,angle=0)=>group(x,y,s,rect(-17,-17,34,34,P,4)+[[ -9,-9],[9,-9],[-9,0],[9,0],[-9,9],[9,9]].map(([a,b])=>circle(a,b,2.2,I,I,.4)).join('')+path('M-12 -13H10M13 -10V10','none',G,1),angle);
export function person(x,y,s=1,pose='run',color=R){return group(x,y,s,circle(0,-20,6,P)+path('M-4 -13L7 -7L1 6L-11 0Z',color)+ (pose==='run'?path('M-5 -10L-17 -7L-23 -16M5 -9L15 -19L23 -17M-7 2L-18 16L-31 16M0 5L12 15L10 29','none',I,4):path('M-5 -9L-19 -20L-30 -15M5 -8L18 -23L28 -19M-6 3L-15 18L-10 27M0 6L14 11L29 9','none',I,4))+path('M-1 -24L4 -23M-9 -5L0 -2','none',I,1));}
export const price=(x,y,value='0',s=1)=>group(x,y,s,path('M-13 -11H8L17 0L8 11H-13Z',P)+circle(9,0,2,I)+text(-3,5,value,12));
export const crownBroken=(x,y,s=1)=>group(x,y,s,path('M-19 -5L-13 10L-2 8L-5 1L-1 -6L-8 -12L-10 -3Z',G)+path('M3 9L14 10L19 -9L9 -3L4 -10L7 -1Z',G)+path('M-2 -10L2 -17M4 17L8 20','none',R,1.5));
