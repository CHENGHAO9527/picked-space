import {NextRequest} from 'next/server';
export async function GET(req:NextRequest){
 try{const url=new URL(req.nextUrl.searchParams.get('url')||'');if(url.protocol!=='https:'||url.port||url.username||url.password||!(url.hostname==='hdslb.com'||url.hostname.endsWith('.hdslb.com')))return new Response('封面域名不受支持',{status:400});
 const response=await fetch(url,{headers:{'Referer':'https://www.bilibili.com/','User-Agent':'Mozilla/5.0'},redirect:'error',signal:AbortSignal.timeout(12000)});const type=response.headers.get('content-type')||'';
 if(!response.ok||!/^image\/(jpeg|png|webp|avif)/.test(type)||Number(response.headers.get('content-length')||0)>5000000)return new Response('封面暂不可用',{status:422});
 const body=await response.arrayBuffer();if(body.byteLength>5000000)return new Response('图片过大',{status:413});return new Response(body,{headers:{'Content-Type':type,'Cache-Control':'private, max-age=86400','X-Content-Type-Options':'nosniff'}});
 }catch{return new Response('封面暂不可用',{status:422});}
}
