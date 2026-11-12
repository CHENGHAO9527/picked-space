import {NextRequest,NextResponse} from 'next/server';
import {loadLibrary,loadState,saveState,upsertVideos} from '@/lib/library';
import {bili,fromBili,readAccount,readHot} from '@/lib/bili';
import {getDoc,putDoc} from '@/lib/db';
import {parseBV} from '@/lib/rules';
export const runtime='nodejs';export const dynamic='force-dynamic';
function allowed(req:NextRequest){const host=req.headers.get('host');return ['127.0.0.1:4180','localhost:4180'].includes(host||'')&&(!req.headers.get('origin')||new URL(req.headers.get('origin')!).host===host)&&req.headers.get('sec-fetch-site')!=='cross-site';}
export async function GET(req:NextRequest){if(!allowed(req))return NextResponse.json({error:'仅限本机访问'},{status:403});const mock=req.nextUrl.searchParams.get('demo')==='1'||process.env.USE_MOCK!=='false';return NextResponse.json({...loadLibrary(mock),state:loadState(mock)},{headers:{'Cache-Control':'no-store'}});}
let syncing=false;
export async function POST(req:NextRequest){
 if(!allowed(req))return NextResponse.json({error:'仅限本机操作'},{status:403});
 try{
 if(Number(req.headers.get('content-length')||0)>2000000)return NextResponse.json({error:'请求过大'},{status:413});
 const body=await req.json();const mock=req.nextUrl.searchParams.get('demo')==='1'||process.env.USE_MOCK!=='false';
 if(body.action==='state'){
  const state=body.state;const object=(v:any)=>v&&typeof v==='object'&&!Array.isArray(v);
  if(!state||!object(state.tiers)||!object(state.watched)||!object(state.progress)||!Array.isArray(state.notes)||!Array.isArray(state.reels)||!Array.isArray(state.plan)||!Array.isArray(state.released)||!Array.isArray(state.dusts)||!Array.isArray(state.blocked)||!['dark','light'].includes(state.theme)||!Number.isInteger(state.budgetMinutes)||state.budgetMinutes<30||state.budgetMinutes>240||state.notes.length>10000||state.reels.length>500||Object.keys(state.progress).length>20000)throw Error('记录格式不正确');
  if(state.notes.some((n:any)=>!n||typeof n.text!=='string'||n.text.length>3000||typeof n.bvid!=='string'||!parseBV(n.bvid)||!Number.isFinite(n.time)||n.time<0)||state.plan.some((id:any)=>typeof id!=='string'||!parseBV(id))||Object.values(state.tiers).some(t=>!['must','often','sometimes'].includes(String(t)))||Object.values(state.progress).some(t=>typeof t!=='number'||!Number.isFinite(t)||t<0)||state.reels.some((r:any)=>!r||typeof r.id!=='string'||typeof r.title!=='string'||r.title.length>80||typeof r.intro!=='string'||r.intro.length>600||!Array.isArray(r.bvids)||r.bvids.some((id:any)=>typeof id!=='string'||!parseBV(id))))throw Error('记录内容不正确');
  saveState(state,mock);return NextResponse.json({ok:true});
 }
 if(body.action==='custom'){
  const bvid=parseBV(String(body.input||''));if(!bvid)throw Error('请输入完整BV号或bilibili.com视频链接');
  const view=await bili('/x/web-interface/view',{bvid},3600000);const video=fromBili(view,'custom');if(!video)throw Error('未找到视频');video.note=String(body.note||'').slice(0,1000);video.reason=video.note||'由你亲手收入';upsertVideos([video],mock?'mock':'real');return NextResponse.json({ok:true,video});
 }
 if(body.action==='sync'){
  if(mock)throw Error('演示模式不读取个人账号；请在.env.local设置USE_MOCK=false后重启');
  if(syncing)throw Error('同步正在进行，请稍候');syncing=true;
  try{const warnings:string[]=[];const hot=await readHot();upsertVideos(hot);if(process.env.BILI_COOKIE){const account=await readAccount();upsertVideos(account.videos);const all=new Map([...getDoc<any[]>('creators',[]),...account.creators].map(c=>[c.id,c]));putDoc('creators',Array.from(all.values()));warnings.push(...account.warnings);}else warnings.push('未配置Cookie，本次只更新公开榜单');putDoc('snapshotAt',new Date().toISOString());return NextResponse.json({ok:true,warnings});}finally{syncing=false;}
 }
 throw Error('不支持的操作');
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'操作失败，请重试'},{status:400});}
}
