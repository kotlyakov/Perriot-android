import test from 'node:test';
import assert from 'node:assert/strict';
import {createProfile,collectionEntries} from '../../src/core/profile.js';
import {createProfileStore} from '../../src/persistence/profile-store.js';
import {createRun} from '../../src/core/run.js';
const unlocks=await import('../../src/ui/collection-unlock.js').catch(()=>({}));

test('collection remembers real stored unlocks per profile, without celebrating starting cards',()=>{
 assert.equal(typeof unlocks.observeCollectionUnlocks,'function');
 const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},saves={};
 const store=createProfileStore({read:k=>saves[k]??'',write:(k,v)=>{saves[k]=v;}});store.load();
 const watch=()=>unlocks.observeCollectionUnlocks(collectionEntries(store.getProfile()),store.activeId,storage);
 assert.equal(watch().pending.size,0);
 store.reset(createRun('COLLECTION-REAL',{runId:'collection-real',money:400n,referenceRng:true,referenceShop:true}),{seeded:false});
 assert.ok(store.getProfile().unlocked.includes('j_satellite'));
 let observed=watch();assert.ok(observed.pending.has('j_satellite'));
 store.selectProfile('2');assert.equal(watch().pending.size,0);
 store.selectProfile('1');observed=watch();assert.ok(observed.pending.has('j_satellite'),'Unshown cards stay pending across visits');
 observed.acknowledge('j_satellite');assert.equal(watch().pending.has('j_satellite'),false);
 const p=createProfile();p.unlocked.push('j_satellite');assert.equal(unlocks.observeCollectionUnlocks(collectionEntries(p),'3',storage).pending.size,0,'A first visit never invents a transition');
});

test('presentation metadata failures never block collection or mutate the profile',()=>{
 const profile=createProfile(),before=JSON.stringify(profile),broken={getItem(){throw Error('blocked');},setItem(){throw Error('full');}};
 const observed=unlocks.observeCollectionUnlocks(collectionEntries(profile),'storage-failure',broken);
 assert.equal(observed.pending.size,0);assert.doesNotThrow(()=>observed.acknowledge('j_satellite'));assert.equal(JSON.stringify(profile),before);
});
