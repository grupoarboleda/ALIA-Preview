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

const paneTrails={area:[],source:[]};let activePane="area";
const paneOrder={area:["area","project","process"],source:["source","area","project","process"]};
const filterBy=(rows,conditions)=>rows.filter(r=>conditions.every(p=>r[p.key]===p.value));
const focusPath=()=>paneTrails[activePane];
function drillPane(pane,key,value){
 if(!key)return;
 // A selection in either branch becomes the single shared analytical context.
 // Clear the opposite trail to avoid stale, contradictory filters.
 if(activePane!==pane)paneTrails[activePane]=[];
 paneTrails[pane].push({key,value});
 activePane=pane;
 override=null;
 render();
}
function goBack(pane){
 if(activePane!==pane){activePane=pane;paneTrails[pane]=[];}
 else paneTrails[pane].pop();
 override=null;render();
}
function goHome(){paneTrails.area=[];paneTrails.source=[];activePane="area";override=null;render();}
function renderPanes(){
 const focus=focusPath();
 for(const pane of ["area","source"]){
  const own=paneTrails[pane],isFocused=pane===activePane;
  const path=isFocused?own:[],levels=paneOrder[pane],level=levels[path.length];
  const filtered=filterBy(records,focus);
  const root=$("ex-tree-"+pane),crumb=$("ex-path-"+pane);
  root.replaceChildren();crumb.replaceChildren();
  const back=$("ex-back-"+pane);
  if(back)back.disabled=!isFocused||!own.length;
  const rootLabel=pane==="area"?"EMPRESA / ÁREAS":"EMPRESA / FINANCIAMIENTO";
  const rootButton=button(rootLabel,()=>{if(pane===activePane)goBackTo(pane,0);else{paneTrails[activePane]=[];activePane=pane;render();}},"exv-pane-crumb");
  crumb.append(rootButton);
  if(isFocused)own.forEach((p,i)=>crumb.append(button("› "+p.value,()=>goBackTo(pane,i+1),"exv-pane-crumb")));
  else if(focus.length){const indicator=document.createElement("span");indicator.className="exv-cross-context";indicator.textContent="FILTRADO POR "+focus.map(p=>p.value).join(" / ");crumb.append(indicator);}
  const items=groups(filtered,level),total=Math.max(sum(filtered,cut()).budget,1);
  if(!items.length){const empty=document.createElement("p");empty.className="exv-empty";empty.textContent="Sin registros para la selección actual.";root.append(empty);}
  for(const item of items){
   const v=sum(item.rows,cut()),p=percent(v);
   const projects=new Set(item.rows.map(r=>r.project)).size,processes=new Set(item.rows.map(r=>r.process)).size;
   const card=button("",()=>drillPane(pane,level,item.value),"exv-node exv-node-click");
   card.disabled=!level;
   card.setAttribute("aria-label",item.value+": codificado "+money(v.budget)+", devengado "+money(v.accrued)+". Abrir siguiente nivel");
   card.style.flexGrow=String(Math.max(1,v.budget/total*100));
   card.style.flexBasis=items.length>4?"39%":"43%";
   const name=document.createElement("strong");name.textContent=item.value;
   const values=document.createElement("span");values.className="exv-node-values";
   for(const [label,value] of [["CODIFICADO",money(v.budget)],["DEVENGADO",money(v.accrued)]]){
    const part=document.createElement("span"),small=document.createElement("small"),num=document.createElement("b");
    small.textContent=label;num.textContent=value;part.append(small,num);values.append(part);
   }
   const summary=document.createElement("span");summary.className="exv-node-summary";summary.textContent=p.toFixed(1)+"% DEVENGADO";
   const bar=document.createElement("span");bar.className="exv-node-bar";const fill=document.createElement("span");fill.style.width=Math.min(100,Math.max(0,p))+"%";bar.append(fill);
   const foot=document.createElement("span");foot.className="exv-node-foot";
   foot.textContent=projects+" PROYECTO"+(projects===1?"":"S")+" · "+processes+" PROCESO"+(processes===1?"":"S")+(level?"   ↗":"");
   card.append(name,values,summary,bar,foot);root.append(card);
  }
  $("ex-pane-"+pane).classList.toggle("is-active",isFocused);
 }
}
function goBackTo(pane,length){paneTrails[pane]=paneTrails[pane].slice(0,length);activePane=pane;override=null;render();}
let override=null;
function render(requested){if(requested)override=requested;syncFilters();const currentPath=paneTrails[activePane],rs=filterBy(records,currentPath),c=cut(),v=sum(rs,c),level=override||paneOrder[activePane][currentPath.length];$("ex-root-budget").textContent=money(sum(records,c).budget);
$("ex-budget").textContent=money(v.budget);$("ex-committed").textContent=money(v.committed);$("ex-accrued").textContent=money(v.accrued);$("ex-advance").textContent=money(v.accrued+v.advance);$("ex-rate").textContent=percent(v).toFixed(1)+"%";
renderPanes();
$("ex-context").textContent=["CNEL EP · ESMERALDAS",...currentPath.map(p=>p.value),...Object.values(crossSelections).filter(Boolean).map(p=>"FILTRO "+p.value)].join(" / ");$("ex-period").textContent="CORTE DEMO · "+({9:"SEP",10:"OCT",11:"NOV",12:"DIC"}[c])+" 2026";
const crumbs=$("ex-breadcrumb");crumbs.replaceChildren();crumbs.append(button("◉ EMPRESA",()=>{branch=null;trail=[];override=null;render();},"exv-crumb"));if(branch)crumbs.append(button(branch==="source"?"FINANCIAMIENTO":"ÁREAS",()=>{trail=[];override=null;render();},"exv-crumb"));trail.forEach((p,i)=>crumbs.append(button("› "+p.value,()=>{trail=trail.slice(0,i+1);override=null;render();},"exv-crumb")));
$("ex-title").textContent=level?"Mapa jerárquico · "+names[level]:"Presupuesto total codificado";$("ex-table-title").textContent=level?"Detalle por "+names[level]:"Consolidado de empresa";$("ex-column").textContent=level?names[level]:"Empresa";
const list=groups(rs,level),map=$("ex-map"),body=$("ex-rows");map.replaceChildren();body.replaceChildren();for(const g of list){map.append(tile(g,level,v.budget));const a=sum(g.rows,c),tr=document.createElement("tr");for(const cell of [g.value,money(a.budget),money(a.committed),money(a.accrued),money(a.accrued+a.advance),percent(a).toFixed(1)+"%"]){const td=document.createElement("td");td.textContent=cell;tr.append(td);}const td=document.createElement("td");if(level)td.append(button("EXPLORAR →",()=>{override=null;enter(level,g.value);},"exv-link"));tr.append(td);body.append(tr);}
renderChart(rs);$("ex-back").disabled=!paneTrails[activePane].length&&!override;$("ex-sankey").hidden=true;$("ex-map").hidden=false;
}
for(const pane of ["area","source"]){
 $("ex-reset-"+pane).addEventListener("click",goHome);
 $("ex-back-"+pane).addEventListener("click",()=>goBack(pane));
}
$("ex-home").addEventListener("click",goHome);
$("ex-back").addEventListener("click",()=>goBack(activePane));
$("ex-cut").addEventListener("change",render);
for(const id of ["ex-area","ex-source","ex-project"])$(id).addEventListener("change",render);
render();
})();
