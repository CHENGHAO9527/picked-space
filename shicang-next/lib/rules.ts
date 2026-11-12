import type {Video,State} from './model';
export function parseBV(input:string){const raw=input.trim();if(/^BV[0-9A-Za-z]{10}$/.test(raw))return raw;try{const u=new URL(raw);if(u.protocol!=='https:'||!['bilibili.com','www.bilibili.com','m.bilibili.com'].includes(u.hostname)||u.username||u.password||u.port)return null;return u.pathname.match(/^\/video\/(BV[0-9A-Za-z]{10})\/?$/)?.[1]||null;}catch{return null;}}
export const daysOld=(date:string|undefined,now=new Date())=>{if(!date)return null;const ms=Date.parse(date);return Number.isFinite(ms)&&ms<=+now?Math.floor((+now-ms)/86400000):null;};
export function dustLevel(date:string|undefined,now=new Date()){const days=daysOld(date,now);return days===null||days<=90?0:days<=180?1:days<=365?2:3;}
// 旧藏按视频发布时间计龄；收藏日期仅保留为收藏信息。
export function isDusty(video:Video,now=new Date()){return video.sources.includes('fav')&&dustLevel(video.pubdate,now)>0;}
export function makePlan(videos:Video[],budget:number,state:State,now=new Date(),salt=0){
 const pool=videos.filter(v=>v.duration>0&&Number.isFinite(v.duration)&&v.duration<=budget&&!state.watched[v.bvid]&&!state.released.includes(v.bvid)&&!(v.source==='hot'&&state.blocked.includes(v.category||'未分类'))&&(v.sources.some(s=>s!=='follow')||daysOld(v.pubdate,now)!==null&&daysOld(v.pubdate,now)!<=6));
 const rank=(v:Video)=>(state.tiers[v.upMid]==='must'&&v.sources.includes('follow')&&daysOld(v.pubdate,now)!<=7?1000:0)+(isDusty(v,now)?200:0)+(v.sources.includes('fav')?50:0);
 const sorted=[...pool].sort((a,b)=>rank(b)-rank(a)||((hash(a.bvid+salt)%1000)-(hash(b.bvid+salt)%1000)));
 const result:Video[]=[];let used=0,hot=0;const picked=new Set<string>();
 const add=(v:Video)=>{if(!picked.has(v.bvid)&&v.duration+used<=budget&&(!(v.source==='hot')||hot<1)){result.push(v);picked.add(v.bvid);used+=v.duration;if(v.source==='hot')hot++;return true;}return false;};
 // Reserve a fitting dusty favorite first, then prioritize must-watch updates in remaining time.
 const dusty=sorted.find(v=>isDusty(v,now));if(dusty)add(dusty);
 for(const v of sorted.filter(v=>state.tiers[v.upMid]==='must'&&v.sources.includes('follow')))add(v);
 for(const source of ['follow','fav','custom','hot']){const v=sorted.find(v=>v.source===source&&!picked.has(v.bvid)&&v.duration<=budget-used);if(v)add(v);}
 for(const v of [...sorted].sort((a,b)=>b.duration-a.duration))add(v);
 return result;
}
const hash=(s:string)=>Array.from(s).reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,0);
