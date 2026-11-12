import {readFile,mkdir,writeFile,copyFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {sanitizeLegacy} from '../lib/import-policy';
const root=fileURLToPath(new URL('../',import.meta.url));
try{process.loadEnvFile(path.join(root,'.env.local'));}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw Error('无法读取本地环境配置');}
const args=process.argv.slice(2);const file=args.find(v=>!v.startsWith('--'));
if(!file){console.error('用法：npm run import:legacy -- /完整路径/我的公开内容.json [--replace]');process.exitCode=1;}
else{
 try{
  const source=path.resolve(file);const raw=await readFile(source);if(raw.length>20*1024*1024)throw Error('快照不能超过20MB');
  let parsed:unknown;try{parsed=JSON.parse(raw.toString('utf8').replace(/^\uFEFF/,''));}catch{throw Error('JSON格式不正确，请修正后重试');}
  const {snapshot,skipped}=sanitizeLegacy(parsed);if(!snapshot.videos.length)throw Error('没有可导入的公开视频，请检查BV、platform、sources与私密标记');
  const dir=path.join(root,'.local');await mkdir(dir,{recursive:true});const dest=path.join(dir,'legacy-library.json');
  let previous=false;try{await readFile(dest);previous=true;}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
  if(previous&&!args.includes('--replace'))throw Error('已有本地快照；确认替换请加--replace，旧快照会先备份。不会清除观看状态或笔记。');
  const content=JSON.stringify(snapshot,null,2)+'\n';if(previous)await copyFile(dest,path.join(dir,'legacy-backup-'+Date.now()+'.json'));
  await writeFile(dest,content,{flag:previous?'w':'wx'});
  console.log(`已保存 ${snapshot.videos.length} 条公开视频、${snapshot.followedCreators.length} 位实际关注；过滤 ${skipped} 条无效/私密/排除内容。`);
  console.log('在.env.local设置USE_MOCK=false后重启应用。快照仅保存在被Git忽略的.local/，不得提交。');
 }catch(e){console.error(e instanceof Error?e.message:'导入失败');process.exitCode=1;}
}
