import {readFile} from 'node:fs/promises';
// Both review exports embed the real vector renderer, without expanding 150 SVGs
// into duplicated source markup. The native game imports these modules normally.
export async function bundledJokerArtwork(){
 const source=await readFile('src/ui/joker-art.js','utf8');
 const imports=source.match(/import\s*\{([^}]+)\}\s*from ['"]\.\/joker-art-primitives\.js['"]/)[1].split(',').map(s=>s.trim().replace(/\s+as\s+/,':')).join(',');
 const names=imports.split(',').map(s=>s.split(':')[0]).join(',');
 const primitives=(await readFile('src/ui/joker-art-primitives.js','utf8')).replace(/\bexport /g,'');
 const art=source.replace(/^import .*;\n/gm,'').replace(/\bexport /g,'');
 return `(()=>{const {${imports}}=(()=>{${primitives};return {${names}};})();${art};return {jokerArtworkSvg};})()`;
}
