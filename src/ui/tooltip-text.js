// Only signed score effects receive emphasis: ranks, money and counts stay plain.
export function formatTooltipText(value){
 const text=String(value),parts=[];
 const amounts=/[+−-]\d+(?:[.,]\d+)?(?=\s+(?:к\s+множителю|множител[ьяю]|Mult\b|очк[а-яё]*|фиш[а-яё]*|chips\b))|×\d+(?:[.,]\d+)?/giu;
 let start=0;
 for(const match of text.matchAll(amounts)){
  if(match.index>start)parts.push({text:text.slice(start,match.index)});
  const following=text.slice(match.index+match[0].length);
  const kind=match[0][0]==='×'||/^\s+(?:к\s+множителю|множител[ьяю]|Mult\b)/iu.test(following)?'mult':'chips';
  parts.push({text:match[0],kind});start=match.index+match[0].length;
 }
 if(start<text.length)parts.push({text:text.slice(start)});
 return parts;
}

export function appendTooltipContents(container,title,descriptions){
 const doc=container.ownerDocument,heading=doc.createElement('strong');
 heading.className='tooltip-title';
 if(typeof title==='string')heading.textContent=title;else heading.append(title);
 container.append(heading);
 for(const description of descriptions){
  const paragraph=doc.createElement('p');
  for(const part of formatTooltipText(description)){
   if(!part.kind){paragraph.append(doc.createTextNode(part.text));continue;}
   const amount=doc.createElement('strong');amount.className='tooltip-effect tooltip-'+part.kind;amount.textContent=part.text;paragraph.append(amount);
  }
  container.append(paragraph);
 }
 return container;
}
