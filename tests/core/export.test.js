import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
test('standalone preview exports executable JS even when source contains dollar-quote sequences',()=>{
 const root=fileURLToPath(new URL('../../',import.meta.url));
 const build=spawnSync(process.execPath,['scripts/export-preview.mjs'],{cwd:root,encoding:'utf8'});
 assert.equal(build.status,0,build.stderr);
 const html=readFileSync(new URL('../../artifacts/field-preview.html',import.meta.url),'utf8');
 const script=html.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];assert.ok(script);
 const check=spawnSync(process.execPath,['--input-type=module','--check'],{input:script,encoding:'utf8'});
 assert.equal(check.status,0,check.stderr.slice(-700));
});
