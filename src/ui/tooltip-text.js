import {suitSvg} from './card-art.js';
// Score effects and money use semantic colours; level increments stay neutral.
// Ranks and ordinary counts stay plain.
export function formatTooltipText(value){
 const text=String(value),parts=[];
 const amounts=/[+−-]?\$\d+(?:[.,]\d+)?|[+−-]?\d+(?:[.,]\d+)?(?=(?:\s+до\s+[+−-]?\d+(?:[.,]\d+)?)?\s+(?:к\s+множителю|множител[ьяю]|Mult\b|очк[а-яё]*|фиш[а-яё]*|chips\b))|×\d+(?:[.,]\d+)?|(?<=уровень[^.!?]*на\s+)(?<level>[+−-]\d+(?:[.,]\d+)?)/giu;
 let start=0;
 for(const match of text.matchAll(amounts)){
  if(match.index>start)parts.push({text:text.slice(start,match.index)});
  const following=text.slice(match.index+match[0].length).replace(/^\s+до\s+[+−-]?\d+(?:[.,]\d+)?/u,'');
  const kind=match.groups?.level?'level':match[0].includes('$')?'money':/^\s+(?:очк[а-яё]*|фиш[а-яё]*|chips\b)/iu.test(following)?'chips':'mult';
  parts.push({text:match[0],kind});start=match.index+match[0].length;
 }
 if(start<text.length)parts.push({text:text.slice(start)});
 return parts.flatMap(part=>{
  if(part.kind)return [part];
  const words=/(?<![а-яёa-z])(?:черв(?:а|ы|ей|ям|ями|ях|овой|овые|овую|овых)|буб(?:на|ны|ен|нам|нами|нах|новой|новые|новую|новых)|пик(?:а|и|ам|ами|ах|овой|овые|овую|овых)|треф(?:а|ы|ам|ами|ах|овой|овые|овую|овых))(?![а-яёa-z])/giu;
  const result=[];let offset=0;
  for(const match of part.text.matchAll(words)){
   if(match.index>offset)result.push({text:part.text.slice(offset,match.index)});
   const word=match[0].toLowerCase(),suit=word.startsWith('черв')?'hearts':word.startsWith('буб')?'diamonds':word.startsWith('пик')?'spades':'clubs';
   result.push({text:match[0],suit});offset=match.index+match[0].length;
  }
  if(offset<part.text.length)result.push({text:part.text.slice(offset)});
  return result;
 });
}

export function appendTooltipText(container,value){
 const doc=container.ownerDocument??globalThis.document;
 for(const part of formatTooltipText(value)){
  const node=doc.createElement(part.kind?'strong':'span');
  if(part.suit){node.className='tooltip-suit tooltip-suit-'+part.suit;node.setAttribute('role','img');node.setAttribute('aria-label',part.text);node.innerHTML=suitSvg(part.suit);}
  else {node.textContent=part.text;if(part.kind)node.className='tooltip-effect tooltip-'+part.kind+(part.text.startsWith('×')?' tooltip-times':'');}
  container.append(node);
 }
 return container;
}
export function appendTooltipContents(container,title,descriptions){
 const doc=container.ownerDocument,heading=doc.createElement('strong');
 heading.className='tooltip-title';
 if(typeof title==='string')heading.textContent=title;else heading.append(title);
 container.append(heading);
 for(const description of descriptions){const paragraph=doc.createElement('p');appendTooltipText(paragraph,description);container.append(paragraph);}
 return container;
}
