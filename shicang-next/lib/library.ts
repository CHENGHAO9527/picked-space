import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {sanitizeLegacy,excludedFolders} from './import-policy';
import {db,videosTable,getDoc,putDoc} from './db';
import type {Video,Creator,Source,State} from './model';
import {emptyState} from './model';
import {eq} from 'drizzle-orm';
import publicDemo from './demo-public.json';
import {parseBV} from './rules';
export function upsertVideos(videos:Video[],namespace='real'){
 for(const video of videos){if(!parseBV(video.bvid||''))continue;const key=namespace+':'+video.bvid;const old=db.select().from(videosTable).where(eq(videosTable.bvid,key)).get();const previous:Video|undefined=old?JSON.parse(old.value):undefined;const v={...previous,...video,sources:Array.from(new Set([...(previous?.sources||[]),...video.sources])),favAt:video.favAt||previous?.favAt,pubdate:video.pubdate||previous?.pubdate||'',duration:video.duration>0?video.duration:previous?.duration||0,category:video.category&&video.category!=='未分类'?video.category:previous?.category||video.category};
 db.insert(videosTable).values({bvid:key,value:JSON.stringify(v)}).onConflictDoUpdate({target:videosTable.bvid,set:{value:JSON.stringify(v)}}).run();}
}
function seedLegacy(){
 if(!fs.existsSync('.local/legacy-library.json'))return;
 const raw=fs.readFileSync('.local/legacy-library.json','utf8');const digest=createHash('sha256').update(raw).digest('hex');if(getDoc('legacyImportDigest','')===digest)return;
 let input:unknown;try{input=JSON.parse(raw);}catch{throw Error('本地快照格式错误，请重新导入');}
 const {snapshot:legacy}=sanitizeLegacy(input);const creators:Creator[]=legacy.followedCreators;
 const inactive=new Set(creators.filter(c=>c.lastUploadAt&&Date.now()-Date.parse(c.lastUploadAt)>365*86400000).map(c=>c.id));
 const aliases:Record<string,Source>={following:'follow',favorites:'fav',watchlater:'fav',ranking:'hot',custom:'custom'};
 const videos:Video[]=legacy.videos.filter((v:any)=>v.platform==='bilibili'&&v.visibility!=='private').flatMap((v:any)=>{
 const sources=Array.from(new Set<Source>((v.sources||[]).filter((s:string)=>!(s==='following'&&inactive.has(v.creatorId))).map((s:string)=>aliases[s]).filter(Boolean)));if(!sources.length)return [];
 return [{bvid:v.id,title:v.title,cover:v.cover,duration:Number(v.duration||0),upName:v.author,upMid:String(v.creatorId||''),pubdate:v.publishedAt||'',source:sources[0],sources,folder:v.collections?.join('、')||(v.sources?.includes('watchlater')?'稍后再看':undefined),category:'未分类',reason:'来自你导入的视频快照'}];});
 upsertVideos(videos);putDoc('creators',Array.from(new Map([...getDoc<Creator[]>('creators',[]),...creators].map(c=>[c.id,c])).values()));putDoc('legacyImported',true);putDoc('legacyImportDigest',digest);putDoc('snapshotAt',legacy.updatedAt||null);
}
function seedMock(){
 if(getDoc('mockSeeded:v3',false)){
  if(!getDoc('mockPublishedAge:v4',false)){
   for(const row of db.select().from(videosTable).all().filter(r=>r.bvid.startsWith('mock:'))){
    const video:Video=JSON.parse(row.value);
    // Only simulated favorite examples change; manual additions and real-library dates are untouched.
    if(video.source==='fav'&&video.favAt&&!video.sources.includes('custom'))upsertVideos([{...video,pubdate:video.favAt}],'mock');
   }
   putDoc('mockPublishedAge:v4',true);
  }
  return;
 }
 let list:Video[]=[];
 // The demo uses public ranking metadata only. Dates and state below are explicitly simulated.
 list=publicDemo.videos.map((v:any,i:number)=>({bvid:parseBV(v.id||v.url)!,title:v.title,cover:String(v.cover||'').replace(/^http:/,'https:'),duration:Number(v.duration||0),upName:v.author,upMid:String(v.creatorId||i),pubdate:new Date(Date.now()-(i%7)*86400000).toISOString(),source:i%3===0?'follow':i%3===1?'fav':'hot',sources:[i%3===0?'follow':i%3===1?'fav':'hot'],...(i%3===1?{favAt:new Date(Date.now()-(95+i*14)*86400000).toISOString(),folder:'演示收藏'}:{}),category:['科技','生活','知识','音乐'][i%4],reason:'演示内容 · 日期与收藏状态为模拟'}));
 if(!list.length){list=Array.from({length:14},(_,i)=>({bvid:'BV1xx411c7'+String(i).padStart(2,'0'),title:['山河之间，留一点时间给自己','把好奇心带到更远的地方','慢慢认识一座城市','从一首歌开始的旅程'][i%4]+' · 演示 '+(i+1),cover:'',duration:300+i*57,upName:'演示创作者 '+(i%5+1),upMid:'demo'+i%5,pubdate:new Date(Date.now()-(i%7)*86400000).toISOString(),source:i%3===0?'follow':i%3===1?'fav':'hot',sources:[i%3===0?'follow':i%3===1?'fav':'hot'],...(i%3===1?{favAt:new Date(Date.now()-120*86400000).toISOString()}:{}),category:'演示',reason:'虚构演示条目，不保证可播放'}));}
 for(const row of db.select().from(videosTable).all().filter(r=>r.bvid.startsWith('mock:')))db.delete(videosTable).where(eq(videosTable.bvid,row.bvid)).run();
 upsertVideos(list.map(v=>v.source==='fav'&&v.favAt?{...v,pubdate:v.favAt}:v),'mock');putDoc('mockSeeded:v3',true);putDoc('mockPublishedAge:v4',true);
}
export function loadLibrary(mock=process.env.USE_MOCK!=='false'){
 seedLegacy();if(mock)seedMock();const prefix=mock?'mock:':'real:';
 const excluded=mock?new Set<string>():excludedFolders();
 const videos:Video[]=db.select().from(videosTable).all().filter(r=>r.bvid.startsWith(prefix)).map(r=>JSON.parse(r.value)).filter((v:Video)=>!v.folder?.split('、').some(name=>excluded.has(name)));
 const creators:Creator[]=mock?Array.from(new Map(videos.map(v=>[v.upMid,{id:v.upMid,name:v.upName}])).values()):getDoc('creators',[]);
 return {videos,creators,mock,snapshotAt:mock?null:getDoc('snapshotAt',null),hasCookie:!!process.env.BILI_COOKIE,remoteWrites:false};
}
export function loadState(mock=process.env.USE_MOCK!=='false'):State{return getDoc(mock?'state:mock':'state:real',emptyState());}
export function saveState(state:State,mock=process.env.USE_MOCK!=='false'){putDoc(mock?'state:mock':'state:real',state);}
