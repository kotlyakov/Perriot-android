// This is the implemented slice, not the complete joker catalog.
export const SUPPORTED_JOKERS = Object.freeze(['joker_joker','joker_sly_joker','joker_clever_joker','joker_splash']);

export function independentEffect(entityId, rankCounts) {
  switch (entityId) {
    case 'joker_joker': return {operation:'add_mult',amount:4n};
    case 'joker_sly_joker': return rankCounts.some(n=>n>=2) ? {operation:'add_chips',amount:50n} : null;
    case 'joker_clever_joker': return rankCounts.filter(n=>n>=2).length>=2 ? {operation:'add_chips',amount:80n} : null;
    case 'joker_splash': return null; // Passive scoring selection, handled before chips.
    default: throw new Error('Unsupported joker');
  }
}
