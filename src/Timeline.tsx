import {h} from './i18n';
import React, {useMemo, useState} from 'react';
import {type Person, displayDates, life, findPeople, togglePerson, timelinePeople} from './model';
import {Icon} from './Evidence';

export default function Timeline({people,onSelect,selected,compared=[],onCompare=()=>{},onlySelected=false,onOnlySelected=()=>{}}:{people:Person[];onSelect:(id:string)=>void;selected:string;compared?:string[];onCompare?:(ids:string[])=>void;onlySelected?:boolean;onOnlySelected?:(value:boolean)=>void}) {
  const [pickerOpen,setPickerOpen]=useState(false);
  const [query,setQuery]=useState('');
  const shown=timelinePeople(people,compared,onlySelected);
  const rows=useMemo(()=>shown.map(p=>({p,...displayDates(p)})).sort((a,b)=>(a.birth.year??a.death.year??Infinity)-(b.birth.year??b.death.year??Infinity)||a.p.name.localeCompare(b.p.name,'ru')),[shown]);
  const values=rows.flatMap(r=>[r.birth.year,r.death.year]).filter((v):v is number=>v!==null);
  const min=values.length?Math.floor(Math.min(...values)/25)*25:1650;
  const max=values.length?Math.max(min+25,Math.ceil(Math.max(...values)/25)*25):1850;
  const ticks=Array.from({length:Math.floor((max-min)/25)+1},(_,i)=>min+i*25);
  const position=(n:number)=>(n-min)/(max-min)*100;
  const pickerPeople=query?findPeople(people,query):people;
  const selectedHere=people.filter(p=>compared.includes(p.id));
  const uncertain=rows.filter(r=>r.birth.uncertain||r.death.uncertain).length;
  return <section className="timeline-wrap" aria-label="생애 연표">
    <div className="timeline-controls">
      <div className="timeline-mode"><button aria-pressed={!onlySelected} onClick={()=>onOnlySelected(false)}>전체 보기</button><button aria-pressed={onlySelected} onClick={()=>{onOnlySelected(true);if(!compared.length)setPickerOpen(true);}}>선택 인물만 <span>{selectedHere.length}</span></button></div>
      <button className="pick-people" aria-expanded={pickerOpen} onClick={()=>setPickerOpen(v=>!v)}>인물 고르기</button>
    </div>
    {pickerOpen&&<div className="timeline-picker">
      <div className="picker-heading"><input aria-label="연표에 넣을 인물 찾기" placeholder="이름으로 찾아 선택" value={query} onChange={e=>setQuery(e.target.value)}/><button onClick={()=>onCompare([])}>선택 해제</button></div>
      <div className="picker-list">{pickerPeople.map(p=><label key={p.id}><input type="checkbox" checked={compared.includes(p.id)} onChange={()=>onCompare(togglePerson(compared,p.id))}/><span lang="ru">{p.name}</span><small>{life(p)}</small></label>)}</div>
      <button className="primary-button" onClick={()=>{onOnlySelected(true);setPickerOpen(false);}}>선택한 {selectedHere.length}명 연표 보기</button>
    </div>}
    {selectedHere.length>0&&<div className="timeline-chips">{selectedHere.map(p=><button key={p.id} onClick={()=>onCompare(togglePerson(compared,p.id))} aria-label={`${p.name} 연표 선택 해제`}><span lang="ru">{p.name}</span><Icon name="close" size={12}/></button>)}</div>}
    <p className="method-note"><Icon name="info" size={15}/><span><strong data-testid="timeline-count">{rows.length}명</strong> 표시 · 자료에 먼저 제시된 해를 사용합니다. 점선·*는 불확실한 연도({uncertain}명)이며, 원문은 인물명 아래에 그대로 표시합니다. 생애는 활동 기간을 뜻하지 않습니다.</span></p>
    {rows.length?<div className="timeline-scroll"><div className="timeline-grid">
      <div className="timeline-scale"><span>인물 · 원문 생몰연도</span><div>{ticks.map(t=><span key={t} style={{left:`${position(t)}%`}}>{t}</span>)}</div></div>
      {rows.map(({p,birth,death})=>{
        const interval=birth.year!==null&&death.year!==null&&death.year>=birth.year;
        const partial=(birth.year===null)!==(death.year===null);
        const point=birth.year??death.year;
        return <button className={`timeline-row ${selected===p.id?'is-selected':''}`} data-person-id={p.id} key={p.id} onClick={()=>onSelect(p.id)}>
          <span lang="ru">{p.name}<small>{life(p)}</small></span>
          <div className="life-track">
            {ticks.map(t=><i key={t} style={{left:`${position(t)}%`}}/>)}
            {interval?<span className={`life-bar ${birth.uncertain||death.uncertain?'uncertain-bar':''}`} style={{left:`${position(birth.year!)}%`,width:`${Math.max(0.5,(death.year!-birth.year!)/(max-min)*100)}%`}}><span className="bar-years">{birth.year}{birth.uncertain?'*':''}–{death.year}{death.uncertain?'*':''}</span></span>:
              partial?<><span className={`life-point ${birth.uncertain||death.uncertain?'uncertain-point':''}`} style={{left:`${position(point!)}%`}}/><span className="partial-date-label">{birth.year!==null?`출생 ${birth.year}${birth.uncertain?'*':''} · 사망 미기재`:`출생 미기재 · 사망 ${death.year}${death.uncertain?'*':''}`}</span></>:
              <span className="partial-date-label">{point===null?'연도 미기재':'원문 연도 확인 필요'}</span>}
          </div>
        </button>;
      })}
    </div></div>:<div className="empty-state"><h2>연표에 넣을 인물을 선택해 주세요</h2><p>인물 고르기에서 여러 명을 체크하거나 인물 상세에서 연표에 추가할 수 있습니다.</p><button className="primary-button" onClick={()=>setPickerOpen(true)}>인물 고르기</button>{compared.length>0&&<p>현재 검색 조건 밖의 선택 인물은 조건을 해제하면 보입니다.</p>}</div>}
  </section>;
}
