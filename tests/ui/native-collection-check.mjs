// Source-shaped DOM interaction checks, independent of dialog integration.
import assert from 'node:assert/strict';
import {createProfile,collectionEntries} from '../../src/core/profile.js';
import {nativeBlindTarget} from '../../src/core/blind-progression.js';
import {renderCollectionView,renderProfileView} from '../../src/ui/profile-screen.js';
class Node {
 constructor(tag){this.tagName=tag;this.children=[];this.dataset={};this.attributes={};this.style={setProperty:(key,value)=>{this.style[key]=value;}};this._text='';}
 set textContent(value){this._text=String(value);this.children=[];}
 get textContent(){return this._text+this.children.map(node=>node.textContent).join('');}
 append(...nodes){this.children.push(...nodes);}
 replaceChildren(...nodes){this._text='';this.children=nodes;}
 setAttribute(key,value){this.attributes[key]=value;}
 querySelectorAll(selector){return all(this).filter(node=>selector==='[data-tab]'?node.dataset.tab:selector==='[data-entry-id]'?node.dataset.entryId:false);}
 click(){if(!this.disabled)this.onclick?.();}
}
const all=node=>node.children.flatMap(child=>[child,...all(child)]);
const find=(root,id)=>[root,...all(root)].find(node=>node.id===id);
const cards=root=>all(root).filter(node=>node.className==='collection-card');
const rows=root=>all(root).filter(node=>node.className==='collection-card-row');
globalThis.document={createElement:tag=>new Node(tag)};
const profile=createProfile(),before=JSON.stringify(profile),navigation=[];
const collection=renderCollectionView(profile,undefined,{onNavigate:state=>navigation.push(state)});
assert.equal(collection.dataset.view,'index');assert.equal(cards(collection).length,0);
assert.equal(all(collection).filter(node=>node.className==='collection-category-column').length,2);
assert.equal(all(collection).filter(node=>node.id?.startsWith('collection_category_')).length,12);
const group=all(collection).find(node=>node.className==='collection-consumables');
for(const set of ['Tarot','Planet','Spectral'])assert.ok(find(group,'collection_category_'+set));
const expected={Joker:[5,5,5],Tarot:[5,6],Planet:[6,6],Spectral:[4,5],Voucher:[4,4],Booster:[4,4],Enhanced:[4,4],Seal:[4],Edition:[5],Back:[1],Tag:[6,6,6,6],Blind:[5,5,5,5,5,5]};
for(const [set,capacities] of Object.entries(expected)){
 find(collection,'collection_category_'+set).click();
 assert.equal(collection.dataset.view,'category');assert.equal(all(collection).some(node=>node.className==='collection-categories'),false,'Category removes the index');
 assert.deepEqual(rows(collection).map(node=>node.style['--collection-columns']),capacities);
 const total=collectionEntries(profile).filter(entry=>entry.set===set).length,size=capacities.reduce((n,x)=>n+x,0),pages=Math.ceil(total/size);
 assert.equal(cards(collection).length,Math.min(total,size));if(pages>1||['Joker','Tarot','Spectral','Voucher','Booster','Back'].includes(set))assert.equal(find(collection,'collection_page').textContent,`1 / ${pages}`);else assert.equal(find(collection,'collection_page'),undefined);
 const visited=cards(collection).map(card=>card.dataset.entryId);
 for(let page=1;page<pages;page++){find(collection,'collection_next').click();visited.push(...cards(collection).map(card=>card.dataset.entryId));}
 assert.equal(visited.length,total);assert.equal(new Set(visited).size,total,'Every category item appears exactly once');
 if(cards(collection).length){const card=cards(collection)[0];card.click();const tip=find(collection,'collection_details');assert.equal(tip.hidden,false);assert.equal(tip.attributes.role,'tooltip');assert.equal(card.attributes['aria-describedby'],tip.id);assert.ok(tip.textContent.length>0);if(card.dataset.discovered==='false'&&card.dataset.unlocked==='true')assert.match(tip.textContent,/Не обнаружено/);}
 if(set==='Blind'){const table=all(collection).find(node=>node.className==='collection-ante-table');assert.ok(table);const anteRows=all(table).filter(node=>node.dataset.ante);assert.equal(anteRows.length,16);for(const record of anteRows)assert.equal(record.dataset.target,String(nativeBlindTarget(Number(record.dataset.ante))));}
 const selected=cards(collection)[0];if(selected){selected.onmouseenter();assert.equal(find(collection,'collection_details').hidden,false);find(collection,'collection_detail_close').click();selected.onmouseenter();assert.equal(find(collection,'collection_details').hidden,true,'Explicit close suppresses hover reopening');selected.click();assert.equal(find(collection,'collection_details').hidden,false,'Click still opens tooltip');find(collection,'collection_detail_close').click();const grid=all(collection).find(node=>node.className==='collection-grid');grid.onmouseleave();selected.onmouseenter();assert.equal(find(collection,'collection_details').hidden,false,'Leaving grid restores hover');collection.onkeydown({key:'Escape',stopPropagation(){}});selected.onmouseenter();assert.equal(find(collection,'collection_details').hidden,true);selected.onfocus();assert.equal(find(collection,'collection_details').hidden,false,'Keyboard focus always opens');}
 assert.equal(collection.back(),true);assert.equal(collection.dataset.view,'index');assert.equal(collection.back(),false);
}
assert.equal(navigation.at(-1).view,'index');
const renamed=[],view=renderProfileView(profile,{name:'Игрок',onRename:name=>renamed.push(name)});
assert.equal(view.attributes['aria-label'],'Профиль игрока');
assert.equal(find(view,'profile_slot_2'),undefined);
assert.equal(find(view,'profile_load'),undefined);
assert.equal(find(view,'profile_reset'),undefined);
const nameInput=find(view,'profile_name');assert.ok(nameInput);assert.equal(nameInput.value,'Игрок');assert.equal(nameInput.maxLength,16);
nameInput.value='  Новое имя  ';nameInput.onchange();assert.deepEqual(renamed,['Новое имя']);
assert.equal(all(view).filter(node=>node.className?.split(' ').includes('profile-progress-item')).length,5,'Overall plus four detail fractions');
let failRename=true;const guarded=renderProfileView(profile,{name:'Сохранено',onRename:value=>{if(failRename)throw Error('disk full');return value;}}),guardedInput=find(guarded,'profile_name');guardedInput.value='Потеря';guardedInput.onchange();assert.equal(guardedInput.value,'Сохранено');assert.match(find(guarded,'profile_name_status').textContent,/Не удалось/);assert.equal(find(guarded,'profile_name_status').attributes.role,'status');failRename=false;guardedInput.value='Ещё раз';guardedInput.onchange();assert.equal(guardedInput.value,'Ещё раз');assert.equal(find(guarded,'profile_name_status').textContent,'');
const completed=createProfile();completed.completedChallenges=Array.from({length:20},(_,i)=>'c'+i);
const completion=renderProfileView(completed);const overall=find(completion,'profile_progress_overall');assert.ok(overall);assert.equal(Number(overall.dataset.percent),Math.floor(.01+25+25*collectionEntries(completed).filter(entry=>!['Enhanced','Seal'].includes(entry.set)&&entry.discovered).length/collectionEntries(completed).filter(entry=>!['Enhanced','Seal'].includes(entry.set)).length),'Overall averages four independent fractions');
find(collection,'collection_category_Joker').click();
assert.equal(cards(collection).length,15);
assert.ok(cards(collection).every(card=>!card.children.some(child=>child.tagName==='strong')),'Names belong in tooltip, never portrait faces');
assert.ok(cards(collection).every(card=>card.dataset.cardState),'Every portrait has a discovery/lock state');
const pageSelect=find(collection,'collection_page_select');assert.ok(pageSelect);assert.equal(pageSelect.children.length,10);pageSelect.value='2';pageSelect.onchange();assert.equal(find(collection,'collection_page').textContent,'3 / 10');find(collection,'collection_page_select').value='9';find(collection,'collection_page_select').onchange();find(collection,'collection_next').click();assert.equal(find(collection,'collection_page').textContent,'1 / 10');find(collection,'collection_prev').click();assert.equal(find(collection,'collection_page').textContent,'10 / 10');
assert.ok(cards(collection).some(card=>card.children.some(child=>child.className==='collection-state-art')));
collection.back();
for(const set of ['Tarot','Planet','Spectral'])assert.equal(find(collection,'collection_category_'+set).dataset.cardSet,set);
assert.equal(JSON.stringify(profile),before,'Views never mutate profile/unlocks');
const seeded=renderCollectionView(profile,'13031990');find(seeded,'collection_category_Joker').click();assert.ok(cards(seeded).every(card=>card.dataset.discovered==='true'),'Verification seed behavior stays intact');assert.ok(cards(seeded).every(card=>card.children.some(child=>child.className==='shop-art'&&child.innerHTML.includes('<svg'))),'Discovered portraits reuse original project artwork');assert.ok(cards(seeded).every(card=>card.attributes['aria-pressed']===undefined),'Collection portraits do not become selected');cards(seeded)[0].click();assert.ok(all(find(seeded,'collection_details')).some(node=>node.className==='collection-rarity'&&node.dataset.rarity==='1'));assert.equal(JSON.stringify(profile),before);
console.log('Collection portrait states/paging/tooltips and single player profile naming/progress/nonmutation PASS');
