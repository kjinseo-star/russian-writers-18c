import {api} from './api.js';
import assets from './assets.generated.json';
const types={html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',json:'application/json; charset=utf-8',txt:'text/plain; charset=utf-8'};
const data=JSON.parse(assets['/app-data.json']);
export default {async fetch(request,env,ctx){
 const path=new URL(request.url).pathname;
 try{
 if(path.startsWith('/api/'))return await api(request,env,ctx,data);
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
 const key=path==='/'?'/index.html':path;
 if(!Object.hasOwn(assets,key))return new Response('Not found',{status:404});
 return new Response(request.method==='HEAD'?null:assets[key],{headers:{'Content-Type':types[key.split('.').at(-1)]||'text/plain','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self' https://chatgpt.com"}});
 }catch(e){console.error('Request failed',path,e?.message);return Response.json({error:'server_error'},{status:500,headers:{'Cache-Control':'no-store'}});}
}};
