#!/usr/bin/env python3
"""Run private APK RNG functions using an independently built LuaJIT oracle.
Original Lua is extracted only into a temporary directory outside this repository.
"""
import argparse, hashlib, json, pathlib, subprocess, tempfile, zipfile
p=argparse.ArgumentParser();p.add_argument('--apk',required=True);p.add_argument('--luajit',required=True);p.add_argument('--output',required=True);a=p.parse_args()
apk=pathlib.Path(a.apk)
with zipfile.ZipFile(apk) as z:
    source=z.read('assets/functions/misc_functions.lua').decode().replace('\r\n','\n')
start=source.index('function pseudohash(str)');end=source.index('\nfunction tprint(',start)
reference=source[start:end]
harness=r'''
local mode = arg[1]
if mode == 'off' then jit.off() end
local out = {}
local function number(v) return string.format('%.17g',v) end
local function emit(k,v) out[#out+1] = '"'..k..'":'..number(v) end
for i=1,5 do emit('default_random:'..i, math.random()) end
for _,v in ipairs({1/16384,3/16384,5/16384,7/16384,0.00000000000005,0.99999999999995}) do
 emit('format13:'..number(v),tonumber(string.format('%.13f',v)))
end
for _, s in ipairs({'0','0.5','1','42','-1'}) do
 math.randomseed(tonumber(s))
 for i=1,5 do emit('random:'..s..':'..i,math.random()) end
end
for _, seed in ipairs({'AAAAAAA1','PIERROT1','12345678','ПЬЕРО1','é🙂'}) do
 G={GAME={pseudorandom={seed=seed,hashed_seed=pseudohash(seed)}}}
 emit(seed..':hash',pseudohash(seed))
 for index, key in ipairs({'cdt1','rarity1sho','cdt1','pack_generic1','cdt1'}) do
  local value=pseudoseed(key)
  emit(seed..':step'..index..':'..key..':seed',value)
  emit(seed..':step'..index..':'..key..':state',G.GAME.pseudorandom[key])
  emit(seed..':step'..index..':'..key..':random',pseudorandom(value))
  -- get_pack's initial Buffoon choice consumes global state after the prior poll.
  emit(seed..':step'..index..':'..key..':unkeyed_firstpack',math.random(1,2))
 end
 emit(seed..':prediction',pseudoseed('cdt1',seed))
 emit(seed..':prediction_state_unchanged',G.GAME.pseudorandom.cdt1)
 emit(seed..':seed_key_unkeyed',pseudoseed('seed'))
end
print('{'..table.concat(out,',')..'}')
'''
with tempfile.TemporaryDirectory(prefix='pierrot-private-rng-') as d:
    script=pathlib.Path(d)/'oracle.lua';script.write_text(reference+'\n'+harness)
    results=[]
    for mode in ['off','on']:
        results.append(json.loads(subprocess.check_output([a.luajit,str(script),mode],text=True)))
    if results[0]!=results[1]: raise SystemExit('JIT/interpreter numerical disagreement')
    version=subprocess.check_output([a.luajit,'-e','print(jit.version)'],text=True).strip()
artifact={'apk_sha256':hashlib.sha256(apk.read_bytes()).hexdigest(),'source':'assets/functions/misc_functions.lua:282-324','runtime_commit':'43d0a19158ceabaa51b0462c1ebc97612b420a2e','runtime_version':version,'jit_interpreter_equal':True,'scope':'isolated RNG oracle, NOT full APK runtime or complete shop call order','values':results[0]}
pathlib.Path(a.output).write_text(json.dumps(artifact,indent=2)+'\n')
print(version, 'verified',len(results[0]),'numerical values')
