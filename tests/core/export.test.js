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
 assert.match(html,/<style>[\s\S]*data:font\/ttf;base64,/,'Styles and font must stay embedded');
 assert.doesNotMatch(html,/<(?:link|script)\b[^>]*(?:href|src)=['"]\/(?:web|src)\//,'Portable HTML must not request source assets');
 const script=html.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];assert.ok(script);
 const check=spawnSync(process.execPath,['--input-type=module','--check'],{input:script,encoding:'utf8'});
 assert.equal(check.status,0,check.stderr.slice(-700));
});
test('standalone preview links and evaluates the cyclic game graph with one identity per shared dependency',()=>{
 const root=fileURLToPath(new URL('../../',import.meta.url));
 const build=spawnSync(process.execPath,['scripts/export-preview.mjs'],{cwd:root,encoding:'utf8'});
 assert.equal(build.status,0,build.stderr);
 // Node's native ESM linker checks the exported code; browser import-map/file loading
 // and the actual startup/save/reload UI remain covered by start-screen-check.mjs.
 const check=spawnSync(process.execPath,['--experimental-vm-modules','--input-type=module'],{cwd:root,encoding:'utf8',input:`
 import assert from 'node:assert/strict';
 import {readFileSync} from 'node:fs';
 import {createContext,runInNewContext,SourceTextModule} from 'node:vm';
 const html=readFileSync('artifacts/field-preview.html','utf8');
 const mapped=html.match(/<script type="importmap">([\\s\\S]*?)<\\/script>/)?.[1];
 if(!mapped){
  // Exercise the old loader too, so this regression fails at its real recursion.
  const script=html.match(/<script type="module">([\\s\\S]*?)<\\/script>/)[1];
  runInNewContext(script.slice(0,script.indexOf('\\nimport('))+"\\nmoduleURL('/src/ui/app.js');",{URL,Blob});
  assert.fail('Standalone export must provide stable module identities');
 }
 const {imports}=JSON.parse(mapped),modules=new Map(),edges=[];
 assert.equal(new Set(Object.values(imports)).size,Object.keys(imports).length,'Distinct source modules need distinct URLs');
 const context=createContext({structuredClone,TextEncoder});
 function get(specifier){
  const url=imports[specifier];
  assert.ok(url,'Unmapped import '+specifier);
  assert.ok(url.startsWith('data:text/javascript;base64,'),'Module must be embedded: '+specifier);
  if(!modules.has(url))modules.set(url,new SourceTextModule(Buffer.from(url.split(',')[1].split('#')[0],'base64').toString('utf8'),{context,identifier:specifier}));
  return modules.get(url);
 }
 const app=get('preview:/src/ui/app.js');
 await app.link((specifier,referrer)=>{
  const module=get(specifier);edges.push([referrer.identifier,specifier,module]);return module;
 });
 for(const [from,to] of [['boss-effects','cashout'],['cashout','boss-effects'],['boss-effects','blind-progression'],['blind-progression','boss-effects']]){
  assert.ok(edges.some(([a,b])=>a==='preview:/src/core/'+from+'.js'&&b==='preview:/src/core/'+to+'.js'),'Missing real cycle edge '+from+' -> '+to);
 }
 const hands='preview:/src/content/hands.js',shared=edges.filter(([,to])=>to===hands);
 assert.ok(shared.length>=2,'Exercise a shared dependency');
 assert.ok(shared.every(([,to,module])=>module===get(to)),'All importers must use the same module instance');
 const run=get('preview:/src/core/run.js'),save=get('preview:/src/persistence/save.js');
 await run.evaluate();await save.evaluate();
 const {createRun,dispatch}=run.namespace,{serializeState,deserializeState}=save.namespace;
 const pending=createRun('EXPORT01',{runId:'portable-cycle',deckId:'blue',money:4n,referenceRng:true,referenceShop:true});
 assert.equal(pending.phase,'blind_selection');
 assert.equal(serializeState(deserializeState(serializeState(pending))),serializeState(pending));
 const playing=dispatch(pending,{type:'START_BLIND',expectedRevision:pending.revision});
 assert.equal(playing.error,null);assert.equal(playing.state.hand.length,8);
 const encoded=serializeState(playing.state),restored=deserializeState(encoded);
 assert.equal(serializeState(restored),encoded);
 const action={type:'DISCARD',cardIds:restored.hand.slice(0,1),expectedRevision:restored.revision};
 assert.equal(serializeState(dispatch(restored,action).state),serializeState(dispatch(playing.state,action).state));
 console.log('Exported native ESM cycles/shared identity/run/save/reload passed');
 `});
 assert.equal(check.status,0,check.stderr.slice(-2000));
});
