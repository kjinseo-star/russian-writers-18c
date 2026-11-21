import cytoscape from 'cytoscape';
import {readFile, writeFile} from 'node:fs/promises';
const data=JSON.parse(await readFile('dist/app-data.json','utf8'));
const graph=cytoscape({headless:true, styleEnabled:false, elements:[
  ...data.people.map((p,i)=>({data:{id:p.id}, position:{x:Math.cos(i*2.39996323)*Math.sqrt(i+1)*55,y:Math.sin(i*2.39996323)*Math.sqrt(i+1)*55}})),
  ...data.edges.map(e=>({data:e}))
]});
graph.layout({name:'cose',animate:false,randomize:false,nodeRepulsion:()=>200000,idealEdgeLength:()=>110,gravity:0.15,numIter:1600,initialTemp:150,coolingFactor:0.96,minTemp:1}).run();
const xs=graph.nodes().map(n=>n.position('x')), ys=graph.nodes().map(n=>n.position('y'));
const minX=Math.min(...xs), maxX=Math.max(...xs), minY=Math.min(...ys), maxY=Math.max(...ys);
const positions=Object.fromEntries(graph.nodes().map(n=>[n.id(),{
  x:Math.round(((n.position('x')-minX)/(maxX-minX)*920-460)*100)/100,
  y:Math.round(((n.position('y')-minY)/(maxY-minY)*680-340)*100)/100
}]));
// Keep node circles separated after fitting the layout into the presentation area.
const maxDegree=Math.max(...data.people.map(p=>p.internalDegree));
const radii=Object.fromEntries(data.people.map(p=>[p.id,(18+p.internalDegree/maxDegree*26)/2]));
for(let pass=0;pass<120;pass++){
  let moved=false;
  for(let i=0;i<data.people.length;i++)for(let j=i+1;j<data.people.length;j++){
    const a=positions[data.people[i].id], b=positions[data.people[j].id];
    const dx=b.x-a.x, dy=b.y-a.y, distance=Math.hypot(dx,dy)||0.001;
    const min=radii[data.people[i].id]+radii[data.people[j].id]+10;
    if(distance<min){const push=(min-distance)/2+0.01;a.x-=dx/distance*push;a.y-=dy/distance*push;b.x+=dx/distance*push;b.y+=dy/distance*push;moved=true;}
  }
  if(!moved)break;
}
// Place the seven initial labels close to their nodes without overlapping one another.
const labels=[];
const prominent=[...data.people].sort((a,b)=>b.internalDegree-a.internalDegree).slice(0,7);
for(const p of prominent){
  const center=positions[p.id], radius=radii[p.id], width=p.name.length*8.4+8, height=22;
  let best;
  for(const [sx,sy] of [[0,-1],[0,1],[-1,0],[1,0],[-1,-1],[1,-1],[-1,1],[1,1]]){
    const dx=sx*(radius+width/2+7),dy=sy*(radius+height/2+7);
    const box={x:center.x+dx-width/2,y:center.y+dy-height/2,w:width,h:height};
    const overlap=labels.filter(b=>box.x<b.x+b.w+4&&box.x+box.w+4>b.x&&box.y<b.y+b.h+4&&box.y+box.h+4>b.y).length;
    const blocked=data.people.filter(other=>{if(other.id===p.id)return false;const o=positions[other.id];return o.x+radii[other.id]>box.x&&o.x-radii[other.id]<box.x+box.w&&o.y+radii[other.id]>box.y&&o.y-radii[other.id]<box.y+box.h;}).length;
    const score=overlap*1000+blocked*10+Math.hypot(dx,dy)/100;
    if(!best||score<best.score)best={dx,dy,box,score};
  }
  center.labelX=best.dx;center.labelY=best.dy;labels.push(best.box);
}
await writeFile('src/graph-layout.json',JSON.stringify(positions)+'\n');
graph.destroy();
console.log(`Saved stable positions for ${Object.keys(positions).length} people.`);
