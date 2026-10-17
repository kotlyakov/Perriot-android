#!/usr/bin/env python3
"""Export factual selection metadata; original Lua exists only in a temporary directory."""
import argparse, hashlib, json, pathlib, subprocess, tempfile, zipfile
p=argparse.ArgumentParser();p.add_argument('--apk',required=True);p.add_argument('--luajit',required=True);p.add_argument('--output',required=True);a=p.parse_args()
with zipfile.ZipFile(a.apk) as z: source=z.read('assets/game.lua').decode().replace('\r\n','\n')
start=source.index('self.P_CENTERS = self.P_CENTERS or {');end=source.index('\n    }',start)+6
adapter=r'''
local fields={'name','set','order','cost','rarity','unlocked','start_locked','start_discovered','wip','skip_pool','omit','requires','enhancement_gate','no_pool_flag','yes_pool_flag','weight','kind','consumeable','eternal_compat','perishable_compat'}
local function json(v)
 if type(v)=='string' then return '"'..v:gsub('\\','\\\\'):gsub('"','\\"')..'"' end
 if type(v)=='number' then return string.format('%.17g',v) end
 if type(v)=='boolean' then return tostring(v) end
 local parts={};local count=0;for _ in pairs(v)do count=count+1 end
 if count>0 and #v==count then for _,x in ipairs(v)do parts[#parts+1]=json(x)end;return '['..table.concat(parts,',')..']' end
 local keys={};for k in pairs(v)do keys[#keys+1]=k end;table.sort(keys)
 for _,k in ipairs(keys)do parts[#parts+1]=json(k)..':'..json(v[k])end;return '{'..table.concat(parts,',')..'}'
end
local out={}
for key,v in pairs(self.P_CENTERS)do
 if v.set=='Joker' or v.set=='Tarot' or v.set=='Planet' or v.set=='Spectral' or v.set=='Voucher' or v.set=='Booster' or v.set=='Enhanced' or key=='c_base' then
  local row={key=key};for _,field in ipairs(fields)do row[field]=v[field] end
  if v.config then row.handType=v.config.hand_type;row.softlock=v.config.softlock end
  out[#out+1]=row
 end
end
table.sort(out,function(a,b)return a.key<b.key end)
print(json(out))
'''
with tempfile.TemporaryDirectory(prefix='private-shop-catalog-') as d:
 script=pathlib.Path(d)/'catalog.lua';script.write_text('local self={FTP_LOCKED=false}\n'+source[start:end]+'\n'+adapter)
 rows=json.loads(subprocess.check_output([a.luajit,str(script)],text=True))
counts={category:sum(r['set']==category for r in rows) for category in ['Joker','Tarot','Planet','Spectral','Voucher','Booster','Enhanced']}
assert counts==dict(Joker=150,Tarot=22,Planet=12,Spectral=18,Voucher=32,Booster=32,Enhanced=8),counts
data={'apkSha256':hashlib.sha256(pathlib.Path(a.apk).read_bytes()).hexdigest(),'scope':'Factual centre identity, pool ordering, eligibility and prices; no original code or art','centres':rows}
pathlib.Path(a.output).write_text('export default '+json.dumps(data,indent=2)+';\n');print(counts)
