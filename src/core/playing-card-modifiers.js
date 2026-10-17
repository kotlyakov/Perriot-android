export const EFFECT_MECHANISM_JOKERS=Object.freeze(['j_mime','j_pareidolia','j_blueprint','j_brainstorm','j_selzer','j_dna','j_marble']);
export function validPlayingCardModifiers(card){return (card.edition===undefined||['base','foil','holographic','polychrome'].includes(card.edition))&&(card.seal===undefined||['red','gold','blue','purple'].includes(card.seal));}
export function hasEffectMechanisms(state){return state.jokers?.some(j=>EFFECT_MECHANISM_JOKERS.includes(j.entityId))||Object.values(state.cards??{}).some(c=>c.seal!==undefined||c.edition!==undefined&&c.edition!=='base');}
