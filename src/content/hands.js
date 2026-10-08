// RULE-HAND/LEVEL: docs/rules/poker-hands.md (1.0.1o-FULL indexed baseline).
export const HANDS = Object.freeze(Object.fromEntries([
  ['high_card',5,1,10,1], ['pair',10,2,15,1], ['two_pair',20,2,20,1],
  ['three_of_a_kind',30,3,20,2], ['straight',30,4,30,3], ['flush',35,4,15,2],
  ['full_house',40,4,25,2], ['four_of_a_kind',60,7,30,3], ['straight_flush',100,8,40,4],
  ['five_of_a_kind',120,12,35,3], ['flush_house',140,14,40,4], ['flush_five',160,16,50,3],
].map(([id,chips,mult,chipGain,multGain])=>[id,Object.freeze({chips,mult,chipGain,multGain})])));
