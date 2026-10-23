#!/usr/bin/env python3
"""Execute private native first-Legendary prediction; emit only seed/ID facts."""
import argparse,json,pathlib,re,subprocess
p=argparse.ArgumentParser();p.add_argument('--assets',type=pathlib.Path,required=True);p.add_argument('--luajit',required=True);p.add_argument('--output',type=pathlib.Path,required=True);a=p.parse_args()
pool=[]
for line in (a.assets/'game.lua').read_text().splitlines():
 if re.search(r'rarity\s*=\s*4\b',line) and 'set = "Joker"' in line:
  pool.append((int(re.search(r'order\s*=\s*(\d+)',line).group(1)),re.search(r'(j_\w+)\s*=',line).group(1)))
pool.sort();assert len(pool)==5
source='dofile('+json.dumps(str(a.assets/'functions/misc_functions.lua'))+')\nG={P_JOKER_RARITY_POOLS={[4]={'+','.join('{key='+json.dumps(k)+',sort_id='+str(o)+'}' for o,k in pool)+'}}}\nfor i=1,200 do local seed="GOLD"..i;print(seed.." "..get_first_legendary(seed)) end\n'
r=subprocess.run([a.luajit,'-'],input=source,text=True,capture_output=True,check=True)
rows=[dict(zip(['seed','joker'],line.split())) for line in r.stdout.splitlines()];assert len(rows)==200
a.output.write_text(json.dumps(rows,indent=2)+'\n')
