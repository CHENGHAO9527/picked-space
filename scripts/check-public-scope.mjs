import {execFileSync} from 'node:child_process';
import {readdir,lstat} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {assertPublicPath} from './public-scope.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));let files=[];
if(existsSync(path.join(root,'.git'))){files=execFileSync('git',['-c','safe.directory='+root.replace(/[\\/]$/,''),'ls-files','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);}
else{
 async function walk(dir=''){for(const e of await readdir(path.join(root,dir),{withFileTypes:true})){if(['.git','.local','.next','node_modules','verification','private'].includes(e.name)||e.name.startsWith('.env')&&e.name!=='.env.example'||/\.tsbuildinfo$/.test(e.name))continue;const rel=path.posix.join(dir,e.name);const st=await lstat(path.join(root,rel));if(st.isSymbolicLink())throw Error('公开模板不接受链接目录：'+rel);if(st.isDirectory())await walk(rel);else if(st.isFile())files.push(rel);}}
 await walk();
}
for(const file of files)assertPublicPath(file);
console.log(`公开范围检查通过：${files.length}个文件；只含网页代码、文档、网页图片与作者信息。`);
