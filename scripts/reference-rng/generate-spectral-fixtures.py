#!/usr/bin/env python3
"""Conditional native Spectral use oracle; source is private and never retained.

Executes unchanged Card:can_use_consumeable and Card:use_consumeable. FIFO
semantic callbacks include edition juice; rendering/audio/update-frame callbacks
are excluded. Native constructor discard draws, juice, copy, generation, ability,
base and edition functions run unchanged. Joker add/remove passives run only in
explicit withPassives cases; Joker calculate reactions and blind updates are
excluded. Destruction/materialization use native
synchronous prefixes followed by area removal adapters. No production JS imports.
"""
import argparse, gzip, hashlib, json, pathlib, re, subprocess, tempfile
p=argparse.ArgumentParser()
p.add_argument('--assets',required=True,type=pathlib.Path)
p.add_argument('--luajit',required=True)
p.add_argument('--output',required=True,type=pathlib.Path)
a=p.parse_args()
names=['game.lua','card.lua','functions/common_events.lua','functions/misc_functions.lua']
PINNED_SOURCE_SHA256={'game.lua':'15ef486aa017ed99c31d2bacdb17846e77e6698d658182964bf7143e2e189e51','card.lua':'a3a613f90eca3e39042d28a70b129ece292644cbe79970e127e27c49bf4dee53','functions/common_events.lua':'6db2e23935413ff53c558a3b4674deff668603f695fd02b8de663d75bee0a4cd','functions/misc_functions.lua':'59f6c7e1ac7a9609eb99fbed1c00619a0ed103e8c647780cc9f9f7e5333c636c'}
for name,expected in PINNED_SOURCE_SHA256.items():
 if hashlib.sha256((a.assets/name).read_bytes()).hexdigest()!=expected:raise SystemExit('Native reference source hash mismatch: '+name)
game,card,common,misc=[(a.assets/name).read_text() for name in names]
def region(s,start,end):
 i=s.index(start);return s[i:s.index(end,i)]
def table(name,local):
 i=game.index('self.'+name+' = self.'+name+' or {');j=game.index('\n    }',i)+6
 return 'local self={FTP_LOCKED=false}\n'+game[i:j]+'\nlocal '+local+'=self.'+name+'\n'
ctor=region(card,'    self.discard_pos = {'," \n    self.facing = 'front'")
materialize=region(card,'function Card:start_materialize(', '    self.children.particles = Particles(')+'end\n'
dissolve=region(card,'function Card:start_dissolve(', '    local childParts = Particles(')+'G.E_MANAGER:add_event(Event({func=function()self:remove();return true end}))\nend\n'
shatter=region(card,'function Card:shatter()', '    local childParts = Particles(')+'G.E_MANAGER:add_event(Event({func=function()self:remove();return true end}))\nend\n'
# Original update-time eligibility block, without unrelated Card:update behavior.
update='function prepare_eligible(self)\n'+region(card, '    if self.ability.consumeable and self.ability.consumeable.max_highlighted then', '    if G.STAGE == G.STAGES.RUN then')+region(card[card.index('function Card:update(dt)'):],"        if self.ability.name == 'Ectoplasm' or self.ability.name == 'Hex' then", "        if self.ability.name == 'Blueprint' or self.ability.name == 'Brainstorm' then")+'end\n'
harness=r'''
local ffi=require('ffi');if arg[1]=='off'then jit.off()end
local queue,created,removed,draws,phase
local rawRandom=math.random
math.random=function(lo,hi)
 local value;if lo==nil then value=rawRandom()elseif hi==nil then value=rawRandom(lo)else value=rawRandom(lo,hi)end
 if draws then draws[#draws+1]={phase=phase,min=lo,max=hi,value=value}end
 return value
end
function localize(x)return type(x)=='string'and x or ''end
function play_sound()end
function delay()end
function Event(e)return e end
function check_for_unlock()end
function discover_card()end
function unlock_card()end
function stop_use()end
function set_consumeable_usage()end
function update_hand_text()end
function playing_card_joker_effects()end
function ease_dollars(n)G.GAME.dollars=G.GAME.dollars+n end
function Card:set_sprites()end
function Card:set_cost()end
function Card:flip()end
function Card:calculate_joker()end
local nativeAdd=Card.add_to_deck
local nativeRemove=Card.remove_from_deck
function Card:add_to_deck()if G.withPassives then nativeAdd(self)else
 self.added_to_deck=true
 if self.ability.set=='Joker'and self.edition and self.edition.negative then G.jokers.config.card_limit=G.jokers.config.card_limit+1 end
end end
function Card:remove()
 removed[#removed+1]=self.id
 if self.area then self.area:remove_card(self)end
 for i=#G.playing_cards,1,-1 do if G.playing_cards[i]==self then table.remove(G.playing_cards,i)end end
 if G.withPassives then nativeRemove(self)elseif self.ability.set=='Joker'and self.edition and self.edition.negative then G.jokers.config.card_limit=G.jokers.config.card_limit-1 end
 self.REMOVED=true
end
local function area(limit)
 return {cards={},highlighted={},T={x=0,y=0,w=1,h=1},config={card_limit=limit},emplace=function(self,c)self.cards[#self.cards+1]=c;c.area=self end,
 remove_card=function(self,c)for i=#self.cards,1,-1 do if self.cards[i]==c then table.remove(self.cards,i);break end end;c.area=nil end,
 change_size=function(self,n)self.config.real_card_limit=(self.config.real_card_limit or self.config.card_limit)+n;self.config.card_limit=math.max(0,self.config.real_card_limit)end,unhighlight_all=function(self)self.highlighted={}end}
end
local function construct(x,y,w,h,front,center,params)
 local ordinal=params and params.playing_card
 local c=setmetatable({id=ordinal and 'card_created_'..ordinal or 'new_joker_'..(#created+1),sort_id=ordinal or 100+#created+1,params=params or {},config={card=front or {},center=center},T={x=x,y=y,w=w,h=h},states={visible=true,hover={can=true}},children={center={pinch={}}},playing_card=ordinal},{__index=Card})
 c:set_ability(center,true);c:set_base(front,true)
 CTOR_DRAWS
 created[#created+1]=c
 return c
end
setmetatable(Card,{__call=function(_,...)return construct(...)end})
local nativeCopy=copy_card
function copy_card(other,...)
 local c=nativeCopy(other,...);c.copyOf=other.id;return c
end
local unlocked={};for k,v in pairs(centers)do unlocked[k]=v.unlocked end
local pools={Enhanced={},Joker={}};local rarityPools={{},{},{},{}}
for k,v in pairs(centers)do v.key=k;if pools[v.set] and not v.wip and not v.skip_pool and not v.omit then
 pools[v.set][#pools[v.set]+1]=v;if v.set=='Joker'then rarityPools[v.rarity][#rarityPools[v.rarity]+1]=v end
end end
for _,pool in pairs(pools)do table.sort(pool,function(a,b)return a.order<b.order end)end
for _,pool in pairs(rarityPools)do table.sort(pool,function(a,b)return a.order<b.order end)end
local function snapshot(c)
 return {id=c.id,center=c.config.center.key,front=c.config.card_key,rank=c.base.id,suit=c.base.suit,edition=c.edition and c.edition.type or 'base',seal=c.seal or 'base',eternal=c.ability.eternal or false,debuffed=c.debuff or false,playingCard=c.playing_card,copyOf=c.copyOf,toDoPokerHand=c.ability.to_do_poker_hand}
end
local function json(v)
 if type(v)=='string'then return string.format('%q',v)end;if type(v)=='number'then return string.format('%.17g',v)end;if type(v)=='boolean'then return tostring(v)end;if v==nil then return 'null'end
 local r={};if #v>0 then for _,x in ipairs(v)do r[#r+1]=json(x)end;return '['..table.concat(r,',')..']'end
 for k,x in pairs(v)do r[#r+1]=json(k)..':'..json(x)end;table.sort(r);return '{'..table.concat(r,',')..'}'
end
local inputs={INPUTS}
local results={}
for _,input in ipairs(inputs)do
 local o=input.opts;queue={};created={};removed={};draws=nil
 for k,v in pairs(centers)do v.unlocked=unlocked[k];if o.unlockedAll and v.set=='Joker'then v.unlocked=true end end
 G={withPassives=o.withPassives,P_CENTERS=centers,P_CARDS=fronts,P_CENTER_POOLS=pools,P_JOKER_RARITY_POOLS=rarityPools,ARGS={TEMP_POOL={}},CARD_W=1,CARD_H=1,
 C={SUITS={},WHITE={},RED={},GREEN={},BLACK={},ORANGE={},GOLD={},JOKER_GREY={},RARITY={{},{},{},{}},SECONDARY_SET={Spectral={},Tarot={},Planet={}}},
 CONTROLLER={locks={}},STATES={SELECTING_HAND=1,HAND_PLAYED=2,DRAW_TO_HAND=3,PLAY_TAROT=4},STATE=1,
 GAME={dollars=o.dollars or 20,ecto_minus=o.ectoMinus or 1,edition_rate=o.editionRate or 1,pseudorandom={seed=input.seed,hashed_seed=pseudohash(input.seed)},round_resets={ante=2},banned_keys={},used_jokers={},used_vouchers={},pool_flags={},modifiers={},selected_back={pos={}}},playing_cards={},playing_card=52}
 G.GAME.hands=copy_table(initialHands);G.GAME.current_round={free_rerolls=0};G.GAME.round_resets.discards=3;G.GAME.round_resets.hands=4;G.GAME.probabilities={normal=1};G.GAME.interest_amount=1;G.GAME.bankrupt_at=0
 G.GAME.blind={debuff_card=function()end,set_blind=function()end}
 G.hand=area(8);G.deck=area(52);G.play=area(52);G.jokers=area(o.jokerLimit or 5);G.consumeables=area(2)
 G.E_MANAGER={add_event=function(_,e)queue[#queue+1]=e end}
 for _,spec in ipairs(input.hand)do
  local c=Card(0,0,1,1,fronts[spec.front],centers[spec.center],{playing_card=spec.ordinal})
  c.id=spec.id;c.sort_id=spec.ordinal;c:set_edition({[spec.edition]=true},nil,true);c:set_seal(spec.seal~='base'and spec.seal or nil,true);c.debuff=spec.debuffed
  G.hand:emplace(c);G.playing_cards[#G.playing_cards+1]=c
 end
 for _,spec in ipairs(input.jokers)do
  local c=Card(0,0,1,1,fronts.empty,centers[spec.center]);c.id=spec.id;c.sort_id=spec.ordinal;c:set_edition({[spec.edition]=true},nil,true);c.ability.eternal=spec.eternal;c.debuff=spec.debuffed;if spec.toDoPokerHand then c.ability.to_do_poker_hand=spec.toDoPokerHand end;c.added_to_deck=false
  if G.withPassives then c:add_to_deck()else c.added_to_deck=true end
  if not G.withPassives and c.edition and c.edition.negative then G.jokers.config.card_limit=G.jokers.config.card_limit+1 end
  G.jokers:emplace(c);G.GAME.used_jokers[spec.center]=true
 end
 for _,key in ipairs(o.banned or {})do G.GAME.banned_keys[key]=true end
 if o.allEternal then G.GAME.modifiers.all_eternal=true end
 local source=Card(0,0,1,1,fronts.empty,centers[input.key]);source.id='spectral';source.debuff=o.debuffed or false;source.area=G.consumeables
 G.consumeables:emplace(source)
 for _,c in ipairs(G.hand.cards)do if c.id==input.target then G.hand.highlighted[#G.hand.highlighted+1]=c end end
 prepare_eligible(source)
 queue={};created={};removed={};draws={};phase='use';G.GAME.pseudorandom={seed=input.seed,hashed_seed=pseudohash(input.seed)};math.randomseed(17)
 local available=source:can_use_consumeable()
 if available then source:use_consumeable();local i=1;while i<=#queue do assert(i<1000,'event overflow');phase='callback:'..i;queue[i].func();i=i+1 end end
 local streams={};for k,v in pairs(G.GAME.pseudorandom)do if k~='seed'and k~='hashed_seed'then streams[k]=v end end
 local hand,jokers,additions={},{},{};for _,c in ipairs(G.hand.cards)do hand[#hand+1]=snapshot(c)end;for _,c in ipairs(G.jokers.cards)do jokers[#jokers+1]=snapshot(c)end;for _,c in ipairs(created)do additions[#additions+1]=snapshot(c)end
 local following={};local actionDraws=draws;draws=nil;for i=1,4 do following[#following+1]=math.random()end
 results[#results+1]={input=input,available=not not available,hand=hand,jokers=jokers,created=additions,removed=removed,handLimit=G.hand.config.card_limit,realHandLimit=G.hand.config.real_card_limit or G.hand.config.card_limit,jokerLimit=G.jokers.config.card_limit,deckLimit=G.deck.config.card_limit,dollars=G.GAME.dollars,ectoMinus=G.GAME.ecto_minus,streams=streams,followingMath=following,draws=actionDraws,queuedEvents=#queue}
end
print(json(results))
'''.replace('CTOR_DRAWS',ctor)

def lua(v):
 if isinstance(v,bool):return str(v).lower()
 if isinstance(v,str):return json.dumps(v)
 if isinstance(v,(int,float)):return str(v)
 if isinstance(v,list):return '{'+','.join(map(lua,v))+'}'
 return '{'+','.join('['+lua(k)+']='+lua(x)for k,x in v.items())+'}'
fronts=['C_2','D_A','H_K','S_7','C_J','D_5','H_T','S_Q']
suit_names={'C':'clubs','D':'diamonds','H':'hearts','S':'spades'}
rank_names={'T':10,'J':11,'Q':12,'K':13,'A':14}
base_fronts=sorted(s+'_'+r for s in 'CDHS' for r in ['2','3','4','5','6','7','8','9','T','J','Q','K','A'])
base_hand=[]
for index,front in enumerate(fronts):
 suit,rank=front.split('_');rank=rank_names.get(rank,int(rank)if rank.isdigit()else 0)
 base_hand.append(dict(id=f'card_{suit_names[suit]}_{rank}',front=front,ordinal=base_fronts.index(front)+1,center='c_base',edition='base',seal='base',debuffed=False))
base_hand=[base_hand[i]for i in [7,1,5,0,6,2,4,3]]
def joker(index,**extra):return dict(id=f'owned_j{index}',center=['j_joker','j_greedy_joker','j_lusty_joker','j_wrathful_joker','j_gluttenous_joker'][index-1],ordinal=100+index,edition='base',eternal=False,debuffed=False,**extra)
inputs=[]
def add(seed,key,mode,**opts):
 hand=json.loads(json.dumps(base_hand[:opts.pop('handCount',8)]));js=[joker(i)for i in opts.pop('jokerIndices',[3,1,2])]
 if opts.pop('decorated',False):
  for i,c in enumerate(hand):c.update(center=['m_glass','m_stone','m_steel','m_lucky'][i%4],edition=['foil','holo','polychrome','base'][i%4],seal=['Red','Blue','Gold','Purple'][i%4],debuffed=False)
 if opts.pop('mixedJokers',False):
  for j in js:j.update(eternal=j['id']=='owned_j2',debuffed=j['id']=='owned_j1',edition='negative'if j['id']=='owned_j3'else 'base')
 if opts.pop('allEternalOwned',False):
  for j in js:j['eternal']=True
 if opts.pop('allEditioned',False):
  for j in js:j['edition']='foil'
 if opts.pop('todoOnly',False):js=[joker(1)];js[0]['center']='j_todo_list';js[0]['toDoPokerHand']='Pair'
 if opts.pop('passiveJokers',False):
  js=[joker(1),joker(2),joker(3)];js[0]['center']='j_juggler';js[1]['center']='j_turtle_bean';js[2]['center']='j_stuntman'
 if opts.pop('negativeOnly',False):js=[joker(1)];js[0]['edition']='negative'
 inputs.append(dict(seed=seed,key=key,mode=mode,opts=opts,hand=hand,jokers=js,target=hand[0]['id']if hand else ''))
keys=['familiar','grim','incantation','cryptid','sigil','ouija','immolate','ankh','hex','ectoplasm','wraith']
for seed in ['PIERROT1','AAAAAAA1','ARC291','SPECTRAL1','SPECTRAL2','SPECTRAL3','SPECTRAL4','SPECTRAL5']:
 for name in keys:
  key='c_'+name
  for mode,opts in [('base',{}),('decorated',{'decorated':True,'mixedJokers':True}),('debuffed',{'debuffed':True})]:add(seed,key,mode,**opts)
  if name in ['familiar','grim','incantation','sigil','ouija','immolate']:
   for count in [0,1,2,5]:add(seed,key,'hand'+str(count),handCount=count)
  if name=='cryptid':add(seed,key,'no_target',handCount=0)
  if name in ['ankh','hex','ectoplasm','wraith']:
   add(seed,key,'no_jokers',jokerIndices=[]);add(seed,key,'one_joker',jokerIndices=[1]);add(seed,key,'eternal',allEternalOwned=True)
  if name=='ankh':
   add(seed,key,'slot_one',jokerLimit=1);add(seed,key,'full',jokerLimit=3,allEternalOwned=True);add(seed,key,'negative',negativeOnly=True)
  if name in ['hex','ectoplasm']:add(seed,key,'editioned',allEditioned=True)
  if name=='ectoplasm':add(seed,key,'repeat',ectoMinus=3)
  if name=='wraith':
   add(seed,key,'full',jokerLimit=3);add(seed,key,'negative_dollars',dollars=-12);add(seed,key,'zero_dollars',dollars=0);add(seed,key,'all_eternal',allEternal=True)
for seed in ['PIERROT1','AAAAAAA1','ARC291','SPECTRAL1','SPECTRAL2','SPECTRAL3','SPECTRAL4','SPECTRAL5']:
 add(seed,'c_ankh','todo',todoOnly=True)
 for key in ['c_ankh','c_hex']:
  add(seed,key,'passives',withPassives=True,passiveJokers=True,handCount=0)
 add(seed,'c_ectoplasm','negative_hand_size',ectoMinus=10)
 add(seed,'c_wraith','edition_boost',editionRate=100)
 rares=re.findall(r'(j_\w+)\s*=\s*\{[^\n]*rarity\s*=\s*3',game)
 add(seed,'c_wraith','stuntman_passive',withPassives=True,unlockedAll=True,banned=[k for k in rares if k!='j_stuntman'],handCount=0)
 add(seed,'c_wraith','empty_pool',banned=rares)
for i in range(1,101):
 add('WRAITH'+str(i),'c_wraith','unlocked',unlockedAll=True)
script='Moveable={extend=function()return {}end,juice_up=function()end}\n'+card+'\n'+misc+'\n'+table('P_CENTERS','centers')+table('P_CARDS','fronts')+'local initialHands='+region(game,'        hands = {','        }\n    }\nend').replace('        hands = ','',1)+'}\n'+region(common,'function get_current_pool(','\nfunction tutorial_info(')+region(common,'function create_playing_card(','\nfunction get_pack(')+materialize+dissolve+shatter+update+harness.replace('{INPUTS}',lua(inputs))
with tempfile.TemporaryDirectory(prefix='spectral-native-')as directory:
 path=pathlib.Path(directory)/'oracle.lua';path.write_text(script)
 results=[]
 for mode in ['on','off']:
  run=subprocess.run([a.luajit,str(path),mode],capture_output=True,text=True)
  if run.returncode:raise SystemExit(run.stderr)
  results.append(json.loads(run.stdout))
assert results[0]==results[1],'JIT on/off mismatch'
for case in results[0]:
 for key in ['hand','jokers']:
  if case['input'][key]=={}:case['input'][key]=[]
 for key in ['hand','jokers','created','removed','draws']:
  if case[key]=={}:case[key]=[]
result={'runtime':subprocess.run([a.luajit,'-v'],capture_output=True,text=True,check=True).stdout.strip(),'scope':__doc__,'sourceSha256':{name:hashlib.sha256((a.assets/name).read_bytes()).hexdigest()for name in names},'jitEquality':True,'cases':results[0]}
payload=(json.dumps(result,separators=(',',':'))+'\n').encode()
a.output.write_bytes(gzip.compress(payload,mtime=0)if a.output.suffix=='.gz'else payload)
print(f'Wrote {len(inputs)} native Spectral cases to {a.output}')
