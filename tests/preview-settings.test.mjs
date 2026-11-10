import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeShots,createPreviewService} from '../preview.mjs';
import {snapshotCell} from '../dist/hover-preview.mjs';
import {normalizeSettings,customizationBrief} from '../dist/settings.mjs';
const raw={image:['//i0.hdslb.com/bfs/videoshot/a.jpg','//i0.hdslb.com/bfs/videoshot/b.jpg'],img_x_len:2,img_y_len:2,index:[0,0,10,20,30,40,50]};
test('预览快照处理哨兵与跨拼图坐标，不接受非B站图片',()=>{const shots=normalizeShots(raw);assert.deepEqual(snapshotCell(shots,0),{image:'https://i0.hdslb.com/bfs/videoshot/a.jpg',x:0,y:0,time:0});assert.deepEqual(snapshotCell(shots,1),{image:'https://i0.hdslb.com/bfs/videoshot/b.jpg',x:1,y:0,time:50});for(const bad of ['https://evil.com/x','http://i0.hdslb.com/x','https://i0.hdslb.com.evil.com/x','https://user@i0.hdslb.com/x'])assert.throws(()=>normalizeShots({...raw,image:[bad]}));assert.throws(()=>normalizeShots({...raw,index:[0,20,10]}));});
test('同视频预览去重缓存及编号验证',async()=>{let calls=0;const service=createPreviewService({fetcher:async()=>{calls++;return {ok:true,json:async()=>({code:0,data:raw})}},now:()=>1000});await Promise.all([service.resolve('BV1HWMx6wEum'),service.resolve('BV1HWMx6wEum')]);await service.resolve('BV1HWMx6wEum');assert.equal(calls,1);await assert.rejects(()=>service.resolve('https://evil.com'));});
test('个人偏好有安全默认并可导出独立需求说明',()=>{const s=normalizeSettings({columns:999,inactiveMonths:13,hoverPreview:false,interests:'吉他',request:'周末看教程',includeRanking:false});assert.equal(s.columns,5);assert.equal(s.inactiveMonths,12);assert.equal(s.hoverPreview,false);assert.equal(s.includeRanking,false);assert.ok(customizationBrief(s).includes('周末看教程'));assert.ok(customizationBrief(s).includes('吉他'));});
