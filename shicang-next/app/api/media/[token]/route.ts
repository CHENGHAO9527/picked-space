import {NextRequest} from 'next/server';
import {PassThrough,Readable} from 'node:stream';
import {player} from '@/lib/player';
export const runtime='nodejs';
export async function GET(req:NextRequest,{params}:{params:Promise<{token:string}>}){
 const {token}=await params;const body=new PassThrough();
 const headers=new Headers();let status=200;let resolveHead:()=>void;const ready=new Promise<void>(r=>{resolveHead=r;});
 const response=Object.assign(body,{headersSent:false,writeHead(code:number,h?:Record<string,string>){status=code;Object.entries(h||{}).forEach(([k,v])=>headers.set(k,v));this.headersSent=true;resolveHead();return this;}});
 void player.stream(token,{headers:{range:req.headers.get('range')||undefined},method:'GET'},response).catch(()=>{if(!response.headersSent)response.writeHead(502);body.end();});
 await ready;req.signal.addEventListener('abort',()=>body.destroy(),{once:true});
 return new Response(Readable.toWeb(body) as ReadableStream,{status,headers});
}
