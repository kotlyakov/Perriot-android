import {serializeState,deserializeState} from './save.js';

// Each backend write replaces one whole slot or throws. Native uses AtomicFile;
// browser uses localStorage. The codec validates before any disk mutation.
export function createRepository(io) {
  const unreadable=Symbol('unreadable');
  let observed=null, writable=false;
  function read(slot){try{return io.read(slot);}catch{return unreadable;}}
  function valid(text) {try {return text ? deserializeState(text) : null;}catch {return null;}}
  function load() {
    writable=false;
      const current=read('current'),backup=read('backup');observed=current;
      const state=valid(current),reserved=valid(backup);
      if(state){writable=true;return {status:'current',state};}
      if(reserved)return {status:'recovery',state:reserved};
      if(!current && !backup){writable=true;return {status:'empty',state:null};}
      if(current===unreadable || backup===unreadable)return {status:'error',state:null};
      return {status:'corrupt',state:null};
  }
  function save(state) {
    const text=serializeState(state);deserializeState(text);
    if(!writable || observed===null)throw Error('Storage must be loaded and resolved first');
    const current=io.read('current');
    if(current!==observed)throw Error('Save was changed by another writer');
    if(current)io.write('backup',current);
    io.write('current',text);observed=text;
  }
  function restoreBackup() {
    if(observed===null)load();
    if(read('current')!==observed)throw Error('Save changed since recovery was offered');
    const text=io.read('backup'),state=deserializeState(text);
    io.write('current',text);observed=text;writable=true;return state;
  }
  function reset(state) {
    // Only explicit user confirmation calls reset. A corrupt pair is preserved
    // and must be exported/cleared separately; no silent destructive repair.
    const result=load();
    if(!['empty','current'].includes(result.status))throw Error('Resolve damaged saves before starting a new run');
    save(state);
  }
  return {load,save,restoreBackup,reset};
}
