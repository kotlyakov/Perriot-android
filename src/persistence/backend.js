export function createBackend({native,storage}) {
 return {
   read(slot) {
     const value=native?native.read(slot):storage.getItem('card-cascade.'+slot);
     if(!native && value===null)return '';
     // WebView bridge failures may return undefined instead of propagating a
     // Java exception. Never interpret that as a missing, safe-to-replace file.
     if(typeof value!=='string')throw Error('Save read failed');
     return value;
   },
   write(slot,text) {
     if(native){if((slot==='current'?native.writeCurrent(text):native.writeBackup(text))!==true)throw Error('Save write failed');}
     else storage.setItem('card-cascade.'+slot,text);
   },
 };
}
