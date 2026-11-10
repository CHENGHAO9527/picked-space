const BVID=/^BV[A-Za-z0-9]{10}$/;
export function normalizeShots(raw){
 const images=(raw.image||[]).slice(0,100).map(s=>{try{const u=new URL(s.startsWith('//')?'https:'+s:s);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&(u.hostname==='hdslb.com'||u.hostname.endsWith('.hdslb.com'))?u.href:'';}catch{return '';}});
 const columns=Number(raw.img_x_len),rows=Number(raw.img_y_len);
 if(!Number.isInteger(columns)||columns<1||columns>30||!Number.isInteger(rows)||rows<1||rows>30)throw Error('暂无视频预览');
 // The first index is a sentinel; index[1] is the first cell timestamp.
 const times=(raw.index||[]).slice(1,1+columns*rows*images.length).map(Number);
 if(!images.length||images.some(s=>!s)||!times.length||times.some((t,i)=>!Number.isFinite(t)||t<0||i>0&&t<times[i-1]))throw Error('暂无视频预览');
 return {images,columns,rows,times};
}
export function createPreviewService({fetcher=fetch,now=Date.now}={}){
 const cache=new Map(),pending=new Map();let lastRequest=0;
 async function resolve(bvid){
  if(!BVID.test(bvid))throw Error('视频编号不正确');const old=cache.get(bvid);if(old&&old.expires>now()){if(old.error)throw Error(old.error);return old.value;}
  if(pending.has(bvid))return pending.get(bvid);
  // One delayed hover at a time, plus caching; do not flood upstream while scanning cards.
  if(pending.size||now()-lastRequest<500)throw Error('稍后预览');lastRequest=now();
  const task=(async()=>{try{const r=await fetcher('https://api.bilibili.com/x/player/videoshot?'+new URLSearchParams({bvid,index:'1'}),{headers:{'User-Agent':'Mozilla/5.0',Referer:'https://www.bilibili.com/'},redirect:'error',signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('暂无视频预览');const j=await r.json();if(j.code!==0)throw Error('暂无视频预览');const value=normalizeShots(j.data||{});cache.set(bvid,{value,expires:now()+3600000});return value;}catch(e){cache.set(bvid,{error:'暂无视频预览',expires:now()+60000});throw e;}finally{pending.delete(bvid);if(cache.size>300)cache.delete(cache.keys().next().value);}})();pending.set(bvid,task);return task;
 }
 return {resolve};
}
