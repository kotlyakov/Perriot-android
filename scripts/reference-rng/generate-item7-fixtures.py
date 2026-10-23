#!/usr/bin/env python3
"""Item 7 oracle: invoke private original Card functions, never production JS.

Probability samples are injected at explicit boundaries. This isolates native
branch/return behavior; it does not assert whole-game RNG or rendering parity.
Private Lua is loaded only into a temporary file and is never a deliverable.
"""
import argparse, gzip, hashlib, json, pathlib, subprocess, tempfile
p=argparse.ArgumentParser()
p.add_argument('--assets',required=True);p.add_argument('--luajit',required=True);p.add_argument('--output',required=True)
a=p.parse_args();assets=pathlib.Path(a.assets)
pins={'card.lua':'a3a613f90eca3e39042d28a70b129ece292644cbe79970e127e27c49bf4dee53','game.lua':'15ef486aa017ed99c31d2bacdb17846e77e6698d658182964bf7143e2e189e51','functions/misc_functions.lua':'59f6c7e1ac7a9609eb99fbed1c00619a0ed103e8c647780cc9f9f7e5333c636c'}
for name,sha in pins.items():
 if hashlib.sha256((assets/name).read_bytes()).hexdigest()!=sha:raise SystemExit('Native reference source hash mismatch: '+name)
card,game,misc=[(assets/n).read_text().replace('\r\n','\n') for n in pins]
i=game.index('self.P_CENTERS = self.P_CENTERS or {');j=game.index('\n    }',i)+6
centers='local self={FTP_LOCKED=false}\n'+game[i:j]+'\nlocal centers=self.P_CENTERS\n'
harness=r'''
if arg[1]=='off' then jit.off() end
function copy_table(o)if type(o)~='table'then return o end local r={}for k,v in pairs(o)do r[k]=copy_table(v)end return r end
function localize()return ''end
function find_joker(name)local r={}for _,c in ipairs(G.jokers.cards)do if c.ability.name==name and not c.debuff then r[#r+1]=c end end return r end
function Card:set_sprites()end
function Card:juice_up()end
function Card:set_cost()end
function Event(e)return e end
function card_eval_status_text()end
function juice_card_until()end
function ease_dollars(n)G.GAME.pendingMoney=G.GAME.pendingMoney+n end
local sample=0
function pseudorandom(_,lo,hi)if lo then return lo+math.floor(sample*(hi-lo+1))end return sample end
local function json(v)
 if type(v)=='string'then return string.format('%q',v)end
 if type(v)=='number'then return string.format('%.17g',v)end
 if type(v)=='boolean'then return tostring(v)end
 if v==nil then return 'null'end
 local r={}if #v>0 then for _,x in ipairs(v)do r[#r+1]=json(x)end return '['..table.concat(r,',')..']'end
 for k,x in pairs(v)do r[#r+1]=json(k)..':'..json(x)end table.sort(r)return '{'..table.concat(r,',')..'}'
end
local function reset(opts)
 G={P_CENTERS=centers,C={RED={},MULT={},CHIPS={},MONEY={},FILTER={},SECONDARY_SET={Tarot={}}},GAME={pendingMoney=0,dollar_buffer=0,used_jokers={},probabilities={normal=1},pool_flags={},modifiers={},consumeable_buffer=0,dollars=opts.money or 20,hands_played=opts.handsPlayed or 0,starting_deck_size=52,consumeable_usage={},consumeable_usage_total={tarot=opts.tarot or 0},current_round={discards_left=opts.discardsLeft or 0,discards_used=opts.discardsUsed or 0,ancient_card={suit='Hearts'},idol_card={id=12,rank='Queen',suit='Hearts'},castle_card={suit='Hearts'},mail_card={id=12}},hands={},blind={boss=opts.boss or false,triggered=opts.triggered or false,debuff_card=function()end}},jokers={cards={},config={card_limit=5}},consumeables={cards={},config={card_limit=2}},hand={cards={},change_size=function()end},play={},deck={cards={}},playing_cards={}}
 G.GAME.queuedEvents=0;G.E_MANAGER={add_event=function()G.GAME.queuedEvents=G.GAME.queuedEvents+1 end}
 for _,name in ipairs({'High Card','Pair','Two Pair','Three of a Kind','Straight','Flush','Full House','Four of a Kind','Straight Flush','Five of a Kind','Flush House','Flush Five'})do G.GAME.hands[name]={played=opts.played or 0,played_this_round=opts.playedThisRound or 0}end
 for n=1,(opts.deckCount or 52)do G.playing_cards[n]={}end
 for n=1,(opts.planets or 0)do G.GAME.consumeable_usage['c'..n]={set='Planet',count=7}end
 G.GAME.consumeable_usage.tarot={set='Tarot',count=2}
end
local function joker(key,debuff)
 local c=setmetatable({params={},config={card={}},T={h=1,w=1}},{__index=Card})
 c:set_ability(assert(centers[key],key),true);c.debuff=debuff;c.sell_cost=2;G.jokers.cards[1]=c;return c
end
local function playing(rank,suit,kind,debuff)
 local c=setmetatable({base={id=rank,nominal=rank==14 and 11 or math.min(rank,10),suit=suit,suit_nominal=1,face_nominal=0},params={},config={card={}},T={h=1,w=1},unique_val=1},{__index=Card})
 c:set_ability(centers[kind=='gold' and 'm_gold' or kind=='wild' and 'm_wild' or kind=='stone' and 'm_stone' or 'c_base'],true);c.debuff=debuff;return c
end
local numeric={'level_up','chips','mult','h_mult','x_mult','chip_mod','mult_mod','Xmult_mod','x_mult_mod','dollars','h_dollars'}
local function effect(r)local out={}for _,k in ipairs(numeric)do if r and r[k]~=nil then out[k]=r[k]end end return out end
local results={}
local function run(key,phase,opts)
 opts=opts or {};reset(opts);sample=opts.sample or 0
 local c=joker(key,opts.debuff)
 c.ability.hands_played_at_create=0
 if opts.runtime then
  if opts.runtime.yorickDiscards~=nil then c.ability.yorick_discards=opts.runtime.yorickDiscards end
  if opts.runtime.turtleHandSize~=nil then c.ability.extra.h_size=opts.runtime.turtleHandSize end
  if opts.runtime.mult~=nil then c.ability.mult=opts.runtime.mult end
  if opts.runtime.chips~=nil then c.ability.extra.chips=opts.runtime.chips end
  if opts.runtime.xMult~=nil then c.ability.x_mult=opts.runtime.xMult end
  if opts.runtime.rocketDollars~=nil then c.ability.extra.dollars=opts.runtime.rocketDollars end
 end
 local cards={playing(opts.rank or 12,opts.suit or 'Hearts',opts.kind,opts.cardDebuff),playing(13,'Spades')}
 if opts.ranks then cards={}for n,rank in ipairs(opts.ranks)do cards[n]=playing(rank,({'Hearts','Diamonds','Spades','Clubs'})[(n-1)%4+1],n==1 and opts.kind or nil,n==1 and opts.cardDebuff or false)end end
 cards[1].lucky_trigger=opts.lucky or false
 G.hand.cards=cards
 local poker=evaluate_poker_hand(cards)
 local scoringName='High Card'
 for _,name in ipairs({'Flush Five','Flush House','Five of a Kind','Straight Flush','Four of a Kind','Full House','Flush','Straight','Three of a Kind','Two Pair','Pair','High Card'})do if next(poker[name])then scoringName=name;break end end
 if opts.otherPlayed then G.GAME.hands.Pair.played=opts.otherPlayed;G.GAME.hands.Pair.visible=true end
 local context={cardarea=G.jokers,joker_main=true,full_hand=cards,scoring_hand=cards,poker_hands=poker,scoring_name=scoringName,blueprint=opts.copied and 1 or nil}
 if phase=='scored' or phase=='held' then context.cardarea=phase=='scored' and G.play or G.hand;context.individual=true;context.other_card=cards[opts.index or 1]
 elseif phase=='after' then context.after=true;context.joker_main=nil
 elseif phase=='discard' then context={discard=true,full_hand=cards,blueprint=context.blueprint}
 elseif phase=='before' then context.before=true;context.joker_main=nil
 elseif phase=='reroll_shop' or phase=='selling_card' or phase=='skipping_booster' or phase=='end_of_round' then context={[phase]=true,blueprint=context.blueprint,cardarea=G.jokers}
 end
 local ret
 if phase=='discard' then
  for _,pc in ipairs(cards)do context.other_card=pc;ret=c:calculate_joker(context)end
 else ret=phase=='cashout' and {dollars=c:calculate_dollar_bonus()} or c:calculate_joker(context)end
 local kinds={}for _,pc in ipairs(cards)do kinds[#kinds+1]=pc.ability.name end
 results[#results+1]={key=key,phase=phase,options=opts,expected=effect(ret),after={mult=c.ability.mult,xMult=c.ability.x_mult,chips=type(c.ability.extra)=='table' and c.ability.extra.chips or nil,cardBonus=cards[1].ability.perma_bonus or 0,pendingMoney=G.GAME.pendingMoney,queuedEvents=G.GAME.queuedEvents,removeCard=ret and ret.remove or false,yorickDiscards=c.ability.yorick_discards,turtleHandSize=type(c.ability.extra)=='table' and c.ability.extra.h_size or nil,enhancements=kinds,rocketDollars=type(c.ability.extra)=='table' and c.ability.extra.dollars or nil}}
end
local independent={'j_trousers','j_square','j_runner','j_ride_the_bus','j_green_joker','j_obelisk','j_vampire','j_wee','j_lucky_cat','j_castle','j_ice_cream','j_popcorn','j_flash','j_red_card','j_ceremonial','j_gros_michel','j_cavendish','j_stuntman','j_supernova','j_erosion','j_fortune_teller','j_card_sharp','j_loyalty_card','j_misprint','j_campfire','j_constellation','j_hologram','j_ramen','j_glass','j_madness','j_hit_the_road','j_yorick','j_caino','j_throwback'}
for _,key in ipairs(independent)do
 for _,debuff in ipairs({false,true})do
  for _,profile in ipairs({0,1,2,5,6,7})do
   local opts={debuff=debuff,played=profile+1,playedThisRound=profile+1,tarot=profile,deckCount=52-profile,handsPlayed=profile,sample=profile/10}
      if key=='j_trousers' or key=='j_ride_the_bus' or key=='j_green_joker' or key=='j_popcorn' or key=='j_flash' or key=='j_red_card' or key=='j_ceremonial' then opts.runtime={mult=profile}
   elseif key=='j_square' or key=='j_runner' or key=='j_wee' or key=='j_castle' or key=='j_ice_cream' then opts.runtime={chips=profile}
   elseif key=='j_obelisk' or key=='j_vampire' or key=='j_lucky_cat' or key=='j_campfire' or key=='j_constellation' or key=='j_hologram' or key=='j_ramen' or key=='j_glass' or key=='j_madness' or key=='j_hit_the_road' or key=='j_yorick' then opts.runtime={xMult=1+profile/4}end
   run(key,'independent',opts)
  end
 end
end
for _,key in ipairs({'j_photograph','j_triboulet','j_bloodstone','j_ancient','j_idol','j_rough_gem','j_ticket','j_business','j_hiker','j_wee','j_lucky_cat'})do
 for _,rank in ipairs({2,8,11,12,13,14})do
  for _,suit in ipairs({'Hearts','Diamonds','Spades','Clubs'})do
   for _,sample in ipairs({0,0.499999,0.5,0.999999})do run(key,'scored',{rank=rank,suit=suit,sample=sample,lucky=sample<0.5})end
  end
 end
 run(key,'scored',{rank=12,suit='Hearts',debuff=true})
 run(key,'scored',{rank=12,suit='Hearts',copied=true,lucky=true})
 run(key,'scored',{rank=12,suit='Hearts',index=2})
 run(key,'scored',{rank=12,suit='Hearts',kind='stone'})
 run(key,'scored',{rank=12,suit='Hearts',kind='gold'})
 run(key,'scored',{rank=12,suit='Hearts',kind='wild'})
end
for _,rank in ipairs({2,11,12,14})do for _,sample in ipairs({0,0.499999,0.5,0.999999})do for _,cardDebuff in ipairs({false,true})do run('j_reserved_parking','held',{rank=rank,sample=sample,cardDebuff=cardDebuff})end end end
for _,key in ipairs({'j_rocket','j_satellite','j_delayed_grat'})do for _,n in ipairs({0,1,2,8})do for _,debuff in ipairs({false,true})do for _,used in ipairs({0,1})do run(key,'cashout',{debuff=debuff,planets=n,discardsLeft=n,discardsUsed=used,runtime=key=='j_rocket' and {rocketDollars=1+n*2} or nil})end end end end
for _,key in ipairs({'j_flash','j_red_card','j_campfire','j_rocket'})do
 local phase=key=='j_flash' and 'reroll_shop' or key=='j_red_card' and 'skipping_booster' or key=='j_campfire' and 'selling_card' or 'end_of_round'
 for _,debuff in ipairs({false,true})do for _,copied in ipairs({false,true})do for _,boss in ipairs({false,true})do run(key,phase,{debuff=debuff,copied=copied,boss=boss})end end end
end
for _,key in ipairs({'j_trousers','j_square','j_runner','j_ride_the_bus','j_green_joker','j_obelisk','j_midas_mask','j_vampire','j_space'})do
 for _,ranks in ipairs({{2},{2,3,4,5},{2,3,4,5,6},{2,2,3,3,4},{2,2,2,3,3},{11,12,13,14}})do
  for _,copied in ipairs({false,true})do
   run(key,'before',{ranks=ranks,copied=copied,kind='gold',played=2,otherPlayed=3,sample=0.249999})
   run(key,'before',{ranks=ranks,copied=copied,kind='gold',played=2,otherPlayed=1,sample=0.25,debuff=true})
  end
 end
end
for _,key in ipairs({'j_ramen','j_yorick','j_green_joker','j_hit_the_road','j_castle','j_mail','j_trading'})do
 for _,ranks in ipairs({{2},{11},{12},{11,12,13}})do
  for _,debuff in ipairs({false,true})do for _,cardDebuff in ipairs({false,true})do
   run(key,'discard',{ranks=ranks,debuff=debuff,cardDebuff=cardDebuff,discardsUsed=0,runtime=key=='j_green_joker' and {mult=2} or key=='j_yorick' and {yorickDiscards=2,xMult=1} or key=='j_ramen' and {xMult=2} or nil})
  end end
 end
end
for _,key in ipairs({'j_ice_cream','j_popcorn','j_turtle_bean'})do for _,n in ipairs({1,4,5,6,20})do for _,debuff in ipairs({false,true})do
 run(key,key=='j_ice_cream' and 'after' or 'end_of_round',{debuff=debuff,runtime=key=='j_ice_cream' and {chips=n} or key=='j_popcorn' and {mult=n} or {turtleHandSize=n}})
end end end
print(json(results))
'''
script='Moveable={extend=function()return {}end}\n'+card+'\n'+misc+'\n'+centers+harness
with tempfile.NamedTemporaryFile('w',suffix='.lua') as f:
 f.write(script);f.flush();outputs=[json.loads(subprocess.check_output([a.luajit,f.name,mode],text=True))for mode in ['on','off']]
assert outputs[0]==outputs[1],'JIT on/off mismatch'
result={'cases':outputs[0],'source':{'filesSha256':pins,'method':'Unchanged original Card:set_ability, Card:calculate_joker, Card:calculate_dollar_bonus and evaluate_poker_hand; JIT on/off identical','limits':'Probability samples injected at explicit boundaries. Queued Event callbacks not executed; rendering, frame/event RNG, constructors and full game lifecycle excluded.'}}
payload=(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n').encode()
pathlib.Path(a.output).write_bytes(gzip.compress(payload,mtime=0)if a.output.endswith('.gz')else payload)
print(str(len(outputs[0]))+' native item 7 cases')
