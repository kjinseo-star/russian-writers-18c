import {h} from './i18n';
import {ReportForm} from './Reports';
import React, {useEffect, useState} from 'react';
import {Icon, EvidenceList, FieldDetail} from './Evidence';
import {type Data, type Person, text, life, originText, directConnections} from './model';
import EducationFields from './EducationFields';
import {educationSummary} from './education';
import EducationPanel,{abroadSummary} from './EducationPanel';

export default function PersonDetail({person,data,onClose,onSelect,onBack,previousName,compared=false,onCompare}:{person:Person;data:Data;onClose:()=>void;onSelect:(id:string)=>void;onBack?:()=>void;previousName?:string;compared?:boolean;onCompare?:()=>void}) {
  const [report,setReport]=useState(false);
  const [tab,setTab]=useState<'info'|'sources'>('info');
  useEffect(()=>setTab('info'),[person.id]);
  const related=directConnections(data.edges,person.id);
  const study=educationSummary(person);
  const currentIssues=person.reviewIssues.filter(issue=>!['Last_education','Education2'].includes(issue.field||''));
  return <aside className="person-drawer" aria-label="선택 인물 상세" data-testid="person-detail">
    <div className="person-heading">
      {previousName&&<button className="person-back" onClick={onBack} title={previousName}>← 이전 인물 <span lang="ru">{previousName}</span></button>}
      <span className="eyebrow">{person.id} · 제{text(person.volume)}권</span>
      <button className="close-button" onClick={onClose} aria-label="인물 상세 닫기"><Icon name="close"/></button>
      <h2 lang="ru">{person.name}</h2>
      <p className="person-years">{life(person)}</p>
      <p className="person-connections"><strong>{related.size}명</strong>과 연결 · 참조 <strong>{person.internalDegree}</strong> <span>104인 기준</span></p>
      {onCompare&&<button className={`compare-person ${compared?'added':''}`} aria-pressed={compared} onClick={onCompare}>{compared?'✓ 연표에 선택됨':'＋ 연표에 추가'}</button>}
    </div>
    <div className="detail-tabs" aria-label="상세 정보 종류">
      <button aria-pressed={tab==='info'} className={tab==='info'?'active':''} onClick={()=>setTab('info')}>기본 정보</button>
      <button aria-pressed={tab==='sources'} className={tab==='sources'?'active':''} onClick={()=>setTab('sources')}>출처와 근거</button>
    </div>
    <div className="person-body">
      {tab==='info'?<>
        <dl className="bio-summary">
          <div><dt>출생지</dt><dd lang="ru">{text(person.birthplace)}</dd></div>
          <div><dt>사망지</dt><dd lang="ru">{text(person.deathplace)}</dd></div>
          <div><dt>출신 분류</dt><dd lang="ru">{originText(person)}</dd></div>
          <div><dt>관등</dt><dd lang="ru">{text(person.rank)}</dd></div>
          {!!study.lastNames.length&&<div className="education-summary"><dt>마지막 교육(기관)</dt><dd lang="ru">{study.lastNames.join(' · ')}{study.orderUncertain&&<small className="order-caution" lang="ko">순서 미확정·복수 기록</small>}</dd></div>}
          {abroadSummary(person)&&<div><dt>해외 수학</dt><dd lang="ru">{abroadSummary(person)}</dd></div>}
        </dl>
        <EducationPanel person={person}/>
        <details className="detail-section" key={`related-${person.id}`}>
          <summary>연결된 인물 <span>{related.size}명</span></summary>
          <p className="muted small">104인 내부 사전 참조 기준입니다. 두 방향의 참조가 있더라도 인물은 한 번만 셉니다.</p>
          <div className="related-list">{data.people.filter(p=>related.has(p.id)).sort((a,b)=>a.name.localeCompare(b.name,'ru')).map(p=><button key={p.id} onClick={()=>onSelect(p.id)}><span lang="ru">{p.name}</span><Icon name="arrow" size={14}/></button>)}</div>
        </details>
        <button className="source-link" onClick={()=>setTab('sources')}><Icon name="book" size={17}/>값과 출처를 자세히 확인하기<Icon name="arrow" size={14}/></button>
      </>:<>
        <p className="muted small">항목을 펼치면 저장 값·원문·판단 상태와 인용 페이지를 볼 수 있습니다.</p>
        <div className="field-list">{Object.entries(person.fields).filter(([key])=>!['Last_education','Education2'].includes(key)).map(([key,field])=><FieldDetail key={`${person.id}-${key}`} label={data.fieldLabels[key]||key} field={field} volume={person.volume}/>)}</div>
        <EducationFields person={person}/>
        {currentIssues.length>0&&<details className="detail-section review-issues" key={`review-${person.id}`}>
          <summary>검토 사항 <span>{currentIssues.length}건</span></summary>
          {currentIssues.map((issue,i)=><article className="review-card" key={i}>
            <h3>{data.fieldLabels[issue.field||'']||issue.field||'검토 항목'}</h3>
            <p>{issue.issue||'검토 내용 미기재'}</p>
            {!!issue.candidates?.length&&<p><strong>검토 후보</strong> {issue.candidates.map(text).join(' · ')}</p>}
            {!!issue.evidence?.length&&<EvidenceList evidence={issue.evidence} volume={person.volume}/>}
          </article>)}
        </details>}
      </>}
      <button className="report-trigger" onClick={()=>setReport(true)}>오류·보완 제보</button>
      {report&&<ReportForm person={person} data={data} onClose={()=>setReport(false)}/>}
      <p className="detail-source">Словарь русских писателей XVIII века<br/>제{text(person.volume)}권 · PDF {Array.isArray(person.articlePages)?person.articlePages.join('–'):text(person.articlePages)}쪽</p>
    </div>
  </aside>;
}
