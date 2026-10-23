// APK reference: Card:set_cost. Pure quotation; purchases never mutate here.
function integer(value,name,min=0n,max=null) {
  if(typeof value!=='bigint')throw new TypeError(`${name} must be bigint`);
  if(value<min || max!==null && value>max)throw new RangeError(`Invalid ${name}`);
  return value;
}

export function quoteShopCard({baseCost,inflation=0n,discountPercent=0n,
  edition={},set='',name='',boosterAnteScaling=false,ante=1n,
  tutorialShopSurcharge=false,astronomer=false,rental=false,
  extraValue=0n,couponed=false,area=''}={}) {
  integer(baseCost,'baseCost');integer(inflation,'inflation');
  integer(discountPercent,'discountPercent',0n,100n);
  integer(ante,'ante',-1n);integer(extraValue,'extraValue');
  let extra=inflation;
  for(const [id,amount] of [['foil',2n],['holo',3n],['polychrome',5n],['negative',5n]])
    if(edition[id])extra+=amount;
  // Exact floor of (base + extra + 0.5) * (100 - discount) / 100.
  let cost=((baseCost+extra)*2n+1n)*(100n-discountPercent)/200n;
  if(cost<1n)cost=1n;
  if(set==='Booster') {
    if(boosterAnteScaling)cost+=ante-1n;
    if(tutorialShopSurcharge)cost+=3n;
  }
  if(astronomer && (set==='Planet' || set==='Booster' && name.includes('Celestial')))cost=0n;
  if(rental)cost=1n;
  const half=cost/2n;
  const sellCost=(half<1n?1n:half)+extraValue;
  if(couponed && ['shop_jokers','shop_booster'].includes(area))cost=0n;
  return {cost,sellCost};
}

export function canAfford(money,cost,bankruptAt=0n) {
  if(typeof money!=='bigint' || typeof bankruptAt!=='bigint')throw new TypeError('Balances must be bigint');
  integer(cost,'cost');
  return cost===0n || money-bankruptAt>=cost;
}
