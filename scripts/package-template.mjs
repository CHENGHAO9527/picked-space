import {readdir,lstat,mkdir,readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const root=fileURLToPath(new URL('../',import.meta.url));
const base=['package.json','server.mjs','playback.mjs','preview.mjs','CONTRIBUTING.md','CHANGELOG.md','FORK_GUIDE.md','TEMPLATE_QA.md','README.md','AI_IMPORT.md','AGENTS.md','LICENSE','.gitignore','启动拾藏.cmd'];
const files=[...base];
async function walk(dir){for(const entry of await readdir(path.join(root,dir),{withFileTypes:true})){
 const rel=path.posix.join(dir,entry.name);if(rel==='dist/data/library.json'||rel==='dist/data/policy.json'||rel==='dist/private'||rel==='private')continue;
 const st=await lstat(path.join(root,rel));if(st.isSymbolicLink())throw new Error('模板不包含链接目录：'+rel);if(st.isDirectory())await walk(rel);else if(st.isFile())files.push(rel);
}}
for(const d of ['dist','tests','scripts','docs','.github'])await walk(d);
if(files.some(x=>x.includes('private/')||x==='dist/data/library.json'||x==='dist/data/policy.json'))throw new Error('检测到私有文件');
const out=path.resolve(root,'..','favorite-space-template-v0.7.0.zip');
execFileSync('tar',['-a','-c','-f',out,...files],{cwd:root,stdio:'pipe'});
const listed=execFileSync('tar',['-t','-f',out],{encoding:'utf8'}).trim().split(/\r?\n/);
if(listed.some(x=>x.includes('private/')||x.endsWith('/library.json')||x.endsWith('/policy.json')))throw new Error('模板包含私有数据，停止交付');
console.log(JSON.stringify({archive:out,files:listed.length,privateDataIncluded:false},null,2));
