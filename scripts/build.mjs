import {build} from 'esbuild';
import {mkdir,writeFile,readFile,readdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
await mkdir('dist',{recursive:true});
execFileSync(process.env.PYTHON||'python3',['scripts/prepare_public_data.py'],{stdio:'inherit'});
const people=JSON.parse(await readFile('dist/app-data.json','utf8')).people;
let savedLayout;
try{savedLayout=JSON.parse(await readFile('src/graph-layout.json','utf8'));}catch{}
if(process.env.REBUILD_LAYOUT==='1'||!savedLayout||Object.keys(savedLayout).length!==people.length||people.some(p=>!savedLayout[p.id]))await import('./layout-network.mjs');
await build({entryPoints:['src/main.tsx'],bundle:true,minify:true,jsx:'transform',jsxFactory:'h',jsxFragment:'React.Fragment',tsconfigRaw:{compilerOptions:{jsx:'react'}},outfile:'dist/app.js',target:'es2020',define:{'process.env.NODE_ENV':'"production"'},legalComments:'linked'});
await writeFile('dist/index.html',`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="description" content="18세기 러시아 작가 104인의 사전 기반 인물 정보와 참조망을 탐색하는 연구·교육용 시제품."><title>18세기 작가 관계도 · 104인</title><link rel="stylesheet" href="./app.css"></head><body><div id="root"></div><noscript>이 시제품의 검색과 시각화에는 JavaScript가 필요합니다.</noscript><script src="./app.js"></script></body></html>`);
console.log('Built dist/index.html, app.js and app.css');

const assetFiles=await readdir('dist');const assets={};
for(const file of assetFiles)if(/\.(html|css|js|json|txt)$/.test(file))assets['/'+file]=await readFile('dist/'+file,'utf8');
await writeFile('worker/assets.generated.json',JSON.stringify(assets));
await mkdir('dist/server',{recursive:true});
await build({entryPoints:['worker/index.js'],bundle:true,minify:true,outfile:'dist/server/index.js',format:'esm',target:'es2022',platform:'browser'});
console.log('Built Worker with D1 report API');

// Normalize generated trailing whitespace for repository review.
for(const file of ['dist/app.js','dist/server/index.js'])await writeFile(file,(await readFile(file,'utf8')).replace(/[ \t]+$/gm,''));
