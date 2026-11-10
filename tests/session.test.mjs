import test from 'node:test';
import assert from 'node:assert/strict';
import {planSession} from '../dist/session.mjs';
const video=(key,author,duration,sources=['following'])=>({key,creatorKey:author,author,duration,sources});
test('放映单遵守预算、排除看完和未知时长，同一博主只选一条',()=>{const vs=[video('a','A',401),video('b','A',120),video('c','C',199),video('d','D',null),video('e','E',200),video('f','F',900)];for(let i=0;i<40;i++){const plan=planSession(vs,{minutes:10,prefs:{e:{watched:true}}});assert.ok(plan.total<=600);assert.ok(plan.videos.length);assert.equal(plan.total,plan.videos.reduce((sum,v)=>sum+v.duration,0));assert.equal(new Set(plan.videos.map(v=>v.creatorKey)).size,plan.videos.length);assert.ok(plan.videos.every(v=>!['d','e','f'].includes(v.key)));}});
test('分钟预算向上取整仍不超时，空范围可解释地返回空单',()=>{assert.equal(planSession([video('a','A',600.1)],{minutes:10}).videos.length,0);assert.equal(planSession([video('a','A',600)],{minutes:10}).total,600);assert.deepEqual(planSession([]).videos,[]);});
test('存在时长合适的组合时能形成多博主放映单',()=>{const p=planSession([video('a','A',420),video('b','B',180),video('c','C',200)],{minutes:10,random:()=>.5});assert.equal(p.total,600);assert.equal(p.videos.length,2);});
