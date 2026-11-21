import {h} from './i18n';
import React from 'react';
import {type Person,type TeacherLink,type Education} from './model';
import {EvidenceList} from './Evidence';
import {sources} from './References';
import {educationName,educationCaution,learningKind} from './education';

const contextLabel:Record<string,string>={home:'가정교육',private:'개인 교습',teacher_guided:'교사 지도',institution:'기관 수학',mentorship:'지도 관계',education_guardian:'교육·양육 담당'};
const studyContext:Record<string,string>={study_trip:'해외 유학·연수',study_during_stay:'해외 체류 중 학습',educational_travel:'교육 여행',pre_migration_education:'러시아 이주 전 교육',uncertain:'맥락 확인 필요'};
export const abroadSummary=(p:Person)=>{
  const events=(p.abroadEvents||[]).filter(e=>e.status==='confirmed'&&e.study_context!=='pre_migration_education');
  return [...new Set(events.map(e=>e.city||e.country||e.institution||'장소 미기재'))].join(' · ');
};
function Teacher({link,volume,embedded=false}:{link:TeacherLink;volume:Person['volume'];embedded?:boolean}){
  return <div className={`teacher-record ${embedded?'embedded':''}`} data-teacher={link.teacher}>
    <p className="teacher-line"><span className="learning-label">{link.context==='education_guardian'?'교육·양육 담당':link.context==='mentorship'?'지도 관계':embedded?'배운 사람':contextLabel[link.context]||'배운 사람'}</span><strong lang="ru">{link.teacher}</strong></p>
    {(link.subject||link.years)&&<p className="learning-meta" lang="ru">{[link.subject,link.years].filter(Boolean).join(' · ')}</p>}
    {!embedded&&link.institution&&<p className="learning-meta" lang="ru">{link.institution}</p>}
    {link.status&&link.status!=='confirmed'&&<span className="study-caution">지도 관계 확인 필요</span>}
    <details className="education-evidence"><summary>원문 근거</summary><EvidenceList evidence={link.evidence} volume={volume}/></details>
  </div>;
}
function Event({event,volume,children}:{event:Education;volume:Person['volume'];children?:React.ReactNode}){
  const kind=learningKind(event);
  const title=kind==='institution'?educationName(event):kind==='home'?'가정교육':kind==='private'?'교사 지도·개인 교습':kind==='self'?'독학':educationName(event)||'교육 기록';
  return <article className="education-card" data-learning-kind={kind}>
    {title&&<h3 lang={kind==='institution'?'ru':'ko'}>{title}</h3>}
    {event.years&&<p className="learning-meta" lang="ru">{event.years}</p>}
    {educationCaution(event)&&<span className="study-caution">{educationCaution(event)}</span>}
    {children}
    <details className="education-evidence"><summary>원문 근거</summary><EvidenceList evidence={event.evidence} volume={volume}/></details>
  </article>;
}
export default function EducationPanel({person}:{person:Person}){
  const events=person.education.map((event,index)=>({event,index}));
  const institutions=events.filter(({event})=>learningKind(event)==='institution'&&educationName(event));
  const personal=events.filter(({event})=>['home','private'].includes(learningKind(event)));
  const others=events.filter(x=>!institutions.includes(x)&&!personal.includes(x));
  const teachers=person.teacherLinks||[];
  const attached=new Set(teachers.filter(t=>t.context==='institution'&&institutions.some(x=>x.index===t.source_event_index)));
  const independent=teachers.filter(t=>!attached.has(t));
  const unattached=independent.filter(t=>!personal.some(x=>x.index===t.source_event_index));
  return <div className="education-groups">
    {!!(person.abroadEvents||[]).length&&<details className="detail-section" key={`abroad-${person.id}`}>
      <summary>해외 수학 <span>{person.abroadEvents!.length}건</span></summary>
      {person.abroadEvents!.map((e,i)=><article className="education-card abroad-card" key={i} data-abroad-status={e.status}>
        <span className="learning-label">{studyContext[e.study_context||'study_trip']||'해외 수학'}</span>
        <h3 lang="ru">{[e.city,e.country].filter(Boolean).join(' · ')||e.institution||'장소 미기재'}</h3>
        {e.institution&&!!(e.city||e.country)&&<p lang="ru">{e.institution}</p>}
        {e.years&&<p className="learning-meta" lang="ru">{e.years}</p>}
        {e.modern_country&&<p className="learning-meta"><span lang="ko">현재 위치 </span><span lang="ru">{e.modern_country}</span></p>}
        {e.administration_note&&<p className="study-caution" lang="ru">{e.administration_note}</p>}
        {!!e.country_candidates?.length&&<p className="small">국가 후보: <span lang="ru">{e.country_candidates.join(' / ')}</span></p>}
        {e.status!=='confirmed'&&<span className="study-caution">{e.status==='planned'?'계획·실현 미확인':'수학 여부 확인 필요'}</span>}
        <details className="education-evidence"><summary>원문 근거</summary><EvidenceList evidence={e.evidence} volume={person.volume}/></details>
        {!!e.geography_sources?.length&&<details className="education-evidence geography-evidence"><summary>국가명 확인 근거</summary>{e.country_raw&&<p className="small">사전의 국가 표기: <span lang="ru">{e.country_raw}</span></p>}{e.geography_note&&<p className="small">{e.geography_note}</p>}{e.geography_temporal_bound&&<EvidenceList evidence={e.geography_temporal_bound.evidence} volume={person.volume}/>}<ul>{e.geography_sources.map((s,j)=><li key={j}><a href={s.url} target="_blank" rel="noreferrer">{sources.find(r=>r.url===s.url)?.abbreviation} · {s.title||new URL(s.url).hostname}</a>{s.evidence_summary&&<p>{s.evidence_summary}</p>}</li>)}</ul></details>}
      </article>)}
    </details>}
    {!!institutions.length&&<details className="detail-section" key={`institutions-${person.id}`}>
      <summary>교육기관 <span>{institutions.length}건</span></summary>
      <p className="muted small">졸업 여부와 관계없이 수학 기록을 표시합니다.</p>
      {institutions.map(({event,index})=><Event key={index} event={event} volume={person.volume}>{teachers.filter(t=>attached.has(t)&&t.source_event_index===index).map((t,i)=><Teacher key={i} link={t} volume={person.volume} embedded/>)}</Event>)}
    </details>}
    {(!!personal.length||!!independent.length)&&<details className="detail-section" key={`teachers-${person.id}`}>
      <summary>교사 지도·가정교육 <span>{independent.length?`${independent.length}건`:''}</span></summary>
      {personal.map(({event,index})=><Event key={index} event={event} volume={person.volume}>{independent.filter(t=>t.source_event_index===index).map((t,i)=><Teacher key={i} link={t} volume={person.volume} embedded/>)}</Event>)}
      {unattached.map((t,i)=><Teacher key={i} link={t} volume={person.volume}/>)}
    </details>}
    {!!others.length&&<details className="detail-section" key={`other-education-${person.id}`}>
      <summary>그 밖의 교육 기록 <span>{others.length}건</span></summary>
      {others.map(({event,index})=><Event key={index} event={event} volume={person.volume}/>)}
    </details>}
  </div>;
}
