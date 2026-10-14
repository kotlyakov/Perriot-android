#!/usr/bin/env python3
"""Execute APK deterministic Joker methods using the existing minimal adapter.

Accepts LuaJIT or a compatible Lua interpreter; records which was selected.
The tally refresh formula is supplied explicitly, not a full Card:update loop.
"""
import argparse, ast, hashlib, json, pathlib, subprocess, tempfile, zipfile
p=argparse.ArgumentParser()
p.add_argument('--apk',required=True)
p.add_argument('--lua',required=True)
p.add_argument('--output',required=True)
a=p.parse_args()
with zipfile.ZipFile(a.apk) as z:
    card=z.read('assets/card.lua').decode().replace('\r\n','\n')
    game=z.read('assets/game.lua').decode().replace('\r\n','\n')
start=game.index('self.P_CENTERS = self.P_CENTERS or {')
end=game.index('\n    }',start)+6
# Reuse the explicit non-rendering adapter; do not duplicate native formulas.
existing=ast.parse(pathlib.Path(__file__).with_name('generate-joker-score-fixtures.py').read_text())
harness=next(ast.literal_eval(n.value) for n in existing.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='harness' for t in n.targets))
harness=harness[:harness.index('local results={}')]+r'''
local results={}
for _,key in ipairs({'j_baron','j_shoot_the_moon'})do
 for _,rank in ipairs({2,12,13,14})do for _,stone in ipairs({false,true})do for _,debuff in ipairs({false,true})do
  reset();local c=joker(key);local pc=playing(rank,'Hearts',stone,debuff)
  results[#results+1]={key=key,phase='held',rank=rank,stone=stone,debuff=debuff,
   expected=effect(c:calculate_joker({cardarea=G.hand,individual=true,other_card=pc}))}
 end end end
end
for _,key in ipairs({'j_stone','j_steel_joker','j_drivers_license'})do
 for _,count in ipairs({0,1,15,16,17})do
  reset();local c=joker(key)
  -- Counts mirror Card:update 4182-4204. Scoring reads the refreshed tally.
  c.ability.stone_tally=count;c.ability.steel_tally=count;c.ability.driver_tally=count
  results[#results+1]={key=key,phase='independent',count=count,
   expected=effect(c:calculate_joker({cardarea=G.jokers,joker_main=true,poker_hands={}}))}
 end
end
for _,key in ipairs({'j_bull','j_bootstraps'})do
 for _,money in ipairs({-5,0,4,5,9,10,99})do for _,buffer in ipairs({0,20})do
  reset();local c=joker(key);G.GAME.dollars=money;G.GAME.dollar_buffer=buffer
  results[#results+1]={key=key,phase='independent',money=money,buffer=buffer,
   expected=effect(c:calculate_joker({cardarea=G.jokers,joker_main=true,poker_hands={}}))}
 end end
end
for _,key in ipairs({'j_flower_pot','j_seeing_double'})do
 for _,entry in ipairs({
  {'plain',{playing(8,'Hearts'),playing(8,'Diamonds'),playing(8,'Spades'),playing(8,'Clubs')}},
  {'single-wild',{playing(8,'Hearts',false,false,true)}},
  {'club-and-wild',{playing(8,'Clubs'),playing(8,'Hearts',false,false,true)}},
  {'four-wilds',{playing(8,'Hearts',false,false,true),playing(8,'Hearts',false,false,true),playing(8,'Hearts',false,false,true),playing(8,'Hearts',false,false,true)}},
  {'debuff-plain',{playing(8,'Hearts'),playing(8,'Diamonds'),playing(8,'Spades'),playing(8,'Clubs',false,true)}},
  {'debuff-wild',{playing(8,'Hearts'),playing(8,'Diamonds'),playing(8,'Spades'),playing(8,'Clubs',false,true,true)}},
  {'stone-club',{playing(8,'Hearts'),playing(8,'Diamonds'),playing(8,'Spades'),playing(8,'Clubs',true)}}
 })do
  reset();local c=joker(key);results[#results+1]={key=key,phase='independent',case=entry[1],scoring=cardspec(entry[2]),
   expected=effect(c:calculate_joker({cardarea=G.jokers,joker_main=true,scoring_hand=entry[2],poker_hands={}}))}
 end
end
print(json({cases=results}))
'''
script='Moveable={extend=function()return {}end}\n'+card+'\nlocal self={FTP_LOCKED=false}\n'+game[start:end]+'\nlocal centers=self.P_CENTERS\n'+harness
with tempfile.NamedTemporaryFile(mode='w',suffix='.lua') as f:
    f.write(script);f.flush();result=json.loads(subprocess.check_output([a.lua,f.name],text=True))
result['source']={'apkSha256':hashlib.sha256(pathlib.Path(a.apk).read_bytes()).hexdigest(),'runtime':pathlib.Path(a.lua).name,'method':'Original Card:set_ability and Card:calculate_joker methods. Native tally refresh supplied explicitly.','limits':'Deterministic method adapter only; not whole APK, RNG, event manager or Card:update execution.'}
pathlib.Path(a.output).write_text(json.dumps(result,indent=2)+'\n')
print(str(len(result['cases']))+' native deterministic Joker return fixtures')
