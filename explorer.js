"use strict";
// ALIA Preview: ALL figures and dates are synthetic. No official matrix is exposed.
(()=>{
const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat("es-EC",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);
const records=[
["Distribución","BID","Modernización de redes","PROC-001",950000,740000,580000,32000],
["Distribución","Recursos propios","Modernización de redes","PROC-002",900000,710000,540000,25000],
["Infraestructura","CAF","Infraestructura de subestaciones","PROC-003",1350000,990000,630000,76000],
["Infraestructura","Recursos propios","Infraestructura de subestaciones","PROC-004",750000,520000,330000,29000],
["Comercial","BID","Medición inteligente","PROC-005",600000,490000,320000,24000],
["Comercial","Recursos propios","Medición inteligente","PROC-006",370000,310000,190000,11000],
["Distribución","CAF","Rehabilitación de alimentadores","PROC-007",800000,640000,390000,34000],
["Distribución","Recursos propios","Rehabilitación de alimentadores","PROC-008",650000,490000,360000,18000]
].map(([area,source,project,process,budget,committed,accrued,advance])=>({area,source,project,process,budget,committed,accrued,advance}));
const factors={9:[1,1],10:[1.02,1.12],11:[1.04,1.22],12:[1.055,1.32]};
const names={source:"Fuente de financiamiento",area:"Área",project:"Proyecto",process:"Proceso"};
let branch=null,trail=[];
const hierarchy=()=>branch==="source"?["source","area","project","process"]:["area","project","process"];
const cut=()=>Number($("ex-cut").value);
const sum=(rs,c)=>rs.reduce((v,r)=>({budget:v.budget+r.budget*factors[c][0],committed:v.committed+r.committed,accrued:v.accrued+r.accrued*factors[c][1],advance:v.advance+r.advance}),{budget:0,committed:0,accrued:0,advance:0});
const percent=v=>v.budget?100*v.accrued/v.budget:0;
const button=(label,fn,cls)=>{const b=document.createElement("button");b.type="button";b.textContent=label;b.className=cls;b.addEventListener("click",fn);return b;};
const scoped=()=>records.filter(r=>trail.every(p=>r[p.key]===p.value)&&["area","source","project"].every(k=>$( {area:"ex-area",source:"ex-source",project:"ex-project"}[k]).value==="all"||r[k]===$({area:"ex-area",source:"ex-source",project:"ex-project"}[k]).value));
const groups=(rs,key)=>key?[...new Set(rs.map(r=>r[key]))].map(value=>({value,rows:rs.filter(r=>r[key]===value)})).sort((a,b)=>sum(b.rows,cut()).budget-sum(a.rows,cut()).budget):[{value:"CNEL EP · Unidad Esmeraldas",rows:rs}];
const svg=(root,tag,props)=>{const e=document.createElementNS("http://www.w3.org/2000/svg",tag);for(const [k,v] of Object.entries(props))e.setAttribute(k,String(v));root.append(e);return e;};
function next(){return branch?hierarchy()[trail.length]:null;}
function enter(key,value){if(!key)return;override=null;trail.push({key,value});render();}
function selectBranch(value){branch=value;trail=[];render();}
function syncFilters(){for(const key of ["area","source","project"]){const el=$({area:"ex-area",source:"ex-source",project:"ex-project"}[key]),old=el.value;const allowed=records.filter(r=>trail.every(p=>r[p.key]===p.value)&&["area","source","project"].every(k=>k===key||$({area:"ex-area",source:"ex-source",project:"ex-project"}[k]).value==="all"||r[k]===$({area:"ex-area",source:"ex-source",project:"ex-project"}[k]).value));const vals=[...new Set(allowed.map(r=>r[key]))].sort((a,b)=>a.localeCompare(b,"es"));el.replaceChildren();const all=document.createElement("option");all.value="all";all.textContent={area:"Todas las áreas",source:"Todas las fuentes",project:"Todos los proyectos"}[key];el.append(all);for(const value of vals){const o=document.createElement("option");o.value=value;o.textContent=value;el.append(o);}el.value=vals.includes(old)?old:"all";}}
function renderChart(rs){const root=$("ex-trend");root.replaceChildren();const series=[9,10,11,12].map(m=>sum(rs,m)),max=Math.max(1,...series.map(s=>s.budget))*1.1,x=i=>25+i*155,y=n=>200-n/max*175;for(let i=0;i<5;i++)svg(root,"line",{x1:25,x2:505,y1:25+i*44,y2:25+i*44,stroke:"#26556b","stroke-dasharray":"4 7"});for(const [field,color] of [["budget","#5bdaf7"],["accrued","#80f4c6"]]){const pts=series.map((v,i)=>[x(i),y(v[field])]);const p=svg(root,"path",{d:pts.map(([a,b],i)=>(i?"L":"M")+a+" "+b).join(" "),stroke:color,"stroke-width":3,fill:"none"});pts.forEach(([cx,cy])=>svg(root,"circle",{cx,cy,r:4,fill:color}));}["SEP","OCT","NOV","DIC"].forEach((m,i)=>{const t=svg(root,"text",{x:x(i),y:225,fill:"#98c4d4","font-size":12,"text-anchor":"middle"});t.textContent=m;});}
function tile(g,key,total){const a=sum(g.rows,cut()),rate=percent(a),projects=new Set(g.rows.map(r=>r.project)).size,processes=new Set(g.rows.map(r=>r.process)).size;const el=document.createElement("div");el.className="exv-tile exv-tile-rich";el.style.flexGrow=String(Math.max(1,a.budget/Math.max(total,1)*100));el.style.flexBasis="30%";el.style.background="linear-gradient(145deg,#104b65,#0a2739)";
const heading=document.createElement("b");heading.className="exv-tile-heading";heading.textContent=g.value;
const amounts=document.createElement("div");amounts.className="exv-tile-amounts";for(const [label,val] of [["CODIFICADO",money(a.budget)],["DEVENGADO",money(a.accrued)]]){const box=document.createElement("span");box.className="exv-metric";const t=document.createElement("span");t.textContent=label;const v=document.createElement("b");v.textContent=val;box.append(t,v);amounts.append(box);}
const r=document.createElement("div");r.className="exv-tile-rate";const label=document.createElement("span");label.textContent="% DEVENGADO";const value=document.createElement("strong");value.textContent=rate.toFixed(1)+"%";r.append(label,value);const track=document.createElement("span");track.className="exv-tile-track";const fill=document.createElement("span");fill.style.width=Math.max(0,Math.min(rate,100))+"%";track.append(fill);
const counts=document.createElement("div");counts.className="exv-tile-counts";counts.append(button("PROYECTOS ↗ "+projects,()=>{if(key)trail.push({key,value:g.value});$("ex-project").value="all";render("project");},"exv-count-link"),button("PROCESOS ↗ "+processes,()=>{if(key)trail.push({key,value:g.value});render("process");},"exv-count-link"));
const explore=button(key?"EXPLORAR SIGUIENTE NIVEL ↗":"SELECCIONA UNA RAMA ARRIBA ↗",()=>enter(key,g.value),"exv-explore-link");el.append(heading,amounts,r,track,counts,explore);return el;}

const paneTrails={area:[],source:[]},paneOverrides={area:null,source:null},crossSelections={area:null,source:null};let activePane="area";
const opposite=p=>p==="area"?"source":"area";
function otherFilter(pane){const other=opposite(pane),selection=crossSelections[other];return selection?[selection]:[];}
function filterBy(rs,conditions){return rs.filter(r=>conditions.every(p=>r[p.key]===p.value));}
function selectCross(pane,key,value){activePane=pane;const prev=crossSelections[pane];crossSelections[pane]=prev&&prev.key===key&&prev.value===value?null:{key,value};render();}
const paneOrder={area:["area","project","process"],source:["source","area","project","process"]};
function renderPanes(){
 for(const pane of ["area","source"]){
  const path=paneTrails[pane],levels=paneOrder[pane],level=paneOverrides[pane]||levels[path.length],root=$("ex-tree-"+pane),crumb=$("ex-path-"+pane);
  const filtered=filterBy(records,[...path,...otherFilter(pane)]);
  root.replaceChildren();crumb.replaceChildren();
  crumb.append(button(pane==="area"?"EMPRESA / ÁREAS":"EMPRESA / FINANCIAMIENTO",()=>{paneTrails[pane]=[];paneOverrides[pane]=null;activePane=pane;render();},"exv-pane-crumb"));
  path.forEach((p,i)=>crumb.append(button("› "+p.value,()=>{paneTrails[pane]=path.slice(0,i+1);paneOverrides[pane]=null;activePane=pane;render();},"exv-pane-crumb")));
  const items=groups(filtered,level),total=Math.max(sum(filtered,cut()).budget,1);
  if(!items.length){const empty=document.createElement("p");empty.className="exv-empty";empty.textContent="Sin registros para esta combinación. Limpia un filtro para continuar.";root.append(empty);}
  for(const item of items){
   const v=sum(item.rows,cut()),p=percent(v),projects=new Set(item.rows.map(r=>r.project)).size,processes=new Set(item.rows.map(r=>r.process)).size;
   const card=document.createElement("div");card.className="exv-node";card.classList.toggle("cross-selected",!!crossSelections[pane]&&crossSelections[pane].key===level&&crossSelections[pane].value===item.value);card.style.flexGrow=String(Math.max(1,v.budget/total*100));card.style.flexBasis=items.length>4?"39%":"43%";
   const name=document.createElement("strong");name.textContent=item.value;
   const values=document.createElement("div");values.className="exv-node-values";
   for(const [label,value] of [["CODIFICADO",money(v.budget)],["DEVENGADO",money(v.accrued)]]){const part=document.createElement("span");const small=document.createElement("small");small.textContent=label;const num=document.createElement("b");num.textContent=value;part.append(small,num);values.append(part);}
   const bar=document.createElement("div");bar.className="exv-node-bar";const fill=document.createElement("span");fill.style.width=Math.min(100,Math.max(0,p))+"%";bar.append(fill);
   const summary=document.createElement("div");summary.className="exv-node-summary";summary.textContent=p.toFixed(1)+"% DEVENGADO";
   const actions=document.createElement("div");actions.className="exv-node-actions";
   const drill=()=>{activePane=pane;if(level)paneTrails[pane].push({key:level,value:item.value});paneOverrides[pane]=null;render();};
   const jump=target=>{activePane=pane;const base=[...path];if(level)base.push({key:level,value:item.value});paneTrails[pane]=base;paneOverrides[pane]=target;render(target);};
   if(level){const sel=button(crossSelections[pane]&&crossSelections[pane].key===level&&crossSelections[pane].value===item.value?"✓ FILTRANDO":"◎ SELECCIONAR",()=>selectCross(pane,level,item.value),"exv-node-action exv-node-select");sel.setAttribute("aria-pressed",String(!!crossSelections[pane]&&crossSelections[pane].key===level&&crossSelections[pane].value===item.value));actions.append(sel);actions.append(button("ABRIR ↗",drill,"exv-node-action"));actions.append(button("PROYECTOS "+projects,()=>jump("project"),"exv-node-action"));actions.append(button("PROCESOS "+processes,()=>jump("process"),"exv-node-action"));}
   card.append(name,values,summary,bar,actions);root.append(card);
  }
  $("ex-pane-"+pane).classList.toggle("is-active",activePane===pane);
 }
}
let override=null;
function render(requested){if(requested)override=requested;syncFilters();const currentPath=paneTrails[activePane],rs=filterBy(records,[...currentPath,...otherFilter(activePane)]),c=cut(),v=sum(rs,c),level=override||paneOrder[activePane][currentPath.length];$("ex-root-budget").textContent=money(sum(records,c).budget);
$("ex-budget").textContent=money(v.budget);$("ex-committed").textContent=money(v.committed);$("ex-accrued").textContent=money(v.accrued);$("ex-advance").textContent=money(v.accrued+v.advance);$("ex-rate").textContent=percent(v).toFixed(1)+"%";
renderPanes();
$("ex-context").textContent=["CNEL EP · ESMERALDAS",...currentPath.map(p=>p.value),...Object.values(crossSelections).filter(Boolean).map(p=>"FILTRO "+p.value)].join(" / ");$("ex-period").textContent="CORTE DEMO · "+({9:"SEP",10:"OCT",11:"NOV",12:"DIC"}[c])+" 2026";
const crumbs=$("ex-breadcrumb");crumbs.replaceChildren();crumbs.append(button("◉ EMPRESA",()=>{branch=null;trail=[];override=null;render();},"exv-crumb"));if(branch)crumbs.append(button(branch==="source"?"FINANCIAMIENTO":"ÁREAS",()=>{trail=[];override=null;render();},"exv-crumb"));trail.forEach((p,i)=>crumbs.append(button("› "+p.value,()=>{trail=trail.slice(0,i+1);override=null;render();},"exv-crumb")));
$("ex-title").textContent=level?"Mapa jerárquico · "+names[level]:"Presupuesto total codificado";$("ex-table-title").textContent=level?"Detalle por "+names[level]:"Consolidado de empresa";$("ex-column").textContent=level?names[level]:"Empresa";
const list=groups(rs,level),map=$("ex-map"),body=$("ex-rows");map.replaceChildren();body.replaceChildren();for(const g of list){map.append(tile(g,level,v.budget));const a=sum(g.rows,c),tr=document.createElement("tr");for(const cell of [g.value,money(a.budget),money(a.committed),money(a.accrued),money(a.accrued+a.advance),percent(a).toFixed(1)+"%"]){const td=document.createElement("td");td.textContent=cell;tr.append(td);}const td=document.createElement("td");if(level)td.append(button("EXPLORAR →",()=>{override=null;enter(level,g.value);},"exv-link"));tr.append(td);body.append(tr);}
renderChart(rs);$("ex-back").disabled=!paneTrails[activePane].length&&!override;$("ex-sankey").hidden=true;$("ex-map").hidden=false;
}
for(const pane of ["area","source"])$("ex-reset-"+pane).addEventListener("click",()=>{paneTrails[pane]=[];paneOverrides[pane]=null;crossSelections[pane]=null;activePane=pane;override=null;render();});
$("ex-home").addEventListener("click",()=>{paneTrails.area=[];paneTrails.source=[];paneOverrides.area=null;paneOverrides.source=null;crossSelections.area=null;crossSelections.source=null;activePane="area";override=null;render();});
$("ex-back").addEventListener("click",()=>{if(override)override=null;else paneTrails[activePane].pop();paneOverrides[activePane]=null;render();});
$("ex-cut").addEventListener("change",()=>render());
for(const id of ["ex-area","ex-source","ex-project"])$(id).addEventListener("change",()=>render());
render();
})();
