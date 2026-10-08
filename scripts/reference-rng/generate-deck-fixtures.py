#!/usr/bin/env python3
"""Numerical first-deck oracle; extracts only original RNG and shuffle temporarily."""
import argparse,hashlib,json,pathlib,subprocess,tempfile,zipfile
p=argparse.ArgumentParser();p.add_argument('--apk',required=True);p.add_argument('--luajit',required=True);p.add_argument('--output',required=True);a=p.parse_args()
with zipfile.ZipFile(a.apk) as z:
 source=z.read('assets/functions/misc_functions.lua').decode().replace('\r\n','\n')
functions=source[source.index('function pseudohash(str)'):source.index('\nfunction tprint(')]+'\n'+source[source.index('function pseudoshuffle(list, seed)'):source.index('\nfunction generate_starting_seed()')]
harness=r'''
if arg[1]=='off' then jit.off() end
local out={}
local function array(cards)
 local ids={};for _,card in ipairs(cards) do ids[#ids+1]='"'..card.key..'"' end
 return '['..table.concat(ids,',')..']'
end
for _,seed in ipairs({'AAAAAAA1','PIERROT1','12345678'}) do
 G={GAME={pseudorandom={seed=seed,hashed_seed=pseudohash(seed)}}}
 local canonical={}
 for _,suit in ipairs({'C','D','H','S'}) do
  for _,rank in ipairs({'2','3','4','5','6','7','8','9','A','J','K','Q','T'}) do
   canonical[#canonical+1]={key=suit..'_'..rank,sort_id=#canonical+1}
  end
 end
 local deck={};for _,card in ipairs(canonical) do table.insert(deck,1,card) end
 local start_seed=pseudoseed('shuffle');pseudoshuffle(deck,start_seed)
 local start_order=array(deck)
 local nr_seed=pseudoseed('nr1');pseudoshuffle(deck,nr_seed)
 local first_order=array(deck)
 local dealt={};for i=1,8 do dealt[#dealt+1]=table.remove(deck) end
 local remaining=array(deck)
 -- No-effects draw replacement after playing/discarding exactly three cards.
 local replacements={};for i=1,3 do replacements[#replacements+1]=table.remove(deck) end
 -- A second nr1 shuffle re-sorts the 52 original objects; key advances.
 local complete={};for _,c in ipairs(canonical) do complete[#complete+1]=c end
 local second_seed=pseudoseed('nr1');pseudoshuffle(complete,second_seed)
 local second_dealt={};for i=1,8 do second_dealt[#second_dealt+1]=table.remove(complete) end
 out[#out+1]='"'..seed..'":{'..
 '"canonical":'..array(canonical)..',"start_shuffle_seed":'..string.format('%.17g',start_seed)..
 ',"start_order_bottom_to_top":'..start_order..',"first_nr1_seed":'..string.format('%.17g',nr_seed)..
 ',"first_blind_order_bottom_to_top":'..first_order..',"first_hand_deal_order":'..array(dealt)..
 ',"remaining_bottom_to_top":'..remaining..',"three_replacements_deal_order":'..array(replacements)..
 ',"second_nr1_seed":'..string.format('%.17g',second_seed)..',"second_blind_deal_order":'..array(second_dealt)..'}'
end
print('{'..table.concat(out,',')..'}')
'''
with tempfile.TemporaryDirectory(prefix='pierrot-private-deck-') as d:
 path=pathlib.Path(d)/'oracle.lua';path.write_text(functions+'\n'+harness)
 results=[json.loads(subprocess.check_output([a.luajit,str(path),m],text=True)) for m in ['off','on']]
 if results[0]!=results[1]:raise SystemExit('JIT/interpreter disagreement')
 data={'apk_sha256':hashlib.sha256(pathlib.Path(a.apk).read_bytes()).hexdigest(),'runtime_commit':'43d0a19158ceabaa51b0462c1ebc97612b420a2e','jit_interpreter_equal':True,'scope':'canonical plain52 card deck, isolated original RNG/shuffle, not full game runtime','seeds':results[0]}
 pathlib.Path(a.output).write_text(json.dumps(data,indent=2)+'\n')
 print('PASS 3 run seeds, first/second shuffle, deal/refill; JIT/interpreter equal')
