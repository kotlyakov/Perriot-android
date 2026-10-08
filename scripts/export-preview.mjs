import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),sources={};
async function scan(dir) {for(const e of await readdir(new URL(dir,root),{withFileTypes:true})){const p=dir+e.name;if(e.isDirectory())await scan(p+'/');else if(e.name.endsWith('.js'))sources['/'+p]=await readFile(new URL(p,root),'utf8');}}
await scan('src/');
let html=await readFile(new URL('web/index.html',root),'utf8');
let css=(await Promise.all(['styles','start-screen','blind-select'].map(name=>readFile(new URL('web/'+name+'.css',root),'utf8')))).join('\n');
css=css.replaceAll('/web/fonts/Rubik.ttf','data:font/ttf;base64,'+(await readFile(new URL('web/fonts/Rubik.ttf',root))).toString('base64'));
html=html.replace('<link rel="stylesheet" href="/web/styles.css">',()=>'<style>'+css+'</style>');
html=html.replace('<link rel="stylesheet" href="/web/start-screen.css">','').replace('<link rel="stylesheet" href="/web/blind-select.css">','');
const safe=JSON.stringify(sources).replaceAll('<','\\u003c');
const loader=`<script type="module">
const sources=${safe},urls=new Map();
function moduleURL(id){if(urls.has(id))return urls.get(id);const code=sources[id].replace(/(from\\s*['"])([^'"]+)(['"])/g,(all,a,rel,b)=>a+moduleURL(new URL(rel,'https://local'+id).pathname)+b);const url=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));urls.set(id,url);return url;}
import(moduleURL('/src/ui/app.js')).catch(error=>{document.getElementById('notice').textContent='Не удалось запустить предпросмотр: '+error.message;console.error(error);});
</script>`;
html=html.replace('<script type="module" src="/src/ui/app.js"></script>',()=>loader);
await mkdir(new URL('artifacts/',root),{recursive:true});
await writeFile(new URL('artifacts/field-preview.html',root),html);
console.log('Standalone preview exported: artifacts/field-preview.html');
