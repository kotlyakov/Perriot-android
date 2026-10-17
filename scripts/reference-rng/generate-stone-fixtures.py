#!/usr/bin/env python3
"""Private native Stone getter oracle, not a full APK/event-loop emulator.

Loads original methods only from --assets; commits no original Lua source.
"""
import gzip,argparse, hashlib, json, pathlib, re, subprocess, tempfile
p=argparse.ArgumentParser()
p.add_argument('--assets', required=True);p.add_argument('--luajit', required=True);p.add_argument('--output', required=True)
a=p.parse_args();assets=pathlib.Path(a.assets)
def read(n):return (assets/n).read_text().replace('\r\n','\n')
def region(s,start,end):
 i=s.index(start);return s[i:s.index(end,i)]
game,card,misc,events=map(read,['game.lua','card.lua','functions/misc_functions.lua','functions/state_events.lua'])
i=game.index('self.P_CENTERS = self.P_CENTERS or {');j=game.index('\n    }',i)+6
centers='local self={FTP_LOCKED=false}\n'+game[i:j]+'\nlocal centers=self.P_CENTERS\n'
keys=re.search(r'const NATIVE_JOKERS=Object.freeze\(\[(.*?)\]\)',pathlib.Path('src/content/jokers.js').read_text()).group(1)
keys=re.findall("'([^']+)'",keys)
cloud=region(card,'        if self.ability.name == "Cloud 9" then','        if self.ability.name == "Stone Joker" then')
harness=r'''
local ffi=require('ffi')
if arg[1]=='off' then jit.off() end
local rawRandom=math.random
local function state()
 local _,u=debug.getupvalue(rawRandom,1);local w=ffi.cast('uint32_t*',u);local r={}
 for i=0,3 do r[#r+1]=string.format('%08x%08x',tonumber(w[2*i+1]),tonumber(w[2*i]))end
 return r
end
local draws,phase,cardid
math.random=function(lo,hi)local n;if lo==nil then n=rawRandom()elseif hi==nil then n=rawRandom(lo)else n=rawRandom(lo,hi)end;draws[#draws+1]={phase=phase,cardId=cardid,min=lo,max=hi,value=n};return n end
function copy_table(o)if type(o)~='table'then return o end local r={}for k,v in pairs(o)do r[k]=copy_table(v)end return r end
function localize()return ''end
function Card:set_sprites()end
function find_joker(name)local r={}for _,j in ipairs(G.jokers.cards)do if j.ability.name==name and not j.debuff then r[#r+1]=j end end return r end
local nativeID=Card.get_id
function Card:get_id()local prev=cardid;cardid=self.id;local x=nativeID(self);cardid=prev;return x end
local function reset(seed)
 math.randomseed(seed);draws={};phase='reset';cardid=nil
 G={P_CENTERS=centers,C={RED={},MULT={},CHIPS={}},FUNCS={},GAME={used_jokers={},probabilities={normal=1},current_round={discards_left=3},hands_played=0},jokers={cards={},config={card_limit=5}},hand={cards={}},play={},deck={cards={}}}
end
local function playing(i,stone,debuff)
 return setmetatable({id='c'..i,base={id=i+1,nominal=i+1,suit='Spades',suit_nominal=1,face_nominal=0},ability={set='Default',name=stone and 'Stone Card' or 'Default Base',effect=stone and 'Stone Card' or ''},config={center={name=stone and 'Stone Card' or 'Default Base'}},unique_val=i,debuff=debuff,T={x=i}},{__index=Card})
end
local function joker(key,debuff)
 local c=setmetatable({id=key,params={},config={card={}},T={h=1,w=1}},{__index=Card});c:set_ability(assert(centers[key],key),true);c.debuff=debuff;return c
end
local function json(v)
 if type(v)=='string'then return string.format('%q',v)end
 if type(v)=='number'then return string.format('%.17g',v)end
 if type(v)=='boolean'then return tostring(v)end
 if v==nil then return 'null'end
 local r={};if #v>0 then for _,x in ipairs(v)do r[#r+1]=json(x)end return '['..table.concat(r,',')..']'end
 for k,x in pairs(v)do r[#r+1]=json(k)..':'..json(x)end;table.sort(r);return '{'..table.concat(r,',')..'}'
end
local results={recognition={},individual={},cloudUpdate={},career={},mixed={}}
for _,seed in ipairs({42,1,918273})do
 for _,deb in ipairs({false,true})do
  reset(seed);phase='preplay-career-face';local c=playing(1,true,deb);local before=state();local face=c:is_face()
  results.career[#results.career+1]={seed=seed,cardDebuffed=deb,before=before,after=state(),drawCount=#draws,draws=draws,isFace=face or false}
 end
 for n=1,5 do for stones=1,n do for _,four in ipairs({false,true})do
  reset(seed);local cards={};for i=1,n do cards[i]=playing(i,i<=stones)end
  if four then G.jokers.cards={joker('j_four_fingers')}end
  phase='recognition';local before=state();local poker=evaluate_poker_hand(cards)
  local names={};for k,v in pairs(poker)do if k~='top' and next(v)then names[#names+1]=k end end;table.sort(names)
  results.recognition[#results.recognition+1]={seed=seed,count=n,stones=stones,fourFingers=four,before=before,after=state(),drawCount=#draws,draws=draws,contains=names}
 end end end
 for _,key in ipairs(KEYS)do for _,areaName in ipairs({'play','hand'})do for _,debuffCard in ipairs({false,true})do for _,debuffJoker in ipairs({false,true})do
  reset(seed);local c=playing(1,true,debuffCard);G.hand.cards={c};local j=joker(key,debuffJoker);G.jokers.cards={j}
  phase=areaName;local before=state();j:calculate_joker({individual=true,cardarea=G[areaName],other_card=c,scoring_hand={c}})
  results.individual[#results.individual+1]={seed=seed,key=key,area=areaName,cardDebuffed=debuffCard,jokerDebuffed=debuffJoker,before=before,after=state(),drawCount=#draws,draws=draws}
 end end end end
 for _,sequence in ipairs({'stone-lucky','lucky-stone','stone-glass','glass-stone','stone-lucky-stone-glass-stone'})do
  reset(seed);G.GAME.pseudorandom={seed='PIERROT1',hashed_seed=pseudohash('PIERROT1')};G.E_MANAGER={add_event=function()end};Event=function(x)return x end
  local stone=playing(1,true);local lucky=playing(2,false);lucky.ability={set='Enhanced',name='Lucky Card',effect='Lucky Card',mult=20,p_dollars=20}
  local before=state();local outputs={}
  for action in sequence:gmatch('[^-]+')do
   phase=action
   if action=='stone'then outputs[#outputs+1]={action=action,id=stone:get_id()}
   elseif action=='lucky'then outputs[#outputs+1]={action=action,mult=lucky:get_chip_mult(),dollars=lucky:get_p_dollars()}
   else outputs[#outputs+1]={action=action,roll=pseudorandom('glass')}end
  end
  results.mixed[#results.mixed+1]={seed=seed,sequence=sequence,before=before,after=state(),drawCount=#draws,draws=draws,outputs=outputs,streams=G.GAME.pseudorandom}
 end
 for _,updates in ipairs({0,1,2,5})do for _,deb in ipairs({false,true})do
  reset(seed);local c=playing(1,true);G.playing_cards={c,playing(2,false),playing(3,true)};local j=joker('j_cloud_9',deb)
  phase='cloud-update';local before=state();for i=1,updates do cloud_update(j)end
  results.cloudUpdate[#results.cloudUpdate+1]={seed=seed,updates=updates,jokerDebuffed=deb,before=before,after=state(),drawCount=#draws,draws=draws,tally=j.ability.nine_tally}
 end end
end
print(json(results))
'''.replace('KEYS','{'+','.join("'"+k+"'" for k in keys)+'}')
script='Moveable={extend=function()return {}end}\n'+card+'\n'+misc+'\n'+centers+'\nfunction cloud_update(self)\n'+cloud+'\nend\n'+harness
with tempfile.NamedTemporaryFile('w',suffix='.lua')as f:
 f.write(script);f.flush()
 outputs=[json.loads(subprocess.check_output([a.luajit,f.name,mode],text=True))for mode in ['on','off']]
assert outputs[0]==outputs[1],'JIT on/off mismatch'
r=outputs[0]
for group in r.values():
 for case in group:
  if case['draws']=={}:case['draws']=[]
  if case['drawCount']==0:
   del case['before'];del case['after'];del case['draws']
r['source']={'filesSha256':{n:hashlib.sha256((assets/n).read_bytes()).hexdigest()for n in ['card.lua','game.lua','functions/misc_functions.lua']},'nativeJokerKeys':keys,'method':'Original evaluate_poker_hand and Card:calculate_joker; exact extracted Cloud9 update branch; prescribed mixed native Lucky getters and pseudorandom glass probes; raw math.random instrumentation; JIT on/off identical','limits':'No full state_events/UI/update scheduler; no integrated round/scorer replay parity. Individual-play probes include debuffed card cases which outer scored loop normally skips.'}
payload=(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n').encode()
pathlib.Path(a.output).write_bytes(gzip.compress(payload,mtime=0) if a.output.endswith('.gz') else payload)
print({k:len(v)for k,v in r.items()if isinstance(v,list)})
