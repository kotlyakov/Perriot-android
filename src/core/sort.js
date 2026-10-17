export const SORT_MODES=['rank','suit'];
export function sortHand(state,mode=state.sortMode){
 if(!SORT_MODES.includes(mode))return;
 const suits=['spades','hearts','clubs','diamonds'];
 state.hand.sort((a,b)=>{const ca=state.cards[a],cb=state.cards[b],stone=Number(ca.enhancement==='stone')-Number(cb.enhancement==='stone'),s=suits.indexOf(ca.suit)-suits.indexOf(cb.suit),r=cb.rank-ca.rank;return stone||(mode==='rank'?(r||s):(s||r));});
}

