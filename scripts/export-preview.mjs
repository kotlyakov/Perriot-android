import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),sources={};
async function scan(dir) {for(const e of await readdir(new URL(dir,root),{withFileTypes:true})){const p=dir+e.name;if(e.isDirectory())await scan(p+'/');else if(e.name.endsWith('.js'))sources['/'+p]=await readFile(new URL(p,root),'utf8');}}
await scan('src/');
let html=await readFile(new URL('web/index.html',root),'utf8');
let css=(await Promise.all(['styles','start-screen','blind-select','shop-screen','window-review','profile-review','challenge-review','card-materials','aspect-layout'].map(name=>readFile(new URL('web/'+name+'.css',root),'utf8')))).join('\n');
css=css.replaceAll('/web/fonts/Rubik.ttf','data:font/ttf;base64,'+(await readFile(new URL('web/fonts/Rubik.ttf',root))).toString('base64'));
html=html.replace('<link rel="stylesheet" href="/web/styles.css">',()=>'<style>'+css+'</style>');
html=html.replace('<link rel="stylesheet" href="/web/start-screen.css">','').replace('<link rel="stylesheet" href="/web/blind-select.css">','').replace('<link rel="stylesheet" href="/web/shop-screen.css">','');
for(const name of ['window-review','profile-review','challenge-review','card-materials','aspect-layout'])html=html.replace('<link rel="stylesheet" href="/web/'+name+'.css">','');
// Stable specifiers let native ESM link cycles and share dependencies without recursion.
const imports=Object.fromEntries(Object.entries(sources).map(([id,source])=>{
 const code=source.replace(/(from\s*['"])([^'"]+)(['"])/g,(all,a,rel,b)=>a+'preview:'+new URL(rel,'https://local'+id).pathname+b);
 return ['preview:'+id,'data:text/javascript;base64,'+Buffer.from(code).toString('base64')+'#'+id];
}));
const loader=`<script type="importmap">${JSON.stringify({imports}).replaceAll('<','\\u003c')}</script>
<script type="module">
import('preview:/src/ui/app.js').catch(error=>{document.getElementById('notice').textContent='Не удалось запустить предпросмотр: '+error.message;console.error(error);});
</script>`;
html=html.replace('<script type="module" src="/src/ui/app.js"></script>',()=>loader);
await mkdir(new URL('artifacts/',root),{recursive:true});
await writeFile(new URL('artifacts/field-preview.html',root),html);
console.log('Standalone preview exported: artifacts/field-preview.html');
