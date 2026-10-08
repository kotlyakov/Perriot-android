import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,sep,extname} from 'node:path';
const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.ttf':'font/ttf'};
const server=createServer(async(req,res)=>{
  try {
    let path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(path==='/')path='/web/index.html';
    if(!['/web/','/src/'].some(prefix=>path.startsWith(prefix)))throw Error('Forbidden');
    const file=resolve(root,'.'+path);if(!['web','src'].some(dir=>file.startsWith(resolve(root,dir)+sep)))throw Error('Forbidden');
    const bytes=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]??'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);
  }catch {res.writeHead(404);res.end('Not found');}
});
server.listen(Number(process.env.PORT??4173),'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:'+server.address().port));
