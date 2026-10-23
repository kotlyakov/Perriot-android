import {cp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url),assets=new URL('android/app/src/main/assets/',root);
await rm(assets,{recursive:true,force:true});
await mkdir(assets,{recursive:true});
await cp(new URL('src/',root),new URL('src/',assets),{recursive:true});
await cp(new URL('web/',root),new URL('web/',assets),{recursive:true});
await writeFile(new URL('index.html',assets),await readFile(new URL('web/index.html',root)));
console.log('Own offline assets prepared: '+fileURLToPath(assets));
