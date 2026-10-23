// Challenge physical card patterns from the 1.0.1n native challenge deck.
export function applyChallengeDeck(state,pattern){
 if(!pattern)return;
 if(pattern==='double_faces'){
  const ranks=[4,5,6,7,8,9,10,11,12,13,11,12,13];
  for(const suit of ['clubs','diamonds','hearts','spades'])
   for(let rank=2;rank<=14;rank++)state.cards[`card_${suit}_${rank}`].rank=ranks[rank-2];
 }else if(pattern==='ranks_2_to_9'){
  state.destroyedCardIds=Object.keys(state.cards).filter(id=>state.cards[id].rank>9);
  for(const id of state.destroyedCardIds)delete state.cards[id];
  state.startingDeckSize=32;
 }else if(pattern==='face_stone'){
  for(const card of Object.values(state.cards))if(card.rank>=11&&card.rank<=13)card.enhancement='stone';
 }else if(pattern==='red_seals'){
  for(const card of Object.values(state.cards))card.seal='red';
 }else if(pattern==='glass'){
  for(const card of Object.values(state.cards))card.enhancement='glass';
 }else throw new TypeError('Unsupported challenge deck');
 state.drawPile=Object.keys(state.cards);
}
