import {studyConfirmed} from './education';
export type Evidence = {source_id?: string;volume?: number|string; pdf_page?: number|string; printed_page?: number|string; quote?: string; purpose?: string; scope?: string};
export type Field = {value?: unknown; raw?: unknown; status?: string; evidence?: Evidence[]; note?: string; rule_id?: string};
export type Education = {institution_raw?: string; institution_canonical?: string; institution_short?: string; stage?: string; event_status?: string; years?: string; entity_type?: string; evidence?: Evidence[]; note?: string; rule_id?: string; learning_kind?: 'institution'|'home'|'private'|'self'|'other'; institution_display?: string|null};
export type AbroadStudy = {institution?:string|null; city?:string|null; country?:string|null; country_raw?:string|null; modern_country?:string|null; country_basis?:string; country_candidates?:string[]; administration_note?:string; geography_temporal_bound?:{basis:string;evidence:Evidence[]}; geography_note?:string; geography_sources?:{url:string;title?:string;evidence_summary?:string}[]; years?:string|null; status:string; study_context?:string; evidence:Evidence[]; note?:string; source_event_index?:number|null};
export type TeacherLink = {teacher:string; named?:boolean; context:string; institution?:string|null; years?:string|null; subject?:string|null; status?:string; evidence:Evidence[]; source_event_index?:number|null};
export type Person = {
  id: string; name: string; graphId?: string|number; birth: number|null; death: number|null;
  birthRaw?: string; deathRaw?: string; birthStatus?: string; deathStatus?: string;
  birthplace?: unknown; deathplace?: unknown; origin?: unknown; rank?: unknown;
  volume?: number|string; articlePages?: unknown; fields: Record<string, Field>;
  education: Education[]; abroadEvents?:AbroadStudy[]; teacherLinks?:TeacherLink[]; schools: string[]; degree: number; internalDegree: number;
  reviewIssues: {field?: string; issue?: string; candidates?: unknown[]; evidence?: Evidence[]}[];
};
export type Edge = {id: string; source: string; target: string};
export type Data = {meta: Record<string, unknown>; people: Person[]; edges: Edge[]; fieldLabels: Record<string,string>; educationStatusLabels: Record<string,string>};
export type View = 'network'|'list'|'timeline';
export type Filters = {origin: string; place: string; school: string; from: string; to: string; period: 'birth'|'alive'; unknown: boolean; study:''|'recorded'|'unrecorded'; country:string; countryEra:'historical'|'modern';teacher:string; learning:string;rank:string};
export const emptyFilters: Filters = {origin:'', place:'', school:'', from:'', to:'', period:'birth', unknown:true,study:'',country:'',countryEra:'historical',teacher:'',learning:'',rank:''};
export const confirmedAbroad=(p:Person)=>(p.abroadEvents||[]).filter(e=>e.status==='confirmed'&&e.study_context!=='pre_migration_education');
export const abroadCountries=(p:Person,era:'historical'|'modern'='historical')=>[...new Set(confirmedAbroad(p).flatMap(e=>{const value=era==='modern'?e.modern_country:e.country;return value?value.split(/\s*;\s*/):['__unspecified__'];}))];
export const confirmedTeachers=(p:Person)=>[...new Set((p.teacherLinks||[]).filter(t=>t.status==='confirmed'&&t.named!==false&&!['mentorship','education_guardian'].includes(t.context)).map(t=>t.teacher))];
export const learningKinds=(p:Person)=>[...new Set(p.education.filter(e=>studyConfirmed(e)||['self_study','independent_study'].includes(e.event_status||'')).map(e=>e.learning_kind).filter(Boolean))];
export const text = (v: unknown): string => v === null || v === undefined || v === '' ? '미기재' : typeof v === 'object' ? JSON.stringify(v) : String(v);
export const originText = (p: Person) => typeof p.origin === 'object' && p.origin !== null ? text((p.origin as Record<string,unknown>).group ?? (p.origin as Record<string,unknown>).detail) : text(p.origin);
export const life = (p: Person) => `${p.birthRaw || (p.birth === null ? '?' : p.birth)} — ${p.deathRaw || (p.death === null ? '?' : p.death)}`;
export const searchText = (v: string) => v.toLocaleLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();
export const findPeople = (people: Person[], query: string) => query.trim() ? people.filter(p=>searchText(`${p.name} ${p.id} ${p.graphId||''}`).includes(searchText(query))) : [];
export const definite = (p: Person) => Number.isFinite(p.birth) && Number.isFinite(p.death) && ['explicit','normalized'].includes(p.birthStatus ?? p.fields.Birth_year?.status ?? '') && ['explicit','normalized'].includes(p.deathStatus ?? p.fields.Death_year?.status ?? '');
export function primaryYear(field: Field) {
  const raw = field.raw == null ? '' : String(field.raw);
  const match = raw.match(/\b(1[5-9]\d{2})\b/);
  const year = match ? Number(match[1]) : typeof field.value === 'number' ? field.value : Number(String(field.value??'').match(/\b(1[5-9]\d{2})\b/)?.[1]) || null;
  return {year, uncertain:year !== null && !['explicit','normalized'].includes(field.status||''), raw:raw||text(field.value), status:field.status||'not_stated'};
}
export function displayDates(p: Person) {return {birth:primaryYear(p.fields.Birth_year),death:primaryYear(p.fields.Death_year)};}
export type Visit = {id:string;filters:Filters;view:View};
export function rememberVisit(history:Visit[],current:Visit,nextId:string) {
  return current.id && nextId && current.id !== nextId ? [...history,{...current,filters:{...current.filters}}].slice(-100) : history;
}
export function previousVisit(history:Visit[]) {return {visit:history.at(-1),history:history.slice(0,-1)};}
export const togglePerson = (ids:string[],id:string) => ids.includes(id)?ids.filter(value=>value!==id):[...ids,id];
export const timelinePeople = (people:Person[],ids:string[],only:boolean) => only?people.filter(p=>ids.includes(p.id)):people;
export function filterPeople(people: Person[], filters: Filters) {
  return people.filter(p => {
    if (filters.origin && originText(p) !== filters.origin) return false;
    if (filters.place && text(p.birthplace) !== filters.place) return false;
    if (filters.school && !p.schools.includes(filters.school)) return false;
    if (filters.study==='recorded'&&!confirmedAbroad(p).length) return false;
    if (filters.study==='unrecorded'&&confirmedAbroad(p).length) return false;
    if (filters.country&&!abroadCountries(p,filters.countryEra).includes(filters.country))return false;
    if (filters.teacher&&!confirmedTeachers(p).includes(filters.teacher))return false;
    if (filters.learning&&!learningKinds(p).includes(filters.learning as Education['learning_kind']))return false;
    if (filters.rank&&text(p.fields.Rank_number?.value)!==filters.rank)return false;
    if (filters.from || filters.to) {
      const {birth,death}=displayDates(p);
      const lo = filters.from ? Number(filters.from) : -Infinity;
      const hi = filters.to ? Number(filters.to) : Infinity;
      if (lo > hi) return false;
      if (filters.period === 'birth') {
        if (birth.year === null) return filters.unknown;
        if (birth.year < lo || birth.year > hi) return false;
      } else {
        if ((birth.year !== null && birth.year > hi) || (death.year !== null && death.year < lo)) return false;
        if (birth.year === null || death.year === null) return filters.unknown;
      }
    }
    return true;
  });
}
export function visibleEdges(edges: Edge[], people: Person[]) {
  const ids = new Set(people.map(p => p.id));
  return edges.filter(e => ids.has(e.source) && ids.has(e.target));
}
export function directConnections(edges: Edge[], id: string) {
  const ids = new Set<string>();
  for (const edge of edges) {
    if (edge.source === id) ids.add(edge.target);
    if (edge.target === id) ids.add(edge.source);
  }
  return ids;
}
export function parseState(hash = '') {
  const p = new URLSearchParams(hash.replace(/^#/,''));
  return {
    filters: {...emptyFilters, origin:p.get('origin')||'', place:p.get('place')||'', school:p.get('school')||'', from:p.get('from')||'', to:p.get('to')||'', period:p.get('period') === 'alive' ? 'alive' : 'birth', unknown:p.get('unknown') !== '0',study:['recorded','unrecorded'].includes(p.get('study')||'')?p.get('study'):p.get('abroad')==='1'?'recorded':'',country:p.get('country')||'',countryEra:p.get('countryEra')==='modern'?'modern':'historical',teacher:p.get('teacher')||'',learning:p.get('learning')||'',rank:p.get('rank')||''} as Filters,
    view: (['network','list','timeline'].includes(p.get('view')||'') ? p.get('view') : 'network') as View,
    selected: p.get('person') || '', search: p.get('q') || '',
    compared:[...new Set((p.get('compare')||'').split(',').filter(id=>/^P\d{2,3}$/.test(id)))],timelineOnly:p.get('timeline')==='selected',
  };
}
export function serializeState(filters: Filters, view: View, selected: string, compared:string[]=[],timelineOnly=false) {
  const p = new URLSearchParams();
  Object.entries(filters).forEach(([key,value]) => {
    if (key === 'unknown') {if (!value) p.set(key,'0');}
    else if (key === 'countryEra') {if(value==='modern')p.set(key,value);}
    else if (value !== '' && !(key === 'period' && value === 'birth')) p.set(key,String(value));
  });
  if (view !== 'network') p.set('view',view);
  if (selected) p.set('person',selected);
  if (compared.length)p.set('compare',compared.join(','));
  if (timelineOnly)p.set('timeline','selected');
  return p.size ? '#'+p.toString() : '';
}
export function validateData(data: Data) {
  if (!Array.isArray(data.people) || data.people.length !== 104 || !Array.isArray(data.edges)) throw new Error('104인 검토본의 자료 형식을 확인해 주세요.');
  const ids = new Set(data.people.map(p => p.id));
  if (ids.size !== 104 || data.edges.some(e => !ids.has(e.source) || !ids.has(e.target) || e.source === e.target)) throw new Error('104인 내부 참조 범위를 확인해 주세요.');
  const counts: Record<string,number> = {};
  data.edges.forEach(e => {counts[e.source]=(counts[e.source]||0)+1; counts[e.target]=(counts[e.target]||0)+1;});
  if (data.people.some(p => p.internalDegree !== (counts[p.id]||0))) throw new Error('104인 내부 연결수 검증이 필요합니다.');
  return data;
}
