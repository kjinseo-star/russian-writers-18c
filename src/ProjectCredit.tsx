import {h,getLanguage} from './i18n';
import React from 'react';

const names={ko:'서광진 (경북대)',en:'Seo Kwangjin (KNU)',ru:'Со Кванг Чжин (КНУ)'};
export default function ProjectCredit({allNames=false}:{allNames?:boolean}){
  return <span className="project-credit"><span>데이터 가공·재구성</span>{' · '}<span translate="no">{allNames?Object.values(names).join(' / '):names[getLanguage()]}</span></span>;
}
