import {h,useLanguage,type Language} from './i18n';
import References from './References';
import About from './About';
import ProjectCredit from './ProjectCredit';
import {AdminReports} from './Reports';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import Network from './Network';
import Timeline from './Timeline';
import PersonDetail from './PersonDetail';
import {Icon} from './Evidence';
import {type Data, type Filters, type View, type Visit, emptyFilters, filterPeople, visibleEdges, parseState, serializeState, validateData, findPeople, text, life, originText, definite, displayDates, rememberVisit, previousVisit, togglePerson, timelinePeople} from './model';
import './styles.css';
import {abroadCountries,confirmedTeachers,confirmedAbroad} from './model';

export default function App({initialData,initialHash}:{initialData?:Data;initialHash?:string}) {
  const [lang,changeLanguage]=useLanguage();
  const [references,setReferences]=useState(false);
  const [about,setAbout]=useState(false);
  const [admin,setAdmin]=useState(false);
  const [inbox,setInbox]=useState(false);
  useEffect(()=>{document.documentElement.lang=lang;fetch('/api/session').then(r=>r.json()).then(s=>{setAdmin(!!s.admin);if(s.admin&&new URLSearchParams(location.search).has('admin'))setInbox(true);}).catch(()=>{});},[]);
  const [data,setData]=useState<Data|null>(initialData||null);
  const [error,setError]=useState('');
  const [seed]=useState(()=>parseState(initialHash??(typeof location==='undefined'?'':location.hash)));
  const [filters,setFilters]=useState<Filters>(seed.filters);
  const [view,setView]=useState<View>(seed.view);
  const [selected,setSelected]=useState(seed.selected);
  const [visits,setVisits]=useState<Visit[]>([]);
  const [compared,setCompared]=useState<string[]>(seed.compared);
  const [timelineOnly,setTimelineOnly]=useState(seed.timelineOnly);
  const [filtersOpen,setFiltersOpen]=useState(false);
  const [labels,setLabels]=useState(false);
  const [query,setQuery]=useState(seed.search);
  const [searchOpen,setSearchOpen]=useState(false);
  const [searchIndex,setSearchIndex]=useState(0);
  const [sort,setSort]=useState<'degree'|'name'|'birth'>('degree');
  const [notice,setNotice]=useState('');
  const searchInput=useRef<HTMLInputElement>(null);
  const filterButton=useRef<HTMLButtonElement>(null);

  useEffect(()=>{
    if(initialData)return;
    const controller=new AbortController();
    fetch('./app-data.json',{signal:controller.signal}).then(r=>{if(!r.ok)throw new Error(`자료를 불러오지 못했습니다 (${r.status}).`);return r.json();})
      .then((d:Data)=>{setData(validateData(d));setSelected(s=>d.people.some(p=>p.id===s)?s:'');})
      .catch(e=>{if(e.name!=='AbortError')setError(e.message);});
    return()=>controller.abort();
  },[initialData]);

  useEffect(()=>{
    history.replaceState(null,'',`${location.pathname}${location.search}${serializeState(filters,view,selected,compared,timelineOnly)}`);
  },[filters,view,selected,compared,timelineOnly]);
  useEffect(()=>{
    const escape=(e:KeyboardEvent)=>{
      if(e.key!=='Escape'||e.defaultPrevented)return;
      if(filtersOpen){setFiltersOpen(false);filterButton.current?.focus();}
      else if(selected){setSelected('');searchInput.current?.focus();}
      setSearchOpen(false);
    };
    document.addEventListener('keydown',escape);
    return()=>document.removeEventListener('keydown',escape);
  },[filtersOpen,selected]);
  useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),4500);return()=>clearTimeout(timer);},[notice]);
  useEffect(()=>{if(filtersOpen)document.getElementById('origin-filter')?.focus();},[filtersOpen]);

  const filtered=useMemo(()=>filterPeople(data?.people||[],filters),[data,filters]);
  const edges=useMemo(()=>visibleEdges(data?.edges||[],filtered),[data,filtered]);
  const sorted=useMemo(()=>[...filtered].sort((a,b)=>sort==='degree'?b.internalDegree-a.internalDegree||a.name.localeCompare(b.name,'ru'):sort==='birth'?(displayDates(a).birth.year??Infinity)-(displayDates(b).birth.year??Infinity)||a.name.localeCompare(b.name,'ru'):a.name.localeCompare(b.name,'ru')),[filtered,sort]);
  const person=filtered.find(p=>p.id===selected);
  useEffect(()=>{if(data&&selected&&!person)setSelected('');},[data,selected,person]);
  useEffect(()=>{if(data)setCompared(ids=>ids.filter(id=>data.people.some(p=>p.id===id)));},[data]);
  const options=useMemo(()=>{
    const people=data?.people||[];
    const unique=(values:string[])=>[...new Set(values)].filter(v=>v!=='미기재').sort((a,b)=>a.localeCompare(b,'ru'));
    return {origins:unique(people.map(originText)),places:unique(people.map(p=>text(p.birthplace))),schools:unique(people.flatMap(p=>p.schools)),countries:unique(people.flatMap(p=>abroadCountries(p,filters.countryEra))),teachers:unique(people.flatMap(confirmedTeachers)),ranks:unique(people.map(p=>text(p.fields.Rank_number?.value))).sort((a,b)=>Number(a)-Number(b))};
  },[data,filters.countryEra]);
  const hits=useMemo(()=>findPeople(filtered,query).slice(0,8),[filtered,query]);
  const setFilter=<K extends keyof Filters>(key:K,value:Filters[K])=>setFilters(f=>({...f,[key]:value}));
  const activeCount=['origin','place','school','study','country','teacher','learning','rank'].filter(k=>!!filters[k as keyof Filters]).length+Number(!!(filters.from||filters.to));
  const selectPerson=(id:string)=>{setVisits(h=>rememberVisit(h,{id:selected,filters,view},id));setSelected(id);setSearchOpen(false);setFiltersOpen(false);setQuery('');};
  const goBack=()=>{const back=previousVisit(visits);if(!back.visit)return;setVisits(back.history);setFilters(back.visit.filters);setView(back.visit.view);setSelected(back.visit.id);setSearchOpen(false);setFiltersOpen(false);setQuery('');};
  const reset=()=>{setFilters({...emptyFilters});setSelected('');setVisits([]);setQuery('');setSearchOpen(false);setFiltersOpen(false);setView('network');};
  const closeFilters=()=>{setFiltersOpen(false);filterButton.current?.focus();};
  const copy=async()=>{try{await navigator.clipboard.writeText(location.href);setNotice('현재 화면의 주소를 복사했습니다.');}catch{setNotice('주소 표시줄에서 현재 주소를 복사해 주세요.');}};
  const csv=()=>{
    const escape=(v:unknown)=>'"'+String(v??'').replace(/^(?:\s*[=+@\-]|[\t\r\n])/,"'$&").replace(/"/g,'""')+'"';
    const exportPeople=view==='timeline'?timelinePeople(sorted,compared,timelineOnly):sorted;
    const rows=[['person_id','name','birth_display_year','birth_raw','birth_status','death_display_year','death_raw','death_status','birthplace','origin','confirmed_attended_schools','abroad_study_record','abroad_study','abroad_country_historical','abroad_country_modern','confirmed_named_teachers','degree_within_104','volume','article_pdf_pages'],...exportPeople.map(p=>[p.id,p.name,displayDates(p).birth.year,p.birthRaw,p.birthStatus,displayDates(p).death.year,p.deathRaw,p.deathStatus,p.birthplace??'',typeof p.origin==='string'?p.origin:'',p.schools.join(' | '),confirmedAbroad(p).length?'recorded':'not_recorded',p.fields.Abroad_study?.value??'',p.fields.Abroad_country?.value??'',abroadCountries(p,'modern').filter(c=>c!=='__unspecified__').join(' | '),confirmedTeachers(p).join(' | '),p.internalDegree,p.volume,Array.isArray(p.articlePages)?p.articlePages.join('–'):text(p.articlePages)])];
    const url=URL.createObjectURL(new Blob(['\ufeff'+rows.map(r=>r.map(escape).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='writers18_104_v05_filtered.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    setNotice(`${exportPeople.length}명의 자료를 CSV로 내보냈습니다.`);
  };

  if(error)return <main className="loading-page"><h1>자료를 열 수 없습니다</h1><p>{error}</p><button onClick={()=>location.reload()}>다시 불러오기</button></main>;
  if(!data)return <main className="loading-page" aria-live="polite"><Icon name="network" size={36}/><h1>104인의 관계도를 준비합니다</h1></main>;

  return <div className="app-shell">
    <header className="masthead">
      <button className="brand" onClick={reset} aria-label="104인 관계도 처음 화면"><Icon name="network" size={24}/><span>18세기 작가 관계도</span></button>
      <span className="scope-badge">104인 · 검토본</span>
      <select className="language-select" aria-label="언어 선택" value={lang} onChange={e=>changeLanguage(e.target.value as Language)}><option value="ko">한국어</option><option value="en">English</option><option value="ru">Русский</option></select>
      <details className="more-menu">
        <summary aria-label="추가 기능">···</summary>
        <div className="menu-content">
          <button onClick={e=>{const menu=e.currentTarget.closest('details');menu?.removeAttribute('open');menu?.querySelector('summary')?.focus();setAbout(true);}}>소개</button>
          <button onClick={()=>setReferences(true)}>참고문헌</button>
          {admin&&<button onClick={()=>setInbox(true)}>비공개 제보 관리함</button>}
          <button onClick={e=>{copy();e.currentTarget.closest('details')?.removeAttribute('open');}}><Icon name="link" size={16}/>현재 화면 주소 복사</button>
          <button onClick={e=>{csv();e.currentTarget.closest('details')?.removeAttribute('open');}}><Icon name="download" size={16}/>검색 결과 CSV 받기</button>
          <label><input type="checkbox" checked={labels} onChange={e=>setLabels(e.target.checked)}/>관계도 이름 모두 표시</label>
          <p>데이터 v05 · 화면 v08<br/>생몰연도는 원문에서 먼저 제시된 해로 표시·검색합니다. 불확실한 연도와 원문 표기는 함께 보존합니다.</p>
        </div>
      </details>
    </header>

    <div className="toolbar">
      <div className="search-box" onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setSearchOpen(false);}}>
        <Icon name="search" size={18}/>
        <input ref={searchInput} aria-label="인물 이름 검색" role="combobox" aria-expanded={searchOpen&&!!query.trim()} aria-controls="search-results" aria-autocomplete="list" aria-activedescendant={searchOpen&&hits[searchIndex]?`hit-${hits[searchIndex].id}`:undefined} placeholder="인물 이름 찾기" value={query}
          onFocus={()=>setSearchOpen(true)} onChange={e=>{setQuery(e.target.value);setSearchOpen(true);setSearchIndex(0);}}
          onKeyDown={e=>{
            if(e.key==='ArrowDown'){e.preventDefault();setSearchOpen(true);setSearchIndex(i=>Math.max(0,Math.min(i+1,hits.length-1)));}
            if(e.key==='ArrowUp'){e.preventDefault();setSearchIndex(i=>Math.max(0,i-1));}
            if(e.key==='Enter'&&hits[Math.max(0,searchIndex)]){e.preventDefault();selectPerson(hits[Math.max(0,searchIndex)].id);}
            if(e.key==='Escape'){e.preventDefault();e.stopPropagation();setSearchOpen(false);}
          }}/>
        {query&&<button className="clear-search" aria-label="검색어 지우기" onClick={()=>{setQuery('');searchInput.current?.focus();}}><Icon name="close" size={16}/></button>}
        {searchOpen&&query.trim()&&<div className="search-results" id="search-results" role="listbox" aria-label="인물 검색 결과">
          {hits.length?hits.map((p,i)=><button id={`hit-${p.id}`} key={p.id} role="option" aria-selected={i===searchIndex} onMouseEnter={()=>setSearchIndex(i)} onMouseDown={e=>e.preventDefault()} onClick={()=>selectPerson(p.id)}><span lang="ru">{p.name}</span><small>{life(p)}</small></button>):<p>일치하는 인물이 없습니다.{activeCount>0&&' 조건을 해제하면 104명 전체에서 찾을 수 있습니다.'}</p>}
        </div>}
      </div>
      <button ref={filterButton} className={`filter-button ${activeCount?'is-active':''}`} aria-expanded={filtersOpen} aria-controls="filters-panel" onClick={()=>{setFiltersOpen(v=>!v);setSelected('');setSearchOpen(false);}}><Icon name="filter" size={16}/>조건{activeCount>0&&<span>{activeCount}</span>}</button>
      <nav className="view-switch" aria-label="자료 표시 방식">
        {([['network','관계도'],['list','목록'],['timeline','연표']] as const).map(([id,label])=><button key={id} aria-pressed={view===id} className={view===id?'active':''} onClick={()=>setView(id)}>{label}</button>)}
      </nav>
    </div>

    <div className="context-bar">
      <p data-testid="result-count" aria-live="polite">{view==='timeline'&&timelineOnly?<>연표 <strong>{timelinePeople(filtered,compared,true).length}명</strong><span> / 검색 범위 {filtered.length}명</span></>:<><strong>{filtered.length}명</strong>{filtered.length!==104&&<span> / 104명</span>}{view!=='timeline'&&<><span className="context-separator">·</span>사전 참조 <strong>{edges.length.toLocaleString()}개</strong></>}</>}</p>
      {activeCount>0&&<div className="filter-chips">
        {filters.origin&&<button title={filters.origin} onClick={()=>setFilter('origin','')}>출신 분류<Icon name="close" size={12}/></button>}
        {filters.place&&<button title={filters.place} onClick={()=>setFilter('place','')}>출생지<Icon name="close" size={12}/></button>}
        {filters.school&&<button title={filters.school} onClick={()=>setFilter('school','')}>학교<Icon name="close" size={12}/></button>}
        {filters.study&&<button onClick={()=>setFilters(f=>({...f,study:'',country:''}))}>{filters.study==='recorded'?'해외 수학 기록 있음':'해외 수학 기록 미확인'}<Icon name="close" size={12}/></button>}
        {filters.country&&<button onClick={()=>setFilter('country','')}>{filters.country==='__unspecified__'?'국가 미기재':filters.country}<Icon name="close" size={12}/></button>}
        {filters.teacher&&<button title={filters.teacher} onClick={()=>setFilter('teacher','')}>배운 사람<Icon name="close" size={12}/></button>}
        {filters.learning&&<button onClick={()=>setFilter('learning','')}>교육 방식<Icon name="close" size={12}/></button>}
        {filters.rank&&<button onClick={()=>setFilter('rank','')}>관등 {filters.rank}등<Icon name="close" size={12}/></button>}
        {(filters.from||filters.to)&&<button onClick={()=>setFilters(f=>({...f,from:'',to:''}))}>{filters.from||'…'}–{filters.to||'…'}<Icon name="close" size={12}/></button>}
        <button className="reset-all" onClick={reset}>104인 전체</button>
      </div>}
    </div>

    <main className={`explorer ${person?'has-detail':''}`}>
      <div className="view-panel" data-view={view}>
        {filtered.length===0?<div className="empty-state"><Icon name="search" size={32}/><h2>조건에 맞는 인물이 없습니다</h2><p>출신·학교·연도 조건을 조정해 주세요.</p><button className="primary-button" onClick={reset}>104인 전체 보기</button></div>:
          view==='network'?<Network data={data} people={filtered} selected={selected} onSelect={selectPerson} labels={labels}/>:
          view==='timeline'?<Timeline people={filtered} selected={selected} onSelect={selectPerson} compared={compared} onCompare={setCompared} onlySelected={timelineOnly} onOnlySelected={setTimelineOnly}/>:
          <section className="list-view" aria-label="인물 목록">
            <div className="list-heading"><p>인물을 선택하면 상세 정보가 열립니다.</p><select aria-label="인물 정렬" value={sort} onChange={e=>setSort(e.target.value as typeof sort)}><option value="degree">연결수순 · 104인 기준</option><option value="name">이름순</option><option value="birth">출생 연도순</option></select></div>
            <table><thead><tr><th>인물</th><th>생몰 연도</th><th className="place-column">출생지</th><th>참조 수</th></tr></thead><tbody>
              {sorted.map(p=><tr key={p.id} className={p.id===selected?'selected-row':''} onClick={()=>selectPerson(p.id)}><td><button className="person-link" onClick={e=>{e.stopPropagation();selectPerson(p.id);}}><span lang="ru">{p.name}</span><small>{p.id}</small></button></td><td>{life(p)}{!definite(p)&&<span className="uncertain-dot" title="불확실 또는 미기재 연도 포함">*</span>}</td><td className="place-column" lang="ru">{text(p.birthplace)}</td><td>{p.internalDegree}</td></tr>)}
            </tbody></table><p className="table-note">* 불확실·미기재 연도 포함 · 참조 수는 필터와 관계없이 104인 내부 기준입니다.</p>
          </section>}
      </div>
      {filtersOpen&&<>
        <button className="drawer-backdrop" aria-label="조건 창 닫기" onClick={closeFilters}/>
        <aside id="filters-panel" className="filters-drawer" aria-label="탐색 조건" data-testid="filters-panel">
          <div className="drawer-heading"><h2>조건으로 모아보기</h2><button className="close-button" onClick={closeFilters} aria-label="탐색 조건 닫기"><Icon name="close"/></button></div>
          <div className="filter-fields">
            <label htmlFor="origin-filter">출신 분류</label><select id="origin-filter" value={filters.origin} onChange={e=>setFilter('origin',e.target.value)}><option value="">모든 출신 분류</option>{options.origins.map(v=><option key={v}>{v}</option>)}</select>
            <label htmlFor="place-filter">출생지</label><select id="place-filter" value={filters.place} onChange={e=>setFilter('place',e.target.value)}><option value="">모든 출생지</option>{options.places.map(v=><option key={v}>{v}</option>)}</select>
            <label htmlFor="school-filter">학교</label><select id="school-filter" value={filters.school} onChange={e=>setFilter('school',e.target.value)}><option value="">모든 확인된 재학 기관</option>{options.schools.map(v=><option key={v}>{v}</option>)}</select>
            <p className="filter-help">기관명과 수학 근거가 확인된 기록만 검색합니다. 전체 교육 이력은 인물 상세에서 확인할 수 있습니다.</p>
            <label htmlFor="study-filter">해외 수학</label><select id="study-filter" value={filters.study} onChange={e=>setFilters(f=>({...f,study:e.target.value as Filters['study'],country:e.target.value==='unrecorded'?'':f.country}))}><option value="">모두</option><option value="recorded">기록 있음</option><option value="unrecorded">기록 미확인</option></select>
            <div className="country-filter-heading"><label htmlFor="country-filter">수학 국가</label><div className="country-era" role="group" aria-label="국가 기준"><button aria-pressed={filters.countryEra==='historical'} onClick={()=>setFilters(f=>({...f,countryEra:'historical',country:''}))}>당시</button><button aria-pressed={filters.countryEra==='modern'} onClick={()=>setFilters(f=>({...f,countryEra:'modern',country:''}))}>현재</button></div></div><select id="country-filter" disabled={filters.study==='unrecorded'} value={filters.country} onChange={e=>setFilters(f=>({...f,country:e.target.value,study:e.target.value?'recorded':f.study}))}><option value="">모든 국가</option>{options.countries.map(v=><option key={v} value={v}>{v==='__unspecified__'?'국가 미확인':v}</option>)}</select>
            <p className="filter-help">도시·시기에 따른 국가명을 보완했습니다. ‘현재’는 지금의 지리적 위치입니다. 유학·연수와 해외 체류 중 학습을 포함하며, 계획과 러시아 이주 전 교육은 제외합니다. ‘기록 미확인’은 유학하지 않았다는 뜻이 아닙니다.</p>
            <details className="extra-conditions"><summary>교육·관등 조건 더 보기</summary><div>
              <label htmlFor="learning-filter">교육 방식</label><select id="learning-filter" value={filters.learning} onChange={e=>setFilter('learning',e.target.value)}><option value="">모든 교육 방식</option><option value="institution">기관 수학</option><option value="home">가정교육</option><option value="private">교사 지도·개인 교습</option><option value="self">독학</option></select>
              <label htmlFor="teacher-filter">배운 사람</label><select id="teacher-filter" value={filters.teacher} onChange={e=>setFilter('teacher',e.target.value)}><option value="">모든 교사·교수</option>{options.teachers.map(v=><option key={v}>{v}</option>)}</select>
              <label htmlFor="rank-filter">관등</label><select id="rank-filter" value={filters.rank} onChange={e=>setFilter('rank',e.target.value)}><option value="">모든 관등</option>{options.ranks.map(v=><option key={v} value={v}>{v}등</option>)}</select>
            </div></details>
            <label htmlFor="period-filter">연도</label><select id="period-filter" value={filters.period} onChange={e=>setFilter('period',e.target.value as 'birth'|'alive')}><option value="birth">출생 연도 범위</option><option value="alive">해당 기간에 생존</option></select>
            <div className="year-inputs"><input aria-label="시작 연도" type="number" placeholder="시작" value={filters.from} onChange={e=>setFilter('from',e.target.value)}/><span>—</span><input aria-label="끝 연도" type="number" placeholder="끝" value={filters.to} onChange={e=>setFilter('to',e.target.value)}/></div>
            {filters.from&&filters.to&&Number(filters.from)>Number(filters.to)&&<p className="warning" role="alert">시작 연도가 끝 연도보다 큽니다.</p>}
            <label className="check"><input type="checkbox" checked={filters.unknown} onChange={e=>setFilter('unknown',e.target.checked)}/>연도 값이 없는 인물 포함</label>
            <p className="filter-help">불확실한 연도도 원문에 먼저 나온 해로 검색합니다. 날짜가 전혀 없으면 위 선택에 따릅니다.</p>
            <details className="teaching-examples"><summary>수업용 예시</summary><button onClick={()=>setFilters({...emptyFilters,period:'alive',from:'1750',to:'1750',unknown:false})}>1750년에 생존한 인물</button><p className="filter-help">우선 표시 연도 기준이며, 생애는 활동 기간을 뜻하지 않습니다.</p></details>
          </div>
          <div className="filter-actions"><button className="text-button" onClick={()=>setFilters({...emptyFilters})}>초기화</button><button className="primary-button" onClick={closeFilters}>{filtered.length}명 보기</button></div>
        </aside>
      </>}
      {person&&<PersonDetail person={person} data={data} onClose={()=>{setSelected('');searchInput.current?.focus();}} onSelect={id=>{setFilters({...emptyFilters});selectPerson(id);}} onBack={goBack} previousName={data.people.find(p=>p.id===visits.at(-1)?.id)?.name} compared={compared.includes(person.id)} onCompare={()=>{setCompared(ids=>togglePerson(ids,person.id));setNotice(compared.includes(person.id)?'연표 선택에서 해제했습니다.':'연표에 추가했습니다. 연표의 ‘선택 인물만’에서 비교하세요.');}}/>}
    </main>
    <footer className="site-footer"><span className="network-note"><Icon name="info" size={14}/><span>사전 항목 사이의 참조를 연결했습니다. 실제 교류 관계를 뜻하지 않습니다.</span></span><span className="network-attribution"><button className="network-credit" onClick={()=>setReferences(true)} aria-label="관계도 출처 보기"><span>사전·원 관계도 출처</span><span translate="no"> · СРП XVIII · Борис Орехов (2022) · ИРЛИ РАН</span></button><ProjectCredit/></span></footer>
    {about&&<About onClose={()=>setAbout(false)} onSources={()=>{setAbout(false);setReferences(true);}}/>}
    {references&&<References onClose={()=>setReferences(false)}/>}
    {inbox&&admin&&<AdminReports onClose={()=>setInbox(false)}/>}
    {notice&&<div className="toast" role="status">{notice}</div>}
  </div>;
}
