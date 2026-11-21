import {h} from './i18n';
import React from 'react';
import ProjectCredit from './ProjectCredit';

export default function NetworkSources(){return <section className="network-sources" aria-labelledby="network-sources-title">
  <h3 id="network-sources-title">관계도 출처</h3>
  <p>이 관계도는 아래 사전과 기존 관계망 데이터를 바탕으로 재구성했습니다.</p>
  <h4>기초 문헌</h4>
  <p><span lang="ru" translate="no">Словарь русских писателей XVIII века</span><br/><span>제1–3권 (1988·1999·2010). 권별 서지는 아래에 있습니다.</span></p>
  <h4>원 관계망 데이터</h4>
  <p className="network-citation" lang="ru" translate="no">Орехов, Борис (2022). «Словарь русских писателей XVIII века: сеть персоналий». Репозиторий открытых данных по русской литературе и фольклору. V1. <a href="https://doi.org/10.31860/openlit-2022.1-B002" target="_blank" rel="noreferrer">doi:10.31860/openlit-2022.1-B002</a>.</p>
  <p className="small"><span>원 관계망 데이터 이용 조건</span>{' · '}<a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noreferrer" translate="no">CC0 1.0</a></p>
  <p><span>제공된 원본 파일:</span> <code>Persons_EDGES.csv</code>, <code>Persons_links.tsv</code>, <code>Readme.md</code>.</p>
  <h4>ИРЛИ의 원 관계도</h4>
  <p lang="ru" translate="no"><a href="https://nevmenandr.github.io/rus-dict18-persons/" target="_blank" rel="noreferrer">Персоналии в Словаре русских писателей XVIII века ↗</a><br/>Лаборатория цифровых исследований литературы и фольклора, Институт русской литературы (Пушкинский Дом) РАН.</p>
  <a className="small" href="https://pushkinskijdom.ru/laboratoriya-tsifrovyh-issledovanij-literatury-i-folklora_/proekty-v-rabote/" target="_blank" rel="noreferrer">ИРЛИ 공식 프로젝트 안내 ↗</a>
  <h4>이번 프로젝트의 재구성</h4>
  <p className="about-credit"><ProjectCredit allNames/></p>
  <p>원 관계망 780명·4,440개 참조에서 선정된 104인의 내부 참조 1,438개를 표시합니다. 참조 방향은 보존하고 자기 자신으로 향하는 선은 제외했습니다.</p>
  <p>본 프로젝트는 104인 범위의 관계도 배치와 탐색 화면을 새로 구성하고, 사전 근거를 연결한 인물·교육 정보와 다국어 화면을 추가했습니다. 원 관계망 데이터의 제작은 위 출처에 귀속됩니다.</p>
  <p className="muted small">관계선은 사전 항목 간 참조이며, 실제 교류·친분·영향 관계를 그 자체로 입증하지 않습니다.</p>
</section>}
