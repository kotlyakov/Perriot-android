// UI-NORMAL-ANDROID19: source1536x688, manual bounds ±5px; not parity acceptance.
export const LAYOUT={
 hud:[150,0,292,688],blind_panel:[157,30,274,202],blind_title:[165,30,266,45],blind_token:[174,117,81,84],blind_target:[260,114,161,85],
 round_score:[157,236,274,56],calculation_panel:[157,295,274,135],chips:[164,362,111,57],times:[275,362,33,57],mult:[308,362,111,57],
 run_info:[157,446,122,96],options:[157,552,122,98],hands:[286,445,66,61],discards:[360,445,68,61],money:[286,518,142,62],ante:[286,592,66,63],round:[360,592,68,63],
 joker_region_inferred:[469,20,681,146],joker_count:[475,172,28,14],consumable_region_inferred:[1210,20,212,146],consumable_count:[1293,172,28,14],
 hand_count:[798,542,31,15],play_hand:[551,564,163,85],sort_panel:[719,562,211,89],sort_label:[745,571,160,17],sort_rank:[733,590,89,42],sort_suit:[829,590,89,42],discard:[935,564,163,85],deck:[1208,491,113,148],deck_count:[1265,644,44,13],
};
export function installLayout() {
 for(const [id,[x,y,w,h]] of Object.entries(LAYOUT))Object.assign(document.getElementById(id).style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px'});
 const stage=document.getElementById('stage');
 function resize(){
   // Mobile innerWidth can include the unscaled stage's overflow (1536px).
   // The root client box is the actual available viewport, independent of content.
   const width=document.documentElement.clientWidth,height=document.documentElement.clientHeight;
   if(!width || !height)return;
   const scale=Math.min(width/1536,height/688);
   document.documentElement.style.setProperty("--deck-scale",Math.min(width/1536,height/709));
   Object.assign(stage.style,{transform:`scale(${scale})`,left:(width-1536*scale)/2+'px',top:(height-688*scale)/2+'px'});
 }
 new ResizeObserver(resize).observe(document.documentElement);
 window.visualViewport?.addEventListener('resize',resize);
 addEventListener('resize',resize);resize();
}
