import {test} from 'node:test';import assert from 'node:assert/strict';
import {parseBV,dustLevel,isDusty,makePlan} from '../lib/rules';import {signWBI} from '../lib/wbi';import {emptyState,type Video} from '../lib/model';
const now=new Date('2026-11-11T12:00:00Z');
const v=(id:string,seconds:number,source:Video['source'],extra:Partial<Video>={}):Video=>({bvid:id,title:id,cover:'',duration:seconds,source,sources:[source],upName:'UP'+id,upMid:id,pubdate:'2026-11-10',...extra});
test('BV validation rejects lookalike hosts, paths, credentials and short links',()=>{assert.equal(parseBV('BV1NS4t6oEXQ'),'BV1NS4t6oEXQ');assert.equal(parseBV('https://www.bilibili.com/video/BV1NS4t6oEXQ/?spm_id_from=333'),'BV1NS4t6oEXQ');for(const s of ['BV123','https://bilibili.com.evil.com/video/BV1NS4t6oEXQ','http://www.bilibili.com/video/BV1NS4t6oEXQ','https://user@www.bilibili.com/video/BV1NS4t6oEXQ','BV1NS4t6oEXQxxx','https://b23.tv/abc'])assert.equal(parseBV(s),null);});
test('dust never invents unknown or future publication dates; 90 days is not over 90',()=>{assert.equal(dustLevel(undefined,now),0);assert.equal(dustLevel('bad',now),0);assert.equal(dustLevel('2027-01-01',now),0);assert.equal(dustLevel('2026-08-13T12:00:00Z',now),0);assert.equal(dustLevel('2026-08-12',now),1);assert.equal(dustLevel('2026-01-01',now),2);assert.equal(dustLevel('2025-01-01',now),3);});
test('plan reserves dust, must watch, diversity, at most one hot, within budget',()=>{const state=emptyState();state.tiers.must='must';const input=[v('dust',500,'fav',{pubdate:'2025-01-01',favAt:'2026-11-10'}),v('must',800,'follow'),v('h1',200,'hot'),v('h2',250,'hot'),v('custom',150,'custom'),v('unfit',4000,'fav')];const plan=makePlan(input,1800,state,now);assert.ok(plan.some(v=>v.bvid==='dust'));assert.ok(plan.some(v=>v.bvid==='must'));assert.ok(plan.reduce((s,v)=>s+v.duration,0)<=1800);assert.ok(plan.filter(v=>v.source==='hot').length<=1);assert.equal(new Set(plan.map(v=>v.bvid)).size,plan.length);});
test('watch status, blocked categories, stale follows, unknown durations and releases are excluded',()=>{const state=emptyState();state.watched.watched={bvid:'watched',at:'2026-11-11',upName:'UP'};state.blocked=['游戏'];state.released=['gone'];const list=[v('watched',100,'fav'),v('blocked',100,'hot',{category:'游戏'}),v('stale',100,'follow',{pubdate:'2020-01-01'}),v('gone',100,'fav'),v('unknown',0,'fav'),v('ok',200,'custom')];assert.deepEqual(makePlan(list,1800,state,now).map(v=>v.bvid),['ok']);});
test('multiple budgets never overflow and keep a fitting dusty item',()=>{const input=Array.from({length:40},(_,i)=>v('v'+i,90+i*41,i%3===0?'fav':i%3===1?'follow':'hot',i%3===0?{pubdate:'2025-02-01',favAt:'2026-11-10'}:{}));for(let budget=1800;budget<=14400;budget+=300){const plan=makePlan(input,budget,emptyState(),now,budget);assert.ok(plan.reduce((s,v)=>s+v.duration,0)<=budget);assert.ok(plan.some(v=>isDusty(v,now)));assert.ok(plan.filter(v=>v.source==='hot').length<=1);}});
test('WBI deterministic fixture and escaping',()=>{const result=signWBI({foo:'114',bar:'514',baz:1919810},'7cd084941338484aae1ad9425b84077c','4932caff0ff746eab6f01bf08b70ac45',1702204169);assert.equal(result,'bar=514&baz=1919810&foo=114&wts=1702204169&w_rid=6149fdadf571698ca7e6a567265cd0ee');assert.ok(signWBI({q:"a!b(c)*'"},'a'.repeat(32),'b'.repeat(32),1).startsWith('q=abc&wts=1&'));});

test('old saved video is dusty even with no collection date; recent uploads and non-favorites are not',()=>{
 assert.equal(isDusty(v('old',200,'fav',{pubdate:'2025-01-01'}),now),true);
 assert.equal(isDusty(v('new',200,'fav',{pubdate:'2026-11-10',favAt:'2025-01-01'}),now),false);
 assert.equal(isDusty(v('hot',200,'hot',{pubdate:'2020-01-01'}),now),false);
 assert.equal(isDusty(v('unknown',200,'fav',{pubdate:'',favAt:'2020-01-01'}),now),false);
 const saved=v('saved',500,'fav',{pubdate:'2020-01-01'});
 const plan=makePlan([v('must',1200,'follow'),saved],1800,emptyState(),now);
 assert.ok(plan.some(x=>x.bvid==='saved'));
});
