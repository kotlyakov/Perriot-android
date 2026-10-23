// Source-shaped DOM interaction checks, independent of dialog integration.
import assert from 'node:assert/strict';
import {createProfile,collectionEntries} from '../../src/core/profile.js';
import {nativeBlindTarget} from '../../src/core/blind-progression.js';
import {renderCollectionView,renderProfileView,renderStatsView} from '../../src/ui/profile-screen.js';
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
 assert.equal(cards(collection).length,Math.min(total,size));assert.equal(find(collection,'collection_page').textContent,`1 / ${pages}`);
 const visited=cards(collection).map(card=>card.dataset.entryId);
 for(let page=1;page<pages;page++){find(collection,'collection_next').click();visited.push(...cards(collection).map(card=>card.dataset.entryId));}
 assert.equal(visited.length,total);assert.equal(new Set(visited).size,total,'Every category item appears exactly once');
 if(cards(collection).length){const card=cards(collection)[0];card.click();const tip=find(collection,'collection_details');assert.equal(tip.hidden,false);assert.equal(tip.attributes.role,'tooltip');assert.equal(card.attributes['aria-describedby'],tip.id);assert.ok(tip.textContent.length>0);if(card.dataset.discovered==='false'&&card.dataset.unlocked==='true')assert.match(tip.textContent,/Не обнаружено/);}
 if(set==='Blind'){const table=all(collection).find(node=>node.className==='collection-ante-table');assert.ok(table);const anteRows=all(table).filter(node=>node.dataset.ante);assert.equal(anteRows.length,16);for(const record of anteRows)assert.equal(record.dataset.target,String(nativeBlindTarget(Number(record.dataset.ante))));}
 const selected=cards(collection)[0];if(selected){selected.onmouseenter();assert.equal(find(collection,'collection_details').hidden,false);find(collection,'collection_detail_close').click();selected.onmouseenter();assert.equal(find(collection,'collection_details').hidden,true,'Explicit close suppresses hover reopening');selected.click();assert.equal(find(collection,'collection_details').hidden,false,'Click still opens tooltip');find(collection,'collection_detail_close').click();const grid=all(collection).find(node=>node.className==='collection-grid');grid.onmouseleave();selected.onmouseenter();assert.equal(find(collection,'collection_details').hidden,false,'Leaving grid restores hover');collection.onkeydown({key:'Escape',stopPropagation(){}});selected.onmouseenter();assert.equal(find(collection,'collection_details').hidden,true);selected.onfocus();assert.equal(find(collection,'collection_details').hidden,false,'Keyboard focus always opens');}
 assert.equal(collection.back(),true);assert.equal(collection.dataset.view,'index');assert.equal(collection.back(),false);
}
assert.equal(navigation.at(-1).view,'index');
const selects=[],view=renderProfileView(profile,{onSelect:id=>selects.push(id)});
find(view,'profile_slot_2').click();assert.deepEqual(selects,[],'Browsing does not load another profile');assert.equal(find(view,'profile_slot_2').attributes['aria-pressed'],'true');find(view,'profile_load').click();assert.deepEqual(selects,['2']);
find(view,'profile_slot_1').click();assert.equal(find(view,'profile_load').disabled,true);
const stats=renderStatsView(profile);assert.equal(all(stats).filter(node=>node.tagName==='tr').length,6);assert.equal(all(stats).filter(node=>node.className==='profile-stats-columns').length,1);find(stats,'profile_usage_tab').click();assert.match(stats.textContent,/Пока нет/);assert.equal(stats.back(),true);assert.equal(stats.back(),false);
const populated=createProfile(),jokers=collectionEntries(populated).filter(entry=>entry.set==='Joker');populated.discovered=jokers.map(entry=>entry.id);populated.usage.jokers=Object.fromEntries(jokers.slice(0,20).map((entry,i)=>[entry.id,i+1]));populated.highScores.hand='9'.repeat(10000);
const populatedStats=renderStatsView(populated);assert.ok(Number(find(populatedStats,'profile_stats_page').textContent.split('/')[1])>20,'Huge values remain paginated');assert.equal(find(populatedStats,'profile_history_tab'),undefined,'Main scores keeps only native actions');find(populatedStats,'profile_usage_tab').click();assert.equal(all(populatedStats).filter(node=>node.dataset.tab).length,6);assert.equal(find(populatedStats,'profile_usage_page').textContent,'1 / 2');const bars=()=>all(populatedStats).filter(node=>node.className==='profile-usage-bar');assert.deepEqual(bars().map(node=>Number(node.dataset.count)),[20,19,18,17,16,15,14,13,12,11]);assert.equal(all(populatedStats).filter(node=>node.className==='profile-usage-column').length,10);find(populatedStats,'profile_usage_next').click();assert.deepEqual(bars().map(node=>Number(node.dataset.count)),[10,9,8,7,6,5,4,3,2,1]);
const consumables=collectionEntries(populated).filter(entry=>['Tarot','Planet','Spectral'].includes(entry.set));populated.discovered.push(...consumables.map(entry=>entry.id));populated.usage.consumables=Object.fromEntries(consumables.map((entry,i)=>[entry.id,i+1]));const filtered=renderStatsView(populated);find(filtered,'profile_usage_tab').click();for(const set of ['Tarot','Planet','Spectral']){find(filtered,'profile_usage_'+set).click();const shown=all(filtered).filter(node=>node.dataset.entryId);assert.ok(shown.length);assert.ok(shown.every(node=>consumables.some(entry=>entry.id===node.dataset.entryId&&entry.set===set)));}
assert.equal(JSON.stringify(profile),before,'Views never mutate profile/unlocks');
const seeded=renderCollectionView(profile,'13031990');find(seeded,'collection_category_Joker').click();assert.ok(cards(seeded).every(card=>card.dataset.discovered==='true'),'Verification seed behavior stays intact');assert.equal(JSON.stringify(profile),before);
console.log('Native collection grids/index/back/tooltip and profile explicit-load/stats/nonmutation PASS');
