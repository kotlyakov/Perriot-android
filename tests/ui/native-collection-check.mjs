// Source-shaped DOM interaction checks, independent of dialog integration.
import assert from 'node:assert/strict';
import {createProfile,collectionEntries} from '../../src/core/profile.js';
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
 assert.equal(collection.back(),true);assert.equal(collection.dataset.view,'index');assert.equal(collection.back(),false);
}
assert.equal(navigation.at(-1).view,'index');
const selects=[],view=renderProfileView(profile,{onSelect:id=>selects.push(id)});
find(view,'profile_slot_2').click();assert.deepEqual(selects,[],'Browsing does not load another profile');assert.equal(find(view,'profile_slot_2').attributes['aria-pressed'],'true');find(view,'profile_load').click();assert.deepEqual(selects,['2']);
find(view,'profile_slot_1').click();assert.equal(find(view,'profile_load').disabled,true);
const stats=renderStatsView(profile);assert.equal(all(stats).filter(node=>node.tagName==='tr').length,6);assert.equal(all(stats).filter(node=>node.className==='profile-stats-columns').length,1);find(stats,'profile_usage_tab').click();assert.match(stats.textContent,/Пока нет/);assert.equal(stats.back(),true);assert.equal(stats.back(),false);
const populated=createProfile(),jokers=collectionEntries(populated).filter(entry=>entry.set==='Joker');populated.discovered=jokers.map(entry=>entry.id);populated.usage.jokers=Object.fromEntries(jokers.slice(0,20).map((entry,i)=>[entry.id,i+1]));populated.highScores.hand='9'.repeat(10000);
const populatedStats=renderStatsView(populated);assert.ok(Number(find(populatedStats,'profile_stats_page').textContent.split('/')[1])>20,'Huge values remain paginated');find(populatedStats,'profile_usage_tab').click();assert.equal(find(populatedStats,'profile_usage_page').textContent,'1 / 4');for(let i=0;i<3;i++)find(populatedStats,'profile_usage_next').click();assert.equal(all(populatedStats).filter(node=>node.tagName==='tr').length,2,'All usage rows remain reachable');populatedStats.back();find(populatedStats,'profile_history_tab').click();assert.equal(find(populatedStats,'profile_history_page').textContent,'1 / 2');
assert.equal(JSON.stringify(profile),before,'Views never mutate profile/unlocks');
const seeded=renderCollectionView(profile,'13031990');find(seeded,'collection_category_Joker').click();assert.ok(cards(seeded).every(card=>card.dataset.discovered==='true'),'Verification seed behavior stays intact');assert.equal(JSON.stringify(profile),before);
console.log('Native collection grids/index/back/tooltip and profile explicit-load/stats/nonmutation PASS');
