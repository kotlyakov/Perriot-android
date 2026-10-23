#!/usr/bin/env python3
"""Isolated native RNG oracle for persistent physical playing-card identities."""
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
    raw = z.read('assets/functions/misc_functions.lua')
source = raw.decode().replace('\r\n', '\n')
functions = '\n'.join([
    source[source.index('function pseudohash(str)'):source.index('\nfunction tprint(')],
    source[source.index('function pseudoshuffle(list, seed)'):source.index('\nfunction generate_starting_seed()')],
    source[source.index('function pseudorandom_element(_t, seed)'):source.index('\nfunction random_string(')],
])
harness = r'''
if arg[1]=='off' then jit.off() end
local function json(v)
 if type(v)=='string' then return '"'..v..'"' end
 if type(v)=='number' then return string.format('%.17g',v) end
 if type(v)=='boolean' then return tostring(v) end
 local array=#v>0;local out={}
 if array then for _,x in ipairs(v)do out[#out+1]=json(x)end
 else
  local keys={};for k in pairs(v)do keys[#keys+1]=k end;table.sort(keys)
  for _,k in ipairs(keys)do out[#out+1]=json(k)..':'..json(v[k])end
 end
 return (array and '[' or '{')..table.concat(out,',')..(array and ']' or '}')
end
local function ids(cards)
 local out={};for _,card in ipairs(cards)do out[#out+1]=card.id end;return out
end
local function pool(reverse,deleted)
 local cards={};local suits={C='clubs',D='diamonds',H='hearts',S='spades'}
 local ranks={A=14,J=11,K=13,Q=12,T=10}
 for _,s in ipairs({'C','D','H','S'})do
  for _,r in ipairs({'2','3','4','5','6','7','8','9','A','J','K','Q','T'})do
   local ordinal=#cards+1
   cards[#cards+1]={id='card_'..suits[s]..'_'..(ranks[r]or tonumber(r)),sort_id=10+ordinal*3,creationOrdinal=ordinal,rank=ranks[r]or tonumber(r),suit=suits[s]}
  end
 end
 -- Death-style in-place face conversion: original identity/order is unchanged.
 cards[1].rank=14;cards[1].suit='spades'
 for _,ordinal in ipairs(deleted and {53,55,56}or {53,54,55})do
  cards[#cards+1]={id='card_created_'..ordinal,sort_id=({[53]=180,[54]=210,[55]=230,[56]=300})[ordinal],creationOrdinal=ordinal,rank=14,suit='spades'}
 end
 if reverse then local reversed={};for i=#cards,1,-1 do reversed[#reversed+1]=cards[i]end;cards=reversed end
 return cards
end
local results={}
for _,seed in ipairs({'AAAAAAA1','PIERROT1','12345678'})do
 local variants={}
 for _,reverse in ipairs({false,true})do
  G={GAME={pseudorandom={seed=seed,hashed_seed=pseudohash(seed)}}}
  local cards=pool(reverse,false)
  pseudoshuffle(cards,pseudoseed('identity'));local first=ids(cards)
  pseudoshuffle(cards,pseudoseed('identity'));local second=ids(cards)
  local bell=pseudorandom_element(cards,pseudoseed('cerulean_bell')).id
  local hook={}
  for i=1,2 do local card,key=pseudorandom_element(cards,pseudoseed('hook'));hook[#hook+1]=card.id;table.remove(cards,key)end
  -- Delete generated54, add generated56 after unrelated Card creations.
  cards=pool(reverse,true)
  pseudoshuffle(cards,pseudoseed('identity'));local replacement=ids(cards)
  local nextBell=pseudorandom_element(cards,pseudoseed('cerulean_bell')).id
  variants[#variants+1]={firstShuffle=first,secondShuffle=second,bell=bell,hook=hook,afterDeleteAndCreateShuffle=replacement,afterDeleteAndCreateBell=nextBell}
 end
 assert(json(variants[1])==json(variants[2]),'input order changed native outcome')
 results[seed]=variants[1]
end
local identities=pool(false,false)
results.identities=identities
print(json(results))
'''
with tempfile.TemporaryDirectory(prefix='pierrot-private-identities-') as d:
    path = pathlib.Path(d) / 'oracle.lua'
    path.write_text(functions + '\n' + harness)
    outputs = [json.loads(subprocess.check_output([a.luajit, str(path), mode], text=True)) for mode in ['off', 'on']]
    if outputs[0] != outputs[1]:
        raise SystemExit('JIT/interpreter disagreement')
data = {
    'apk_sha256': hashlib.sha256(pathlib.Path(a.apk).read_bytes()).hexdigest(),
    'misc_functions_sha256': hashlib.sha256(raw).hexdigest(),
    'runtime_commit': '43d0a19158ceabaa51b0462c1ebc97612b420a2e',
    'jit_interpreter_equal': True,
    'forward_reverse_equal': True,
    'scope': 'Original isolated pseudoshuffle/pseudorandom_element; prescribed native sort_id gaps, transformed base face, new duplicate identities53/54/55, deletion54 and later56; not native gameplay creation effects.',
    'seeds': outputs[0],
}
data['identities'] = data['seeds'].pop('identities')
pathlib.Path(a.output).write_text(json.dumps(data, indent=2) + '\n')
print('PASS 3 seeds, repeated native shuffle, Bell/Hook choices, deletion/new creation, reversed pools; JIT/interpreter equal')
