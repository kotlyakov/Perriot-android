import {spawn,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const exported=spawnSync(process.execPath,['scripts/export-preview.mjs'],{cwd:root,stdio:'inherit'});
if(exported.status!==0)throw Error('Preview export failed');
// Server and Chromium must run in the same execution network namespace.
const server=spawn(process.execPath,['scripts/preview.mjs'],{cwd:root,env:{...process.env,PORT:'0'},stdio:['ignore','pipe','inherit']});
try {
 const url=await new Promise((resolve,reject)=>{
   const timeout=setTimeout(()=>reject(Error('Preview startup timed out')),5000);
   server.once('error',error=>{clearTimeout(timeout);reject(error);});
   server.once('exit',code=>{clearTimeout(timeout);reject(Error('Preview exited: '+code));});
   server.stdout.once('data',data=>{clearTimeout(timeout);const match=data.toString().match(/http:\/\/127\.0\.0\.1:\d+/);match?resolve(match[0]):reject(Error('Missing preview URL'));});
 });
 const check=spawn(process.execPath,[process.env.UI_CHECK_SCRIPT??'tests/ui/browser-check.mjs'],{cwd:root,env:{...process.env,PREVIEW_URL:url},stdio:'inherit'});
 process.exitCode=await new Promise((resolve,reject)=>{check.once('error',reject);check.once('exit',code=>resolve(code??1));});
} finally {server.kill();}
