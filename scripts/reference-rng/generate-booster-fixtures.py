#!/usr/bin/env python3
"""Independent original-function remaining-pack oracle; retains numerical facts only."""
import argparse,gzip,hashlib,json,pathlib,subprocess,tempfile
p=argparse.ArgumentParser()
p.add_argument('--assets',required=True,type=pathlib.Path)
p.add_argument('--luajit',required=True)
p.add_argument('--output',required=True,type=pathlib.Path)
a=p.parse_args()
def read(name):return (a.assets/name).read_text()
def region(s,start,end):
 i=s.index(start);return s[i:s.index(end,i)]
game,misc,common,card=map(read,['game.lua','functions/misc_functions.lua','functions/common_events.lua','card.lua'])
def table(name):
 start=game.index('self.'+name+' = self.'+name+' or {');return game[start:game.index('\n    }',start)+6]
source='local self={FTP_LOCKED=false}\n'+table('P_CENTERS')+'\n'+table('P_CARDS')+'\nlocal centers,fronts=self.P_CENTERS,self.P_CARDS\n'
source+='\n'.join([region(misc,'function EMPTY(t)','\nfunction '),region(misc,'function copy_table(O)','\nfunction '),region(misc,'function find_joker(name','\nfunction '),region(misc,'function pseudorandom_element(_t','\nfunction random_string('),region(misc,'function pseudohash(str)','\nfunction tprint('),region(common,'function get_current_pool(','\nfunction copy_card(')])
source+=r'''
local function json(v)
 if type(v)=='string'then return '"'..v:gsub('\\','\\\\'):gsub('"','\\"')..'"'end
 if type(v)=='number'then return string.format('%.17g',v)end
 if type(v)=='boolean'then return tostring(v)end
 if v==nil then return 'null'end
 local count=0;for _ in pairs(v)do count=count+1 end
 local out={}
 if count>0 and #v==count then for _,x in ipairs(v)do out[#out+1]=json(x)end;return '['..table.concat(out,',')..']'end
 local keys={};for k in pairs(v)do keys[#keys+1]=k end;table.sort(keys)
 for _,k in ipairs(keys)do out[#out+1]=json(k)..':'..json(v[k])end
 return '{'..table.concat(out,',')..'}'
end
-- Explicit hands traversal boundary, matching supplied visibleHandOrder. Lua table
-- hash layouts differ between processes; this order is context, not selection logic.
local native_pairs=pairs
local hand_order={'Straight','Flush','Full House','Four of a Kind','Straight Flush','High Card','Pair','Two Pair','Three of a Kind'}
function pairs(t)
 if G and G.GAME and t==G.GAME.hands then
  local i=0;return function()i=i+1;local k=hand_order[i];if k then return k,t[k]end end
 end
 return native_pairs(t)
end
function check_for_unlock()end
function Event(e)return e end
Card=setmetatable({}, {__call=function(_,x,y,w,h,front,center)
 local c=setmetatable({T={},config={card=front or {}},params={},facing='front'},{__index=Card})
 c:set_ability(center,true)
 for i=1,3 do math.random()end
 c:set_cost();return c
end})
function Card:set_sprites()end
function Card:start_materialize()math.random()end
function Card:set_edition(v)self.edition=v;self:set_cost()end
function Card:set_seal(v)self.seal=v;self:set_cost()end
'''
source+=region(card,'function Card:set_ability(center','\nfunction Card:set_edition(')
source+=region(card,'function Card:set_eternal(','\nfunction Card:set_debuff(')
source+=r'''
local pools={Joker={},Enhanced={},Spectral={}}
local rarities={{},{},{},{}}
for k,v in pairs(centers)do
 v.key=k;v.demo=nil
 if v.start_locked then v.unlocked=false end
 if pools[v.set] and not v.wip and not v.skip_pool and not v.omit then table.insert(pools[v.set],v)end
 if v.set=='Joker'and not v.wip then table.insert(rarities[v.rarity],v)end
end
for _,pool in pairs(pools)do table.sort(pool,function(a,b)return a.order<b.order end)end
for _,pool in ipairs(rarities)do table.sort(pool,function(a,b)return a.order<b.order end)end
for k,v in pairs(fronts)do v.key=k end
local function setup(seed,mode)
 G={P_CENTERS=centers,P_CARDS=fronts,P_CENTER_POOLS=pools,P_JOKER_RARITY_POOLS=rarities,ARGS={TEMP_POOL={}},CARD_W=1,CARD_H=1,C={WHITE={}},SETTINGS={GAMESPEED=1},
 GAME={seeded=true,pseudorandom={seed=seed,hashed_seed=pseudohash(seed)},round_resets={ante=2},banned_keys={},used_jokers={},used_vouchers={},pool_flags={},modifiers={},selected_back={pos={}},edition_rate=1,inflation=0,discount_percent=0,hands={},perishable_rounds=5},
 jokers={cards={}},consumeables={cards={}},playing_cards={},E_MANAGER={add_event=function()end}}
 G.pack_cards={T={x=0,y=0,w=1}}
 for _,name in ipairs({'High Card','Pair','Two Pair','Three of a Kind','Straight','Flush','Full House','Four of a Kind','Straight Flush'})do G.GAME.hands[name]={visible=true,played=0}end
 if mode=='owned'or mode=='showman'then
  for _,key in ipairs({'j_joker','j_greedy_joker','j_lusty_joker','c_incantation','c_familiar','c_soul','c_black_hole'})do G.GAME.used_jokers[key]=true end
 end
 if mode=='showman'then G.jokers.cards={{ability={name='Showman'}}}end
 if mode=='banned'then for _,key in ipairs({'j_joker','j_greedy_joker','c_soul','c_familiar','m_bonus'})do G.GAME.banned_keys[key]=true end end
 if mode=='stake'or mode=='eternal'then
  G.GAME.modifiers={all_eternal=mode=='eternal',enable_eternals_in_shop=true,enable_perishables_in_shop=true,enable_rentals_in_shop=true}
  G.GAME.inflation=2;G.GAME.discount_percent=25;G.GAME.edition_rate=4
 end
 if mode=='empty'then for _,set in ipairs({'Joker','Spectral'})do for _,c in ipairs(pools[set])do G.GAME.banned_keys[c.key]=true end end;G.GAME.banned_keys.c_soul=true end
 math.randomseed(17)
end
for n=1,101 do for _,kind in ipairs({'Standard','Buffoon','Spectral'})do for _,size in ipairs({kind=='Standard'and 3 or 2,kind=='Standard'and 5 or 4})do for _,mode in ipairs({'base','owned','showman','banned','stake','eternal','empty'})do
 local seed='BOOST'..(n==101 and 244 or n);setup(seed,mode)
 local self={ability={name=kind..' Pack'},T={x=0,y=0}};local _size=size;local pack_cards={}
'''
source+=region(card,'                for i = 1, _size do','                return true\n            end}))')
source+=r'''
 local cards={}
 for _,c in ipairs(pack_cards)do
  local e=c.edition;local edition=e and(e.holo and 'holographic'or e.foil and 'foil'or e.polychrome and 'polychrome'or 'negative')or 'base'
  cards[#cards+1]={entityId=c.config.center.key,frontKey=c.config.card.key,edition=edition,seal=c.seal and string.lower(c.seal),eternal=c.ability.eternal or nil,perishable=c.ability.perishable or nil,rental=c.ability.rental or nil,cost=c.cost,sellCost=c.sell_cost,toDoPokerHand=c.ability.to_do_poker_hand}
 end
 local streams={};for k,v in pairs(G.GAME.pseudorandom)do if k~='seed'and k~='hashed_seed'then streams[k]=v end end
 local following={};for i=1,4 do following[i]=math.random()end
 io.write(json({seed=seed,kind=kind,size=size,mode=mode,cards=cards,streams=streams,followingMath=following}),'\n')
end end end end
'''
with tempfile.TemporaryDirectory(prefix='booster-native-')as directory:
 script=pathlib.Path(directory)/'oracle.lua';script.write_text(source)
 result=subprocess.check_output([a.luajit,str(script)],text=True)
 script.write_text('jit.off()\n'+source)
 interpreted=subprocess.check_output([a.luajit,str(script)],text=True)
 cases=[json.loads(line)for line in result.splitlines()]
 assert cases==[json.loads(line)for line in interpreted.splitlines()],'JIT/interpreter disagreement'
data={'scope':'Original APK get_current_pool/create_card/poll_edition/set_ability/set_cost/set_eternal/set_perishable/set_rental and full pack loop; constructor adapter consumes three init draws; synchronous start_materialize one raw draw. Edition/seal queued events/render/audio omitted. Ante2, math.randomseed17.', 'jitInterpreterEqual':True,'sourceSha256':{name:hashlib.sha256((a.assets/name).read_bytes()).hexdigest()for name in ['game.lua','card.lua','functions/common_events.lua','functions/misc_functions.lua']},'cases':cases}
serialized=(json.dumps(data,separators=(',',':'))+'\n').encode()
if a.output.suffix=='.gz':a.output.write_bytes(gzip.compress(serialized,mtime=0))
else:a.output.write_bytes(serialized)
print(f'Wrote {len(cases)} native cases to {a.output}')
