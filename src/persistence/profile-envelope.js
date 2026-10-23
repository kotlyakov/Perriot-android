import {validateProfile} from '../core/profile.js';
export const PROFILE_IDS=['1','2','3'];
export const PROFILE_LIMIT=16*1024*1024;
export function validateAccount(account,decodeRun){
 if(!account||account.version!==1||!PROFILE_IDS.includes(account.activeId)||!account.profiles||Object.keys(account).sort().join()!=='activeId,profiles,version'||Object.keys(account.profiles).sort().join()!=='1,2,3')throw Error('Invalid profiles');
 for(const id of PROFILE_IDS){
  const entry=account.profiles[id];
  if(!entry||Object.keys(entry).sort().join()!=='backup,current,name,profile'||typeof entry.name!=='string'||!entry.name.trim()||entry.name.length>32)throw Error('Invalid profile entry');
  validateProfile(entry.profile);
  for(const slot of ['current','backup'])if(entry[slot]!==null){
   if(typeof entry[slot]!=='string'||Object.hasOwn(JSON.parse(entry[slot]),'account'))throw Error('Invalid profile run');
   decodeRun(entry[slot]);
  }
 }
 return account;
}
