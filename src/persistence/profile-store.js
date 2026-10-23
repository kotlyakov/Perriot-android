import {createProfile,updateProfile} from '../core/profile.js';
import {serializeState,deserializeState} from './save.js';
import {PROFILE_IDS,PROFILE_LIMIT,validateAccount} from './profile-envelope.js';
const initial=()=>({version:1,activeId:'1',profiles:Object.fromEntries(PROFILE_IDS.map(id=>[id,{name:'П'+id,profile:createProfile(),current:null,backup:null}]))});
// The active run and all profile changes share one atomic backend replacement.
// Legacy save bytes remain valid; no historical seeded status is guessed.
export function createProfileStore(io){
 let account,observed,writable=false,recoveryText;
 const read=slot=>{const text=io.read(slot);if(typeof text!=='string')throw Error('Unreadable save');return text;};
 function decode(text){
  if(text.length>PROFILE_LIMIT||new TextEncoder().encode(text).length>PROFILE_LIMIT)throw Error('Profile save exceeds limit');
  const payload=JSON.parse(text);
  if(payload.account){
   validateAccount(payload.account,deserializeState);
   const active=payload.account.profiles[payload.account.activeId].current;
   if(payload.format!=='card-cascade-save'||payload.version!==1||JSON.stringify(payload.state)!==JSON.stringify(active?JSON.parse(active).state:null)||Object.keys(payload).sort().join()!=='account,format,state,version')throw Error('Profile/run mismatch');
   return structuredClone(payload.account);
  }
  const state=deserializeState(text),next=initial();next.profiles['1'].current=text;
  next.profiles['1'].profile=updateProfile(next.profiles['1'].profile,null,state,[],{seeded:true,legacy:true});
  return next;
 }
 const result=status=>({status,state:account?.profiles[account.activeId].current?deserializeState(account.profiles[account.activeId].current):null});
 function load(){
  writable=false;recoveryText=undefined;
  let current,backup;try{current=read('current');}catch{current=null;}try{backup=read('backup');}catch{backup=null;}
  observed=current;
  if(current)try{account=decode(current);writable=true;return result(account.profiles[account.activeId].current?'current':'empty');}catch{}
  if(backup)try{account=decode(backup);recoveryText=backup;return result('recovery');}catch{}
  if(current===''&&backup===''){account=initial();writable=true;return result('empty');}
  account=undefined;return {status:current===null||backup===null?'error':'corrupt',state:null};
 }
 function commit(next){
  if(!writable||observed===undefined||!account)throw Error('Load and resolve storage first');
  if(read('current')!==observed)throw Error('Save changed by another writer');
  const active=next.profiles[next.activeId].current;
  const text=JSON.stringify({format:'card-cascade-save',version:1,state:active?JSON.parse(active).state:null,account:next});decode(text);
  if(observed)io.write('backup',observed);
  io.write('current',text);observed=text;account=next;
 }
 function save(state,events=[],context){
  const next=structuredClone(account);if(!next)throw Error('Storage not loaded');
  const entry=next.profiles[next.activeId],previous=entry.current?deserializeState(entry.current):null;
  entry.profile=updateProfile(entry.profile,previous,state,events,context);
  const text=serializeState(state);
  if(text===entry.current&&JSON.stringify(entry.profile)===JSON.stringify(account.profiles[next.activeId].profile))return;
  entry.backup=entry.current;entry.current=text;commit(next);
 }
 function reset(state,context={seeded:true}){
  if(!writable)throw Error('Resolve storage first');
  const current=account.profiles[account.activeId].current;
  save(state,[],{...context,abandonedRunId:current?deserializeState(current).runId:undefined});
 }
 function selectProfile(id){
  if(!PROFILE_IDS.includes(id))throw Error('Unknown profile');if(id===account?.activeId)return result(account.profiles[id].current?'current':'empty');
  const next=structuredClone(account);next.activeId=id;commit(next);return result(next.profiles[id].current?'current':'empty');
 }
 function restoreBackup(){
  if(!recoveryText||read('current')!==observed)throw Error('No unchanged recovery available');
  const recovered=decode(recoveryText);io.write('current',recoveryText);account=recovered;observed=recoveryText;writable=true;recoveryText=undefined;
  return result(account.profiles[account.activeId].current?'current':'empty').state;
 }
 return {load,save,reset,selectProfile,restoreBackup,get activeId(){return account?.activeId;},getProfile:(id=account?.activeId)=>structuredClone(account?.profiles[id]?.profile),getProfiles:()=>PROFILE_IDS.map(id=>({id,name:account?.profiles[id].name??'П'+id}))};
}
