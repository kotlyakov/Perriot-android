#!/usr/bin/env python3
"""Run original APK Card methods in a minimal, explicit non-rendering adapter.

No APK source is saved in the repository; no Android gameplay execution is claimed.
"""
import argparse
import hashlib
import json
import pathlib
import subprocess
import tempfile
import zipfile

p = argparse.ArgumentParser()
p.add_argument('--apk', required=True)
p.add_argument('--luajit', required=True)
p.add_argument('--output', required=True)
a = p.parse_args()
with zipfile.ZipFile(a.apk) as z:
    def read(name):
        return z.read('assets/' + name).decode().replace('\r\n', '\n')
    game, card, misc = map(read, ['game.lua', 'card.lua', 'functions/misc_functions.lua'])
start = game.index('self.P_CENTERS = self.P_CENTERS or {')
end = game.index('\n    }', start) + 6
original_centers = 'local self={FTP_LOCKED=false}\n' + game[start:end] + '\nlocal centers=self.P_CENTERS\n'
harness = r'''
function copy_table(o) if type(o)~='table' then return o end local r={} for k,v in pairs(o)do r[k]=copy_table(v)end return r end
function localize()return ''end
function find_joker()return {}end
local function json(v)
 if type(v)=='string' then return '"'..v:gsub('\\','\\\\'):gsub('"','\\"'):gsub('\n','\\n')..'"' end
 if type(v)=='number' or type(v)=='boolean' then return tostring(v) end
 if v==nil then return 'null' end
 local p={};local n=0;for _ in pairs(v)do n=n+1 end
 if n>0 and #v==n then for _,x in ipairs(v)do p[#p+1]=json(x)end return '['..table.concat(p,',')..']'end
 local keys={};for k in pairs(v)do keys[#keys+1]=k end table.sort(keys)
 for _,k in ipairs(keys)do p[#p+1]=json(k)..':'..json(v[k])end return '{'..table.concat(p,',')..'}'
end
local function reset()
 G={P_CENTERS=centers,C={RED={},MULT={},CHIPS={}},GAME={used_jokers={},current_round={discards_left=3},hands_played=0},
 jokers={cards={},config={card_limit=5}},hand={cards={}},play={},deck={cards={}}}
end
function Card:set_sprites()end
local function joker(key)
 local c=setmetatable({params={},config={card={}},T={h=1,w=1}},{__index=Card})
 c:set_ability(assert(centers[key],key),true);return c
end
local suits={'Spades','Hearts','Clubs','Diamonds'}
local function playing(rank,suit,stone,debuff,wild)
 return setmetatable({base={id=rank,nominal=rank==14 and 11 or math.min(rank,10),suit=suit or 'Spades',suit_nominal=0,face_nominal=0},
 ability={effect=stone and 'Stone Card' or '',name=wild and 'Wild Card' or 'Default Base'},unique_val=0,debuff=debuff},{__index=Card})
end
local function hand(ranks,flush)
 local r={};for i,id in ipairs(ranks)do r[i]=playing(id,flush and 'Spades' or suits[(i-1)%4+1])end return r
end
local function effect(ret)
 local r={};for _,k in ipairs({'chips','mult','h_mult','x_mult','chip_mod','mult_mod','Xmult_mod','x_mult_mod'})do if ret and ret[k]~=nil then r[k]=ret[k]end end
 return r
end
local function cardspec(cards)
 local r={} for _,c in ipairs(cards)do r[#r+1]={rank=c.base.id,suit=c.base.suit,stone=c.ability.effect=='Stone Card',wild=c.ability.name=='Wild Card',debuff=c.debuff or false}end return r
end
local results={};local catalog={}
local ids={'j_joker','j_greedy_joker','j_lusty_joker','j_wrathful_joker','j_gluttenous_joker','j_jolly','j_zany','j_mad','j_crazy','j_droll','j_sly','j_wily','j_clever','j_devious','j_crafty','j_half','j_stencil','j_banner','j_mystic_summit','j_raised_fist','j_fibonacci','j_scary_face','j_even_steven','j_odd_todd','j_scholar','j_splash','j_abstract','j_blackboard','j_blue_joker','j_arrowhead','j_onyx_agate','j_smiley','j_walkie_talkie','j_flower_pot','j_duo','j_trio','j_family','j_order','j_tribe'}
reset()
for _,key in ipairs(ids)do local c=joker(key);catalog[#catalog+1]={key=key,name=c.ability.name,effect=c.ability.effect,config=centers[key].config}end
local hands={
 {'high-card',{14,10,8,5,2}}, {'pair',{9,9,8,5,2}}, {'two-pair',{9,9,8,8,2}},
 {'three',{9,9,9,5,2}}, {'straight',{2,3,4,5,6}}, {'flush',{14,10,8,5,2},true},
 {'full-house',{9,9,9,8,8}}, {'four',{9,9,9,9,2}}, {'straight-flush',{2,3,4,5,6},true},
 {'five',{9,9,9,9,9}}, {'flush-house',{9,9,9,8,8},true}, {'flush-five',{9,9,9,9,9},true}
}
local contains={}
for _,h in ipairs(hands)do
 reset();local cards=hand(h[2],h[3]);local poker=evaluate_poker_hand(cards);local names={}
 for k,v in pairs(poker)do if k~='top' and next(v)then names[#names+1]=k end end table.sort(names)
 contains[#contains+1]={case=h[1],ranks=h[2],flush=h[3] or false,contains=names}
 for _,key in ipairs({'j_jolly','j_zany','j_mad','j_crazy','j_droll','j_sly','j_wily','j_clever','j_devious','j_crafty','j_duo','j_trio','j_family','j_order','j_tribe'})do
  local c=joker(key);results[#results+1]={case=h[1],key=key,phase='independent',expected=effect(c:calculate_joker({cardarea=G.jokers,joker_main=true,full_hand=cards,scoring_hand=cards,poker_hands=poker}))}
 end
end
for _,key in ipairs({'j_greedy_joker','j_lusty_joker','j_wrathful_joker','j_gluttenous_joker','j_fibonacci','j_scary_face','j_even_steven','j_odd_todd','j_scholar','j_arrowhead','j_onyx_agate','j_smiley','j_walkie_talkie'})do
 for rank=2,14 do for _,suit in ipairs(suits)do
  reset();local c=joker(key);local pc=playing(rank,suit)
  results[#results+1]={key=key,phase='individual-play',rank=rank,suit=suit,expected=effect(c:calculate_joker({cardarea=G.play,individual=true,other_card=pc,scoring_hand={pc}}))}
 end end
end
local function independent(key,case,cards,held,discards,deck,count,limit,stencils,debuff)
 reset();G.hand.cards=held or {};G.GAME.current_round.discards_left=discards or 0
 for i=1,(deck or 0)do G.deck.cards[i]={}end
 G.jokers.config.card_limit=limit or 5
 local c=joker(key);c.debuff=debuff;G.jokers.cards[1]=c
 for i=2,(count or 1)do G.jokers.cards[i]=joker(i<=(stencils or 0) and 'j_stencil' or 'j_joker')end
 if key=='j_stencil'then c.ability.x_mult=G.jokers.config.card_limit-#G.jokers.cards
  for _,j in ipairs(G.jokers.cards)do if j.ability.name=='Joker Stencil'then c.ability.x_mult=c.ability.x_mult+1 end end
 end
 results[#results+1]={key=key,case=case,phase='independent',played=cardspec(cards),held=cardspec(G.hand.cards),playedCount=#cards,heldCount=#G.hand.cards,discards=G.GAME.current_round.discards_left,deckCount=#G.deck.cards,jokerCount=#G.jokers.cards,jokerLimit=G.jokers.config.card_limit,stencilX=c.ability.x_mult,debuff=debuff or false,
 expected=effect(c:calculate_joker({cardarea=G.jokers,joker_main=true,full_hand=cards,scoring_hand=cards,poker_hands=evaluate_poker_hand(cards)}))}
end
independent('j_stencil','full-five-stencils',hand({2,3}),{},0,0,5,5,5)
independent('j_stencil','negative-full-capacity',hand({2,3}),{},0,0,6,6,1)
for _,key in ipairs({'j_joker','j_half','j_banner','j_mystic_summit','j_blue_joker','j_abstract','j_stencil'})do
 independent(key,'boundary-zero',hand({2,3,4,5}),{},0,0,5)
 independent(key,'boundary-three',hand({2,3,4}),{},3,40,1)
 independent(key,'two-stencils',hand({2,3}),{},0,10,2,5,2)
 independent(key,'debuffed',hand({2,3}),{},0,10,1,5,1,true)
end
for _,entry in ipairs({{'empty',{}},{'black',{playing(2,'Spades'),playing(3,'Clubs')}},{'red',{playing(2,'Spades'),playing(3,'Hearts')}},{'debuff-black',{playing(2,'Spades',false,true)}},{'stone-black',{playing(2,'Spades',true)}},{'wild-red',{playing(2,'Hearts',false,false,true)}}})do
 independent('j_blackboard',entry[1],hand({2,3}),entry[2])
end
for _,h in ipairs({{'four-suits',{playing(2,'Spades'),playing(3,'Clubs'),playing(4,'Diamonds'),playing(5,'Hearts')}},{'missing-suit',{playing(2,'Spades'),playing(3,'Clubs'),playing(4,'Diamonds'),playing(5,'Diamonds')}},{'wild-fourth',{playing(2,'Spades'),playing(3,'Clubs'),playing(4,'Diamonds'),playing(5,'Diamonds',false,false,true)}},{'debuff-plain',{playing(2,'Spades',false,true),playing(3,'Clubs'),playing(4,'Diamonds'),playing(5,'Hearts')}},{'debuff-wild',{playing(2,'Spades'),playing(3,'Clubs'),playing(4,'Diamonds'),playing(5,'Diamonds',false,true,true)}}})do independent('j_flower_pot',h[1],h[2])end
for _,entry in ipairs({{'last-tied-lowest',{playing(2),playing(5),playing(2)}},{'ace-high',{playing(14),playing(13)}},{'stone-skipped',{playing(2,'Spades',true),playing(5)}},{'lowest-debuff',{playing(2,'Spades',false,true),playing(5)}}})do
 reset();G.hand.cards=entry[2];local c=joker('j_raised_fist')
 for i,pc in ipairs(G.hand.cards)do results[#results+1]={key='j_raised_fist',case=entry[1],phase='individual-held',held=cardspec(G.hand.cards),heldIndex=i,rank=pc.base.id,expected=effect(c:calculate_joker({cardarea=G.hand,individual=true,other_card=pc}))}end
end
local editions={}
for _,entry in ipairs({{'foil',{foil=true,chips=centers.e_foil.config.extra}},{'holo',{holo=true,mult=centers.e_holo.config.extra}},{'negative',{negative=true,card_limit=centers.e_negative.config.extra}},{'polychrome',{polychrome=true,x_mult=centers.e_polychrome.config.extra}}})do
 reset();local c=joker('j_joker');c.edition=entry[2];editions[#editions+1]={edition=entry[1],expected=effect(c:get_edition()),config=centers['e_'..entry[1]].config}
end
print(json({catalog=catalog,contains=contains,cases=results,editions=editions}))
'''
script = 'Moveable={extend=function()return {}end}\n' + card + '\n' + misc + '\n' + original_centers + harness
with tempfile.NamedTemporaryFile(mode='w', suffix='.lua') as f:
    f.write(script)
    f.flush()
    result = json.loads(subprocess.check_output([a.luajit, f.name], text=True))
for case in result['cases']:
    for field in ['held', 'played']:
        if case.get(field) == {}:
            case[field] = []
result['source'] = {'apkSha256': hashlib.sha256(pathlib.Path(a.apk).read_bytes()).hexdigest(),
                    'method': 'Original Card:set_ability, Card:calculate_joker, Card:get_edition and evaluate_poker_hand under minimal adapter',
                    'limits': 'Not full APK execution. No rendering, round loop, retriggers, or full state_events execution. Stencil update formula applied explicitly from native Card:update.'}
pathlib.Path(a.output).write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(f'{len(result["cases"])} native Joker return fixtures; {len(result["contains"])} native hand contains fixtures')
