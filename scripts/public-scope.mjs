import path from 'node:path';
export function assertPublicPath(file){
 const normalized=file.replaceAll('\\','/');const name=path.posix.basename(normalized);
 if(/\.(?:mp4|mov|mkv|avi|webm|m4v|mp3|wav|m4a|srt|ass|vtt|prproj|aep)$/i.test(name)||/(?:^|\/)(?:[^/]*发布材料[^/]*|[^/]*发布文案[^/]*|发布制作|剪辑准备|[^/]*逐字稿[^/]*|封面[-_][^/]*)(?:\/|$)/u.test(normalized))throw Error('公开仓库只收网页源码、使用说明与作者信息，禁止视频或发布材料：'+file);
 if(normalized.split('/').some(p=>['.local','.next','node_modules','verification','private'].includes(p))||name.startsWith('.env')&&name!=='.env.example'||/\.(?:sqlite(?:-.*)?|db|tsbuildinfo|log)$/.test(name))throw Error('禁止发布本机数据、凭证或构建产物：'+file);
 return true;
}
