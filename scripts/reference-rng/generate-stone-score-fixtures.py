#!/usr/bin/env python3
"""Execute unchanged native evaluate_play plus extracted preplay career block.

Deferred Event callbacks, visual helpers, update frames, previews, unlock checks
are explicit scope exclusions. No production JS imports. Private Lua transient.
"""
import gzip,argparse,hashlib,json,pathlib,re,subprocess,tempfile
p=argparse.ArgumentParser();p.add_argument('--assets',required=True);p.add_argument('--luajit',required=True);p.add_argument('--output',required=True);a=p.parse_args();assets=pathlib.Path(a.assets)
def read(n):return (assets/n).read_text().replace('\r\n','\n')
def region(s,start,end):
 i=s.index(start);return s[i:s.index(end,i)]
game,card,misc,events,common=map(read,['game.lua','card.lua','functions/misc_functions.lua','functions/state_events.lua','functions/common_events.lua'])
i=game.index('self.P_CENTERS = self.P_CENTERS or {');j=game.index('\n    }',i)+6
centers='local self={FTP_LOCKED=false}\n'+game[i:j]+'\nlocal centers=self.P_CENTERS\n'
hands='local initialHands='+region(game,'        hands = {','        }\n    }\nend').replace('        hands = ','',1)+'}\n'
install='function install_native()\n'+region(events,'G.FUNCS.get_poker_hand_info = function(_cards)','  G.FUNCS.draw_from_play_to_discard =')+'\nend\n'
preplay=events[events.index('G.FUNCS.play_cards_from_highlighted ='): ]
career='function career_play()\n'+region(preplay,"    table.sort(G.hand.highlighted, function(a,b) return a.T.x < b.T.x end)",'\n\n    G.E_MANAGER:add_event(Event({')+'\n'+region(preplay,'        for i=1, #G.hand.highlighted do\n            if G.hand.highlighted[i]:is_face()','\n\n        check_for_unlock({type = \'run_card_replays\'})')+'\nend\n'
evalcard=region(common,'function eval_card(card, context)','\nfunction set_alerts()')
update_source=card[card.index('function Card:update(dt)'):]
updates='function prepare_tallies(self)\n'+region(update_source,"        if self.ability.name == \"Driver's License\" then",'        if self.ability.name == "Cloud 9" then')+region(update_source,'        if self.ability.name == "Stone Joker" then',"        if self.ability.name == 'The Wheel of Fortune' then")+region(update_source,"        if self.ability.name == 'Swashbuckler' then","    else\n        if self.ability.name == 'Temperance' then")+'\nend\n'

keys=re.findall("'([^']+)'",re.search(r'const NATIVE_JOKERS=Object.freeze\(\[(.*?)\]\)',pathlib.Path('src/content/jokers.js').read_text()).group(1))
harness=r'''
local ffi=require('ffi');if arg[1]=='off'then jit.off()end
local rawRandom=math.random
local phase,draws,evals,queue,scoringOrder
local function state()local _,u=debug.getupvalue(rawRandom,1);local w=ffi.cast('uint32_t*',u);local r={}for i=0,3 do r[#r+1]=string.format('%08x%08x',tonumber(w[2*i+1]),tonumber(w[2*i]))end return r end
math.random=function(lo,hi)local x;if lo==nil then x=rawRandom()elseif hi==nil then x=rawRandom(lo)else x=rawRandom(lo,hi)end;draws[#draws+1]={phase=phase,min=lo,max=hi,value=x};return x end
local function contextPhase(c)
 local area=c.cardarea==G.play and 'scored' or c.cardarea==G.hand and 'held' or 'jokers'
 for _,flag in ipairs({'before','edition','joker_main','other_joker','after','repetition','individual','destroying_card','remove_playing_cards','debuffed_hand'})do if c[flag]then return area..':'..flag end end
 return area..':own'
end
local nativeID=Card.get_id
function Card:get_id()local n=nativeID(self);if self.ability.effect=='Stone Card'then local d=draws[#draws];if d then d.cardId=self.id end end return n end
local nativeJoker=Card.calculate_joker
function Card:calculate_joker(c)local old=phase;phase=contextPhase(c)..':'..self.id;evals[#evals+1]={phase=phase,otherCardId=c.other_card and c.other_card.id or nil};local r=nativeJoker(self,c);phase=old;return r end
local nativeEval=eval_card
function eval_card(card,c)local old=phase;phase=contextPhase(c)..':'..card.id;evals[#evals+1]={phase=phase,evalCard=true};local r=nativeEval(card,c);phase=old;return r end
function copy_table(o)if type(o)~='table'then return o end local r={}for k,v in pairs(o)do r[k]=copy_table(v)end return r end
function localize(x)return type(x)=='string' and x or ''end
function find_joker(name)local r={}for _,j in ipairs(G.jokers.cards)do if j.ability.name==name and not j.debuff then r[#r+1]=j end end return r end
function Card:set_sprites()end
function Card:juice_up()end
function delay()end
function Event(e)return e end
function draw_card(from,to,_,_,_,c)to.cards[#to.cards+1]=c end
function inc_career_stat()end
function set_hand_usage()end
function highlight_card(c,_,dir)if dir=='up'then scoringOrder[#scoringOrder+1]=c.id end end
function update_hand_text()end
function mod_mult(n)return n end
function mod_chips(n)return n end
function check_for_unlock()end
function check_and_set_high_score()end
function card_eval_status_text()end
function juice_card()end
function ease_dollars(n)G.GAME.pendingMoney=G.GAME.pendingMoney+n end
function play_sound()end
function play_area_status_text()end
local function playing(i,kind,rank,debuff)
 local effect=kind and kind~='base' and kind or 'Default Base'
 local c=setmetatable({id='c'..i,params={},config={card={}},T={x=i,h=1,w=1},base={id=rank or i+1,nominal=math.min(rank or i+1,10),value=tostring(rank or i+1),suit='Spades',suit_nominal=1,face_nominal=0,times_played=0},unique_val=i},{__index=Card})
 local key=({['Stone Card']='m_stone',['Lucky Card']='m_lucky',['Glass Card']='m_glass',['Steel Card']='m_steel'})[effect] or 'c_base'
 c:set_ability(assert(centers[key],key),true);c.debuff=debuff;c.base.id=rank or i+1
 return c
end
local function joker(key,i,debuff)
 local c=setmetatable({id=key..':'..i,base={nominal=0,id=0,value='',suit=''},params={},config={card={}},T={h=1,w=1}},{__index=Card});c:set_ability(assert(centers[key],key),true);c.debuff=debuff;c.sell_cost=2;c.area=G.jokers;return c
end
local function reset(seed,denied)
 math.randomseed(seed);draws={};evals={};queue={};scoringOrder={};phase='reset';hand_chips=0;mult=0
 G={P_CENTERS=centers,C={RED={},MULT={},CHIPS={}},FUNCS={},GAME={chips=0,dollars=20,pendingMoney=0,used_jokers={},probabilities={normal=1},pseudorandom={seed='PIERROT1',hashed_seed=pseudohash('PIERROT1')},modifiers={},current_round={discards_left=3,hands_left=0,current_hand={handname=''}},hands_played=0,hands=copy_table(initialHands),cards_played={},round_scores={cards_played={amt=0}}},jokers={cards={},config={card_limit=5}},hand={cards={},highlighted={}},play={cards={}},deck={cards={}},consumeables={cards={}}}
 G.GAME.selected_back={trigger_effect=function()end};G.E_MANAGER={add_event=function(_,e)queue[#queue+1]=e end}
 G.GAME.blind={debuff_hand=function()return denied end,modify_hand=function(_,_,_,_,m,ch)return m,ch,false end}
 for i=2,14 do G.GAME.cards_played[tostring(i)]={total=0,suits={}}end
 install_native();local nativeInfo=G.FUNCS.get_poker_hand_info
 G.FUNCS.get_poker_hand_info=function(cards)local old=phase;phase='recognition';local a,b,c,d,e=nativeInfo(cards);phase=old;return a,b,c,d,e end
end
local function json(v)
 if type(v)=='string'then return string.format('%q',v)end
 if type(v)=='number'then return string.format('%.17g',v)end
 if type(v)=='boolean'then return tostring(v)end
 if v==nil then return 'null'end
 local r={};if #v>0 then for _,x in ipairs(v)do r[#r+1]=json(x)end return '['..table.concat(r,',')..']'end
 for k,x in pairs(v)do r[#r+1]=json(k)..':'..json(x)end;table.sort(r);return '{'..table.concat(r,',')..'}'
end
local results={}
local function run(seed,n,stones,keys,opts)
 opts=opts or {};reset(seed,opts.denied)
 G.GAME.pseudorandom={seed=opts.runSeed or 'PIERROT1',hashed_seed=pseudohash(opts.runSeed or 'PIERROT1')}
 local playedSpecs,heldSpecs,jokerSpecs={},{},{}
 for i=n,1,-1 do
  local kind=(opts.kinds and opts.kinds[i]) or (i<=stones and 'Stone Card') or (opts.lucky and i==2 and 'Lucky Card') or (opts.glass and i==3 and 'Glass Card') or 'base'
  local deb=opts.debuffCard and i==1 or false;local c=playing(i,kind,opts.ranks and opts.ranks[i],deb);G.hand.highlighted[#G.hand.highlighted+1]=c
  playedSpecs[#playedSpecs+1]={id=c.id,rank=c.base.id,suit=c.base.suit,enhancement=kind,debuffed=deb,x=c.T.x}
 end
 local held=playing(8,'Stone Card',10,opts.debuffHeld);G.hand.cards={held};heldSpecs[1]={id=held.id,rank=held.base.id,suit=held.base.suit,enhancement='Stone Card',debuffed=opts.debuffHeld or false,x=held.T.x}
 G.playing_cards={};for _,c in ipairs(G.hand.highlighted)do G.playing_cards[#G.playing_cards+1]=c end;G.playing_cards[#G.playing_cards+1]=held
 for i,key in ipairs(keys)do local j=joker(key,i,opts.debuffJoker);G.jokers.cards[#G.jokers.cards+1]=j;jokerSpecs[#jokerSpecs+1]={key=key,id=j.id,debuffed=opts.debuffJoker or false}end
 for _,j in ipairs(G.jokers.cards)do prepare_tallies(j)end
 local before=state();phase='career';career_play();phase='evaluate_play';G.FUNCS.evaluate_play()
 local destroyed,playedOrder={},{};for _,c in ipairs(G.play.cards)do playedOrder[#playedOrder+1]=c.id;if c.shattered or c.destroyed then destroyed[#destroyed+1]=c.id end end
 results[#results+1]={seed=seed,runSeed=G.GAME.pseudorandom.seed,playedSpecs=playedSpecs,heldSpecs=heldSpecs,jokers=jokerSpecs,options=opts,before=before,after=state(),draws=draws,drawCount=#draws,evals=evals,recognizedHand=G.GAME.last_hand_played,destroyed=destroyed,playedOrder=playedOrder,scoringOrder=scoringOrder,chips=hand_chips,mult=mult,score=math.floor(hand_chips*mult),streams=G.GAME.pseudorandom,pendingMoney=G.GAME.pendingMoney,queuedEvents=#queue}
end
for _,seed in ipairs({42,1,918273})do
 for n=1,5 do for stones=1,n do run(seed,n,stones,{})end end
 for _,key in ipairs(KEYS)do run(seed,5,1,{key})end
 for _,opts in ipairs({{lucky=true,glass=true},{lucky=true,glass=true,debuffCard=true},{lucky=true,glass=true,debuffJoker=true},{lucky=true,glass=true,debuffHeld=true},{lucky=true,glass=true,denied=true}})do
  run(seed,5,1,{'j_fibonacci','j_odd_todd','j_walkie_talkie','j_baron','j_shoot_the_moon'},opts)
  run(seed,5,1,{'j_shoot_the_moon','j_baron','j_walkie_talkie','j_odd_todd','j_fibonacci'},opts)
 end
 for _,runSeed in ipairs({'PIERROT1','LUCKY1','GLASS1'})do
  for _,kinds in ipairs({{'Stone Card','Lucky Card','Glass Card','base','Stone Card'},{'Glass Card','Stone Card','Lucky Card','Stone Card','base'},{'Lucky Card','Glass Card','Stone Card','base','Stone Card'}})do
   for _,js in ipairs({{'j_splash'},{'j_splash','j_fibonacci','j_odd_todd','j_baron','j_shoot_the_moon'},{'j_splash','j_fibonacci','j_fibonacci','j_walkie_talkie'},{'j_walkie_talkie','j_fibonacci','j_fibonacci','j_splash'}})do
    run(seed,5,0,js,{kinds=kinds,runSeed=runSeed})
   end
  end
 end
 run(seed,5,1,{'j_four_fingers'})
 run(seed,5,1,{'j_splash'},{lucky=true,glass=true,debuffHeld=true})
 run(seed,5,1,{'j_splash','j_fibonacci','j_baron'},{lucky=true,glass=true,debuffJoker=true})
 run(seed,5,1,{'j_splash','j_fibonacci','j_baron'},{lucky=true,glass=true,denied=true})
end
print(json(results))
'''.replace('KEYS','{'+','.join("'"+k+"'"for k in keys)+'}')
script='Moveable={extend=function()return {}end}\n'+card+'\n'+misc+'\n'+centers+hands+evalcard+install+career+updates+harness
with tempfile.NamedTemporaryFile('w',suffix='.lua')as f:
 f.write(script);f.flush();out=[json.loads(subprocess.check_output([a.luajit,f.name,mode],text=True))for mode in ['on','off']]
assert out[0]==out[1],'JIT on/off mismatch'
for case in out[0]:
 for name in ['draws','evals','scoringOrder','playedOrder','destroyed']:
  if case[name]=={}:case[name]=[]
result={'cases':out[0],'source':{'filesSha256':{n:hashlib.sha256((assets/n).read_bytes()).hexdigest()for n in ['card.lua','game.lua','functions/misc_functions.lua','functions/common_events.lua','functions/state_events.lua']},'nativeJokerKeys':keys,'method':'Unchanged evaluate_play body + original get_poker_hand_info/eval_card and extracted career block + native sort; JIT on/off identical','limits':'Queued Event callbacks not executed; UI, unlocks, previews, frames and boss lifecycle adapters excluded. Numeric score and synchronous getter chronology only.'}}
payload=(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n').encode()
pathlib.Path(a.output).write_bytes(gzip.compress(payload,mtime=0) if a.output.endswith('.gz') else payload)
