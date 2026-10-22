import {DECKS} from '../content/decks.js';
import {canonicalCards} from './apk-deck.js';
import {session,createApkShopContext} from './apk-shop.js';
import {syncVoucherShopContext} from './vouchers.js';
import {stampJokerCreationOrdinals} from './shop.js';

// Erratic samples complete prototypes with replacement, then sorts fronts before
// assigning immutable physical IDs. Future face changes never reorder identities.
export function prepareStartingDeck(state,rng){
 if(state.deckId==='abandoned'){
  state.destroyedCardIds=Object.keys(state.cards).filter(id=>state.cards[id].rank>=11&&state.cards[id].rank<=13);
  for(const id of state.destroyedCardIds)delete state.cards[id];
  state.startingDeckSize=40;
 }
 if(state.deckId==='erratic'){
  const ids=canonicalCards(state.cards),s=session(rng,createApkShopContext());
  const fronts=ids.map(()=>s.element(ids,'erratic')).sort((a,b)=>ids.indexOf(a)-ids.indexOf(b));
  const original=structuredClone(state.cards);
  ids.forEach((id,index)=>{state.cards[id]={...original[fronts[index]],id};});
  rng=s.rng;
 }
 state.drawPile=Object.keys(state.cards);return rng;
}

// Queued Back callbacks run after initial creation/shuffle; no purchase or
// consumable-use statistics are recorded for the initial vouchers and cards.
export function finishStartingDeck(state){
 if(state.deckId==='checkered')for(const card of Object.values(state.cards))card.suit=({clubs:'spades',diamonds:'hearts'})[card.suit]??card.suit;
 if(state.apkShop){
  syncVoucherShopContext(state);
  if(state.deckId==='ghost')state.apkShop.context.rates.Spectral=2;
  if(DECKS[state.deckId].consumables){
   const s=session(state.rng.apk,state.apkShop.context);
   state.consumables=DECKS[state.deckId].consumables.map((key,index)=>s.construct(key,`deck_${index+1}`,{materialize:true}));
   state.rng.apk=s.rng;stampJokerCreationOrdinals(state,state.consumables);
  }
 }
}
