#!/usr/bin/env python3
"""Extend item7's unchanged private Card oracle with drained callback contracts.
No private source is persisted. Constructor/create_card are recording stubs:
creation set/suffix/count is proven, generated identity/RNG is a separate oracle.
"""
import argparse, ast, gzip, hashlib, json, pathlib, subprocess, tempfile
p=argparse.ArgumentParser();p.add_argument('--assets',required=True);p.add_argument('--luajit',required=True);p.add_argument('--output',required=True);a=p.parse_args()
base=ast.parse(pathlib.Path(__file__).with_name('generate-item7-fixtures.py').read_text())
constants={n.targets[0].id:ast.literal_eval(n.value) for n in base.body if isinstance(n,ast.Assign) and isinstance(n.targets[0],ast.Name) and n.targets[0].id in ('pins','harness')}
pins=constants['pins'];pins['functions/common_events.lua']='6db2e23935413ff53c558a3b4674deff668603f695fd02b8de663d75bee0a4cd';assets=pathlib.Path(a.assets)
for name,sha in pins.items():
 if hashlib.sha256((assets/name).read_bytes()).hexdigest()!=sha:raise SystemExit('Native reference source hash mismatch: '+name)
card,game,misc=[(assets/n).read_text().replace('\r\n','\n')for n in list(pins)[:3]]
i=game.index('self.P_CENTERS = self.P_CENTERS or {');j=game.index('\n    }',i)+6
centers='local self={FTP_LOCKED=false}\n'+game[i:j]+'\nlocal centers=self.P_CENTERS\n'
common=(assets/'functions/common_events.lua').read_text().replace('\r\n','\n')
targets=common[common.index('function reset_idol_card()'):common.index('function reset_blinds()')]
pool=common[common.index('function get_current_pool('):common.index('function poll_edition(')]
harness=constants['harness'].split("local independent=")[0]
extension=r'''
function EMPTY()return {}end
function pseudoseed(k)return k end
function pseudorandom_element(t)local keys={}for k in pairs(t)do keys[#keys+1]=k end table.sort(keys,function(a,b)return tostring(a)<tostring(b)end);return t[keys[math.min(#keys,1+math.floor(sample*#keys))]] end
function play_sound()end
function delay()end
function stop_use()end
function set_consumeable_usage()end
function check_for_unlock()end
function playing_card_joker_effects()end
function update_hand_text()end
function level_up_hand(_,name,_,n)G.GAME.hands[name].level=G.GAME.hands[name].level+n end
function Tag(key)return key end
function add_tag(key)G.tags[#G.tags+1]=key end
function Card:start_materialize()end
function Card:start_dissolve()self.removed=true end
function Card:remove()self.removed=true end
function Card:set_edition(e)self.edition=e end
function Card:set_seal(s)self.seal=s end
function copy_card(c)local r=setmetatable(copy_table(c),{__index=Card});r.add_to_deck=function()end;return r end
function create_card(set,area,legendary,rarity,_,_,forced,append)
 G.created[#G.created+1]={set=set,append=append,rarity=rarity,legendary=legendary or false}
 return {ability={extra_value=0},add_to_deck=function()end,start_materialize=function()end,set_cost=function()end}
end
function create_playing_card()
 local c=playing(2,'Hearts');G.created[#G.created+1]={set='Playing'};G.hand.cards[#G.hand.cards+1]=c;return c
end
local function prepare(o)
 reset(o);sample=o.sample or 0
 G.created={};G.tags={};G.I={CARD={}};G.CONTROLLER={locked=false};G.STATES={HAND_PLAYED=1,DRAW_TO_HAND=2,PLAY_TAROT=3};G.STATE=0
 G.play.cards={};G.hand.highlighted={};G.hand.sort=function()end;G.hand.emplace=function(t,c)t.cards[#t.cards+1]=c end;G.deck.config={card_limit=52}
 G.GAME.round_resets={ante=1,hands=4,discards=3};G.GAME.joker_buffer=0;G.GAME.chips=o.chips or 0
 G.GAME.current_round.hands_played=o.handsPlayed or 0;G.GAME.current_round.hands_left=4
 G.GAME.blind.chips=100;G.GAME.blind.get_type=function()return o.boss and 'Boss' or 'Small'end
 G.GAME.blind.disable=function(b)b.disabled=true end
 G.GAME.blind.set_blind=function()end
 G.hand_text_area={blind_chips={juice_up=function()end},game_chips={juice_up=function()end}}
 for _,h in pairs(G.GAME.hands)do h.visible=true;h.level=1;h.chips=5;h.mult=1 end
 G.FUNCS={get_poker_hand_info=function()return o.hand or 'High Card',''end}
 G.consumeables.emplace=function(t,c)t.cards[#t.cards+1]=c end
 G.jokers.emplace=function(t,c)t.cards[#t.cards+1]=c end
 G.jokers.remove_card=function(t,c)for i,v in ipairs(t.cards)do if v==c then table.remove(t.cards,i);break end end end
 G.consumeables.config.card_limit=o.capacity or 2;G.jokers.config.card_limit=o.jokerCapacity or 5
 for n=1,(o.occupied or 0)do G.consumeables.cards[n]={ability={extra_value=0},set_cost=function()end}end
 G.GAME.bankrupt_at=0;G.GAME.interest_amount=1;G.GAME.current_round.free_rerolls=0
 local queue={};G.E_MANAGER.add_event=function(_,e)queue[#queue+1]=e end
 return function()local n=1;while queue[n]do assert(n<100,'event overflow');if queue[n].func then queue[n].func()end;n=n+1 end end
end
function ease_discard(n)G.GAME.current_round.discards_left=(G.GAME.current_round.discards_left or 0)+n end
function ease_hands_played(n)G.GAME.current_round.hands_left=G.GAME.current_round.hands_left+n end
function discover_card()end
local function extended(key,phase,o)
 local drain=prepare(o);local c=joker(key,o.debuff);c.ability.invis_rounds=o.age or 0;c.ability.to_do_poker_hand='High Card';c.getting_sliced=o.sliced
 local cards={};for n,r in ipairs(o.ranks or {2,3,4,5,14})do cards[n]=playing(r,o.flush and 'Hearts' or ({'Hearts','Diamonds','Spades','Clubs'})[(n-1)%4+1]);cards[n].shattered=o.shattered end
 G.hand.cards=cards;G.hand.highlighted=cards
 local poker=evaluate_poker_hand(cards)
 local ctx={cardarea=G.jokers,full_hand=cards,scoring_hand=cards,poker_hands=poker,scoring_name='High Card',blueprint=o.copied and 1 or nil}
 if phase=='main'then ctx.joker_main=true
 elseif phase=='before'then ctx.before=true
 elseif phase=='scored'then ctx.individual=true;ctx.cardarea=G.play;ctx.other_card=cards[1]
 elseif phase=='destroying_card'then ctx.destroying_card=cards[1]
 elseif phase=='other_joker'then ctx.other_joker={config={center={rarity=o.rarity}},juice_up=function()end}
 elseif phase=='using_consumeable'then ctx.using_consumeable=true;ctx.consumeable={ability={set='Planet'}}
 elseif phase=='cards_destroyed'then ctx.cards_destroyed=true;ctx.glass_shattered=cards
 elseif phase=='playing_card_added'then ctx.playing_card_added=true;ctx.cards=cards
 elseif phase=='setting_blind'then ctx.setting_blind=true;ctx.blind=G.GAME.blind
 elseif phase=='end_of_round'then ctx.end_of_round=true;ctx.game_over=o.gameOver
 elseif phase=='pre_discard'then ctx.pre_discard=true;ctx.hook=o.hook
 elseif phase=='passive'then
  c:add_to_deck();drain();local added={bankrupt=G.GAME.bankrupt_at,interest=G.GAME.interest_amount,disabled=G.GAME.blind.disabled or false};c:remove_from_deck();drain()
  results[#results+1]={key=key,phase=phase,options=o,added=added,after={bankrupt=G.GAME.bankrupt_at,interest=G.GAME.interest_amount}};return
 elseif phase=='suit'then
  local values={};for _,s in ipairs({'Hearts','Diamonds','Spades','Clubs'})do values[#values+1]=cards[1]:is_suit(s)or false end
  results[#results+1]={key=key,phase=phase,options=o,values=values};return
 else ctx[phase]=true end
 if o.neighbour then local n=joker('j_joker');G.jokers.cards={c,n};n.sell_cost=3;n.ability.eternal=o.eternal end
 local ret=c:calculate_joker(ctx);if type(ret)=='table'and ret.extra and ret.extra.func then ret.extra.func()end;drain()
 local levels=0;for _,h in pairs(G.GAME.hands)do levels=levels+h.level-1 end
 results[#results+1]={key=key,phase=phase,options=o,expected=type(ret)=='table'and effect(ret)or{},after={created=G.created,tags=G.tags,money=G.GAME.pendingMoney,removed=c.removed or false,saved=type(ret)=='table'and ret.saved or false,destroyed=ret==true,xMult=c.ability.x_mult,cainoXMult=c.ability.caino_xmult,mult=c.ability.mult,extraValue=c.ability.extra_value,invisibleRounds=c.ability.invis_rounds,hands=G.GAME.current_round.hands_left,disabled=G.GAME.blind.disabled or false,levels=levels,seal=G.hand.cards[#G.hand.cards]and G.hand.cards[#G.hand.cards].seal}}
end
local keys={'j_8_ball','j_ancient','j_astronomer','j_baseball','j_burnt','j_caino','j_campfire','j_cartomancer','j_castle','j_ceremonial','j_certificate','j_chicot','j_diet_cola','j_gift','j_glass','j_hallucination','j_hit_the_road','j_hologram','j_idol','j_invisible','j_luchador','j_lucky_cat','j_madness','j_mail','j_matador','j_midas_mask','j_mr_bones','j_obelisk','j_perkeo','j_riff_raff','j_ring_master','j_seance','j_sixth_sense','j_smeared','j_superposition','j_todo_list','j_trading','j_triboulet','j_trousers','j_vagabond','j_vampire','j_wee','j_yorick'}
for _,key in ipairs(keys)do for _,debuff in ipairs({false,true})do extended(key,'main',{debuff=debuff,money=4})end end
for _,key in ipairs({'j_8_ball','j_hallucination','j_cartomancer','j_riff_raff','j_seance','j_superposition','j_vagabond','j_sixth_sense'})do
 for _,occupied in ipairs({0,1,2})do for _,debuff in ipairs({false,true})do for _,copied in ipairs({false,true})do for _,sample in ipairs({0,.249999,.25,.499999,.5,.999999})do
  local phase=key=='j_8_ball'and'scored'or key=='j_hallucination'and'open_booster'or(key=='j_cartomancer'or key=='j_riff_raff')and'setting_blind'or key=='j_sixth_sense'and'destroying_card'or'main'
  extended(key,phase,{occupied=occupied,debuff=debuff,copied=copied,sample=sample,ranks=key=='j_8_ball'and{8}or key=='j_sixth_sense'and{6}or{10,11,12,13,14},flush=key=='j_seance',money=4,jokerCapacity=2})
 end end end end
end
for _,key in ipairs({'j_caino','j_glass','j_hologram'})do for _,ranks in ipairs({{2},{11,12,13},{2,11}})do for _,copied in ipairs({false,true})do for _,debuff in ipairs({false,true})do
 extended(key,key=='j_hologram'and'playing_card_added'or'cards_destroyed',{ranks=ranks,copied=copied,debuff=debuff,shattered=true})
end end end end
for _,key in ipairs({'j_gift','j_invisible','j_hit_the_road','j_campfire','j_mr_bones'})do for _,copied in ipairs({false,true})do for _,debuff in ipairs({false,true})do for _,chips in ipairs({24,25,26})do extended(key,'end_of_round',{copied=copied,debuff=debuff,gameOver=true,chips=chips,boss=true})end end end end
for _,key in ipairs({'j_chicot','j_madness','j_ceremonial'})do for _,copied in ipairs({false,true})do for _,debuff in ipairs({false,true})do for _,boss in ipairs({false,true})do for _,eternal in ipairs({false,true})do extended(key,'setting_blind',{copied=copied,debuff=debuff,boss=boss,eternal=eternal,neighbour=true})end end end end end
for _,key in ipairs({'j_luchador','j_diet_cola','j_perkeo'})do for _,copied in ipairs({false,true})do for _,debuff in ipairs({false,true})do for _,boss in ipairs({false,true})do extended(key,key=='j_perkeo'and'ending_shop'or'selling_self',{copied=copied,debuff=debuff,boss=boss,occupied=1})end end end end
for _,rarity in ipairs({1,2,3,4})do for _,debuff in ipairs({false,true})do extended('j_baseball','other_joker',{rarity=rarity,debuff=debuff})end end
for _,hook in ipairs({false,true})do for _,debuff in ipairs({false,true})do for _,copied in ipairs({false,true})do extended('j_burnt','pre_discard',{hook=hook,debuff=debuff,copied=copied,ranks={2}})end end end
for _,debuff in ipairs({false,true})do extended('j_smeared','suit',{debuff=debuff})end
for _,key in ipairs({'j_astronomer','j_chicot'})do extended(key,'passive',{boss=true})end
for _,n in ipairs({0,4,5,6})do for _,debuff in ipairs({false,true})do
 local drain=prepare({});local c=joker('c_judgement',debuff);for i=1,n do G.jokers.cards[i]={}end;if n==0 then G.jokers.cards={}end
 local available=c:can_use_consumeable(true,true);if available then c:use_consumeable();drain()end
 results[#results+1]={key='c_judgement',phase='use',options={occupied=n,debuff=debuff},available=available,created=G.created}
end end
for _,debuff in ipairs({false,true})do for _,copied in ipairs({false,true})do
 extended('j_todo_list','before',{debuff=debuff,copied=copied})
 extended('j_matador','main',{debuff=debuff,copied=copied,triggered=true})
 extended('j_matador','debuffed_hand',{debuff=debuff,copied=copied,triggered=true})
end end
for _,debuff in ipairs({false,true})do for _,banned in ipairs({false,true})do for _,locked in ipairs({false,true})do
 prepare({});joker('j_ring_master',debuff);G.ARGS={};G.GAME.used_jokers.c_empress=true;G.GAME.banned_keys=banned and {c_empress=true}or{};local center=copy_table(centers.c_empress);center.key='c_empress';center.unlocked=not locked;G.P_CENTER_POOLS={Tarot={center}}
 local pool=get_current_pool('Tarot',nil,nil,'native');results[#results+1]={key='j_ring_master',phase='pool',options={debuff=debuff,banned=banned,locked=locked},pool=pool}
end end end
for _,debuff in ipairs({false,true})do
 prepare({});joker('j_astronomer',debuff);G.GAME.inflation=0;G.GAME.discount_percent=0;G.SETTINGS={tutorial_complete=true};local c={base_cost=3,ability={set='Planet',extra_value=0}};nativeSetCost(c);results[#results+1]={key='j_astronomer',phase='price',options={debuff=debuff},cost=c.cost,sellCost=c.sell_cost}
end
for _,order in ipairs({{'j_midas_mask','j_dna'},{'j_dna','j_midas_mask'},{'j_vampire','j_dna'},{'j_blueprint','j_dna'}})do
 local drain=prepare({});local pc=playing(12,'Hearts',order[1]=='j_vampire'and'gold'or nil);pc.states={visible=true};pc.ability.perma_bonus=15
 local jokers={};for i,key in ipairs(order)do jokers[i]=joker(key)end;local h=joker('j_hologram');jokers[#jokers+1]=h;G.jokers.cards=jokers;G.hand.cards={pc}
 local poker=evaluate_poker_hand({pc});local ctx={cardarea=G.jokers,before=true,full_hand={pc},scoring_hand={pc},poker_hands=poker,scoring_name='High Card'}
 for _,c in ipairs(jokers)do local ret=c:calculate_joker(ctx);ctx.blueprint=nil;ctx.blueprint_card=nil;if ret and ret.playing_cards_created then for _,j in ipairs(jokers)do j:calculate_joker({playing_card_added=true,cards=ret.playing_cards_created})end end end;drain()
 local names={};local bonus={};for _,c in ipairs(G.hand.cards)do names[#names+1]=c.ability.name;bonus[#bonus+1]=c.ability.perma_bonus or 0 end
 results[#results+1]={key='before-order',phase='before-order',options={order=order},after={enhancements=names,bonuses=bonus,xMult=h.ability.x_mult}}
end
pseudoseed=nativeSeed;pseudorandom=nativeRandom;pseudorandom_element=nativeElement
local ffi=require('ffi')
local function mathState()local _,u=debug.getupvalue(math.random,1);local w=ffi.cast('uint32_t*',u);local r={}for i=0,3 do r[#r+1]=string.format('%08x%08x',tonumber(w[2*i+1]),tonumber(w[2*i]))end return r end
for i=0,19 do for _,prior in ipairs({'unset','Spades'})do
 prepare({});local seed='TARGET7B'..i;G.GAME.pseudorandom={seed=seed,hashed_seed=pseudohash(seed)};G.GAME.current_round.ancient_card={suit=prior~='unset'and prior or nil}
 G.jokers.cards={};G.playing_cards={playing(13,'Clubs'),playing(2,'Hearts'),playing(14,'Spades'),playing(9,'Diamonds','stone')};for n,c in ipairs(G.playing_cards)do c.sort_id=({3,1,2,4})[n];c.base.value=tostring(c.base.id)end
 for round=1,3 do
  reset_idol_card();reset_mail_rank();reset_ancient_card();reset_castle_card();local r=G.GAME.current_round;local streams=copy_table(G.GAME.pseudorandom);streams.seed=nil;streams.hashed_seed=nil
  results[#results+1]={key='round-targets',phase='round-targets',options={seed=seed,prior=prior,round=round},after={idol={rank=r.idol_card.id,suit=r.idol_card.suit},mail=r.mail_card.id,ancient=r.ancient_card.suit,castle=r.castle_card.suit,streams=streams,mathState=mathState()}}
 end
end end
print(json(results))
'''
script='Moveable={extend=function()return {}end}\n'+card+'\n'+misc+'\n'+pool+'\n'+targets+'\nlocal nativeSetCost=Card.set_cost;local nativeSeed=pseudoseed;local nativeRandom=pseudorandom;local nativeElement=pseudorandom_element\n'+centers+harness+extension
with tempfile.NamedTemporaryFile('w',suffix='.lua')as f:
 f.write(script);f.flush();outputs=[json.loads(subprocess.check_output([a.luajit,f.name,m],text=True))for m in ['on','off']]
assert outputs[0]==outputs[1],'JIT on/off mismatch'
result={'cases':outputs[0],'source':{'filesSha256':pins,'method':'Unchanged original Card:set_ability, calculate_joker, add_to_deck, remove_from_deck, is_suit, can_use_consumeable, use_consumeable, set_cost, get_current_pool and reset_idol_card/reset_mail_rank/reset_ancient_card/reset_castle_card; JIT on/off identical','limits':'Probability samples injected except round-target cases, which use original pseudoseed/pseudorandom_element and actual LuaJIT PRNG; event callbacks drained FIFO. create_card/copy_card/create_playing_card are recording stubs: generated identities and constructor RNG excluded. Main-only rows establish no-trigger/default behavior, not full effect coverage.'}}
payload=(json.dumps(result,separators=(',',':'))+'\n').encode();pathlib.Path(a.output).write_bytes(gzip.compress(payload,mtime=0)if a.output.endswith('.gz')else payload);print(str(len(outputs[0]))+' native item7b cases')
