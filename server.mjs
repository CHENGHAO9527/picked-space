import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createPreviewService} from './preview.mjs';
import {createPlaybackService} from './playback.mjs';
const playback=createPlaybackService(),preview=createPreviewService();
const root=path.resolve(fileURLToPath(new URL('./dist/',import.meta.url)));
const port=Number(process.env.PORT||4173);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.avif':'image/avif','.webp':'image/webp'};
const server=http.createServer(async(req,res)=>{
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end();return;}
  try{
    const requestURL=new URL(req.url,'http://localhost');
    const pathname=decodeURIComponent(requestURL.pathname);
    if(pathname.startsWith('/api/')){
      const allowed=new Set([`127.0.0.1:${port}`,`localhost:${port}`]);
      if(!allowed.has(req.headers.host)||req.headers['sec-fetch-site']==='cross-site'||req.headers.origin&&!allowed.has(new URL(req.headers.origin).host)){res.writeHead(403);res.end();return;}
      if(pathname==='/api/preview'){try{const result=await preview.resolve(requestURL.searchParams.get('bvid')||'');res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, max-age=3600'});res.end(JSON.stringify(result));}catch{res.writeHead(422,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify({error:'暂无视频预览'}));}return;}
      if(pathname==='/api/playback'){
        try{const result=await playback.resolve(requestURL.searchParams.get('bvid')||'',Number(requestURL.searchParams.get('part')||1));res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(result));}catch(e){res.writeHead(422,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify({error:e.message}));}return;
      }
      if(pathname.startsWith('/api/media/')){try{await playback.stream(pathname.slice('/api/media/'.length),req,res);}catch{if(!res.headersSent)res.writeHead(502);res.end();}return;}
      res.writeHead(404);res.end();return;
    }
    const p=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
    if(!p.startsWith(root+path.sep)&&p!==root){res.writeHead(403);res.end();return;}
    if(!(await stat(p)).isFile())throw new Error('not file');
    const data=await readFile(p);
    res.writeHead(200,{'Content-Type':types[path.extname(p)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' https: data:; media-src 'self'; frame-src https://player.bilibili.com; connect-src 'self'; object-src 'none'; base-uri 'self'"});
    res.end(req.method==='HEAD'?undefined:data);
  }catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('未找到文件');}
});
server.listen(port,'127.0.0.1',()=>console.log(`拾藏已启动：http://127.0.0.1:${port}\n只绑定本机。按 Ctrl+C 停止。`));
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?`端口 ${port} 已被占用，请使用已运行的页面或更换 PORT。`:e.message);process.exitCode=1;});
