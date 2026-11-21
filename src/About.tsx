import {h} from './i18n';
import React from 'react';
import Modal from './Modal';
import ProjectCredit from './ProjectCredit';

export default function About({onClose,onSources}:{onClose:()=>void;onSources:()=>void}){
  return <Modal title="소개" onClose={onClose}><div className="about-site">
    <p className="about-lead">러시아 18세기 문학의 인물과 사전 속 참조 관계를 탐색하는 연구·교육용 사이트입니다.</p>
    <p>『18세기 러시아 작가 사전』 1–3권을 바탕으로 제작된 원 관계망에서 104인을 재구성하고, 인물·교육 정보와 문헌 근거를 연결했습니다.</p>
    <p className="about-credit"><ProjectCredit allNames/></p>
    <h3>이용 방법</h3>
    <ul>
      <li>관계도·목록·연표에서 같은 인물 집합을 살펴볼 수 있습니다.</li>
      <li>이름 검색은 인물을 찾아 강조하고, 조건 필터는 표시할 인물의 범위를 좁힙니다.</li>
      <li>인물을 선택하면 세부 정보와 사전 원문·쪽수를 확인하고 오류나 보완 의견을 제보할 수 있습니다.</li>
    </ul>
    <p className="muted">관계선은 사전 항목 간 참조입니다. 실제 교류·친분·영향 관계를 그 자체로 입증하지 않습니다. 불확실한 정보와 원문은 함께 보존합니다.</p>
    <p className="muted">한국어·영어·러시아어로 화면을 이용할 수 있습니다. 인명·기관명과 사전 원문은 원어를 유지합니다.</p>
    <button className="about-sources" onClick={onSources}>자료 출처와 가공 범위 보기</button>
  </div></Modal>;
}
