import {getCache,putCache} from './db';
import {isPublicFolder} from './import-policy';
import {signWBI} from './wbi';
import type {Video,Source} from './model';
const routes=new Set(['/x/web-interface/nav','/x/polymer/web-dynamic/v1/feed/all','/x/relation/followings','/x/v3/fav/folder/created/list-all','/x/v3/fav/resource/list','/x/v2/history/toview','/x/web-interface/ranking/v2','/x/web-interface/popular','/x/web-interface/view']);
let tail:Promise<unknown>=Promise.resolve(),last=0;
export function limited<T>(fn:()=>Promise<T>):Promise<T>{const work=tail.then(async()=>{await new Promise(r=>setTimeout(r,Math.max(0,510-(Date.now()-last))));last=Date.now();return fn();});tail=work.catch(()=>{});return work;}
export async function bili(route:string,params:Record<string,string|number>={},ttl=0):Promise<any>{
 if(!routes.has(route))throw Error('接口不在白名单中');
 const key=route+'?'+new URLSearchParams(Object.entries(params).map(([k,v])=>[k,String(v)])).toString();
 const cached=ttl?getCache(key):null;if(cached)return cached;
 const requestQuery=route==='/x/relation/followings'?await wbiQuery(params):key.slice(route.length+1);
 const data=await limited(async()=>{
  let response;try{response=await fetch('https://api.bilibili.com'+route+'?'+requestQuery,{headers:{'User-Agent':'Mozilla/5.0','Referer':'https://www.bilibili.com/',...(process.env.BILI_COOKIE?{Cookie:process.env.BILI_COOKIE}:{})},redirect:'error',cache:'no-store',signal:AbortSignal.timeout(15000)});}catch{throw Error('暂时无法连接B站，请稍后重试');}
  if(!response.ok)throw Error('B站接口暂不可用，请稍后重试');
  const body=await response.json();if(body.code!==0)throw Error(body.code===-101?'登录已失效，请重新配置服务端Cookie':body.code===-352||body.code===-412?'B站要求验证，请在原站处理后再同步':'B站未返回可用数据（'+body.code+'）');return body.data;
 });if(ttl)putCache(key,data,ttl);return data;
}
export async function wbiQuery(params:Record<string,string|number>){const nav=await bili('/x/web-interface/nav',{},3600000);const key=(s:string)=>s.split('/').pop()!.split('.')[0];if(!nav.wbi_img)throw Error('未取得WBI密钥');return signWBI(params,key(nav.wbi_img.img_url),key(nav.wbi_img.sub_url));}
export function fromBili(v:any,source:Source):Video|null{const bvid=v.bvid||v.bv_id;if(!/^BV[0-9A-Za-z]{10}$/.test(bvid||''))return null;const d=typeof v.duration==='string'?v.duration.split(':').reduce((n:number,s:string)=>n*60+Number(s),0):Number(v.duration||0);return {bvid,title:String(v.title||'未命名视频'),cover:String(v.pic||v.cover||'').replace(/^http:/,'https:'),duration:d,upName:String(v.owner?.name||v.upper?.name||'未知UP'),upMid:String(v.owner?.mid||v.upper?.mid||''),pubdate:v.pubdate||v.pubtime?new Date(Number(v.pubdate||v.pubtime)*1000).toISOString():'',source,sources:[source],category:v.tname||v.type_name||'未分类',...(v.fav_time?{favAt:new Date(v.fav_time*1000).toISOString()}:{} )};}
export async function readAccount(){
 if(!process.env.BILI_COOKIE)throw Error('尚未配置服务端Cookie；已有本地内容仍可浏览');
 const nav=await bili('/x/web-interface/nav');if(!nav.isLogin)throw Error('登录已失效，请重新配置服务端Cookie');
 const result:Video[]=[],creators:{id:string;name:string}[]=[],warnings:string[]=[];
 const folders=await bili('/x/v3/fav/folder/created/list-all',{up_mid:nav.mid},1800000);
 for(const folder of (folders.list||[]).filter((f:any)=>isPublicFolder(f))){
  for(let page=1;page<=100;page++){const data=await bili('/x/v3/fav/resource/list',{media_id:folder.id,pn:page,ps:20},1800000);for(const raw of data.medias||[]){const v=fromBili(raw,'fav');if(v)result.push({...v,folder:folder.title});}if(!data.has_more)break;if(page===100)warnings.push('部分大型收藏夹尚未读完');}
 }
 const later=await bili('/x/v2/history/toview',{},1800000);for(const raw of later.list||[]){const v=fromBili(raw,'fav');if(v)result.push({...v,folder:'稍后再看'});}
 for(let page=1;page<=200;page++){const data=await bili('/x/relation/followings',{vmid:nav.mid,pn:page,ps:50},900000);for(const raw of data.list||[])creators.push({id:String(raw.mid),name:raw.uname});if((data.list||[]).length<50)break;if(page===200)warnings.push('关注列表达到本轮读取上限');}
 let offset='';for(let page=0;page<20;page++){const data=await bili('/x/polymer/web-dynamic/v1/feed/all',{type:'video',...(offset?{offset}:{})},900000);let oldest=Date.now();for(const raw of data.items||[]){const archive=raw.modules?.module_dynamic?.major?.archive,author=raw.modules?.module_author;if(!archive)continue;const pub=Number(author?.pub_ts||0)*1000;if(pub)oldest=Math.min(oldest,pub);const v=fromBili({...archive,pubdate:author?.pub_ts,owner:{name:author?.name,mid:author?.mid}},'follow');if(v&&Date.now()-pub<=7*86400000)result.push(v);}if(!data.has_more||oldest<Date.now()-7*86400000)break;offset=data.offset;if(page===19)warnings.push('关注动态读取了前20页，可稍后再次同步');}
 return {videos:result,creators,warnings};
}
export async function readHot(){const result:Video[]=[];const ranking=await bili('/x/web-interface/ranking/v2',{rid:0,type:'all'},3600000),popular=await bili('/x/web-interface/popular',{pn:1,ps:20},3600000);for(const raw of [...(ranking.list||[]),...(popular.list||[])]){const v=fromBili(raw,'hot');if(v)result.push(v);}return result;}
