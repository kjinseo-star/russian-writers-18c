import {h} from './i18n';
import React from 'react';
import {type Education, type Person, text} from './model';
import {EvidenceList} from './Evidence';
import {educationSummary,educationName} from './education';

export function StudyField({label,events,volume}:{label:string;events:Education[];volume?:number|string}) {
  const names=[...new Set(events.map(educationName))];
  return <details className="study-field">
    <summary><span>{label}</span><strong lang="ru">{names.join(' · ')||'미기재'}</strong>{names.length>1&&<small>순서 미확정·복수 기록</small>}</summary>
    {events.map((e,i)=><div key={i} className="study-source"><h3 lang="ru">{educationName(e)}</h3><p className="small">시기: {text(e.years)}</p><EvidenceList evidence={e.evidence} volume={volume}/></div>)}
  </details>;
}
export default function EducationFields({person}:{person:Person}) {
  const summary=educationSummary(person);
  if(!summary.last.length)return null;
  return <div className="study-fields"><p className="muted small">졸업 여부와 관계없이 확인된 기관 수학 기록을 사용합니다. 개인 교습·가정교육은 별도로 표시합니다. 마지막 순서를 정할 수 없으면 관련 기록을 함께 표시합니다.</p><StudyField label="마지막 교육(기관)" events={summary.last} volume={person.volume}/>{!!summary.previous.length&&<StudyField label="이전 교육(기관)" events={summary.previous} volume={person.volume}/>}</div>;
}
