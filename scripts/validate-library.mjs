import {readFile} from 'node:fs/promises';
import {normalizeLibrary} from '../dist/core.mjs';
const file=process.argv[2]||new URL('../dist/data/library.json',import.meta.url);
try{const input=JSON.parse(await readFile(file,'utf8'));const r=normalizeLibrary(input);if(r.errors.length){console.error(r.errors.join('\n'));process.exitCode=1;}else{console.log(JSON.stringify({valid:true,videos:r.library.videos.length,bilibili:r.library.videos.filter(v=>v.platform==='bilibili').length,douyin:r.library.videos.filter(v=>v.platform==='douyin').length,folders:[...new Set(r.library.videos.flatMap(v=>v.collections))].length,duplicates:r.duplicates,scope:r.library.provenance?.scope||'未记录范围'},null,2));}}catch(e){console.error('校验失败：'+e.message);process.exitCode=1;}
