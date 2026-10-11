import catalogue from '../content/apk-shop-catalog.js';
import {createApkShopContext} from './apk-shop.js';

const originalJokers={joker_joker:'j_joker',joker_sly_joker:'j_sly',joker_clever_joker:'j_clever',joker_splash:'j_splash'};
const centres=new Map(catalogue.centres.map(c=>[c.key,c]));
export const APK_HAND_NAMES={high_card:'High Card',pair:'Pair',two_pair:'Two Pair',three_of_a_kind:'Three of a Kind',straight:'Straight',flush:'Flush',full_house:'Full House',four_of_a_kind:'Four of a Kind',straight_flush:'Straight Flush',five_of_a_kind:'Five of a Kind',flush_house:'Flush House',flush_five:'Flush Five'};

// Rebuild duplicate eligibility from actual areas, including unbought offers.
export function currentApkShopContext(state) {
 if(!state.apkShop || !state.rng?.apk)throw new TypeError('Missing APK shop state');
 const ownedCentreIds=[...state.jokers,...(state.consumables??[])].map(j=>originalJokers[j.entityId]??j.entityId);
 const offers=state.shop?[...state.shop.main,...state.shop.vouchers,...state.shop.boosters]:[];
 const identities=[...ownedCentreIds,...offers.map(o=>o.originalKey??o.entityId)];
 if(identities.some(id=>!centres.has(id)))throw new TypeError('Unsupported centre identity');
 const names=new Set(identities.map(id=>centres.get(id).name));
 const usedCentreIds=catalogue.centres.filter(c=>names.has(c.name)).map(c=>c.key);
 const enhancementIds=[...new Set(Object.values(state.cards??{}).map(card=>({mult:'m_mult',bonus:'m_bonus',lucky:'m_lucky',wild:'m_wild'})[card.enhancement]).filter(Boolean))];
 return createApkShopContext({...state.apkShop.context,ante:state.round.ante+(['shop','pack'].includes(state.phase)&&state.round.blindId==='boss'?1:0),ownedCentreIds,usedCentreIds,enhancementIds,
  shopVoucherIds:state.shop?.vouchers.map(o=>o.originalKey??o.entityId)??[]});
}



