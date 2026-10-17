import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
test('preview serves the actual page/modules and rejects paths outside web/src',{timeout:10000},async t=>{
 const child=spawn(process.execPath,['scripts/preview.mjs'],{cwd:fileURLToPath(new URL('../../',import.meta.url)),env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe']});
 t.after(()=>child.kill());
 const url=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',code=>reject(Error('server exit '+code)));child.stdout.once('data',bytes=>resolve(bytes.toString().match(/http:\/\/127\.0\.0\.1:\d+/)[0]));});
 const home=await fetch(url+'/');assert.equal(home.status,200);assert.ok((await home.text()).includes('id="stage"'));
 const js=await fetch(url+'/src/ui/app.js');assert.equal(js.status,200);assert.equal(js.headers.get('content-type'),'text/javascript');assert.ok((await js.text()).length>100);
 for(const path of ['/README.md','/src/..%2fAGENTS.md','/web/..%2fdocs/design.md','/src/../../package.json','/web/%2e%2e/%2e%2e/package.json'])assert.equal((await fetch(url+path)).status,404);
});
