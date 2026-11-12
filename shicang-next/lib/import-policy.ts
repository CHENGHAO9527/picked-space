import {parseBV} from './rules';

type LegacyVideo={id:string;platform:'bilibili';title:string;author:string;creatorId:string;cover:string;duration:number;publishedAt:string;sources:string[];collections:string[];visibility:'public'};
type LegacyCreator={id:string;name:string;lastUploadAt?:string};
const sourceAliases:Record<string,string>={following:'following',follow:'following',favorites:'favorites',fav:'favorites',watchlater:'watchlater',ranking:'ranking',hot:'ranking',custom:'custom'};
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const text=(v:unknown,max=500)=>typeof v==='string'?v.slice(0,max):'';
const date=(v:unknown)=>typeof v==='string'&&Number.isFinite(Date.parse(v))?v:'';
export const excludedFolders=()=>new Set((process.env.EXCLUDED_FOLDERS||'').split(',').map(v=>v.trim()).filter(Boolean));
export function isPublicFolder(folder:{attr?:unknown;title?:unknown},excluded=excludedFolders()){
 const attr=typeof folder.attr==='number'?folder.attr:typeof folder.attr==='string'&&/^\d+$/.test(folder.attr)?Number(folder.attr):NaN;
 return Number.isSafeInteger(attr)&&attr>=0&&(attr&1)===0&&!excluded.has(String(folder.title||''));
}
/** Accept only a portable whitelist. Unknown account fields and credentials are never retained. */
export function sanitizeLegacy(input:unknown,excluded=excludedFolders()){
 if(!object(input)||!Array.isArray(input.videos)||input.videos.length>50000)throw Error('需要包含videos数组的JSON快照（最多50000条）');
 const creators:LegacyCreator[]=[];const creatorIds=new Set<string>();
 for(const raw of Array.isArray(input.followedCreators)?input.followedCreators:[]){
  if(!object(raw))continue;const id=text(raw.id,32),name=text(raw.name,100);if(!/^\d+$/.test(id)||!name||creatorIds.has(id))continue;
  creatorIds.add(id);creators.push({id,name,...(date(raw.lastUploadAt)?{lastUploadAt:date(raw.lastUploadAt)}:{})});
 }
 const videos=new Map<string,LegacyVideo>();let skipped=0;
 for(const raw of input.videos){
  if(!object(raw)||raw.platform!=='bilibili'||raw.visibility==='private'||raw.private===true){skipped++;continue;}
  const collections=Array.isArray(raw.collections)?raw.collections.filter((v):v is string=>typeof v==='string').map(v=>v.slice(0,100)):[];
  if(collections.some(v=>excluded.has(v))){skipped++;continue;}
  const id=parseBV(text(raw.id||raw.bvid||raw.url,2000));const title=text(raw.title),author=text(raw.author||raw.upName,100),creatorId=text(raw.creatorId||raw.upMid,32);
  const sources=Array.from(new Set((Array.isArray(raw.sources)?raw.sources:[]).filter((s):s is string=>typeof s==='string').map(s=>sourceAliases[s]).filter(Boolean)));
  if(!id||!title||!sources.length||!/^\d*$/.test(creatorId)){skipped++;continue;}
  let cover='';try{const u=new URL(text(raw.cover,2000));if(u.protocol==='https:'&&/(^|\.)hdslb\.com$/.test(u.hostname)&&!u.username&&!u.password&&!u.port)cover=u.toString();}catch{}
  const duration=typeof raw.duration==='number'&&Number.isFinite(raw.duration)&&raw.duration>=0?raw.duration:0;
  const old=videos.get(id);videos.set(id,{id,platform:'bilibili',title,author:author||'未知UP',creatorId,cover,duration,publishedAt:date(raw.publishedAt||raw.pubdate),sources:Array.from(new Set([...(old?.sources||[]),...sources])),collections:Array.from(new Set([...(old?.collections||[]),...collections])),visibility:'public'});
 }
 return {snapshot:{schemaVersion:1,title:'我的拾藏',updatedAt:date(input.updatedAt),followedCreators:creators,videos:[...videos.values()]},skipped};
}
