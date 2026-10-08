#!/usr/bin/env python3
"""Conditional shop-generation oracle: original selection functions, explicit adapter.
No original source is kept in the repository. This is not a full Android-game run.
"""
import argparse,hashlib,json,pathlib,subprocess,tempfile,zipfile
p=argparse.ArgumentParser();p.add_argument('--apk',required=True);p.add_argument('--luajit',required=True);p.add_argument('--output',required=True);a=p.parse_args()
with zipfile.ZipFile(a.apk) as z:
 def read(n):return z.read('assets/'+n).decode().replace('\r\n','\n')
 misc=read('functions/misc_functions.lua');common=read('functions/common_events.lua');ui=read('functions/UI_definitions.lua');game=read('game.lua');card=read('card.lua')
 def region(s,start,end):return s[s.index(start):s.index(end,s.index(start))]
 # Catalogue region also includes intervening unrelated declarations? Restrict at closing table.
 start=game.index('self.P_CENTERS = self.P_CENTERS or {');end=game.index('\n    }',start)+6
 prefix='local self={FTP_LOCKED=false}\n'+game[start:end]+'\nlocal original_centers=self.P_CENTERS\n'
 original='\n'.join([
 region(misc,'function EMPTY(t)','\nfunction '),
 region(misc,'function copy_table(O)','\nfunction '),
 region(misc,'function find_joker(name','\nfunction '),
 region(misc,'function pseudorandom_element(_t','\nfunction random_string('),
 region(misc,'function pseudohash(str)','\nfunction tprint('),
 region(common,'function get_next_voucher_key(','\nfunction get_next_tag_key('),
 region(common,'function get_pack(','\nfunction copy_card('),
 region(ui,'  function create_card_for_shop(area)','\n  function create_shop_card_ui('),
 ])
 cardmethods=region(card,'function Card:set_ability(center','\nfunction Card:set_edition(')
harness=r'''
local function json(v)
 if type(v)=='string' then return '"'..v:gsub('\\','\\\\'):gsub('"','\\"'):gsub('\n','\\n')..'"' end
 if type(v)=='number' then return string.format('%.17g',v) end
 if type(v)=='boolean' then return tostring(v) end
 if v==nil then return 'null' end
 local parts={};local count=0;for _ in pairs(v) do count=count+1 end
 if count>0 and #v==count then for _,x in ipairs(v) do parts[#parts+1]=json(x) end;return '['..table.concat(parts,',')..']' end
 local keys={};for k in pairs(v) do keys[#keys+1]=k end;table.sort(keys)
 for _,k in ipairs(keys) do parts[#parts+1]=json(k)..':'..json(v[k]) end
 return '{'..table.concat(parts,',')..'}'
end
local trace={}
local native_random,native_seed=math.random,math.randomseed
math.random=function(...) local args={...};local v=native_random(...);trace[#trace+1]={kind='random',args=args,value=v};return v end
math.randomseed=function(v) trace[#trace+1]={kind='randomseed',seed=v};return native_seed(v) end
local native_pseudoseed=pseudoseed
pseudoseed=function(key,...) local v=native_pseudoseed(key,...);trace[#trace+1]={kind='pseudoseed',key=key,value=v};return v end
function Event(x)return x end
function create_shop_card_ui()end
function check_for_unlock(args) assert(G.GAME.seeded,'unseeded unlock is outside oracle scope') end
local function area()return {T={x=0,y=0,w=1},cards={},config={type='shop'},emplace=function(self,c)self.cards[#self.cards+1]=c;c.area=self end}end
Card=setmetatable({}, {__call=function(_,x,y,w,h,front,center,params)
 local c=setmetatable({T={x=x,y=y,w=w,h=h},config={card=front or {}},params=params or {},facing='front'},{__index=Card})
 c:set_ability(center,true)
 assert(not center.pos or not center.pos.v,'random sprite variant requires fuller adapter')
 for i=1,3 do math.random() end -- Card:init discard rotation/x/y.
 c:set_cost();return c
end})
function Card:set_sprites()end
function Card:start_materialize()self:juice_up()end
function Card:juice_up()if not G.SETTINGS.reduced_motion then pseudorandom_element({0.24,-0.24}) end end
function Card:set_eternal(v)self.ability.eternal=v end
function Card:set_perishable(v)self.ability.perishable=v end
function Card:set_rental(v)self.ability.rental=v end
function Card:set_edition(v)self.edition=v;self:set_cost()end
'''
setup=r'''
local results={}
for _,reduced in ipairs({false,true}) do
 for _,seed in ipairs({'AAAAAAA1','PIERROT1','12345678'}) do
  trace={}
  local centers=copy_table(original_centers)
  local pools={Joker={},Tarot={},Planet={},Voucher={},Booster={},Enhanced={},Spectral={}}
  local rarities={{},{},{},{}}
  for key,v in pairs(centers) do
   v.key=key;v.demo=nil
   if type(v.unlocked)=='boolean' and v.start_locked then v.unlocked=false end
   if type(v.discovered)=='boolean' and not v.start_discovered then v.discovered=false end
   if v.set=='Joker' then pools.Joker[#pools.Joker+1]=v end
   if not v.wip then
    if pools[v.set] and v.set~='Joker' and not v.skip_pool and not v.omit then pools[v.set][#pools[v.set]+1]=v end
    if v.set=='Joker' and v.rarity then rarities[v.rarity][#rarities[v.rarity]+1]=v end
   end
  end
  for _,pool in pairs(pools) do table.sort(pool,function(a,b)return a.order<b.order end) end
  for _,pool in ipairs(rarities) do table.sort(pool,function(a,b)return a.order<b.order end) end
  local hands={}
  for _,name in ipairs({'High Card','Pair','Two Pair','Three of a Kind','Straight','Flush','Full House','Four of a Kind','Straight Flush','Five of a Kind','Flush House','Flush Five'}) do
   hands[name]={played=name=='High Card' and 1 or 0,visible=name~='Five of a Kind' and name~='Flush House' and name~='Flush Five'}
  end
  G={P_CENTERS=centers,P_CENTER_POOLS=pools,P_JOKER_RARITY_POOLS=rarities,P_CARDS={empty={}},ARGS={TEMP_POOL={}},
   CARD_W=1,CARD_H=1,SETTINGS={tutorial_complete=true,reduced_motion=reduced},
   GAME={seeded=true,round_resets={ante=1},pseudorandom={seed=seed,hashed_seed=pseudohash(seed)},
    used_jokers={},used_vouchers={},banned_keys={},pool_flags={},edition_rate=1,modifiers={},tags={},
    selected_back={pos={x=0,y=0}},inflation=0,discount_percent=0,hands=hands,hands_played=1,
    joker_rate=20,tarot_rate=4,planet_rate=4,playing_card_rate=0,spectral_rate=0},
   jokers=area(),consumeables=area(),shop_jokers=area(),shop_vouchers=area(),shop_booster=area(),
   playing_cards={{config={center=centers.c_base}}},E_MANAGER={add_event=function()end}}
  assert(#pools.Joker==150 and #pools.Booster==32 and #pools.Voucher==32,'full catalogue missing')
  -- Voucher selected at start_run, before gameplay and shop. Different keyed draws
  -- cannot affect its key, which has never advanced in this no-skip first round.
  local voucher=get_next_voucher_key()
  local function summary(c)return {key=c.config.center.key,set=c.ability.set,edition=c.edition or false,cost=c.cost,sell_cost=c.sell_cost,to_do=c.ability.to_do_poker_hand} end
  local items={}
  for i=1,2 do local c=create_card_for_shop(G.shop_jokers);G.shop_jokers:emplace(c);items[#items+1]=summary(c) end
  local vc=Card(0,0,1,1,nil,centers[voucher],{});vc:start_materialize();G.shop_vouchers:emplace(vc)
  local packs={}
  for i=1,2 do local pc=Card(0,0,1,1,nil,get_pack('shop_pack'),{});pc:start_materialize();G.shop_booster:emplace(pc);packs[#packs+1]=summary(pc) end
  local first_trace=copy_table(trace);trace={}
  -- remove() clears used names when no owned Joker/consumable retains them.
  for _,c in ipairs(G.shop_jokers.cards) do
   for key,v in pairs(centers) do if v.name==c.ability.name then G.GAME.used_jokers[key]=nil end end
  end
  G.shop_jokers.cards={}
  local reroll={}
  for i=1,2 do local c=create_card_for_shop(G.shop_jokers);G.shop_jokers:emplace(c);c:juice_up();reroll[#reroll+1]=summary(c) end
  local counts={};for key,pool in pairs(pools)do counts[key]=#pool end
  results[#results+1]={seed=seed,reduced_motion=reduced,profile='fresh meta; explicit seeded run; high-card-only first win',
   pool_counts=counts,items=items,voucher=summary(vc),packs=packs,reroll_items=reroll,first_trace=first_trace,reroll_trace=trace,key_state=G.GAME.pseudorandom}
 end
end
print(json(results))
'''
with tempfile.TemporaryDirectory(prefix='pierrot-private-shop-') as d:
 script=pathlib.Path(d)/'oracle.lua';script.write_text(prefix+'\n'+original+'\n'+harness+'\n'+cardmethods+'\n'+setup)
 results=json.loads(subprocess.check_output([a.luajit,str(script)],text=True))
 script.write_text('jit.off()\n'+script.read_text())
 interpreter=json.loads(subprocess.check_output([a.luajit,str(script)],text=True))
 if results!=interpreter:raise SystemExit('JIT/interpreter disagreement')
 data={'apk_sha256':hashlib.sha256(pathlib.Path(a.apk).read_bytes()).hexdigest(),'runtime_commit':'43d0a19158ceabaa51b0462c1ebc97612b420a2e','jit_interpreter_equal':True,'scope':'conditional original selection/card-ability/pricing oracle; rendering/materialize/constructor adapter; NOT full game execution','cases':results}
 pathlib.Path(a.output).write_text(json.dumps(data,indent=2)+'\n')
 print('PASS',len(results),'conditional shop+reroll cases; full150 Joker/32 Voucher/32 Booster pools')
