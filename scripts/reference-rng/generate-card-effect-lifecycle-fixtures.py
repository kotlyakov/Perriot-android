#!/usr/bin/env python3
"""Native card lifecycle oracle: original methods and selected lifecycle callbacks.

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


pc_start=game.index('self.P_CARDS = self.P_CARDS or {');pc_end=game.index('\n    }',pc_start)+6
fronts='local self={}\n'+game[pc_start:pc_end]+'\nlocal fronts=self.P_CARDS\n'
creation=region(common,'function get_current_pool(','\nfunction tutorial_info(')
endround=region(events,'                for i=1, #G.hand.cards do\n                    --Check for hand doubling','                delay(0.3)')
ctor_draws=region(card,'    self.discard_pos = {'," \n    self.facing = 'front'")
materialize=region(card,'function Card:start_materialize(', '    self.children.particles = Particles(')+'end\n'
harness=r'''
local ffi=require('ffi');if arg[1]=='off'then jit.off()end
local rawRandom=math.random
local draws,queue,created,repeats,phase,money,currentCard
local function state()local _,u=debug.getupvalue(rawRandom,1);local w=ffi.cast('uint32_t*',u);local r={}for i=0,3 do r[#r+1]=string.format('%08x%08x',tonumber(w[2*i+1]),tonumber(w[2*i]))end return r end
math.random=function(lo,hi)local x;if lo==nil then x=rawRandom()elseif hi==nil then x=rawRandom(lo)else x=rawRandom(lo,hi)end;draws[#draws+1]={phase=phase,min=lo,max=hi,value=x};return x end
function copy_table(o)if type(o)~='table'then return o end local r={}for k,v in pairs(o)do r[k]=copy_table(v)end return r end
function localize(x)return type(x)=='string' and x or ''end
function find_joker(name)local r={}for _,j in ipairs(G.jokers.cards)do if j.ability.name==name and not j.debuff then r[#r+1]=j end end return r end
function Card:set_sprites()end
function Card:set_cost()end
function Card:remove()self.REMOVED=true end
function delay()end
function Event(e)return e end
function check_for_unlock()end
function discover_card()end
function unlock_card()end
function card_eval_status_text(c,_,__,___,____,effect)if effect and effect.repetitions then repeats[#repeats+1]={sourceId=c.id,cardId=currentCard}end end
function ease_dollars(n)money=money+n end
function play_sound()end
function playing_card_joker_effects()end
function juice_card()end
local function area(limit)
 return {cards={},T={x=0,y=0,w=1,h=1},config={card_limit=limit or 52},emplace=function(self,c)self.cards[#self.cards+1]=c;c.area=self end,remove_card=function(self,c)for i=#self.cards,1,-1 do if self.cards[i]==c then table.remove(self.cards,i);break end end;c.area=nil end}
end
function draw_card(from,to)G.E_MANAGER:add_event(Event({func=function()local c=table.remove(from.cards,1);if c then to:emplace(c)end;return true end}))end
local nativeEnd=Card.get_end_of_round_effect
function Card:get_end_of_round_effect(...)currentCard=self.id;return nativeEnd(self,...)end
local nativeSeal=Card.calculate_seal
function Card:calculate_seal(c)currentCard=self.id;return nativeSeal(self,c)end
local pools={Tarot={},Planet={}}
for k,v in pairs(centers)do v.key=k;if pools[v.set] and not v.wip and not v.skip_pool and not v.omit then pools[v.set][#pools[v.set]+1]=v end end
for _,p in pairs(pools)do table.sort(p,function(a,b)return a.order<b.order end)end
local function snapshot(c)return {id=c.id,center=c.config.center.key,front=c.config.card_key,rank=c.base.id,suit=c.base.suit,edition=c.edition and c.edition.type or 'base',seal=c.seal or 'base',playingCard=c.playing_card,added=c.added_to_deck or false,debuffed=c.debuff or false}end
local function construct(x,y,w,h,front,center,params)
 G.sort_id=(G.sort_id or 0)+1
 local self=setmetatable({id='created_'..G.sort_id,params=params or {},config={card=front or {},center=center},T={x=x,y=y,w=w,h=h},states={visible=true,drag={},hover={can=true}},children={center={pinch={}}},playing_card=params and params.playing_card,unique_val=G.sort_id},{__index=Card})
 self:set_ability(center,true);self:set_base(front,true)
 CTOR_DRAWS
 if center.consumeable then G.GAME.used_jokers[center.key]=true end
 created[#created+1]=self
 return self
end
setmetatable(Card,{__call=function(_,...)return construct(...)end})
local function drain()local i=1;while i<=#queue do assert(i<1000,'event overflow');local e=queue[i];phase='callback:'..i;e.func();i=i+1 end end
local function reset(seed,opts)
 draws={};queue={};created={};repeats={};phase='setup';money=0
 G={P_CENTERS=centers,P_CARDS=fronts,P_CENTER_POOLS=pools,ARGS={TEMP_POOL={}},CARD_W=1,CARD_H=1,C={SUITS={},WHITE={},RED={},FILTER={},BLUE={},CHIPS={},GREEN={},SECONDARY_SET={Planet={},Tarot={},Enhanced={}}},GAME={consumeable_buffer=0,used_jokers={},used_vouchers={},banned_keys={},pool_flags={},modifiers={},pseudorandom={seed=seed,hashed_seed=pseudohash(seed)},round_resets={ante=2},current_round={hands_played=opts.handsPlayed or 0},selected_back={pos={}},hands=copy_table(initialHands),last_hand_played=opts.handName or 'High Card'},playing_cards={},sort_id=0,playing_card=52}
 for _,h in pairs(G.GAME.hands)do h.played=1 end
 G.GAME.blind={debuff_card=function()end,set_blind=function()end}
 G.hand=area();G.play=area();G.deck=area();G.jokers=area(5);G.consumeables=area(opts.limit or 2)
 G.E_MANAGER={add_event=function(_,e)queue[#queue+1]=e end}
 for i=1,(opts.occupied or 0)do G.consumeables:emplace({id='owned_'..i,config={center=centers.c_fool}})end
 for _,k in ipairs(opts.owned or {})do G.GAME.used_jokers[k]=true end
 for _,k in ipairs(opts.banned or {})do G.GAME.banned_keys[k]=true end
 if opts.empty then for _,c in ipairs(pools.Tarot)do G.GAME.banned_keys[c.key]=true end end
 for i,key in ipairs(opts.jokers or {})do
  local j=Card(0,0,1,1,fronts.empty,centers[key]);j.id=key..':'..i;j.debuff=opts.debuffJokerIndex==i;j.area=G.jokers
  if key=='j_selzer'then j.ability.extra=opts.remaining or 10 end
  G.jokers.cards[#G.jokers.cards+1]=j
 end
 for i=1,(opts.count or 1)do
  local c=Card(0,0,1,1,fronts[opts.front or 'S_K'],centers[opts.heldKinds and opts.heldKinds[i] or opts.enhancement or 'c_base'],{playing_card=i});c.id='card_'..i;c:set_edition({[opts.edition or 'base']=true},nil,true);c:set_seal(opts.heldSeals and opts.heldSeals[i] or opts.seal,true);c.debuff=opts.debuffCard or false
  G.hand:emplace(c);G.playing_cards[#G.playing_cards+1]=c
 end
 created={};draws={};queue={};math.randomseed(42);phase='action'
end
local function json(v)
 if type(v)=='string'then return string.format('%q',v)end;if type(v)=='number'then return string.format('%.17g',v)end;if type(v)=='boolean'then return tostring(v)end;if v==nil then return 'null'end
 local r={};if #v>0 then for _,x in ipairs(v)do r[#r+1]=json(x)end;return '['..table.concat(r,',')..']'end
 for k,x in pairs(v)do r[#r+1]=json(k)..':'..json(x)end;table.sort(r);return '{'..table.concat(r,',')..'}'
end
local results={}
local function run(kind,seed,opts)
 reset(seed,opts);local before=state();local heldBefore={};for _,c in ipairs(G.hand.cards)do heldBefore[#heldBefore+1]=snapshot(c)end
 if kind=='endround'then
 ENDROUND
 elseif kind=='purple'then for _,c in ipairs(G.hand.cards)do c:calculate_seal({discard=true})end
 elseif kind=='dna'then local full={};for _,c in ipairs(G.hand.cards)do full[#full+1]=c end;for _,j in ipairs(G.jokers.cards)do j:calculate_joker({before=true,cardarea=G.jokers,full_hand=full,scoring_hand=full,scoring_name='High Card',poker_hands={}})end
 elseif kind=='marble'then for _,j in ipairs(G.jokers.cards)do j:calculate_joker({setting_blind=true,blind={boss=false}})end
 elseif kind=='seltzer'then for _,j in ipairs(G.jokers.cards)do j:calculate_joker({after=true,cardarea=G.jokers,full_hand={},scoring_hand={},scoring_name='High Card',poker_hands={}})end end
 local reserved=G.GAME.consumeable_buffer;drain()
 local additions,held,deck,owned,remaining={},{},{},{},{}
 for _,c in ipairs(created)do additions[#additions+1]=snapshot(c)end
 for _,c in ipairs(G.hand.cards)do held[#held+1]=c.id end
 for _,c in ipairs(G.deck.cards)do deck[#deck+1]=c.id end
 for _,j in ipairs(G.jokers.cards)do owned[#owned+1]=j.id;if j.ability.name=='Seltzer'then remaining[j.id]=j.ability.extra end end
 results[#results+1]={kind=kind,seed=seed,opts=opts,heldBefore=heldBefore,before=before,after=state(),draws=draws,streams=G.GAME.pseudorandom,reserved=reserved,bufferAfter=G.GAME.consumeable_buffer,created=additions,held=held,deck=deck,ownedJokers=owned,remaining=remaining,money=money,repeats=repeats,deckLimit=G.deck.config.card_limit,queuedEvents=#queue}
end
for _,seed in ipairs({'PIERROT1','AAAAAAA1','ARC291'})do
 for _,hand in ipairs({'High Card','Pair','Two Pair','Three of a Kind','Straight','Flush','Full House','Four of a Kind','Straight Flush','Five of a Kind','Flush House','Flush Five'})do
  run('endround',seed,{seal='Blue',handName=hand})
 end
 for _,occupied in ipairs({0,1,2})do for _,count in ipairs({1,2,3})do
  run('endround',seed,{seal='Blue',occupied=occupied,count=count,jokers={'j_mime'}})
  run('purple',seed,{seal='Purple',occupied=occupied,count=count})
 end end
 for _,opts in ipairs({{seal='Blue',owned={'c_pluto'}},{seal='Blue',banned={'c_pluto'}},{seal='Purple',empty=true},{seal='Purple',owned={'c_fool','c_magician','c_high_priestess','c_empress','c_emperor'},count=2}})do run(opts.seal=='Blue' and 'endround' or 'purple',seed,opts)end
 for _,js in ipairs({{'j_blueprint'}, {'j_mime'}, {'j_blueprint','j_mime'}, {'j_mime','j_brainstorm'}})do
  run('endround',seed,{enhancement='m_gold',seal='Red',jokers=js})
  run('endround',seed,{enhancement='m_gold',seal='Red',jokers=js,debuffCard=true})
 end
 for _,kinds in ipairs({{'m_gold','c_base'},{'c_base','m_gold'}})do
  run('endround',seed,{count=2,jokers={'j_mime'},heldKinds=kinds,heldSeals=kinds[1]=='m_gold' and {'Red','Blue'} or {'Blue','Red'}})
 end
 run('endround',seed,{seal='Blue',limit=3,count=3,jokers={'j_mime'}})
 run('purple',seed,{seal='Purple',limit=3,count=3})
 run('endround',seed,{seal='Blue',debuffCard=true})
 run('purple',seed,{seal='Purple',debuffCard=true})
 for _,js in ipairs({{'j_dna'}, {'j_blueprint','j_dna'}, {'j_dna','j_brainstorm'}, {'j_blueprint','j_blueprint','j_dna'}})do for _,hands in ipairs({0,1})do for _,count in ipairs({1,2})do
  run('dna',seed,{jokers=js,handsPlayed=hands,count=count,enhancement='m_steel',edition='polychrome',seal='Red'})
 end end end
 for _,js in ipairs({{'j_marble'}, {'j_blueprint','j_marble'}, {'j_marble','j_brainstorm'}})do run('marble',seed,{jokers=js})end
 for _,js in ipairs({{'j_selzer'}, {'j_blueprint','j_selzer'}, {'j_selzer','j_brainstorm'}})do for _,remaining in ipairs({1,2,10})do run('seltzer',seed,{jokers=js,remaining=remaining})end end
end
print(json(results))
'''.replace('CTOR_DRAWS',ctor_draws).replace('ENDROUND',endround)
script='Moveable={extend=function()return {}end,juice_up=function()end}\n'+card+'\n'+misc+'\n'+centers+fronts+hands+evalcard+creation+materialize+harness
with tempfile.NamedTemporaryFile('w',suffix='.lua')as f:
 f.write(script);f.flush();out=[json.loads(subprocess.check_output([a.luajit,f.name,mode],text=True))for mode in ['on','off']]
assert out[0]==out[1],'JIT on/off mismatch'
for case in out[0]:
 for name in ['draws','created','held','deck','ownedJokers','repeats']:
  if case[name]=={}:case[name]=[]
result={'cases':out[0],'source':{'filesSha256':PINNED_SOURCE_SHA256,'method':'Original Card calculate_joker/calculate_seal/get_end_of_round_effect, original endround held loop/get_current_pool/create_card/copy_card; extracted original constructor discard RNG and materialize synchronous prefix; explicitly admitted lifecycle callbacks drained FIFO; JIT on/off identical','limits':'Constructor graphics/discovery and area geometry adapters; native juice raw draw retained. Materialize stops before particles/audio/deferred visual events. Status popup visual RNG omitted. No full frame/event scheduler parity.'}}
payload=(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n').encode();pathlib.Path(a.output).write_bytes(gzip.compress(payload,mtime=0) if a.output.endswith('.gz') else payload)
