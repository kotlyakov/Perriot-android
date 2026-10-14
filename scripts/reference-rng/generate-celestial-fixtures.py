#!/usr/bin/env python3
"""Execute supplied native APK selection, with synchronous constructor/juice adapter.
No original Lua or assets are retained. Requires the pinned native LuaJIT runtime.
"""
import argparse, hashlib, json, pathlib, subprocess, tempfile
p=argparse.ArgumentParser()
p.add_argument('--assets',required=True,type=pathlib.Path)
p.add_argument('--luajit',required=True)
p.add_argument('--output',required=True,type=pathlib.Path)
a=p.parse_args()
def read(name):return (a.assets/name).read_text()
def region(source,start,end):
 first=source.index(start)
 return source[first:source.index(end,first)]
game,misc,common,card=map(read,['game.lua','functions/misc_functions.lua','functions/common_events.lua','card.lua'])
start=game.index('self.P_CENTERS = self.P_CENTERS or {')
end=game.index('\n    }',start)+6
source='local self={FTP_LOCKED=false}\n'+game[start:end]+'\nlocal centers=self.P_CENTERS\n'
source+='\n'.join([
 region(misc,'function EMPTY(t)','\nfunction '),
 region(misc,'function find_joker(name','\nfunction '),
 region(misc,'function pseudorandom_element(_t','\nfunction random_string('),
 region(misc,'function pseudohash(str)','\nfunction tprint('),
 region(common,'function get_current_pool(','\nfunction copy_card('),
])
# Use the original entire pack loop, choosing its Celestial branch through self.
loop=region(card,'                for i = 1, _size do','                return true\n            end}))')
source+=r'''
local pools={Planet={}}
for k,v in pairs(centers)do v.key=k;if pools[v.set] and not v.wip and not v.skip_pool and not v.omit then table.insert(pools[v.set],v)end end
for _,pool in pairs(pools)do table.sort(pool,function(a,b)return a.order<b.order end)end
Card=setmetatable({}, {__call=function(_,x,y,w,h,front,center)
 for k,v in pairs(centers)do if v.name==center.name then G.GAME.used_jokers[k]=true end end
 for i=1,3 do math.random()end
 return {T={},config={center=center},ability={consumeable=center.consumeable},start_materialize=function()math.random()end}
end})
function check_for_unlock()end
local hands={'Flush Five','Flush House','Five of a Kind','Straight Flush','Four of a Kind','Full House','Flush','Straight','Three of a Kind','Two Pair','Pair','High Card'}
local function setup(seed,mode)
 G={P_CENTERS=centers,P_CENTER_POOLS=pools,ARGS={TEMP_POOL={}},CARD_W=1,CARD_H=1,C={WHITE={}},SETTINGS={GAMESPEED=1},handlist=hands,
 GAME={pseudorandom={seed=seed,hashed_seed=pseudohash(seed)},round_resets={ante=2},banned_keys={},used_jokers={},used_vouchers={},pool_flags={},modifiers={},selected_back={pos={}},hands={}},
 jokers={cards={}},consumeables={cards={}},playing_cards={}}
 G.pack_cards={T={x=0,y=0,w=1}}
 for i,name in ipairs(hands)do G.GAME.hands[name]={visible=i>3 or mode=='softlock',played=(name=='Pair' or name=='Flush')and 4 or(mode=='softlock' and i<=3 and 1 or 0)}end
 if mode:find('telescope')then G.GAME.used_vouchers.v_telescope=true end
 if mode=='telescope_zero'then G.GAME.hands.Pair.played=0;G.GAME.hands.Flush.played=0 end
 if mode=='telescope_banned'then G.GAME.banned_keys.c_jupiter=true end
 if mode=='blackhole_banned'then G.GAME.banned_keys.c_black_hole=true end
 if mode=='owned'or mode=='showman'then G.GAME.used_jokers.c_pluto=true;G.GAME.used_jokers.c_saturn=true end
 if mode=='showman'then G.jokers.cards={{ability={name='Showman'}}}end
 math.randomseed(17)
end
local modes={'base','telescope','softlock','owned','showman','telescope_zero','telescope_banned','blackhole_banned'}
for _,seed in ipairs({'AAAAAAA1','PIERROT1','12345678','BH76'})do for _,_size in ipairs({3,5})do for _,mode in ipairs(modes)do
 setup(seed,mode);local self={ability={name='Celestial Pack'},T={x=0,y=0}};local pack_cards={}
'''+loop+r'''
 local ids={};for _,c in ipairs(pack_cards)do table.insert(ids,c.config.center.key)end
 io.write(seed,'|',_size,'|',mode,'|',table.concat(ids,','),'|')
 local keys={};for k in pairs(G.GAME.pseudorandom)do if k~='seed'and k~='hashed_seed'then table.insert(keys,k)end end;table.sort(keys)
 for _,k in ipairs(keys)do io.write(k,'=',string.format('%.17g',G.GAME.pseudorandom[k]),',')end
 io.write('|');for i=1,4 do io.write(string.format('%.17g',math.random()),',')end;io.write('\n')
end end end
'''
with tempfile.TemporaryDirectory(prefix='celestial-native-')as directory:
 script=pathlib.Path(directory)/'oracle.lua';script.write_text(source)
 result=subprocess.run([a.luajit,str(script)],capture_output=True,text=True,check=True)
cases=[]
for line in result.stdout.splitlines():
 seed,size,mode,ids,streams,following=line.split('|')
 cases.append({'seed':seed,'ante':2,'size':int(size),'mode':mode,'centreIds':ids.split(','),
 'streams':{k:float(v)for k,v in(s.split('=')for s in streams.split(',')if s)},
 'followingMath':[float(v)for v in following.split(',')if v]})
metadata={'runtime':subprocess.run([a.luajit,'-v'],capture_output=True,text=True,check=True).stdout.strip(),
 'scope':'Original APK get_current_pool/create_card and full Card:open pack loop. Card adapter registers centre names, consumes three init draws and one synchronous start_materialize juice draw. Queued audio/render/statistics omitted. Native math.randomseed(17), ante2. Exact identities, keyed streams and four following raw math draws.',
 'sourceSha256':{name:hashlib.sha256((a.assets/name).read_bytes()).hexdigest()for name in['game.lua','card.lua','functions/common_events.lua','functions/misc_functions.lua']},'cases':cases}
a.output.write_text(json.dumps(metadata,indent=2)+'\n')
print(f'Wrote {len(cases)} native cases to {a.output}')
