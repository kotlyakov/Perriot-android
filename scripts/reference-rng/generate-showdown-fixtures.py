#!/usr/bin/env python3
"""Private native hook oracle: temporary extraction, explicit non-rendering adapters.

No JS implementation is imported. Native Event/EventManager and delay execute against an explicit clock/Object
adapter; sounds/rendering are inert. This proves the extracted callback contract,
not Android/LÖVE execution or all setting_blind Joker effects.
"""
import argparse, hashlib, json, pathlib, subprocess, tempfile
p = argparse.ArgumentParser()
p.add_argument('--assets', required=True)
p.add_argument('--luajit', required=True)
p.add_argument('--output', required=True)
a = p.parse_args()
assets = pathlib.Path(a.assets)
def source(name):
    return (assets / name).read_text().replace('\r\n', '\n')
def region(text, start, end):
    return text[text.index(start):text.index(end, text.index(start))]
misc, blind, events, area = map(source, ['functions/misc_functions.lua', 'blind.lua', 'functions/state_events.lua', 'cardarea.lua'])
extracted = '\n'.join([
    source('engine/event.lua'),
    region(source('functions/common_events.lua'), 'function delay(time, queue)', '\nfunction '),
    region(misc, 'function pseudohash(str)', '\nfunction tprint('),
    region(misc, 'function pseudoshuffle(list, seed)', '\nfunction generate_starting_seed()'),
    region(misc, 'function pseudorandom_element(_t, seed)', '\nfunction random_string('),
    region(misc, 'function get_blind_amount(ante)', '\nfunction score_number_scale('),
    region(source('engine/string_packer.lua'), 'function STR_PACK(', '\nfunction load_local_file('),
    region(blind, 'function Blind:press_play()', '\nfunction Blind:modify_hand('),
    region(blind, 'function Blind:drawn_to_hand()', '\nfunction Blind:stay_flipped('),
    region(blind, 'function Blind:disable()', '\nfunction Blind:wiggle('),
    region(blind, 'function Blind:debuff_card(', '\nfunction Blind:move('),
    region(area, 'function CardArea:shuffle(', '\nfunction CardArea:sort('),
    # Execute the original relevant set_blind callback, not a rewritten shuffle.
    'function Blind:setup_acorn(reset)\n' + region(blind, "    if self.name == 'Amber Acorn' and not reset", '\n    --add new debuffs') + '\nend',
    'function setup_round()\n' + region(events, '            G.GAME.blind:set_blind(G.GAME.round_resets.blind)', '\n            return true\n            end\n        }))\nend') + '\nend',
])
harness = r'''
local ffi=require('ffi')
if arg[1]=='off' then jit.off() end
local function json(v)
 if type(v)=='string' then return string.format('%q',v) end
 if type(v)=='number' then return string.format('%.17g',v) end
 if type(v)=='boolean' then return tostring(v) end
 if v==nil then return 'null' end
 local list={}; if #v>0 or (getmetatable(v) or {}).array then for _,x in ipairs(v)do list[#list+1]=json(x)end;return '['..table.concat(list,',')..']' end
 for k,x in pairs(v)do list[#list+1]=json(k)..':'..json(x)end;table.sort(list);return '{'..table.concat(list,',')..'}'
end
local function state()
 local _,u=debug.getupvalue(math.random,1);local words=ffi.cast('uint32_t*',u);local out={}
 for i=0,3 do out[#out+1]=string.format('%08x%08x',tonumber(words[i*2+1]),tonumber(words[i*2]))end
 return out
end
local function ids(cards)local out=setmetatable({},{array=true});for _,c in ipairs(cards)do out[#out+1]=c.id end;return out end
local trace
function play_sound()end
function CardArea:set_ranks()end
function CardArea:hard_set_T()end
function CardArea:unhighlight_all()self.highlighted={}end
function CardArea:add_to_highlighted(c)self.highlighted[#self.highlighted+1]=c end
function Blind:wiggle()end
function Blind:set_text()end
function Blind:set_blind(config)
 self.name=config.name;self.disabled=false;self.prepped=true;self.debuff={};self.boss=true
 trace[#trace+1]='set_blind';self:setup_acorn(false)
end
local originalShuffle=CardArea.shuffle
function CardArea:shuffle(key)
 trace[#trace+1]='shuffle:'..key;originalShuffle(self,key)
end
local function card(id,ordinal)
 return {id=id,sort_id=ordinal,ability={},facing='front',debuff=false,
 set_debuff=function(self,v)self.debuff=v end,juice_up=function()end,
 flip=function(self)self.facing=self.facing=='front' and 'back' or 'front'end,
 calculate_joker=function(self,context)
  assert(context.setting_blind);trace[#trace+1]='setting_blind:'..self.id
  -- Explicit stochastic setup probe, not a claimed native Joker implementation.
  pseudorandom('setup_oracle',1,5)
 end}
end
local function area(cards)return setmetatable({cards=cards,highlighted={}},{__index=CardArea})end
local function reset(seed,count,reverse)
 math.randomseed(42);trace={}
 G={TIMERS={REAL=0,TOTAL=0},SETTINGS={paused=false},ARGS={},GAME={pseudorandom={seed=seed,hashed_seed=pseudohash(seed)},modifiers={},round_resets={ante=8,blind={name='Amber Acorn'}},chips=0},STATES={DRAW_TO_HAND=1,NEW_ROUND=2}}
 local jokers={};for i=1,count do jokers[#jokers+1]=card('joker_'..i,i)end
 if reverse then local reversed={};for i=#jokers,1,-1 do reversed[#reversed+1]=jokers[i]end;jokers=reversed end
 G.jokers=area(jokers);G.hand=area({});G.playing_cards={};G.deck=area({})
 for _,suit in ipairs({'clubs','diamonds','hearts','spades'})do
  for _,rank in ipairs({2,3,4,5,6,7,8,9,14,11,13,12,10})do
   local c=card('card_'..suit..'_'..rank,#G.playing_cards+1);G.playing_cards[#G.playing_cards+1]=c;G.deck.cards[#G.deck.cards+1]=c
  end
 end
 G.E_MANAGER=EventManager()
 G.GAME.blind=setmetatable({},{__index=Blind})
end
local function drain()
 for step=1,1000 do
  local pending=false;for _,q in pairs(G.E_MANAGER.queues)do if #q>0 then pending=true end end
  if not pending then return end
  G.TIMERS.REAL=G.TIMERS.REAL+1/60;G.TIMERS.TOTAL=G.TIMERS.TOTAL+1/60
  G.E_MANAGER:update(1/60,true)
 end
 error('event queue did not finish')
end
local function snapshot()
 local streams={};for k,v in pairs(G.GAME.pseudorandom)do if k~='seed' and k~='hashed_seed'then streams[k]=v end end
 local disabled,forced=setmetatable({},{array=true}),setmetatable({},{array=true})
 for _,c in ipairs(G.jokers.cards)do if c.debuff then disabled[#disabled+1]=c.id end end
 for _,c in ipairs(G.hand.cards)do if c.ability.forced_selection then forced[#forced+1]=c.id end end
 local facings=setmetatable({},{array=true});for _,c in ipairs(G.jokers.cards)do facings[#facings+1]=c.facing end
 return {jokerIds=ids(G.jokers.cards),jokerFacings=facings,disabledIds=disabled,forcedIds=forced,streams=streams,mathState=state()}
end
local results={acorn={},bell={},heart={},disable={}}
for _,seed in ipairs({'AAAAAAA1','PIERROT1','12345678'})do
 for _,count in ipairs({0,1,2,5})do for _,reverse in ipairs({false,true})do
  reset(seed,count,reverse);setup_round();drain()
  results.acorn[#results.acorn+1]={seed=seed,count=count,reverse=reverse,trace=trace,deckIds=ids(G.deck.cards),after=snapshot()}
 end end
 for _,count in ipairs({0,1,2,5})do
  reset(seed,count,true);local b=G.GAME.blind;b.name='Crimson Heart';b.prepped=true
  local steps={};b:drawn_to_hand();steps[#steps+1]={action='initial',after=snapshot()}
  b:drawn_to_hand();steps[#steps+1]={action='discard',after=snapshot()}
  for i=1,4 do b:press_play();b:drawn_to_hand();steps[#steps+1]={action='play',after=snapshot()}end
  results.heart[#results.heart+1]={seed=seed,count=count,steps=steps}
 end
 for _,count in ipairs({0,1,2,5})do
  reset(seed,0,false);G.hand.cards={};for i=count,1,-1 do G.hand.cards[#G.hand.cards+1]=G.playing_cards[i]end
  local b=G.GAME.blind;b.name='Cerulean Bell';local steps={}
  local ok=pcall(function()b:drawn_to_hand()end)
  steps[#steps+1]={action='initial',ok=ok,after=snapshot()}
  if ok then
   b:drawn_to_hand();steps[#steps+1]={action='already_forced',ok=true,after=snapshot()}
   for _,action in ipairs({'play','discard','play','discard'})do
    for _,c in ipairs(G.playing_cards)do c.ability.forced_selection=nil end
    b:drawn_to_hand();steps[#steps+1]={action=action,ok=true,after=snapshot()}
   end
  end
  results.bell[#results.bell+1]={seed=seed,count=count,steps=steps}
 end
end
-- Preexisting debuffs exclude candidates before native clears every joker.
reset('PIERROT1',5,true);G.jokers.cards[1].debuff=true;G.jokers.cards[3].debuff=true
local b=G.GAME.blind;b.name='Crimson Heart';b.prepped=true;b:drawn_to_hand()
results.heartExcluded={seed='PIERROT1',excludedIds={'joker_5','joker_3'},after=snapshot()}
for _,name in ipairs({'Amber Acorn','Cerulean Bell','Crimson Heart','Verdant Leaf','Violet Vessel'})do
 reset('PIERROT1',2,false);local b=G.GAME.blind;b.name=name;b.chips=300000;b.debuff={};b.boss=true
 for _,c in ipairs(G.jokers.cards)do c.facing='back';c.debuff=true end
 G.hand.cards={G.playing_cards[1]};G.hand.cards[1].ability.forced_selection=true
 b:disable();drain();results.disable[#results.disable+1]={name=name,disabled=b.disabled,chips=b.chips,after=snapshot()}
end
local function numeric(x)if x~=x then return 'NaN' elseif x==math.huge then return 'Infinity'end;return string.format('%.17g',x)end
results.numeric={}
for _,ante in ipairs({8,9,16,32,38,39,40,1000})do
 for _,mult in ipairs({1,1.5,2,6})do
  local n=get_blind_amount(ante)*mult
  local packed=STR_PACK({chips=n});local ok,unpacked=pcall(STR_UNPACK,packed)
  results.numeric[#results.numeric+1]={ante=ante,multiplier=mult,value=numeric(n),display=number_format(n),zeroGte=0>=n,largeGte=1e300>=n,subtractGte=0-n>=0,packed=packed,unpackOk=ok,unpackedType=type(unpacked.chips),unpackedValue=unpacked.chips and numeric(unpacked.chips) or 'nil'}
 end
end
results.format={}
for _,n in ipairs({99999999999,100000000000,100049999999,999950000000})do results.format[#results.format+1]={value=numeric(n),display=number_format(n)}end
results.vesselDivision={}
for ante=1,40 do
 reset('PIERROT1',0,false);local b=G.GAME.blind;b.name='Violet Vessel';b.chips=get_blind_amount(ante)*6;b.debuff={};b.boss=true
 local before=b.chips;b:disable();drain()
 results.vesselDivision[#results.vesselDivision+1]={ante=ante,before=numeric(before),disabled=numeric(b.chips),freshDouble=numeric(get_blind_amount(ante)*2),display=number_format(b.chips)}
end
results.targets={}
for ante=1,39 do
 G.GAME.modifiers={};local n=get_blind_amount(ante)
 results.targets[#results.targets+1]={ante=ante,base=numeric(n),big=numeric(n*1.5),six=numeric(n*6)}
end
print(json(results))
'''
with tempfile.TemporaryDirectory(prefix='pierrot-private-showdown-') as d:
    path = pathlib.Path(d) / 'oracle.lua'
    path.write_text('''Object={}
function Object:extend()
 local class={};class.__index=class
 return setmetatable(class,{__index=self,__call=function(c,...)local o=setmetatable({},c);o:init(...);return o end})
end
function Object:is(class)return getmetatable(self)==class end
Blind={}
CardArea={}
''' + extracted + '\n' + harness)
    outputs = [json.loads(subprocess.check_output([a.luajit, str(path), mode], text=True)) for mode in ['off', 'on']]
    if outputs[0] != outputs[1]:
        raise SystemExit('JIT/interpreter disagreement')
data = outputs[0]
data['source'] = {'runtimeCommit': '43d0a19158ceabaa51b0462c1ebc97612b420a2e', 'jitInterpreterEqual': True,
    'sha256': {name: hashlib.sha256((assets / name).read_bytes()).hexdigest() for name in ['blind.lua', 'functions/misc_functions.lua', 'functions/state_events.lua', 'cardarea.lua', 'engine/event.lua', 'functions/common_events.lua', 'engine/string_packer.lua']},
    'scope': 'Extracted native showdown hooks, Acorn and new_round setup callbacks, RNG, default get_blind_amount, number_format, STR_PACK/STR_UNPACK and native Vessel disable division; original Event/EventManager/delay with own clock/Object/CardArea/debuff/creation-ID adapters. Stochastic setting_blind probe is adapter-owned. Not Android/full event-manager parity.'}
pathlib.Path(a.output).write_text(json.dumps(data, indent=2) + '\n')
print('PASS native showdown hooks and Antes1–39; JIT/interpreter equal')
