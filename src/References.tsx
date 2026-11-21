import {h} from './i18n';
import React from 'react';
import Modal from './Modal';
import NetworkSources from './NetworkSources';
import bibliography from './bibliography.json';
import {text,type Evidence} from './model';
export const sources=bibliography;
export function SourceDetail({id}:{id:string}){const s=sources.find(s=>s.id===id);return s?<div className="source-detail"><strong translate="no">{s.abbreviation}</strong><p lang="ru" translate="no">{s.title}{'coverage' in s?`: ${s.coverage}. ${s.place}`:''}{s.year?` (${s.year})`:''}</p><p>{s.kind==='dictionary'?'인물 정보의 사전 근거':'국가명 대응을 위한 역사 지리 출처'}</p>{s.url&&<a href={s.url} target="_blank" rel="noreferrer">출처 열기 ↗</a>}<p className="muted small">{s.kind==='dictionary'?'제공 자료에서 확인된 서지 정보를 표시합니다. 인쇄면과 PDF 쪽수는 구별합니다.':'전기 사실의 추가 근거가 아닌 지명·국가 대응 자료입니다.'}</p></div>:<p>서지 확인 필요</p>;}
export function Citation({e,volume}:{e:Evidence;volume?:string|number}){
 const id=e.source_id||`srp18-${e.volume??volume}`;const s=sources.find(s=>s.id===id);
 return <details className="compact-citation"><summary>{s?.abbreviation||'출처 확인 필요'} · <span>인쇄면</span> {text(e.printed_page)} · PDF {text(e.pdf_page)}</summary><SourceDetail id={id}/></details>;
}
export default function References({onClose}:{onClose:()=>void}){return <Modal title="참고문헌" onClose={onClose}><NetworkSources/><p className="muted small">약어를 펼치면 서지와 출처를 확인할 수 있습니다.</p>{['dictionary','geography'].map(kind=><section key={kind}><h3>{kind==='dictionary'?'사전':'역사 지리'}</h3>{sources.filter(s=>s.kind===kind).map(s=><details className="reference-row" key={s.id}><summary><span>{s.abbreviation}</span> <span translate="no">{s.title}</span></summary><SourceDetail id={s.id}/></details>)}</section>)}</Modal>}
