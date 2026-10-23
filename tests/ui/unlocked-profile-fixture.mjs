import {createProfile,collectionEntries} from '../../src/core/profile.js';
import {DECKS} from '../../src/content/decks.js';
// Item10a/10b exercise every deck/stake. Unlock their setup explicitly rather
// than granting production users preview access or weakening admission rules.
export function unlockedProfileFixture(){
 const profile=createProfile();profile.unlocked=collectionEntries(profile).map(e=>e.id);profile.deckWins=Object.fromEntries(Object.keys(DECKS).map(id=>[id,Array(8).fill(1)]));
 const account={version:1,activeId:'1',profiles:Object.fromEntries(['1','2','3'].map(id=>[id,{name:'П'+id,profile:id==='1'?profile:createProfile(),current:null,backup:null}]))};
 return JSON.stringify({format:'card-cascade-save',version:1,state:null,account});
}
export async function installUnlockedProfile(context){await context.addInitScript(text=>{if(localStorage.getItem('card-cascade.current')===null)localStorage.setItem('card-cascade.current',text);},unlockedProfileFixture());}
