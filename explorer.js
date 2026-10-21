"use strict";
// DEMO ONLY. All row values, advances, and historical multipliers are synthetic.
(()=>{
const $=id=>document.getElementById(id),fmt=n=>new Intl.NumberFormat("es-EC",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);
const rows=[
["Distribución","BID","Modernización de redes","PROC-001",950000,740000,580000,32000],
["Distribución","Recursos propios","Modernización de redes","PROC-002",900000,710000,540000,25000],
["Infraestructura","CAF","Infraestructura de subestaciones","PROC-003",1350000,990000,630000,76000],
["Infraestructura","Recursos propios","Infraestructura de subestaciones","PROC-004",750000,520000,330000,29000],
["Comercial","BID","Medición inteligente","PROC-005",600000,490000,320000,24000],
["Comercial","Recursos propios","Medición inteligente","PROC-006",370000,310000,190000,11000],
["Distribución","CAF","Rehabilitación de alimentadores","PROC-007",800000,640000,390000,34000],
["Distribución","Recursos propios","Rehabilitación de alimentadores","PROC-008",650000,490000,360000,18000]
].map(([area,source,project,process,budget,committed,accrued,advance])=>({area,source,project,process,budget,committed,accrued,advance}));
const factor={9:[1,1],10:[1.02,1.12],11:[1.04,1.22],12:[1.055,1.32]},labels={total:"Empresa",area:"Área",source:"Fuente de financiamiento",project:"Proyecto",process:"Proceso"};
let view="total";
const choice={area:$("ex-area"),source:$("ex-source"),project:$("ex-project")};
function selected(){return Object.fromEntries(Object.entries(choice).map(([k,el])=>[k,el.value]));}
function subset(exclude){const s=selected();return rows.filter(r=>Object.entries(s).every(([k,v])=>k===exclude||v==="all"||r[k]===v));}
function options(key){const el=choice[key],old=el.value;const values=[...new Set(subset(key).map(r=>r[key]))].sort((a,b)=>a.localeCompare(b,"es"));el.replaceChildren();const all=document.createElement("option");all.value="all";all.textContent={area:"Todas las áreas",source:"Todas las fuentes",project:"Todos los proyectos"}[key];el.append(all);for(const v of values){const o=document.createElement("option");o.value=v;o.textContent=v;el.append(o);}el.value=values.includes(old)?old:"all";}
function sync(){for(const key of Object.keys(choice))options(key);}
function sums(data,cut){const [b,d]=factor[cut];return data.reduce((a,r)=>({budget:a.budget+r.budget*b,committed:a.committed+r.committed,accrued:a.accrued+r.accrued*d,advance:a.advance+r.advance}),{budget:0,committed:0,accrued:0,advance:0});}
const rate=v=>v.budget?100*v.accrued/v.budget:0;
function svgNode(svg,tag,attrs){const el=document.createElementNS("http://www.w3.org/2000/svg",tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));svg.append(el);return el;}
function chart(data){const svg=$("ex-trend");svg.replaceChildren();const series=[9,10,11,12].map(m=>sums(data,m)),max=Math.max(1,...series.map(v=>v.budget))*1.12,w=520,h=230,l=24,r=14,t=15,b=30;const x=i=>l+i*(w-l-r)/3,y=n=>h-b-n/max*(h-t-b);
for(let i=0;i<5;i++){const yy=t+i*(h-t-b)/4;svgNode(svg,"line",{x1:l,y1:yy,x2:w-r,y2:yy,stroke:"#25566c","stroke-dasharray":"3 8"});}
for(const [key,color] of [["budget","#5ad6f5"],["accrued","#7bf2c5"]]){const pts=series.map((v,i)=>[x(i),y(v[key])]);const d=pts.map(([px,py],i)=>(i?"L":"M")+px+" "+py).join(" ");const path=svgNode(svg,"path",{d,stroke:color,fill:"none","stroke-width":3,"stroke-linejoin":"round",class:"telemetry-line"});path.style.setProperty("--path-length",String(path.getTotalLength()));pts.forEach(([cx,cy])=>svgNode(svg,"circle",{cx,cy,r:3.5,fill:color}));}
["SEP","OCT","NOV","DIC"].forEach((m,i)=>{const t=svgNode(svg,"text",{x:x(i),y:h-8,fill:"#9ac2d3","font-size":12,"text-anchor":"middle"});t.textContent=m;});}
function button(text,click,cls){const b=document.createElement("button");b.type="button";b.textContent=text;b.className=cls;b.addEventListener("click",click);return b;}

let viz="treemap",trail=[];
const pathLevels=()=> $("ex-path").value==="source"?["source","area","project","process"]:["area","source","project","process"];
function viewKey(){const order=pathLevels();return trail.length>=order.length?"process":order[trail.length];}
function scoped(){return subset().filter(r=>trail.every(p=>r[p.key]===p.value));}
function selectGroup(key,value){trail.push({key,value});view=trail.length>=pathLevels().length?"process":viewKey();render();}
function jumpTo(key,value,target){if(key){trail.push({key,value});}view=target;render();}
function makeGroups(data,key){if(!key)return [{name:"CNEL EP · Unidad Esmeraldas",data}];return [...new Set(data.map(r=>r[key]))].map(name=>({name,data:data.filter(r=>r[key]===name)})).sort((a,b)=>sums(b.data,9).budget-sums(a.data,9).budget);}
function breadcrumbs(){const el=$("ex-breadcrumb");el.replaceChildren();el.append(button("◉ EMPRESA",()=>{trail=[];view="total";render();},"exv-crumb"));for(const [i,p] of trail.entries()){el.append(button("› "+p.value,()=>{trail=trail.slice(0,i+1);view=viewKey();render();},"exv-crumb"));}}
function treemap(data,key,cut){
 const el=$("ex-map");el.replaceChildren();
 const groups=makeGroups(data,key),total=Math.max(sums(data,cut).budget,1);
 const compact=n=>new Intl.NumberFormat("es-EC",{notation:"compact",maximumFractionDigits:2}).format(n);
 const metric=(label,value)=>{const box=document.createElement("span");box.className="exv-metric";const t=document.createElement("span");t.textContent=label;const v=document.createElement("b");v.textContent=value;box.append(t,v);return box;};
 for(const [i,g] of groups.entries()){
  const a=sums(g.data,cut),percent=rate(a),projects=new Set(g.data.map(r=>r.project)).size,processes=new Set(g.data.map(r=>r.process)).size;
  const tile=document.createElement("div");tile.className="exv-tile exv-tile-rich";
  tile.style.flexGrow=String(Math.max(1,100*a.budget/total));
  tile.style.flexBasis=groups.length===1?"100%":groups.length>6?"21%":"30%";
  tile.style.background=["linear-gradient(145deg,#104e65,#0b293a)","linear-gradient(145deg,#143f63,#0b243a)","linear-gradient(145deg,#13565b,#0b2938)"][i%3];
  tile.title=g.name+"\nCodificado: "+fmt(a.budget)+"\nDevengado: "+fmt(a.accrued)+"\n% devengado: "+percent.toFixed(1)+"%\nProyectos: "+projects+"\nProcesos: "+processes;
  const heading=document.createElement("span");heading.className="exv-tile-heading";heading.textContent=g.name;
  const amounts=document.createElement("span");amounts.className="exv-tile-amounts";
  amounts.append(metric("CODIFICADO",fmt(a.budget)),metric("DEVENGADO",fmt(a.accrued)));
  const rateLine=document.createElement("span");rateLine.className="exv-tile-rate";const rateLabel=document.createElement("span");rateLabel.textContent="% DEVENGADO";const rateValue=document.createElement("strong");rateValue.textContent=percent.toFixed(1)+"%";rateLine.append(rateLabel,rateValue);
  const track=document.createElement("span");track.className="exv-tile-track";const fill=document.createElement("span");fill.style.width=Math.min(100,Math.max(0,percent))+"%";track.append(fill);
  const counts=document.createElement("span");counts.className="exv-tile-counts";
  const projectLink=button("PROYECTOS  ↗  "+projects,()=>jumpTo(key,g.name,"project"),"exv-count-link");const processLink=button("PROCESOS  ↗  "+processes,()=>jumpTo(key,g.name,"process"),"exv-count-link");projectLink.setAttribute("aria-label","Ver "+projects+" proyectos de "+g.name);processLink.setAttribute("aria-label","Ver "+processes+" procesos de "+g.name);counts.append(projectLink,processLink);
  const footer=document.createElement("span");footer.className="exv-tile-footer";footer.textContent=key==="process"?"DETALLE DEL PROCESO":"EXPLORAR SIGUIENTE NIVEL ↗";
  const explore=button(key==="process"?"VER PROCESO ↗":"EXPLORAR SIGUIENTE NIVEL ↗",()=>{if(key)selectGroup(key,g.name);else{view=viewKey();render();}},"exv-explore-link");tile.append(heading,amounts,rateLine,track,counts,explore);el.append(tile);
 }
}
function sankey(data,cut){const el=$("ex-sankey");el.replaceChildren();const order=pathLevels();const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");svg.setAttribute("viewBox","0 0 960 380");svg.setAttribute("role","img");svg.setAttribute("aria-label","Flujo de presupuesto codificado desde fuente y área hasta proyecto y proceso");el.append(svg);
const layers=order.map(key=>makeGroups(data,key).slice(0,12).map(g=>({...g,key,value:sums(g.data,cut).budget})));const total=Math.max(sums(data,cut).budget,1),positions=[];
for(let col=0;col<layers.length;col++){let yy=25;const items=layers[col],available=330-items.length*8;positions[col]=[];for(const item of items){const height=Math.max(9,item.value/total*Math.max(available,100));positions[col].push({item,x:20+col*235,y:yy,height});yy+=height+8;}}
for(let col=0;col<positions.length-1;col++){for(const left of positions[col])for(const right of positions[col+1]){const intersection=data.filter(r=>r[left.item.key]===left.item.name&&r[right.item.key]===right.item.name);const value=sums(intersection,cut).budget;if(!value)continue;const weight=Math.max(1,value/total*34);const x1=left.x+145,x2=right.x,y1=left.y+left.height/2,y2=right.y+right.height/2;svgNode(svg,"path",{d:"M"+x1+" "+y1+" C"+(x1+40)+" "+y1+" "+(x2-40)+" "+y2+" "+x2+" "+y2,fill:"none",stroke:col%2?"#73f1ce":"#46c7ee","stroke-width":weight,opacity:".22",class:"exv-flow"});}}
for(const column of positions)for(const p of column){const g=svgNode(svg,"g",{role:"button",tabindex:"0",class:"exv-flow-node","aria-label":p.item.name+" "+fmt(p.item.value)});const rect=svgNode(g,"rect",{x:p.x,y:p.y,width:145,height:p.height,rx:2,fill:"#125069",stroke:"#4fd6e9","stroke-width":1});const title=svgNode(g,"text",{x:p.x+7,y:p.y+Math.min(16,p.height-2),fill:"#e3faff","font-size":10});title.textContent=p.item.name.length>21?p.item.name.slice(0,19)+"…":p.item.name;const go=()=>{const key=p.item.key;if(key==="source"||key==="area"||key==="project"){choice[key].value=p.item.name;trail=[];view=key==="project"?"process":key==="source"?"area":"project";}else{trail=[];view="process";}render();};g.addEventListener("click",go);g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();go();}});}
}
function render(){sync();const cut=Number($("ex-cut").value),data=scoped(),v=sums(data,cut),order=pathLevels();const key=view==="total"?null:view;$("ex-budget").textContent=fmt(v.budget);$("ex-committed").textContent=fmt(v.committed);$("ex-accrued").textContent=fmt(v.accrued);$("ex-advance").textContent=fmt(v.accrued+v.advance);$("ex-rate").textContent=rate(v).toFixed(1)+"%";
$("ex-context").textContent=["CNEL EP · ESMERALDAS",...trail.map(p=>p.value),...Object.entries(selected()).filter(([k,val])=>val!=="all").map(([k,val])=>val)].join(" / ");
$("ex-period").textContent="CORTE DEMO · "+({9:"SEP",10:"OCT",11:"NOV",12:"DIC"}[cut])+" 2026";
document.querySelectorAll(".exv-tab").forEach(b=>{const on=b.dataset.exview===view;b.classList.toggle("active",on);b.setAttribute("aria-pressed",String(on));});document.querySelectorAll(".exv-viz-btn").forEach(b=>{const on=b.dataset.exviz===viz;b.classList.toggle("active",on);b.setAttribute("aria-pressed",String(on));});
breadcrumbs();$("ex-title").textContent=viz==="treemap"?"Mapa jerárquico · "+(key?labels[key]:"Empresa"):"Flujo financiero · Sankey";$("ex-table-title").textContent="Detalle por "+(key?labels[key]:"Empresa");$("ex-column").textContent=key?labels[key]:"Empresa";
$("ex-map").hidden=viz!=="treemap";$("ex-sankey").hidden=viz!=="sankey";if(viz==="treemap")treemap(data,key,cut);else sankey(data,cut);
const body=$("ex-rows");body.replaceChildren();for(const g of makeGroups(data,key)){const a=sums(g.data,cut),tr=document.createElement("tr");for(const cell of [g.name,fmt(a.budget),fmt(a.committed),fmt(a.accrued),fmt(a.accrued+a.advance),rate(a).toFixed(1)+"%"]){const td=document.createElement("td");td.textContent=cell;tr.append(td);}const td=document.createElement("td");if(key&&trail.length<4)td.append(button("EXPLORAR →",()=>selectGroup(key,g.name),"exv-link"));else td.textContent="—";tr.append(td);body.append(tr);}
chart(data);$("ex-back").disabled=!trail.length&&view==="total";
}
for(const [key,el] of Object.entries(choice))el.addEventListener("change",()=>{trail=[];if(key!=="project")choice.project.value="all";render();});
$("ex-cut").addEventListener("change",render);$("ex-path").addEventListener("change",()=>{trail=[];view="total";render();});
document.querySelectorAll(".exv-tab").forEach(b=>b.addEventListener("click",()=>{trail=[];view=b.dataset.exview;render();}));
document.querySelectorAll(".exv-viz-btn").forEach(b=>b.addEventListener("click",()=>{viz=b.dataset.exviz;render();}));
$("ex-home").addEventListener("click",()=>{for(const el of Object.values(choice))el.value="all";trail=[];view="total";render();});
$("ex-back").addEventListener("click",()=>{if(trail.length){trail.pop();view=trail.length?viewKey():"total";}else view="total";render();});
render();
})();
