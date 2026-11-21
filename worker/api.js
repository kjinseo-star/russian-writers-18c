const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const statuses=['received','reviewing','applied','held','rejected'];
const string=(v,max=4000)=>typeof v==='string'?v.trim().slice(0,max):'';
const original=v=>v===null||v===undefined?'미기재':typeof v==='object'?JSON.stringify(v):String(v);
export function fieldsFor(p){return {...Object.fromEntries(Object.entries(p.fields).map(([k,v])=>[k,original(v.value)])),education:JSON.stringify(p.education),teacherLinks:JSON.stringify(p.teacherLinks||[]),abroadEvents:JSON.stringify(p.abroadEvents||[]),general:p.name};}
export function validateReport(b,data,origin){
 const p=data.people.find(p=>p.id===b.personId);if(!p)return {error:'invalid_person'};
 const fields=fieldsFor(p);if(!Object.hasOwn(fields,b.field))return {error:'invalid_field'};
 if(b.version!==data.meta.version||b.currentValue!==fields[b.field])return {error:'stale_context'};
 if(!/^[a-f0-9-]{36}$/.test(b.id||''))return {error:'invalid_id'};
 if(!['correction','addition','source'].includes(b.kind))return {error:'invalid_kind'};
 const problem=string(b.problem),proposal=string(b.proposal),evidence=string(b.evidence,6000),email=string(b.email,254);
 if(problem.length<2||proposal.length<2||email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return {error:'invalid_input'};
 if(b.website)return {error:'invalid_input'};
 let u;try{u=new URL(b.url);if(u.origin!==origin||u.pathname!=='/'||new URLSearchParams(u.hash.slice(1)).get('person')!==p.id)return {error:'invalid_url'};}catch{return {error:'invalid_url'};}
 return {value:{id:b.id,personId:p.id,personName:p.name,field:b.field,fieldLabel:data.fieldLabels[b.field]||({general:'인물 전반',education:'교육 기록',teacherLinks:'교사 지도·가정교육',abroadEvents:'해외 수학 기록'})[b.field]||b.field,currentValue:fields[b.field],version:data.meta.version,url:u.href,kind:b.kind,problem,proposal,evidence,email}};
}
export async function notifyReport(env,row,origin){
 if(!env.RESEND_API_KEY||!env.REPORT_EMAIL_FROM||!env.REPORT_EMAIL_TO)return 'unconfigured';
 try{
 const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`report-${row.id}`},body:JSON.stringify({from:env.REPORT_EMAIL_FROM,to:[env.REPORT_EMAIL_TO],subject:'18세기 작가 데이터: 새 오류·보완 제보',text:`새 제보가 접수되었습니다.\n인물: ${row.personName}\n항목: ${row.fieldLabel}\n접수번호: ${row.id}\n비공개 관리함: ${origin}/?admin=1\n연구 데이터는 자동으로 변경되지 않습니다.`})});
 const result=await r.json();return r.ok&&result.id?'sent':'failed';
 }catch{return 'failed';}
}
export async function api(request,env,ctx,data){
 const u=new URL(request.url),path=u.pathname;
 const email=request.headers.get('oai-authenticated-user-email')||'';
 const admin=!!env.ADMIN_EMAIL&&email.toLowerCase()===env.ADMIN_EMAIL.toLowerCase();
 if(path==='/api/session'&&request.method==='GET')return reply({admin});
 if(path.startsWith('/api/admin')&&!admin)return reply({error:'forbidden'},403);
 if(!env.DB)return reply({error:'storage_unavailable'},503);
 if(request.method!=='GET'){
   if(request.headers.get('Origin')!==u.origin||!request.headers.get('Content-Type')?.startsWith('application/json'))return reply({error:'invalid_origin'},403);
   if(Number(request.headers.get('Content-Length')||0)>60000)return reply({error:'too_large'},413);
 }
 let b;if(request.method!=='GET'){const raw=await request.text();if(raw.length>60000)return reply({error:'too_large'},413);try{b=JSON.parse(raw)}catch{return reply({error:'invalid_json'},400);}}
 if(path==='/api/reports'&&request.method==='POST'){
   const checked=validateReport(b,data,u.origin);if(checked.error)return reply(checked,checked.error==='stale_context'?409:400);
   const row=checked.value;
   const identity=request.headers.get('oai-authenticated-user-id')||request.headers.get('CF-Connecting-IP');
   if(!identity)return reply({error:'identity_required'},401);
   const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(identity)))).map(b=>b.toString(16).padStart(2,'0')).join('');
   const old=await env.DB.prepare('SELECT id,sender_hash FROM reports WHERE id=?').bind(row.id).first();
   if(old)return old.sender_hash===hash?reply({id:row.id,received:true}):reply({error:'duplicate_id'},409);
   const since=new Date(Date.now()-3600000).toISOString();
   const count=await env.DB.prepare('SELECT count(*) AS n FROM reports WHERE sender_hash=? AND created_at>?').bind(hash,since).first();
   if(count.n>=5)return reply({error:'rate_limited'},429);
   const now=new Date().toISOString();
   await env.DB.prepare('INSERT INTO reports(id,person_id,field_key,payload,created_at,updated_at,sender_hash) VALUES(?,?,?,?,?,?,?)').bind(row.id,row.personId,row.field,JSON.stringify(row),now,now,hash).run();
   ctx.waitUntil((async()=>{const state=await notifyReport(env,row,u.origin);await env.DB.prepare('UPDATE reports SET notification=? WHERE id=?').bind(state,row.id).run();})());
   return reply({id:row.id,received:true},201);
 }
 if(path==='/api/admin/reports'&&request.method==='GET'){
   const offset=Math.max(0,Math.min(100000,Number(u.searchParams.get('offset'))||0));
   const result=await env.DB.prepare('SELECT id,payload,status,decision,revision,created_at,updated_at,notification FROM reports ORDER BY created_at DESC LIMIT 51 OFFSET ?').bind(offset).all();
   return reply({items:result.results.slice(0,50).map(r=>({...r,payload:JSON.parse(r.payload)})),next:result.results.length>50?offset+50:null,emailConfigured:!!(env.RESEND_API_KEY&&env.REPORT_EMAIL_FROM&&env.REPORT_EMAIL_TO)});
 }
 const match=path.match(/^\/api\/admin\/reports\/([a-f0-9-]{36})(\/history)?$/);
 if(match&&request.method==='GET'&&match[2]){const rows=await env.DB.prepare('SELECT status,decision,revision,reviewed_at FROM report_history WHERE report_id=? ORDER BY revision DESC').bind(match[1]).all();return reply({items:rows.results});}
 if(match&&request.method==='POST'&&!match[2]){
   if(!statuses.includes(b.status)||!Number.isInteger(b.revision))return reply({error:'invalid_input'},400);
   const decision=string(b.decision,6000);
   if(['applied','held','rejected'].includes(b.status)&&decision.length<2)return reply({error:'decision_required'},400);
   if(b.status==='applied'&&(!string(b.appliedVersion,80)||!string(b.correctedValue,4000)))return reply({error:'applied_details_required'},400);
   const note=b.status==='applied'?`${decision}\n반영 버전: ${string(b.appliedVersion,80)}\n수정 후: ${string(b.correctedValue,4000)}`:decision;
   const now=new Date().toISOString();
   const result=await env.DB.batch([
    env.DB.prepare('UPDATE reports SET status=?,decision=?,revision=revision+1,updated_at=? WHERE id=? AND revision=?').bind(b.status,note,now,match[1],b.revision),
    env.DB.prepare('INSERT INTO report_history(id,report_id,status,decision,revision,reviewed_at) SELECT ?,id,status,decision,revision,updated_at FROM reports WHERE changes()=1 AND id=? AND revision=? AND updated_at=?').bind(crypto.randomUUID(),match[1],b.revision+1,now)
   ]);
   if(!result[0].meta.changes)return reply({error:'revision_conflict'},409);
   return reply({saved:true});
 }
 return reply({error:'not_found'},404);
}
