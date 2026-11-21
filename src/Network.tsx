import {h} from './i18n';
import React, {useEffect, useRef, useState} from 'react';
import cytoscape from 'cytoscape';
import positions from './graph-layout.json';
import {Icon} from './Evidence';
import {type Data, type Person, visibleEdges} from './model';

export default function Network({data, people, selected, onSelect, labels}: {
  data:Data; people:Person[]; selected:string; onSelect:(id:string)=>void; labels:boolean;
}) {
  const container=useRef<HTMLDivElement>(null);
  const graph=useRef<cytoscape.Core|null>(null);
  const selectRef=useRef(onSelect);
  selectRef.current=onSelect;
  const [hover,setHover]=useState('');
  const ids=people.map(p=>p.id).sort().join(',');
  const edges=visibleEdges(data.edges,people);

  useEffect(()=>{
    if (!container.current) return;
    const maxDegree=Math.max(...data.people.map(p=>p.internalDegree),1);
    const prominent=new Set([...data.people].sort((a,b)=>b.internalDegree-a.internalDegree).slice(0,7).map(p=>p.id));
    const instance=cytoscape({
      container:container.current,
      elements:[...data.people.map(p=>({data:{id:p.id,label:p.name,degree:p.internalDegree,labelX:positions[p.id].labelX??0,labelY:positions[p.id].labelY??24},position:positions[p.id],classes:prominent.has(p.id)?'prominent':''})), ...data.edges.map(e=>({data:e}))],
      layout:{name:'preset',fit:true,padding:65},
      style:[
        {selector:'node',style:{'background-color':'#6f9990','border-width':1.5,'border-color':'#fafbf8',width:`mapData(degree, 0, ${maxDegree}, 18, 44)`,height:`mapData(degree, 0, ${maxDegree}, 18, 44)`,label:'','font-family':'Georgia, serif','font-size':15,color:'#263d37','text-valign':'bottom','text-margin-y':6,'text-background-color':'#f9faf7','text-background-opacity':0.9,'text-background-padding':'3px','overlay-opacity':0}},
        {selector:'edge',style:{width:0.7,'line-color':'#76948a','target-arrow-color':'#76948a','target-arrow-shape':'none','curve-style':'bezier',opacity:0.065}},
        {selector:'node.prominent, node.show-label, node.hovered',style:{label:'data(label)'}},
        {selector:'node.prominent',style:{'text-valign':'center','text-margin-x':element=>element.data('labelX'),'text-margin-y':element=>element.data('labelY')}},
        {selector:'.muted',style:{opacity:0.17}},
        {selector:'edge.muted',style:{opacity:0.018}},
        {selector:'node.neighbor',style:{'background-color':'#6e9c90',opacity:1}},
        {selector:'edge.focused',style:{'line-color':'#628b7d','target-arrow-color':'#497363','target-arrow-shape':'triangle','arrow-scale':0.7,width:1.25,opacity:0.8,'z-index':3}},
        {selector:'node.chosen',style:{label:'data(label)','background-color':'#245b4c','border-color':'#e3bf72','border-width':4,'font-size':17,'font-weight':'bold',opacity:1,'z-index':10}},
        {selector:'node.hovered',style:{'border-color':'#245b4c','border-width':3,'z-index':11}},
      ],
      minZoom:0.15,maxZoom:4,wheelSensitivity:0.2,boxSelectionEnabled:false,
      autounselectify:true,
    });
    instance.on('tap','node',event=>selectRef.current(event.target.id()));
    instance.on('tap',event=>{if(event.target===instance)selectRef.current('');});
    instance.on('mouseover','node',event=>{event.target.addClass('hovered');setHover(event.target.data('label'));if(container.current)container.current.style.cursor='pointer';});
    instance.on('mouseout','node',event=>{event.target.removeClass('hovered');setHover('');if(container.current)container.current.style.cursor='grab';});
    graph.current=instance;
    const observer=new ResizeObserver(()=>{instance.resize();instance.fit(instance.elements(':visible'),55);});
    observer.observe(container.current);
    return()=>{observer.disconnect();graph.current=null;instance.destroy();};
  },[data]);

  useEffect(()=>{
    const instance=graph.current;
    if (!instance) return;
    const visible=new Set(ids.split(','));
    instance.batch(()=>{
      instance.nodes().forEach(n=>{n.style('display',visible.has(n.id())?'element':'none');});
      instance.edges().forEach(e=>{e.style('display',visible.has(e.source().id())&&visible.has(e.target().id())?'element':'none');});
    });
    instance.fit(instance.elements(':visible'),55);
    setHover('');
  },[ids]);

  useEffect(()=>{
    const instance=graph.current;
    if (!instance) return;
    instance.batch(()=>{
      instance.elements().removeClass('chosen neighbor muted focused show-label');
      if(labels)instance.nodes().addClass('show-label');
      if(selected) {
        const node=instance.getElementById(selected);
        if(node.length&&node.visible()) {
          instance.elements().addClass('muted');
          node.closedNeighborhood().removeClass('muted');
          node.neighborhood('node').addClass('neighbor');
          node.connectedEdges().addClass('focused');
          node.addClass('chosen');
        }
      }
    });
  },[selected,labels,ids]);

  const zoom=(factor:number)=>{
    const instance=graph.current;
    if(instance)instance.zoom({level:instance.zoom()*factor,renderedPosition:{x:instance.width()/2,y:instance.height()/2}});
  };
  return <section className="network-view" aria-label="104인 사전 참조 관계도">
    <div ref={container} className="network-canvas" role="img" aria-label={`${people.length}명의 인물과 ${edges.length}개의 방향성 사전 참조. 이름 검색이나 인물 목록으로도 인물을 선택할 수 있습니다.`}/>
    <p className="canvas-hint" aria-live="polite">{hover?<span lang="ru">{hover}</span>:selected?'강조된 선은 선택 인물의 사전 참조입니다.':'인물을 누르거나, 이름으로 찾아보세요.'}</p>
    <div className="graph-legend"><span className="legend-dots"><i/><i/></span>크기: 104인 내부 연결수</div>
    <div className="zoom-tools" aria-label="관계도 확대와 축소">
      <button aria-label="관계도 축소" onClick={()=>zoom(1/1.25)}>−</button>
      <button aria-label="관계도 확대" onClick={()=>zoom(1.25)}>+</button>
      <button className="fit-button" onClick={()=>graph.current?.fit(graph.current.elements(':visible'),55)}><Icon name="reset" size={15}/>화면에 맞추기</button>
    </div>
  </section>;
}
