import {type Education, type Person} from './model';

// Graduation is not required. Only the source's evidence of actual learning is used.
const actualStudy=new Set(['degree_awarded','attended','attendance','completed','graduated','home_education','received','attended_completion_not_stated','attendance_completion_not_stated','attested','received_no_institutional_completion_stated','transferred','not_completed','expelled','informal_study','private_tuition','education_received','literacy_acquired','attendance_departure_completion_not_stated','enrolled','study_abroad','considered_completed','interrupted','ongoing','left','left_for_service_completion_ambiguous','literacy_acquired_other_subjects_ongoing','completed_military_school_release_interpretation','left_for_service','lectures_and_disputation_certificate','attended_no_enrollment_stated','entered_transferred_no_completion','transferred_in_completion_not_stated','left_without_completing','learned','learned_institution_not_stated','entered_completion_not_stated','left_without_theology_course','course_completed_full_institution_completion_ambiguous','study_without_institutional_completion_stated','started','ongoing_study','attended_then_transferred','lectures_attended','certificate_received','left_without_stated_completion','professional_study_visit','self_reported_study','probably_not_completed','auditing','admitted','apprenticeship','withdrew','course_completed','received_education','class_completed','lecture_course_attended','home_or_informal_education','lecture_attendance','transferred_out','stage_completed']);
export const educationName=(e:Education)=>e.institution_display||e.institution_short||e.institution_raw||e.institution_canonical||'';
export const learningKind=(e:Education)=>e.learning_kind||(isInstitution(e)?'institution':e.entity_type==='home_education'?'home':e.entity_type==='self_education'?'self':'other');
export const studyConfirmed=(e:Education)=>actualStudy.has(e.event_status||'');
export function educationCaution(e:Education) {
  const s=e.event_status||'';
  if(studyConfirmed(e)||s==='self_study'||s==='independent_study')return '';
  if(/reject|explicitly_not_received/.test(s))return '수학 기록 부정';
  if(/planned|intended|not_realized|declined|proposal|not_attended|not_enrolled/.test(s))return '계획·미실현';
  if(/uncertain|possible|possibly|doubt|tentative|conflicting|ambiguous|unconfirmed|not_attested|unclear|not_confirmed/.test(s))return '수학 여부 확인 필요';
  return '별도 교육 관련 기록';
}
function isInstitution(e:Education) {
  if(e.learning_kind)return e.learning_kind==='institution'&&!!e.institution_display;
  if(e.entity_type==='named_institution_or_stage')return true;
  if(e.entity_type==='home_education'||e.entity_type==='self_education')return false;
  return /university|gymnasium|academy|school|corps|boarding|seminar|college|higher_study|specialized_training|пансион|гимназ|университет|академ|школ|семинар|корпус/i.test((e.stage||'')+' '+(e.institution_raw||''));
}
function timeBounds(e:Education) {
  const s=e.years||'';
  const ys=[...s.matchAll(/\b(1[5-9]\d{2})\b/g)].map(m=>Number(m[1]));
  if(!ys.length)return {startLow:null,startHigh:null,endHigh:null};
  if(/^до\b|^до\s|окончание к/.test(s))return {startLow:null,startHigh:null,endHigh:Math.max(...ys)};
  if(/после|позднее|не ранее/.test(s))return {startLow:ys[0],startHigh:null,endHigh:null};
  const startPart=s.split(/[–—]/)[0];
  const startYears=[...startPart.matchAll(/\b(1[5-9]\d{2})\b/g)].map(m=>Number(m[1]));
  if(!startYears.length)startYears.push(ys[0]);
  return {startLow:Math.min(...startYears),startHigh:Math.max(...startYears),endHigh:null};
}
function layers(events:Education[]) {
  const remaining=events.map(e=>({event:e,time:timeBounds(e)}));
  const latest=remaining.filter(a=>!remaining.some(b=>a!==b&&b.time.startLow!==null&&((a.time.startHigh!==null&&b.time.startLow>a.time.startHigh)||(a.time.endHigh!==null&&b.time.startLow>=a.time.endHigh)))).map(x=>x.event);
  return {latest,remaining:events.filter(e=>!latest.includes(e))};
}
export function educationSummary(p:Person) {
  const confirmed=p.education.filter(studyConfirmed);
  const formal=confirmed.filter(e=>isInstitution(e)&&educationName(e)!=='기관 미기재');
  // Teachers, home education and self-study are separate records, never institution names.
  const candidates=formal.filter(e=>!!educationName(e));
  const last=layers(candidates);
  const lastNames=new Set(last.latest.map(educationName));
  const previous=layers(last.remaining.filter(e=>!lastNames.has(educationName(e))));
  const names=(events:Education[])=>[...new Set(events.map(educationName))];
  return {last:last.latest,previous:previous.latest,lastNames:names(last.latest),previousNames:names(previous.latest),orderUncertain:names(last.latest).length>1};
}
