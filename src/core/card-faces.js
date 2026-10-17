// Native is_face queries rank before the global Pareidolia predicate. Callers
// supplying a rank getter retain Stone's chronological raw random draw.
export function isCardFace(card,jokers=[],{debuffed=card.debuffed===true,rankGetter}={}){
 if(debuffed)return false;
 const rank=rankGetter?rankGetter(card):card.enhancement==='stone'?-1:card.rank;
 return rank===11||rank===12||rank===13||jokers.some(joker=>joker.entityId==='j_pareidolia'&&!joker.debuffed);
}
