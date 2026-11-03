// Diagnostic reproductions for the unchanged 0.4.60 snapshot, not a release gate.
// Some probes deliberately assert the observed bug; fixing it should change that result.
import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const probes=[
 ['consumables','audit060-consumables/probe.mjs'],
 ['profile','audit060-profile/probes.mjs'],
 ['replay-cap','audit060-profile/replay-cap.mjs'],
 ['bones','audit060-jokers/probe.mjs'],
 ['purple-trading','audit060-jokers/probe-purple-discard.mjs'],
 ['boss-rules','audit060-bosses/probe.mjs'],
 ['boss-semantics','audit060-bosses/semantic-probe.mjs'],
 ['boss-concealment','audit060-bosses/concealment-probe.mjs'],
 ['ox-tie','audit060-bosses/ox-tie-probe.mjs'],
 ['150-jokers-28-bosses','audit060-score/probe-150-boss-matrix.mjs'],
 ['modifier-arithmetic','audit060-score/probe-modifier-arithmetic.mjs']
];
const results=[];
for(const [name,path]of probes){
 const r=spawnSync(process.execPath,['scripts/'+path],{cwd:root,encoding:'utf8'});
 results.push({name,exitCode:r.status,error:r.error?.message,stdout:r.stdout,stderr:r.stderr});
 console.log(name+': '+(r.status===0?'reproduced/checked':'FAILED'));
}
const lua=process.env.NATIVE_LUAJIT??process.env.LUAJIT_BIN;
if(lua){
 const r=spawnSync(process.env.PYTHON??'python3',['scripts/audit060-score/probe-ride-bus-stone.py'],{cwd:root,encoding:'utf8',env:{...process.env,NATIVE_LUAJIT:lua}});
 results.push({name:'native-ride-bus',exitCode:r.status,error:r.error?.message,stdout:r.stdout,stderr:r.stderr});
 console.log('native-ride-bus: '+(r.status===0?'mismatch reproduced':'FAILED'));
}else results.push({name:'native-ride-bus',skipped:'Set NATIVE_LUAJIT and BALATRO_APK; original source is not distributed.'});
mkdirSync(root+'artifacts/audit060-results',{recursive:true});
writeFileSync(root+'artifacts/audit060-results/results.json',JSON.stringify({snapshot:'0.4.60 / 1f1cf3a9',results},null,2)+'\n');
process.exitCode=results.some(r=>r.exitCode!==undefined&&r.exitCode!==0)?1:0;
