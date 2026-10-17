#!/usr/bin/env python3
"""Native effect-mechanism oracle: unchanged evaluate_play and career block.

Deferred Event callbacks, visual helpers, update frames, previews, unlock checks
are explicit scope exclusions. No production JS imports. Private Lua transient.
"""
import gzip,argparse,hashlib,json,pathlib,re,subprocess,tempfile
p=argparse.ArgumentParser();p.add_argument('--assets',required=True);p.add_argument('--luajit',required=True);p.add_argument('--output',required=True);a=p.parse_args();assets=pathlib.Path(a.assets)
PINNED_SOURCE_SHA256={'card.lua': 'a3a613f90eca3e39042d28a70b129ece292644cbe79970e127e27c49bf4dee53', 'game.lua': '15ef486aa017ed99c31d2bacdb17846e77e6698d658182964bf7143e2e189e51', 'functions/misc_functions.lua': '59f6c7e1ac7a9609eb99fbed1c00619a0ed103e8c647780cc9f9f7e5333c636c', 'functions/common_events.lua': '6db2e23935413ff53c558a3b4674deff668603f695fd02b8de663d75bee0a4cd', 'functions/state_events.lua': '8ea653623e2c9b6aaa606750e1b0e90eeb215ee18d36676e5a3627f14ce9e4ac'}
for name,expected in PINNED_SOURCE_SHA256.items():
 if hashlib.sha256((assets/name).read_bytes()).hexdigest()!=expected:raise SystemExit("Native reference source hash mismatch: "+name)
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

keys=['j_mime','j_pareidolia','j_blueprint','j_brainstorm','j_selzer']
harness=r'''
local ffi=require('ffi');if arg[1]=='off'then jit.off()end
local rawRandom=math.random
local phase,draws,evals,queue,scoringOrder,repeats,queriedCard,repeatArea
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
function Card:calculate_joker(c)local old=phase;phase=contextPhase(c)..':'..self.id;evals[#evals+1]={phase=phase,otherCardId=c.other_card and c.other_card.id or nil};if c.repetition and c.cardarea==G.play then queriedCard=c.other_card.id;repeatArea='scored_card' end;if c.repetition and c.cardarea==G.hand then queriedCard=c.other_card.id;repeatArea='held_card' end;local r=nativeJoker(self,c);phase=old;return r end
local nativeEval=eval_card
function eval_card(card,c)if c.repetition_only then queriedCard=card.id;repeatArea=c.cardarea==G.play and 'scored_card' or 'held_card' end;local old=phase;phase=contextPhase(c)..':'..card.id;evals[#evals+1]={phase=phase,evalCard=true};local r=nativeEval(card,c);phase=old;return r end
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
function card_eval_status_text(c,kind,_,__,___,effect)if effect and effect.repetitions then repeats[#repeats+1]={cardId=queriedCard,sourceId=c.id,phase=repeatArea}end end
function juice_card()end
function ease_dollars(n)G.GAME.pendingMoney=G.GAME.pendingMoney+n end
function play_sound()end
function play_area_status_text()end
local function playing(i,kind,rank,debuff,edition,seal)
 local effect=kind and kind~='base' and kind or 'Default Base'
 local c=setmetatable({id='c'..i,params={},config={card={}},T={x=i,h=1,w=1},base={id=rank or i+1,nominal=(rank==14 and 11 or math.min(rank or i+1,10)),value=tostring(rank or i+1),suit='Spades',suit_nominal=1,face_nominal=0,times_played=0},unique_val=i},{__index=Card})
 local key=({['Stone Card']='m_stone',['Lucky Card']='m_lucky',['Glass Card']='m_glass',['Steel Card']='m_steel',['Bonus Card']='m_bonus',['Mult Card']='m_mult'})[effect] or 'c_base'
 c:set_ability(assert(centers[key],key),true);c.debuff=debuff;c.base.id=rank or i+1
 if edition and edition~='base' then local k=edition=='holo' and 'e_holo' or 'e_'..edition;local extra=assert(centers[k],k).config.extra;c.edition={[edition]=true};c.edition[edition=='foil' and 'chips' or edition=='holo' and 'mult' or 'x_mult']=extra end
 c.seal=seal=='gold' and 'Gold' or seal=='red' and 'Red' or nil
 return c
end
local function joker(key,i,debuff)
 local c=setmetatable({id=key..':'..i,base={nominal=0,id=0,value='',suit=''},params={},config={card={}},T={h=1,w=1}},{__index=Card});c:set_ability(assert(centers[key],key),true);c.debuff=debuff;c.sell_cost=2;c.area=G.jokers;return c
end
local function reset(seed,denied)
 math.randomseed(seed);draws={};evals={};queue={};scoringOrder={};repeats={};queriedCard=nil;phase='reset';hand_chips=0;mult=0
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
 G.GAME.current_round.hands_left=opts.nativeHands or 0
 local playedSpecs,heldSpecs,jokerSpecs={},{},{}
 for i=n,1,-1 do
  local kind=(opts.kinds and opts.kinds[i]) or (i<=stones and 'Stone Card') or (opts.lucky and i==2 and 'Lucky Card') or (opts.glass and i==3 and 'Glass Card') or 'base'
  local deb=opts.debuffCard and i==1 or false;local edition=opts.editions and opts.editions[i] or 'base';local seal=opts.seals and opts.seals[i] or 'base';local c=playing(i,kind,opts.ranks and opts.ranks[i],deb,edition,seal);if opts.suits then c.base.suit=opts.suits[i]end;G.hand.highlighted[#G.hand.highlighted+1]=c
  playedSpecs[#playedSpecs+1]={id=c.id,rank=c.base.id,suit=c.base.suit,enhancement=kind,debuffed=deb,x=c.T.x,edition=edition,seal=seal}
 end
 local held=playing(8,opts.heldKind or 'Stone Card',opts.heldRank or 10,opts.debuffHeld,opts.heldEdition,opts.heldSeal);G.hand.cards={held};heldSpecs[1]={id=held.id,rank=held.base.id,suit=held.base.suit,enhancement=opts.heldKind or 'Stone Card',debuffed=opts.debuffHeld or false,x=held.T.x,edition=opts.heldEdition or 'base',seal=opts.heldSeal or 'base'}
 G.playing_cards={};for _,c in ipairs(G.hand.highlighted)do G.playing_cards[#G.playing_cards+1]=c end;G.playing_cards[#G.playing_cards+1]=held
 for i,key in ipairs(keys)do local deb=opts.debuffJoker or opts.debuffJokerIndex==i;local j=joker(key,i,deb);if key=='j_selzer' and opts.seltzerRemaining then j.ability.extra=opts.seltzerRemaining end;if opts.jokerEditionIndex==i then j.edition={foil=true,chips=centers.e_foil.config.extra}end;G.jokers.cards[#G.jokers.cards+1]=j;jokerSpecs[#jokerSpecs+1]={key=key,id=j.id,debuffed=deb or false,edition=opts.jokerEditionIndex==i and 'foil' or 'base',runtimeExtra=key=='j_selzer' and j.ability.extra or nil}end
 for _,j in ipairs(G.jokers.cards)do prepare_tallies(j)end
 local before=state();phase='career';career_play();phase='evaluate_play';G.FUNCS.evaluate_play()
 local extrasAfter={};for _,j in ipairs(G.jokers.cards)do if j.config.center.key=='j_selzer' or j.ability.name=='Seltzer' then extrasAfter[j.id]=j.ability.extra end end
 local destroyed,playedOrder={},{};for _,c in ipairs(G.play.cards)do playedOrder[#playedOrder+1]=c.id;if c.shattered or c.destroyed then destroyed[#destroyed+1]=c.id end end
 results[#results+1]={seed=seed,runSeed=G.GAME.pseudorandom.seed,playedSpecs=playedSpecs,heldSpecs=heldSpecs,jokers=jokerSpecs,options=opts,before=before,after=state(),draws=draws,drawCount=#draws,evals=evals,repeats=repeats,recognizedHand=G.GAME.last_hand_played,destroyed=destroyed,playedOrder=playedOrder,scoringOrder=scoringOrder,chips=hand_chips,mult=mult,score=math.floor(hand_chips*mult),streams=G.GAME.pseudorandom,pendingMoney=G.GAME.pendingMoney,queuedEvents=#queue,jokerExtrasAfter=extrasAfter}
end
for _,seed in ipairs({42,918273})do
 -- Every numeric playing edition combines independently with a seal and repeats.
 for _,edition in ipairs({'base','foil','holo','polychrome'})do
  for _,seal in ipairs({'base','gold','red'})do
   for _,kind in ipairs({'base','Stone Card','Lucky Card','Glass Card','Steel Card'})do
    for _,js in ipairs({{}, {'j_hanging_chad'}, {'j_blueprint','j_hanging_chad'}, {'j_selzer'}})do
     run(seed,1,0,js,{ranks={4},kinds={kind},editions={edition},seals={seal}})
    end
   end
   run(seed,1,0,{'j_hanging_chad'},{ranks={12},editions={edition},seals={seal},debuffCard=true})
  end
 end
 -- Held repetitions are admitted only when at least one held effect exists.
 for _,heldKind in ipairs({'base','Steel Card','Stone Card'})do
  for _,heldRank in ipairs({2,12,13})do
   for _,seal in ipairs({'base','red','gold'})do
    for _,js in ipairs({{}, {'j_mime'}, {'j_baron','j_mime'}, {'j_shoot_the_moon','j_mime'}, {'j_raised_fist','j_mime'}, {'j_mime','j_mime'}, {'j_blueprint','j_mime','j_baron'}, {'j_mime','j_brainstorm','j_shoot_the_moon'}})do
     run(seed,1,0,js,{ranks={4},heldKind=heldKind,heldRank=heldRank,heldSeal=seal,heldEdition='polychrome'})
    end
   end
  end
 end
 for _,js in ipairs({{'j_pareidolia','j_sock_and_buskin','j_smiley','j_scary_face'}, {'j_blueprint','j_pareidolia','j_sock_and_buskin'}, {'j_pareidolia','j_blueprint','j_sock_and_buskin'}, {'j_pareidolia','j_baron','j_mime'}, {'j_pareidolia','j_shoot_the_moon','j_mime'}})do
  for _,kind in ipairs({'base','Stone Card'})do
   for _,rank in ipairs({2,12})do
    run(seed,1,0,js,{ranks={rank},kinds={kind},heldRank=2,heldKind='Steel Card',heldSeal='red'})
    run(seed,1,0,js,{ranks={rank},kinds={kind},debuffJokerIndex=1})
   end
  end
 end
 for _,js in ipairs({{'j_blueprint','j_joker'}, {'j_joker','j_brainstorm'}, {'j_blueprint','j_walkie_talkie','j_hanging_chad'}, {'j_selzer','j_blueprint','j_sock_and_buskin','j_pareidolia','j_splash'}})do
  run(seed,3,0,js,{ranks={4,4,2},kinds={'Stone Card','Lucky Card','Glass Card'},suits={'Spades','Hearts','Clubs'},editions={'foil','holo','polychrome'},seals={'red','gold','red'},heldKind='Steel Card',heldRank=13,heldSeal='red',jokerEditionIndex=2})
  run(seed,1,0,js,{ranks={4},heldKind='Steel Card',heldRank=13,heldSeal='red',debuffHeld=true,jokerEditionIndex=2})
 end
 -- Copy chains, self targets, cycles, and native source ownership.
 for _,js in ipairs({{'j_blueprint'}, {'j_brainstorm'}, {'j_blueprint','j_brainstorm'}, {'j_blueprint','j_blueprint','j_brainstorm'}, {'j_brainstorm','j_blueprint'}, {'j_blueprint','j_blueprint','j_joker'}, {'j_joker','j_brainstorm','j_brainstorm'}, {'j_blueprint','j_walkie_talkie','j_brainstorm'}, {'j_blueprint','j_blueprint','j_hack'}, {'j_hanging_chad','j_brainstorm','j_blueprint','j_selzer'}, {'j_selzer','j_brainstorm','j_blueprint','j_mime'}, {'j_blueprint','j_baron'}, {'j_blueprint','j_raised_fist'}, {'j_blueprint','j_shoot_the_moon'}})do
  run(seed,1,0,js,{ranks={4},heldRank=13,heldKind='Steel Card',seals={'red'},heldSeal='red'})
  run(seed,1,0,js,{ranks={4},heldRank=12,heldKind='base',debuffJokerIndex=1})
  run(seed,1,1,js,{heldRank=2,heldKind='Stone Card'})
 end
 for _,remaining in ipairs({1,2,10})do
  run(seed,1,0,{'j_selzer','j_blueprint','j_selzer'},{ranks={2},seltzerRemaining=remaining,kinds={'Lucky Card'},seals={'gold'}})
 end
end
print(json(results))
'''.replace('KEYS','{'+','.join("'"+k+"'"for k in keys)+'}')
script='Moveable={extend=function()return {}end}\n'+card+'\n'+misc+'\n'+centers+hands+evalcard+install+career+updates+harness
with tempfile.NamedTemporaryFile('w',suffix='.lua')as f:
 f.write(script);f.flush();out=[json.loads(subprocess.check_output([a.luajit,f.name,mode],text=True))for mode in ['on','off']]
assert out[0]==out[1],'JIT on/off mismatch'
for case in out[0]:
 for name in ['draws','evals','scoringOrder','playedOrder','destroyed','repeats','jokers']:
  if case[name]=={}:case[name]=[]
result={'cases':out[0],'source':{'filesSha256':{n:hashlib.sha256((assets/n).read_bytes()).hexdigest()for n in ['card.lua','game.lua','functions/misc_functions.lua','functions/common_events.lua','functions/state_events.lua']},'nativeJokerKeys':keys,'method':'Unchanged evaluate_play body + original get_poker_hand_info/eval_card and extracted career block + native sort; JIT on/off identical','limits':'Queued Event callbacks not executed; UI, unlocks, previews, frames and boss lifecycle adapters excluded. Numeric score and synchronous getter chronology only.'}}
payload=(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n').encode()
pathlib.Path(a.output).write_bytes(gzip.compress(payload,mtime=0) if a.output.endswith('.gz') else payload)
