// DOM-only interaction check; layout boundaries are checked by the integrated preview.
import assert from 'node:assert/strict';
import {createProfile,collectionEntries} from '../../src/core/profile.js';
import {renderCollectionView,renderProfileView} from '../../src/ui/profile-screen.js';
class Node {
 constructor(tag){this.tagName=tag;this.children=[];this.dataset={};this.attributes={};this.style={setProperty(){}};this._text='';}
 set textContent(value){this._text=String(value);this.children=[];}
 get textContent(){return this._text+this.children.map(node=>node.textContent).join('');}
 append(...nodes){this.children.push(...nodes);}
 replaceChildren(...nodes){this._text='';this.children=nodes;}
 setAttribute(key,value){this.attributes[key]=value;}
 querySelectorAll(selector){return all(this).filter(node=>selector==='[data-tab]'&&node.dataset.tab);}
 click(){if(!this.disabled)this.onclick?.();}
}
const all=node=>node.children.flatMap(child=>[child,...all(child)]);
const find=(root,id)=>[root,...all(root)].find(node=>node.id===id);
const cards=root=>all(root).filter(node=>node.className==='collection-card');
globalThis.document={createElement:tag=>new Node(tag)};
const profile=createProfile(),before=JSON.stringify(profile),collection=renderCollectionView(profile);
assert.equal(cards(collection).length,15);
assert.equal(find(collection,'collection_page').textContent,'1 / 10');
assert.equal(find(collection,'collection_prev').disabled,true);
assert.equal(find(collection,'collection_set').hidden,true);
assert.equal(all(collection).filter(node=>node.id?.startsWith('collection_category_')).length,12);
find(collection,'collection_next').click();assert.equal(find(collection,'collection_page').textContent,'2 / 10');
for(let i=0;i<20;i++)find(collection,'collection_next').click();
assert.equal(find(collection,'collection_page').textContent,'10 / 10');assert.equal(find(collection,'collection_next').disabled,true);
const unknown=cards(collection).find(card=>card.dataset.discovered==='false'&&card.dataset.unlocked==='true');
if(unknown){unknown.click();assert.match(find(collection,'collection_details').textContent,/Не обнаружено/);}
const locked=cards(collection).find(card=>card.dataset.unlocked==='false');if(locked){locked.click();assert.ok(find(collection,'collection_details').textContent.length>0,'Locked cards retain unlock conditions');}
find(collection,'collection_category_Seal').click();assert.equal(cards(collection).length,4);assert.equal(find(collection,'collection_page').textContent,'1 / 1');
const view=renderProfileView(profile);find(view,'profile_stats_tab').click();
assert.equal(all(find(view,'profile_details')).filter(node=>node.tagName==='tr').length,6);
assert.equal(find(view,'profile_stats_page').textContent,'1 / 3');
find(view,'profile_stats_next').click();find(view,'profile_stats_next').click();assert.equal(find(view,'profile_stats_page').textContent,'3 / 3');
find(view,'profile_usage_tab').click();assert.match(find(view,'profile_details').textContent,/Пока нет/);
assert.equal(JSON.stringify(profile),before,'Rendering and navigation must not mutate progress');
const populated=createProfile();const entries=collectionEntries(populated).filter(entry=>entry.set==='Joker');populated.discovered=entries.map(entry=>entry.id);populated.usage.jokers=Object.fromEntries(entries.slice(0,20).map((entry,i)=>[entry.id,i+1]));
const populatedView=renderProfileView(populated);find(populatedView,'profile_usage_tab').click();assert.equal(find(populatedView,'profile_usage_page').textContent,'1 / 4');
for(let i=0;i<3;i++)find(populatedView,'profile_usage_next').click();assert.equal(all(find(populatedView,'profile_details')).filter(node=>node.tagName==='tr').length,2,'Usage pages retain rows beyond old top-ten cutoff');
populated.highScores.hand='9'.repeat(10000);const huge=renderProfileView(populated);find(huge,'profile_stats_tab').click();assert.ok(Number(find(huge,'profile_stats_page').textContent.split('/')[1])>20,'Huge saved scores are paginated instead of clipped');
console.log('Profile/collection DOM pages, categories, unknowns, empty states and nonmutation PASS');
