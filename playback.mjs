import {randomUUID} from 'node:crypto';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';

const HEADERS={'User-Agent':'Mozilla/5.0','Referer':'https://www.bilibili.com/'};
export function isMediaURL(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&['bilivideo.com','hdslb.com'].some(d=>u.hostname===d||u.hostname.endsWith('.'+d));}catch{return false;}}
export function createPlaybackService({fetcher=fetch,now=Date.now}={}){
 const media=new Map(),resolutions=new Map();
 const json=async path=>{const r=await fetcher('https://api.bilibili.com/'+path,{headers:HEADERS,redirect:'error',signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('B站暂时无法提供视频信息，请稍后重试');const j=await r.json();if(j.code!==0)throw Error('B站未提供公开播放信息（'+j.code+'）');return j.data;};
 async function resolve(bvid,part=1){
  if(!/^BV[A-Za-z0-9]{10}$/.test(bvid)||!Number.isInteger(part)||part<1||part>10000)throw Error('视频编号或分P不正确');
  const cacheKey=bvid+':'+part,cached=resolutions.get(cacheKey);if(cached&&cached.expires>now())return cached.result;
  const view=await json('x/web-interface/view?bvid='+bvid);
  if(view.rights?.pay||view.is_upower_exclusive||view.is_upower_play)throw Error('此视频需要付费或特定权限，本站不提供直接播放');
  const pages=view.pages||[],page=pages.find(p=>p.page===part);if(!page)throw Error('未找到这个分P');
  const play=await json('x/player/playurl?'+new URLSearchParams({bvid,cid:String(page.cid),qn:'80',fnval:'0',fourk:'0'}));
  if(play.is_preview||play.is_pay_preview)throw Error('接口只返回试看，本站不把试看当完整视频');
  if(!Array.isArray(play.durl)||play.durl.length!==1)throw Error('暂无可供本站直接播放的完整MP4流');
  const mediaURL=[play.durl[0].url,...(play.durl[0].backup_url||[])].find(isMediaURL);
  if(!mediaURL)throw Error('暂无受支持的视频CDN地址');
  const duration=Number(play.timelength)/1000;if(!Number.isFinite(duration)||duration<=0||Math.abs(duration-Number(page.duration))>Math.max(5,Number(page.duration)*.02))throw Error('播放时长与原片不符，暂不提供不完整的流');
  for(const [k,v] of media)if(v.expires<=now())media.delete(k);for(const [k,v] of resolutions)if(v.expires<=now())resolutions.delete(k);
  if(media.size>=500)media.delete(media.keys().next().value);if(resolutions.size>=500)resolutions.delete(resolutions.keys().next().value);
  const token=randomUUID(),expires=now()+3600000;media.set(token,{url:mediaURL,expires});
  const quality={16:'360p',32:'480p',64:'720p',74:'720p60',80:'1080p',112:'1080p高码率',116:'1080p60',120:'4K'}[play.quality]||String(play.quality);
  const result={bvid,title:view.title,quality,duration,part,pages:pages.map(p=>({page:p.page,part:p.part,duration:p.duration})),src:'/api/media/'+token};resolutions.set(cacheKey,{expires:now()+120000,result});return result;
 }
 async function stream(token,req,res){
  const entry=media.get(token);if(!entry||entry.expires<=now()){res.writeHead(410);res.end('播放地址已过期，请重试');return;}
  if(req.headers.range&&!/^bytes=\d*-\d*$/.test(req.headers.range)){res.writeHead(416);res.end();return;}
  const controller=new AbortController();const abort=()=>controller.abort();res.on('close',abort);
  const timeout=setTimeout(abort,20000);let upstream;
  try{let url=entry.url;for(let hop=0;hop<4;hop++){upstream=await fetcher(url,{headers:{...HEADERS,'Accept-Encoding':'identity',...(req.headers.range?{Range:req.headers.range}:{})},redirect:'manual',signal:controller.signal});if([301,302,303,307,308].includes(upstream.status)){const next=new URL(upstream.headers.get('location')||'',url).href;await upstream.body?.cancel();if(!isMediaURL(next))throw Error('媒体跳转目标不受支持');url=next;upstream=null;continue;}break;}
   clearTimeout(timeout);if(!upstream||![200,206].includes(upstream.status)){await upstream?.body?.cancel();res.writeHead(upstream?.status===416?416:502);res.end('媒体暂不可播放，请重试');return;}
   const type=upstream.headers.get('content-type')||'';if(!/^(video\/mp4|application\/(octet-stream|mp4))/i.test(type))throw Error('上游没有返回MP4视频');
   const headers={'Content-Type':'video/mp4','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes'};for(const h of ['content-range','content-length'])if(upstream.headers.get(h))headers[h]=upstream.headers.get(h);
   res.writeHead(upstream.status,headers);if(req.method==='HEAD'){await upstream.body?.cancel();res.end();return;}await pipeline(Readable.fromWeb(upstream.body),res);
  }finally{clearTimeout(timeout);res.removeListener('close',abort);}
 }
 return {resolve,stream};
}
