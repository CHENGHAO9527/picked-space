import {test} from 'node:test';import assert from 'node:assert/strict';
import {sanitizeLegacy,isPublicFolder} from '../lib/import-policy';
const video={id:'BV1NS4t6oEXQ',platform:'bilibili',title:'已核实的公开标题',author:'公开UP',creatorId:'123',duration:600,publishedAt:'2025-01-01',sources:['following','favorites'],collections:['公开收藏']};
test('public import strips unknown account/credential fields and does not infer follows',()=>{
 const {snapshot}=sanitizeLegacy({Cookie:'not-a-real-secret',account:{name:'private profile'},videos:[{...video,SESSDATA:'example-only',raw:{token:'test-only'}}]});
 assert.equal(snapshot.videos.length,1);assert.deepEqual(snapshot.followedCreators,[]);assert.ok(!JSON.stringify(snapshot).includes('SESSDATA'));assert.ok(!JSON.stringify(snapshot).includes('Cookie'));assert.ok(!JSON.stringify(snapshot).includes('private profile'));
});
test('private, excluded and non-Bilibili rows are removed; duplicate BV retains public sources',()=>{
 const {snapshot,skipped}=sanitizeLegacy({videos:[video,{...video,sources:['ranking'],collections:['其他公开夹']},{...video,visibility:'private'},{...video,collections:['测试排除夹']},{...video,platform:'douyin'}]},new Set(['测试排除夹']));
 assert.equal(skipped,3);assert.equal(snapshot.videos.length,1);assert.deepEqual(snapshot.videos[0].sources,['following','favorites','ranking']);assert.deepEqual(snapshot.videos[0].collections,['公开收藏','其他公开夹']);
});
test('unknown dates remain unknown and unsafe covers are not fetched',()=>{
 const {snapshot}=sanitizeLegacy({videos:[{...video,publishedAt:'unknown',cover:'http://127.0.0.1/private'}]});assert.equal(snapshot.videos[0].publishedAt,'');assert.equal(snapshot.videos[0].cover,'');assert.throws(()=>sanitizeLegacy({videos:'bad'}));
});
test('folder privacy requires a known public attr and honors per-user exclusions',()=>{
 assert.equal(isPublicFolder({attr:0,title:'公开夹'}),true);assert.equal(isPublicFolder({attr:'0',title:'公开夹'}),true);assert.equal(isPublicFolder({attr:1,title:'私密夹'}),false);assert.equal(isPublicFolder({title:'未知权限'}),false);assert.equal(isPublicFolder({attr:null}),false);assert.equal(isPublicFolder({attr:0,title:'排除'},new Set(['排除'])),false);
});
