#!/usr/bin/env python3
"""Execute private APK create_card/get_current_pool/poll_edition for The Soul.

Only numerical results and source hashes are retained, never reference Lua.
Constructor adapter consumes native three init draws; edition callback and Soul
used-card juice each consume one raw draw. Rendering/audio/profile are omitted.
"""
import argparse, hashlib, json, pathlib, subprocess, tempfile

p = argparse.ArgumentParser()
p.add_argument('--assets', required=True, type=pathlib.Path)
p.add_argument('--luajit', required=True)
p.add_argument('--output', required=True, type=pathlib.Path)
a = p.parse_args()
names = ['game.lua', 'card.lua', 'functions/common_events.lua', 'functions/misc_functions.lua']
game, card, common, misc = [(a.assets / name).read_text() for name in names]

def region(source, start, end):
    first = source.index(start)
    return source[first:source.index(end, first)]

start = game.index('self.P_CENTERS = self.P_CENTERS or {')
end = game.index('\n    }', start) + 6
source = 'local self={FTP_LOCKED=false}\n' + game[start:end] + '\nlocal centers=self.P_CENTERS\n'
source += '\n'.join([
    region(misc, 'function EMPTY(t)', '\nfunction '),
    region(misc, 'function find_joker(name', '\nfunction '),
    region(misc, 'function pseudorandom_element(_t', '\nfunction random_string('),
    region(misc, 'function pseudohash(str)', '\nfunction tprint('),
    region(common, 'function get_current_pool(', '\nfunction copy_card('),
])
source += r'''
local pools={Joker={}}
local rarityPools={{},{},{},{}}
for k,v in pairs(centers)do v.key=k;if v.set=='Joker' and not v.wip and not v.skip_pool and not v.omit then
 table.insert(pools.Joker,v);table.insert(rarityPools[v.rarity],v)
end end
for _,pool in pairs(rarityPools)do table.sort(pool,function(a,b)return a.order<b.order end)end
Card=setmetatable({}, {__call=function(_,x,y,w,h,front,center)
 for k,v in pairs(centers)do if v.name==center.name then G.GAME.used_jokers[k]=true end end
 for i=1,3 do math.random()end
 return {config={center=center},ability={consumeable=center.consumeable},
 set_edition=function(self,e)self.edition=e;if e then math.random()end end,
 set_eternal=function(self,e)self.eternal=e end}
end})
function check_for_unlock()end
local modes={'base','owned','owned_showman','banned','empty','locked','all_eternal'}
local seeds={};for n=1,100 do seeds[#seeds+1]=n end;seeds[#seeds+1]=278;seeds[#seeds+1]=399
for _,n in ipairs(seeds)do for _,mode in ipairs(modes)do
 local seed='SOUL'..n
 G={P_CENTERS=centers,P_CENTER_POOLS=pools,P_JOKER_RARITY_POOLS=rarityPools,ARGS={TEMP_POOL={}},CARD_W=1,CARD_H=1,
 GAME={pseudorandom={seed=seed,hashed_seed=pseudohash(seed)},round_resets={ante=2},banned_keys={},used_jokers={},pool_flags={},modifiers={},selected_back={pos={}},edition_rate=1},
 jokers={T={x=0,y=0,w=1},cards={}},consumeables={cards={}},playing_cards={}}
 if mode:find('owned')then G.GAME.used_jokers.j_caino=true;G.GAME.used_jokers.j_triboulet=true end
 if mode:find('showman')then G.jokers.cards={{ability={name='Showman'}}}end
 if mode=='banned'then G.GAME.banned_keys.j_perkeo=true;G.GAME.banned_keys.j_chicot=true end
 if mode=='empty'then for _,c in ipairs(rarityPools[4])do G.GAME.banned_keys[c.key]=true end end
 if mode=='locked'then for _,c in ipairs(rarityPools[4])do c.unlocked=false end end
 if mode=='all_eternal'then G.GAME.modifiers.all_eternal=true end
 math.randomseed(17)
 local created=create_card('Joker',G.jokers,true,nil,nil,nil,nil,'sou')
 -- Original card.lua Soul callback: used_tarot:juice_up(0.3,0.5).
 math.random()
 local edition='base';for k in pairs(created.edition or {})do edition=k end
 io.write(seed,'|',mode,'|',created.config.center.key,'|',edition,'|',created.eternal and '1' or '0','|')
 local keys={};for k in pairs(G.GAME.pseudorandom)do if k~='seed'and k~='hashed_seed'then table.insert(keys,k)end end;table.sort(keys)
 for _,k in ipairs(keys)do io.write(k,'=',string.format('%.17g',G.GAME.pseudorandom[k]),',')end
 io.write('|');for i=1,4 do io.write(string.format('%.17g',math.random()),',')end;io.write('\n')
end end
'''
with tempfile.TemporaryDirectory(prefix='soul-native-') as directory:
    script = pathlib.Path(directory) / 'oracle.lua'
    script.write_text(source)
    result = subprocess.run([a.luajit, str(script)], capture_output=True, text=True, check=True)
cases = []
for line in result.stdout.splitlines():
    seed, mode, identity, edition, eternal, streams, following = line.split('|')
    cases.append({'seed': seed, 'ante': 2, 'mode': mode, 'id': identity,
                  'edition': 'holographic' if edition == 'holo' else edition, 'eternal': eternal == '1',
                  'streams': {k: float(v) for k, v in (s.split('=') for s in streams.split(',') if s)},
                  'followingMath': [float(v) for v in following.split(',') if v]})
metadata = {'runtime': subprocess.run([a.luajit, '-v'], capture_output=True, text=True, check=True).stdout.strip(),
            'scope': __doc__, 'sourceSha256': {name: hashlib.sha256((a.assets / name).read_bytes()).hexdigest() for name in names},
            'cases': cases}
a.output.write_text(json.dumps(metadata, indent=2) + '\n')
print(f'Wrote {len(cases)} native Soul cases to {a.output}')
