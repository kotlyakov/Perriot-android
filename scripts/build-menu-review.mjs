// Conversation-only review uses the actual exported application, with isolated memory storage.
import {readFile,writeFile} from 'node:fs/promises';import {gzipSync} from 'node:zlib';
let html=await readFile('artifacts/field-preview.html','utf8');
const memory=`<script>const previewStorage=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>previewStorage.get(k)??null,setItem:(k,v)=>previewStorage.set(k,String(v)),removeItem:k=>previewStorage.delete(k)}});const startup=new MutationObserver(()=>{const start=document.getElementById('start_new');if(!start)return;startup.disconnect();start.click();const input=document.getElementById('setup_seed');input.value='13031990';input.dispatchEvent(new Event('input',{bubbles:true}));document.getElementById('setup_play').click();setTimeout(()=>document.getElementById('options').click(),50);});startup.observe(document.documentElement,{childList:true,subtree:true});<\/script>`;
html=html.replace('<body>',()=>'<body>'+memory);
const path=process.env.MENU_REVIEW_OUTPUT??'artifacts/menu-review-fragment.html',template=await readFile('tools/previews/menu-review-template.html','utf8');
const fragment=template.replace(/const packed='[^']*';/,()=>"const packed='"+gzipSync(Buffer.from(html)).toString('base64')+"';");
if(Buffer.byteLength(fragment)>=1000000)throw Error('Inline preview exceeds1MB');await writeFile(path,fragment);await writeFile('artifacts/menu-review-fragment.html',fragment);console.log('Inline preview bytes: '+Buffer.byteLength(fragment));
