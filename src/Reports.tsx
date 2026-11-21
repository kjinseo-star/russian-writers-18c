import {h} from './i18n';
import React,{useState,useEffect} from 'react';
import Modal from './Modal';
import {text,type Person,type Data} from './model';
const extraLabels={general:'인물 전반',education:'교육 기록',teacherLinks:'교사 지도·가정교육',abroadEvents:'해외 수학 기록'};
export function reportFields(p:Person){return {...Object.fromEntries(Object.entries(p.fields).map(([k,v])=>[k,text(v.value)])),education:JSON.stringify(p.education),teacherLinks:JSON.stringify(p.teacherLinks||[]),abroadEvents:JSON.stringify(p.abroadEvents||[]),general:p.name};}
async function request(path:string,body?:unknown){const r=await fetch(path,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:undefined);let data;try{data=await r.json()}catch{throw Error('요청을 처리하지 못했습니다. 다시 시도해 주세요.')};if(!r.ok)throw Error(({stale_context:'자료가 갱신되었습니다. 새로고침 후 다시 제출해 주세요.',rate_limited:'제보가 많습니다. 한 시간 뒤 다시 시도해 주세요.',forbidden:'관리자만 열 수 있습니다.',revision_conflict:'다른 변경이 있습니다. 새로고침 후 확인해 주세요.'} as Record<string,string>)[data.error]||'요청을 처리하지 못했습니다. 다시 시도해 주세요.');return data;}
export function ReportForm({person,data,onClose}:{person:Person;data:Data;onClose:()=>void}){
 const [field,setField]=useState('general'),[kind,setKind]=useState('correction'),[problem,setProblem]=useState(''),[proposal,setProposal]=useState(''),[evidence,setEvidence]=useState(''),[email,setEmail]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[done,setDone]=useState('');
 const [id]=useState(()=>crypto.randomUUID());const fields=reportFields(person);
 return <Modal title="오류·보완 제보" onClose={onClose}>{done?<div role="status"><h3>제보를 접수했습니다.</h3><p>교수님이 근거를 검토한 뒤 반영 여부를 결정합니다.</p><p className="muted small">접수번호: {done}</p><button className="primary-button" onClick={onClose}>닫기</button></div>:<form className="simple-form" onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try{const url=new URL(location.href);url.search='';url.hash=new URLSearchParams({person:person.id}).toString();const r=await request('/api/reports',{id,personId:person.id,field,currentValue:fields[field],version:data.meta.version,url:url.href,kind,problem,proposal,evidence,email,website:(new FormData(e.currentTarget).get('website')||'')});setDone(r.id);}catch(e){setError((e as Error).message)}finally{setBusy(false)}}}>
 <p lang="ru" translate="no"><strong>{person.name}</strong> · {person.id}</p>
 <label>항목<select value={field} onChange={e=>setField(e.target.value)}>{Object.keys(fields).map(k=><option key={k} value={k}>{data.fieldLabels[k]||extraLabels[k]}</option>)}</select></label>
 <details><summary>현재 정보 · 데이터 {String(data.meta.version)}</summary><pre lang="ru" translate="no">{fields[field]}</pre></details>
 <label>제보 유형<select value={kind} onChange={e=>setKind(e.target.value)}><option value="correction">오류 정정</option><option value="addition">정보 보완</option><option value="source">출처 추가</option></select></label>
 <label>확인이 필요한 내용<textarea required minLength={2} maxLength={4000} value={problem} onChange={e=>setProblem(e.target.value)}/></label>
 <label>수정·보완 제안<textarea required minLength={2} maxLength={4000} value={proposal} onChange={e=>setProposal(e.target.value)}/></label>
 <label>근거 문헌·쪽수·링크<textarea maxLength={6000} value={evidence} onChange={e=>setEvidence(e.target.value)} placeholder="가능하면 근거 구절도 함께 적어 주세요."/></label>
 <label>답신용 이메일 · 선택<input type="email" maxLength={254} value={email} onChange={e=>setEmail(e.target.value)}/></label>
 <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off"/></label>
 <p className="muted small">제보 내용과 연락처는 비공개로 보관하며 검토·답신에만 사용합니다. 연구 데이터는 자동으로 바뀌지 않습니다.</p>
 {error&&<p role="alert" className="warning">{error}</p>}<button className="primary-button" disabled={busy} type="submit">{busy?'접수 중…':'제보 제출'}</button>
 </form>}</Modal>;
}
const statusLabels={received:'접수',reviewing:'검토 중',applied:'반영',held:'보류',rejected:'미반영'};
function Review({row,onSaved}:{row:any;onSaved:()=>void}){
 const [status,setStatus]=useState(row.status),[decision,setDecision]=useState(row.decision),[version,setVersion]=useState(''),[corrected,setCorrected]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[history,setHistory]=useState<any[]|null>(null);const p=row.payload;
 return <details className="report-row"><summary><span lang="ru" translate="no">{p.personName}</span><span>{statusLabels[row.status]}</span><small>{row.created_at.slice(0,10)}</small></summary><dl><dt>항목</dt><dd>{p.fieldLabel}</dd><dt>현재 정보</dt><dd><pre translate="no">{p.currentValue}</pre></dd><dt>확인이 필요한 내용</dt><dd translate="no">{p.problem}</dd><dt>수정·보완 제안</dt><dd translate="no">{p.proposal}</dd><dt>근거 문헌·쪽수·링크</dt><dd translate="no">{p.evidence||'—'}</dd><dt>답신용 이메일</dt><dd>{p.email||'—'}</dd><dt>기준 버전</dt><dd>{p.version} · <a href={p.url}>해당 인물 열기</a></dd><dt>이메일 알림</dt><dd>{({sent:'발송 완료',pending:'발송 대기',failed:'발송 실패',unconfigured:'연결 필요'})[row.notification]||row.notification}</dd></dl>
 <form className="simple-form" onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try{await request(`/api/admin/reports/${row.id}`,{status,decision,revision:row.revision,appliedVersion:version,correctedValue:corrected});onSaved()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}}>
 <label>처리 상태<select value={status} onChange={e=>setStatus(e.target.value)}>{Object.entries(statusLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label><label>판단 근거<textarea value={decision} onChange={e=>setDecision(e.target.value)} required={['applied','held','rejected'].includes(status)} maxLength={6000}/></label>
 {status==='applied'&&<><label>반영한 데이터 버전<input required value={version} onChange={e=>setVersion(e.target.value)}/></label><label>수정 후 정보<textarea required value={corrected} onChange={e=>setCorrected(e.target.value)}/></label><p className="muted small">실제 데이터 개정을 마친 뒤 기록하세요. 이 저장은 연구 데이터를 수정하지 않습니다.</p></>}
 {error&&<p role="alert">{error}</p>}<button className="primary-button" disabled={busy}>{busy?'저장 중…':'검토 기록 저장'}</button></form>
 <button onClick={async()=>{try{setHistory((await request(`/api/admin/reports/${row.id}/history`)).items)}catch(e){setError((e as Error).message)}}}>처리 이력</button>{history&&<ol>{history.map(h=><li key={h.revision}>{h.reviewed_at} · {statusLabels[h.status]}<p translate="no">{h.decision}</p></li>)}</ol>}
 </details>;
}
export function AdminReports({onClose}:{onClose:()=>void}){
 const [rows,setRows]=useState<any[]>([]),[next,setNext]=useState<number|null>(null),[ready,setReady]=useState(false),[configured,setConfigured]=useState(false),[error,setError]=useState('');
 async function refresh(offset=0){setError('');try{const r=await request('/api/admin/reports?offset='+offset);setRows(v=>offset?[...v,...r.items]:r.items);setNext(r.next);setConfigured(r.emailConfigured);setReady(true)}catch(e){setError((e as Error).message)}}
 useEffect(()=>{refresh()},[]);
 return <Modal title="비공개 제보 관리함" onClose={onClose}><div className="inbox-tools"><button onClick={()=>refresh()}>새로고침</button><span className="muted small">{configured?'이메일 알림 연결됨':'이메일 알림 연결 필요'}</span></div>{!configured&&ready&&<p className="muted small">접수·검토 기록은 저장됩니다. 이메일 자동 알림은 발송 서비스 연결 후 사용할 수 있습니다.</p>}{error&&<p role="alert">{error}</p>}{ready&&!rows.length&&<p className="inbox-empty">접수된 제보가 없습니다.</p>}{rows.map(r=><Review key={r.id+'-'+r.revision} row={r} onSaved={()=>refresh()}/>)}{next!==null&&<button onClick={()=>refresh(next)}>더 보기</button>}</Modal>;
}
