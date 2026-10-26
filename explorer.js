"use strict";
// ALIA Preview: DEMO is synthetic; REAL data is loaded only from local localhost importer.
(()=>{
const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat("es-EC",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);
let realMode=false;
let records=[
["Distribución","BID","Modernización de redes","PROC-001",950000,740000,580000,32000],
["Distribución","Recursos propios","Modernización de redes","PROC-002",900000,710000,540000,25000],
["Infraestructura","CAF","Infraestructura de subestaciones","PROC-003",1350000,990000,630000,76000],
["Infraestructura","Recursos propios","Infraestructura de subestaciones","PROC-004",750000,520000,330000,29000],
["Comercial","BID","Medición inteligente","PROC-005",600000,490000,320000,24000],
["Comercial","Recursos propios","Medición inteligente","PROC-006",370000,310000,190000,11000],
["Distribución","CAF","Rehabilitación de alimentadores","PROC-007",800000,640000,390000,34000],
["Distribución","Recursos propios","Rehabilitación de alimentadores","PROC-008",650000,490000,360000,18000]
].map(([area,source,project,process,budget,committed,accrued,advance])=>({area,source,project,process,contract:"CT-DEMO-"+process.slice(-3),budget,committed,accrued,advance}));
const factors={9:[1,1],10:[1.02,1.12],11:[1.04,1.22],12:[1.055,1.32]};
const names={source:"Fuente de financiamiento",area:"Área",project:"Proyecto",process:"Proceso"};
let branch=null,trail=[];
const hierarchy=()=>branch==="source"?["source","area","project","process"]:["area","project","process"];
const cut=()=>Number($("ex-cut").value);
const sum=(rs,c)=>rs.reduce((v,r)=>({budget:v.budget+r.budget*(realMode?1:factors[c][0]),committed:v.committed+r.committed,accrued:v.accrued+r.accrued*(realMode?1:factors[c][1]),advance:v.advance+r.advance}),{budget:0,committed:0,accrued:0,advance:0});
const percent=v=>v.budget?100*v.accrued/v.budget:0;
const distinctCodes=(rows,kind)=>{
 const field=kind==="project"?"project_code":"process_code";
 const fallback=kind==="project"?"project":"process";
 const codes=rows.map(r=>r[field]??(!realMode?r[fallback]:""))
  .map(value=>String(value??"").trim().toUpperCase())
  .filter(value=>value&&value!=="0"&&!value.startsWith("SIN "));
 return new Set(codes).size;
};
const button=(label,fn,cls)=>{const b=document.createElement("button");b.type="button";b.textContent=label;b.className=cls;b.addEventListener("click",fn);return b;};
const scoped=()=>records.filter(r=>trail.every(p=>r[p.key]===p.value)&&["area","source","project"].every(k=>$( {area:"ex-area",source:"ex-source",project:"ex-project"}[k]).value==="all"||r[k]===$({area:"ex-area",source:"ex-source",project:"ex-project"}[k]).value));
const groups=(rs,key)=>key?[...new Set(rs.map(r=>r[key]))].map(value=>({value,rows:rs.filter(r=>r[key]===value)})).sort((a,b)=>sum(b.rows,cut()).budget-sum(a.rows,cut()).budget):[{value:"CNEL EP · Unidad Esmeraldas",rows:rs}];
const svg=(root,tag,props)=>{const e=document.createElementNS("http://www.w3.org/2000/svg",tag);for(const [k,v] of Object.entries(props))e.setAttribute(k,String(v));root.append(e);return e;};
function next(){return branch?hierarchy()[trail.length]:null;}
function enter(key,value){if(!key)return;override=null;trail.push({key,value});render();}
function selectBranch(value){branch=value;trail=[];render();}
function syncFilters(){for(const key of ["area","source","project"]){const el=$({area:"ex-area",source:"ex-source",project:"ex-project"}[key]),old=el.value;const allowed=records.filter(r=>trail.every(p=>r[p.key]===p.value)&&["area","source","project"].every(k=>k===key||$({area:"ex-area",source:"ex-source",project:"ex-project"}[k]).value==="all"||r[k]===$({area:"ex-area",source:"ex-source",project:"ex-project"}[k]).value));const vals=[...new Set(allowed.map(r=>r[key]))].sort((a,b)=>a.localeCompare(b,"es"));el.replaceChildren();const all=document.createElement("option");all.value="all";all.textContent={area:"Todas las áreas",source:"Todas las fuentes",project:"Todos los proyectos"}[key];el.append(all);for(const value of vals){const o=document.createElement("option");o.value=value;o.textContent=value;el.append(o);}el.value=vals.includes(old)?old:"all";}}
function renderChart(rs){const root=$("ex-trend");root.replaceChildren();const series=[9,10,11,12].map(m=>sum(rs,m)),max=Math.max(1,...series.map(s=>s.budget))*1.1,x=i=>25+i*155,y=n=>200-n/max*175;for(let i=0;i<5;i++)svg(root,"line",{x1:25,x2:505,y1:25+i*44,y2:25+i*44,stroke:"#26556b","stroke-dasharray":"4 7"});for(const [field,color] of [["budget","#5bdaf7"],["accrued","#80f4c6"]]){const pts=series.map((v,i)=>[x(i),y(v[field])]);const p=svg(root,"path",{d:pts.map(([a,b],i)=>(i?"L":"M")+a+" "+b).join(" "),stroke:color,"stroke-width":3,fill:"none"});pts.forEach(([cx,cy])=>svg(root,"circle",{cx,cy,r:4,fill:color}));}["SEP","OCT","NOV","DIC"].forEach((m,i)=>{const t=svg(root,"text",{x:x(i),y:225,fill:"#98c4d4","font-size":12,"text-anchor":"middle"});t.textContent=m;});}
function tile(g,key,total){const a=sum(g.rows,cut()),rate=percent(a),projects=distinctCodes(g.rows,"project"),processes=distinctCodes(g.rows,"process");const el=document.createElement("div");el.className="exv-tile exv-tile-rich";el.style.flexGrow=String(Math.max(1,a.budget/Math.max(total,1)*100));el.style.flexBasis="30%";el.style.background="linear-gradient(145deg,#104b65,#0a2739)";
const heading=document.createElement("b");heading.className="exv-tile-heading";heading.textContent=g.value;
const amounts=document.createElement("div");amounts.className="exv-tile-amounts";for(const [label,val] of [["CODIFICADO",money(a.budget)],["DEVENGADO",money(a.accrued)]]){const box=document.createElement("span");box.className="exv-metric";const t=document.createElement("span");t.textContent=label;const v=document.createElement("b");v.textContent=val;box.append(t,v);amounts.append(box);}
const r=document.createElement("div");r.className="exv-tile-rate";const label=document.createElement("span");label.textContent="% DEVENGADO";const value=document.createElement("strong");value.textContent=rate.toFixed(1)+"%";r.append(label,value);const track=document.createElement("span");track.className="exv-tile-track";const fill=document.createElement("span");fill.style.width=Math.max(0,Math.min(rate,100))+"%";track.append(fill);
const counts=document.createElement("div");counts.className="exv-tile-counts";counts.append(button("PROYECTOS ↗ "+projects,()=>{if(key)trail.push({key,value:g.value});$("ex-project").value="all";render("project");},"exv-count-link"),button("PROCESOS ↗ "+processes,()=>{if(key)trail.push({key,value:g.value});render("process");},"exv-count-link"));
const explore=button(key?"EXPLORAR SIGUIENTE NIVEL ↗":"SELECCIONA UNA RAMA ARRIBA ↗",()=>enter(key,g.value),"exv-explore-link");el.append(heading,amounts,r,track,counts,explore);return el;}

const paneTrails={area:[],source:[]};let activePane="area";let selectedFunding=null;
const fundingScope=rows=>rows.filter(r=>
 (!selectedFunding||r.source===selectedFunding)&&
 (["area","source","project"].every(key=>{
  const el=$({area:"ex-area",source:"ex-source",project:"ex-project"}[key]);
  return !el||el.value==="all"||r[key]===el.value;
 }))
);
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
function goHome(){
 paneTrails.area=[];paneTrails.source=[];activePane="area";selectedFunding=null;override=null;
 for(const id of ["ex-area","ex-source","ex-project"])$(id).value="all";
 render();
}

// Budget-weighted project map and searchable ranking. Each row is a clickable drill target.
const projectControls={area:{query:"",sort:"gap",limit:10},source:{query:"",sort:"gap",limit:10}};
function buildManagementInsight(filtered,heading="LECTURA GERENCIAL · ¿DÓNDE INTERVENIR?"){
 const insight=document.createElement("section");insight.className="exv-management-insight";insight.setAttribute("aria-label","Análisis de prioridad gerencial");
 const baseline=sum(filtered,cut()),gaps=groups(filtered,"project").map(g=>({name:g.value,...sum(g.rows,cut())})).map(g=>({...g,gap:Math.max(0,g.budget-g.accrued)})).sort((a,b)=>b.gap-a.gap);
 const totalGap=gaps.reduce((n,g)=>n+g.gap,0),top3=gaps.slice(0,3),topGap=top3.reduce((n,g)=>n+g.gap,0);
 const insightTitle=document.createElement("h3");insightTitle.textContent=heading;
 const insightMetrics=document.createElement("div");insightMetrics.className="exv-management-metrics";
 // Independent budget gaps; a project/process can belong to both categories.
 const balanceRows=filtered.map(r=>{const v=sum([r],cut());return {...r,...v,uncommitted:Math.max(0,v.budget-v.committed),committed:Math.max(0,v.committed-v.accrued)};});
 const balances=[
  {label:"SALDO SIN COMPROMETER",type:"uncommitted",description:"Codificado − Comprometido"},
  {label:"SALDO SIN DEVENGAR",type:"committed",description:"Comprometido − Devengado"}
 ];
 const balanceStats=type=>{
  const eligible=balanceRows.filter(r=>r[type]>0);
  return {rows:eligible,amount:eligible.reduce((v,r)=>v+r[type],0),
   projects:new Set(eligible.map(r=>type==="uncommitted"?r.process:(r.contract||r.process))).size,
   processes:new Set(eligible.map(r=>r.process)).size};
 };

 const detail=document.createElement("section");detail.className="exv-balance-detail";detail.hidden=true;
 const detailHead=document.createElement("div");detailHead.className="exv-balance-detail-head";
 const detailTitle=document.createElement("strong");
 const closeDetail=button("✕ CERRAR",()=>{detail.hidden=true;insightMetrics.querySelectorAll("button").forEach(b=>b.setAttribute("aria-expanded","false"));},"exv-balance-close");
 detailHead.append(detailTitle,closeDetail);
 const detailTable=document.createElement("div");detailTable.className="exv-balance-table";
 detail.append(detailHead,detailTable);
 function showBalance(type,label){
  detail.hidden=false;detailTitle.textContent=label+" · TOP 5 "+(type==="uncommitted"?"PROCESOS":"CONTRATOS");detailTable.replaceChildren();
  insightMetrics.querySelectorAll("button").forEach(b=>b.setAttribute("aria-expanded",String(b.dataset.balance===type)));
  const entries=balanceStats(type).rows;
  const byProject=new Map();
  for(const r of entries){const entity=type==="uncommitted"?r.process:(r.contract||r.process);if(!byProject.has(entity))byProject.set(entity,[]);byProject.get(entity).push(r);}
  const ranking=[...byProject].map(([project,rows])=>({project,rows,total:rows.reduce((v,r)=>v+r[type],0)})).sort((a,b)=>b.total-a.total);
  const note=document.createElement("p");note.className="exv-balance-ranking-note";
  note.textContent=ranking.length+(type==="uncommitted"?" procesos":" contratos")+" con saldo · Prioridad por monto pendiente. Selecciona uno para ver su evolución.";
  detailTable.append(note);
  const rankingRoot=document.createElement("div");rankingRoot.className="exv-balance-ranking";detailTable.append(rankingRoot);
  let showAll=false;
  const paint=()=>{
   rankingRoot.replaceChildren();
   const shown=showAll?ranking:ranking.slice(0,5);
   for(const [i,{project,rows,total}] of shown.entries()){
    const current=managementDemoStatus(type,project,cut());
    const item=button("",()=>{
     selectedManagement={type,id:project};
     renderTemporal(fundingScope(filterBy(records,paneTrails[activePane])),cut());
     rankingRoot.querySelectorAll(".exv-management-item").forEach(b=>b.setAttribute("aria-pressed",String(b===item)));
    },"exv-management-item");
    item.setAttribute("aria-pressed",String(!!selectedManagement&&selectedManagement.type===type&&selectedManagement.id===project));
    const top=document.createElement("span");top.className="exv-management-item-top";
    const id=document.createElement("strong");id.textContent=String(i+1).padStart(2,"0")+" · "+project;
    const amount=document.createElement("strong");amount.textContent=money(total);
    top.append(id,amount);
    const bottom=document.createElement("span");bottom.className="exv-management-item-status";
    bottom.textContent=type==="uncommitted"
     ?current.stage+" · "+current.months+" reporte(s) en esta etapa"
     :"Devengado "+current.dev+"% · "+current.idle+" reporte(s) sin incremento";
    item.append(top,bottom);rankingRoot.append(item);
   }
   if(ranking.length>5){
    const more=button(showAll?"VER TOP 5":"VER TODOS LOS "+ranking.length+(type==="uncommitted"?" PROCESOS":" CONTRATOS"),()=>{showAll=!showAll;paint();},"exv-count-link");
    rankingRoot.append(more);
   }
   if(!ranking.length){const empty=document.createElement("p");empty.textContent="No hay saldos positivos en esta selección.";rankingRoot.append(empty);}
  };
  paint();
 }
 for(const {label,type,description} of balances){
  const stats=balanceStats(type),unit=type==="uncommitted"?"PROCESOS":"CONTRATOS";
  const card=document.createElement("button");card.type="button";card.className="exv-balance-action exv-balance-priority";card.dataset.balance=type;
  card.setAttribute("aria-expanded","false");card.title="Ver ranking de "+unit.toLowerCase();
  const small=document.createElement("small");small.textContent=label+" ↗";
  const strong=document.createElement("strong");strong.textContent=money(stats.amount);
  const counts=document.createElement("span");counts.className="exv-balance-counts";
  counts.textContent=stats.projects+" "+unit;
  const info=document.createElement("span");info.className="exv-balance-info";info.textContent="ⓘ";info.title="Ver definición y fórmula";info.setAttribute("role","button");info.tabIndex=0;
  info.setAttribute("aria-label","Información sobre "+label);
  const explanation=document.createElement("span");explanation.className="exv-balance-explanation";explanation.hidden=true;
  explanation.textContent=(type==="uncommitted"?"Presupuesto codificado todavía disponible para comprometer. ":"Compromisos registrados cuyo devengado aún está pendiente. ")+description+". El recuento utiliza códigos únicos, no filas de la matriz.";
  const toggleInfo=e=>{e.stopPropagation();explanation.hidden=!explanation.hidden;info.setAttribute("aria-expanded",String(!explanation.hidden));};
  info.addEventListener("click",toggleInfo);
  info.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();toggleInfo(e);}});
  card.append(small,strong,counts,info,explanation);
  card.addEventListener("click",()=>showBalance(type,label));insightMetrics.append(card);
 }
 insight.append(insightTitle,insightMetrics,detail);
 return {insight,baseline,gaps,totalGap,top3,topGap};
}
function projectExplorer(pane,root,items,filtered){
 const control=projectControls[pane],outer=document.createElement("section");outer.className="exv-project-explorer";
 const tools=document.createElement("div");tools.className="exv-project-toolbar";
 const heading=document.createElement("strong");heading.textContent="PROYECTOS CON MAYOR IMPACTO POTENCIAL · "+items.length;
 const search=document.createElement("input");search.type="search";search.placeholder="Buscar proyecto…";search.setAttribute("aria-label","Buscar proyecto");search.value=control.query;
 const sort=document.createElement("select");sort.setAttribute("aria-label","Ordenar proyectos");
 for(const [key,label] of [["gap","Mayor brecha de ejecución"],["budget","Mayor codificado"],["accrued","Mayor devengado"],["rate","Mayor % devengado"],["risk","Menor % devengado"]]){const option=document.createElement("option");option.value=key;option.textContent=label;sort.append(option);}sort.value=control.sort;
 const limit=document.createElement("select");limit.setAttribute("aria-label","Cantidad de proyectos");
 for(const [key,label] of [[10,"Top 10"],[20,"Top 20"],[0,"Todos"]]){const option=document.createElement("option");option.value=String(key);option.textContent=label;limit.append(option);}limit.value=String(control.limit);
 tools.append(heading,search,sort,limit);
 const map=document.createElement("div");map.className="exv-project-map";map.setAttribute("aria-label","Mapa de proyectos proporcional al presupuesto codificado");
 const {insight,baseline,gaps,totalGap,top3,topGap}=buildManagementInsight(filtered);

 const advice=document.createElement("p");advice.className="exv-management-advice";
 advice.textContent=top3.length&&topGap>0?"Mayor oportunidad de seguimiento: "+top3.map(g=>g.name).join(" · ")+". Concentran "+(100*topGap/totalGap).toFixed(1)+"% del saldo por devengar. Analizar por separado el saldo por comprometer y los compromisos pendientes de devengar.":"Sin brechas positivas de ejecución en la selección actual.";
 const scenario=document.createElement("div");scenario.className="exv-management-scenario";
 const scenarioLabel=document.createElement("label");scenarioLabel.textContent="SIMULACIÓN · ¿QUÉ PASARÍA SI SE DEVENGA PARTE DE LA BRECHA TOP 3?";
 const scenarioSlider=document.createElement("input");scenarioSlider.type="range";scenarioSlider.min="0";scenarioSlider.max="100";scenarioSlider.step="10";scenarioSlider.value="25";scenarioSlider.setAttribute("aria-label","Porcentaje de la brecha de los tres proyectos prioritarios que se podría devengar");
 const scenarioResult=document.createElement("output");scenarioResult.className="exv-management-result";
 const updateScenario=()=>{const ratio=Number(scenarioSlider.value)/100,increment=topGap*ratio,newRate=baseline.budget?100*(baseline.accrued+increment)/baseline.budget:0;scenarioResult.textContent=Math.round(ratio*100)+"% de la brecha top 3 → +"+money(increment)+" devengado potencial · Ejecución "+newRate.toFixed(1)+"%";};
 scenarioSlider.addEventListener("input",updateScenario);updateScenario();
 const disclaimer=document.createElement("small");disclaimer.className="exv-management-disclaimer";disclaimer.textContent="Escenario hipotético, no pronóstico. La brecha no equivale a atraso: validar cronograma, contratos y elegibilidad antes de decidir.";
 scenario.append(scenarioLabel,scenarioSlider,scenarioResult,disclaimer);insight.append(advice,scenario);
 const list=document.createElement("div");list.className="exv-project-ranking";
 const total=sum(filtered,cut()).budget;
 const view=()=>{
  map.replaceChildren();list.replaceChildren();
  const found=items.filter(g=>g.value.toLocaleLowerCase("es").includes(control.query.toLocaleLowerCase("es")));
  const sorted=[...found].sort((a,b)=>{
   const x=sum(a.rows,cut()),y=sum(b.rows,cut());
   return control.sort==="rate"?percent(y)-percent(x):control.sort==="risk"?percent(x)-percent(y):control.sort==="gap"?Math.max(0,y.budget-y.accrued)-Math.max(0,x.budget-x.accrued):y[control.sort]-x[control.sort];
  });
  const shown=control.limit?sorted.slice(0,control.limit):sorted;
  const visibleTotal=shown.reduce((n,g)=>n+sum(g.rows,cut()).budget,0);
  const header=document.createElement("p");header.className="exv-project-caption";
  header.textContent=shown.length+" de "+items.length+" proyectos · "+(total?((visibleTotal/total)*100).toFixed(1):"0.0")+"% del codificado de esta selección";
  map.append(header);
  // Horizontal proportional strips are easier to read than dozens of tiny cards.
  const strips=document.createElement("div");strips.className="exv-project-strips";
  const mapItems=[...shown].sort((a,b)=>sum(b.rows,cut()).budget-sum(a.rows,cut()).budget);
  for(const g of mapItems){
   const v=sum(g.rows,cut()),share=visibleTotal?100*v.budget/visibleTotal:0;
   const rect=button(g.value,()=>drillPane(pane,"project",g.value),"exv-project-rect");
   rect.style.flexGrow=String(Math.max(0.1,v.budget));rect.style.background=percent(v)<35?"#654c52":percent(v)<60?"#17556b":"#166a69";
   rect.title=g.value+" · Codificado "+money(v.budget)+" · Devengado "+money(v.accrued)+" · "+percent(v).toFixed(1)+"%";
   rect.setAttribute("aria-label",rect.title);
   if(share>=8)rect.textContent=g.value+" · "+share.toFixed(1)+"%";
   else rect.textContent=share.toFixed(0)+"%";
   strips.append(rect);
  }
  map.append(strips);
  if(!shown.length){const empty=document.createElement("p");empty.className="exv-empty";empty.textContent="No hay proyectos con ese nombre.";map.append(empty);}
  const listTitle=document.createElement("strong");listTitle.textContent="PRIORIDAD DE SEGUIMIENTO · BRECHA CODIFICADO − DEVENGADO";list.append(listTitle);
  for(const [i,g] of shown.entries()){
   const v=sum(g.rows,cut()),share=total?100*v.budget/total:0;
   const row=document.createElement("button");row.type="button";row.className="exv-project-row";
   row.addEventListener("click",()=>drillPane(pane,"project",g.value));
   row.setAttribute("aria-label","Abrir "+g.value);
   const rank=document.createElement("span");rank.textContent=String(i+1).padStart(2,"0");
   const title=document.createElement("span");title.className="exv-project-row-name";title.textContent=g.value;
   const amount=document.createElement("span");amount.textContent=money(v.budget);amount.title="Codificado";
   const rate=document.createElement("span");rate.textContent=percent(v).toFixed(1)+"% dev.";const gap=document.createElement("span");gap.className="exv-project-gap";gap.textContent=money(Math.max(0,v.budget-v.accrued))+" pendiente";
   const bar=document.createElement("span");bar.className="exv-project-row-bar";const fill=document.createElement("span");fill.style.width=share+"%";bar.append(fill);
   row.append(rank,title,amount,rate,gap,bar);list.append(row);
  }
 };
 search.addEventListener("input",()=>{control.query=search.value;view();});
 sort.addEventListener("change",()=>{control.sort=sort.value;view();});
 limit.addEventListener("change",()=>{control.limit=Number(limit.value);view();});
 outer.append(insight,tools,map,list);root.append(outer);view();
}
const fundingColors=["#32c6db","#74e8c5","#d6b66d","#8a9fe7","#db91ba","#88bdd6"];

// Barra proporcional única, con etiquetas externas para fuentes estrechas.
const aliaFundingStyle=document.createElement("style");
aliaFundingStyle.id="alia-funding-composition-v3";
aliaFundingStyle.textContent=`
#explorer .exv-funding-stack{display:flex!important;flex-direction:row!important;align-items:stretch!important;gap:0!important;height:120px!important;min-height:120px!important;padding:0!important;background:#102c3b!important;overflow:hidden!important;border:1px solid #376075}
#explorer .exv-funding-segment{position:relative;display:flex;flex-direction:column;justify-content:center;align-items:stretch;gap:7px;min-width:0;min-height:100%;padding:9px 8px;border:0;border-right:1px solid rgba(3,25,37,.3);border-radius:0;background:var(--funding-color);color:#072334;cursor:pointer;overflow:hidden;transition:filter .15s,box-shadow .15s}
#explorer .exv-funding-segment:hover{filter:brightness(1.08);z-index:1}
#explorer .exv-funding-segment[aria-pressed="true"]{box-shadow:inset 0 0 0 3px #e9fbff;z-index:2}
#explorer .exv-funding-segment:focus-visible{outline:3px solid #fff;outline-offset:-3px;z-index:3}
#explorer .exv-funding-segment-label{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:6px;font-size:clamp(10px,.75vw,13px);font-weight:800;overflow-wrap:anywhere;text-align:left}
#explorer .exv-funding-segment-execution{font-size:11px;font-weight:700;text-align:left;white-space:nowrap}
#explorer .exv-funding-segment-meter{height:5px;width:100%;background:rgba(2,30,45,.25);overflow:hidden}
#explorer .exv-funding-segment-meter>span{display:block;height:100%;background:#06334a}
#explorer .exv-funding-segment-compact{padding:0 3px!important;align-items:center;justify-content:center}
#explorer .exv-funding-segment-abbrev{font-size:clamp(9px,.75vw,12px);font-weight:900;white-space:nowrap;text-align:center;line-height:1}
#explorer .exv-funding-legend{display:flex!important;flex-wrap:wrap!important;gap:8px 18px!important;align-items:center!important;height:auto!important;min-height:0!important;padding:12px 4px!important}
#explorer .exv-funding-legend-item{display:inline-flex;align-items:center;gap:7px;padding:6px 7px;border:1px solid transparent;border-radius:5px;background:transparent;color:#cce8f2;cursor:pointer;font-size:11px;text-align:left}
#explorer .exv-funding-legend-item:hover,#explorer .exv-funding-legend-item[aria-pressed="true"]{border-color:#5edbd9;background:#153e4e}
#explorer .exv-funding-legend-dot{width:9px;height:9px;flex:0 0 9px;border-radius:2px}
#explorer .exv-funding-legend-note{flex-basis:100%;font-size:11px;color:#9bbdca}
`;
document.head.append(aliaFundingStyle);

function renderFundingComposition(rows){
 const track=$("ex-source-composition"),legend=$("ex-source-composition-legend"),totalNode=$("ex-composition-total");
 track.replaceChildren();legend.replaceChildren();
 track.classList.remove("exv-funding-list");legend.classList.remove("exv-funding-footnote");
 track.classList.add("exv-funding-stack");legend.classList.add("exv-funding-legend");
 const grouped=groups(rows,"source").map(g=>({g,figures:sum(g.rows,cut())}))
  .filter(x=>x.figures.budget>0).sort((a,b)=>b.figures.budget-a.figures.budget);
 const total=sum(rows,cut()).budget;
 totalNode.textContent="TOTAL "+money(total);
 if(!grouped.length){
  const empty=document.createElement("p");empty.textContent="Sin presupuesto para esta selección";
  track.append(empty);return;
 }
 for(const [i,{g,figures}] of grouped.entries()){
  const budget=figures.budget,share=total?100*budget/total:0;
  const execution=budget?100*figures.accrued/budget:0;
  const color=fundingColors[i%fundingColors.length];
  const select=()=>{selectedFunding=selectedFunding===g.value?null:g.value;override=null;render();};
  const description=g.value+" · Codificado "+money(budget)+" · "+share.toFixed(1)+"% del total · Devengado "+money(figures.accrued)+" ("+execution.toFixed(1)+"%)";
  const segment=document.createElement("button");segment.type="button";
  segment.className="exv-funding-segment"+(share<14?" exv-funding-segment-compact":"");
  segment.style.setProperty("--funding-color",color);
  segment.style.flex="0 0 "+share.toFixed(6)+"%";
  segment.setAttribute("aria-label","Filtrar por "+description);
  segment.setAttribute("aria-pressed",String(selectedFunding===g.value));
  segment.title=description;segment.addEventListener("click",select);
  // Fuentes medianas: tres letras; las diminutas se identifican en la leyenda.
  if(share>=14){
   const label=document.createElement("span");label.className="exv-funding-segment-label";
   const name=document.createElement("span");name.textContent=g.value;
   const percentage=document.createElement("span");percentage.textContent=share.toFixed(1)+"%";
   label.append(name,percentage);
   const executionLabel=document.createElement("span");executionLabel.className="exv-funding-segment-execution";
   executionLabel.textContent=execution.toFixed(1)+"% DEVENGADO";
   const meter=document.createElement("span");meter.className="exv-funding-segment-meter";
   const fill=document.createElement("span");fill.style.width=Math.max(0,Math.min(100,execution))+"%";meter.append(fill);
   segment.append(label,executionLabel,meter);
  }else if(share>=3){
   const abbrev=document.createElement("span");abbrev.className="exv-funding-segment-abbrev";
   abbrev.textContent=String(g.value).trim().slice(0,3).toUpperCase();
   segment.append(abbrev);
  }
  track.append(segment);
  const item=document.createElement("button");item.type="button";item.className="exv-funding-legend-item";
  item.setAttribute("aria-pressed",String(selectedFunding===g.value));
  item.title=description;item.setAttribute("aria-label","Filtrar por "+description);
  item.addEventListener("click",select);
  const dot=document.createElement("span");dot.className="exv-funding-legend-dot";dot.style.background=color;
  const caption=document.createElement("span");caption.textContent=g.value+" · "+money(budget)+" · "+share.toFixed(1)+"%";
  item.append(dot,caption);legend.append(item);
 }
 const note=document.createElement("span");note.className="exv-funding-legend-note";
 note.textContent="Selecciona un segmento o su leyenda para filtrar. Las fuentes pequeñas conservan su proporción sin etiquetas superpuestas.";
 legend.append(note);
}

// Las áreas usan tarjetas legibles, no un treemap con etiquetas verticales.
const aliaAreaStyle=document.createElement("style");
aliaAreaStyle.id="alia-area-cards-v2";
aliaAreaStyle.textContent=`
#explorer .exv-area-block-map{display:grid!important;grid-template-columns:minmax(0,2.2fr) minmax(230px,1fr)!important;grid-auto-rows:minmax(170px,auto)!important;gap:10px!important;align-items:stretch!important}
#explorer .exv-area-block-map .exv-area-block-primary{grid-row:span 2!important;min-height:350px!important;background:linear-gradient(145deg,#17536c,#0d3246)!important;border-color:#53cfe1!important}
#explorer .exv-area-block-map .exv-area-block:not(.exv-area-block-primary){min-height:170px!important}
#explorer .exv-area-block-map .exv-node-values{grid-template-columns:repeat(2,minmax(0,1fr))!important}
@media(max-width:950px){#explorer .exv-area-block-map{grid-template-columns:repeat(2,minmax(0,1fr))!important}#explorer .exv-area-block-map .exv-area-block-primary{grid-column:1/-1!important;grid-row:auto!important;min-height:205px!important}}
@media(max-width:560px){#explorer .exv-area-block-map{grid-template-columns:1fr!important}#explorer .exv-area-block-map .exv-area-block-primary{grid-column:auto!important;min-height:190px!important}}
#explorer .exv-area-card-grid{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(min(100%,255px),1fr))!important;gap:12px!important;height:auto!important;min-height:0!important;padding:10px 0!important;overflow:visible!important;align-items:stretch!important}
#explorer .exv-area-card-grid .exv-node{position:relative!important;left:auto!important;top:auto!important;width:auto!important;height:auto!important;min-height:185px!important;display:flex!important;flex-direction:column!important;align-items:stretch!important;justify-content:flex-start!important;gap:12px!important;padding:18px!important;overflow:hidden!important;border:1px solid #376277!important;border-radius:8px!important;text-align:left!important;word-break:normal!important;overflow-wrap:break-word!important;writing-mode:horizontal-tb!important}
#explorer .exv-area-card-grid .exv-node:hover{border-color:#65e0e6!important;background:#194c61!important}
#explorer .exv-area-card-grid .exv-node>strong{display:block!important;font-size:clamp(13px,1.1vw,17px)!important;line-height:1.3!important;letter-spacing:.02em!important;writing-mode:horizontal-tb!important;overflow-wrap:break-word!important}
#explorer .exv-area-card-grid .exv-node-values{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important;width:100%!important}
#explorer .exv-area-card-grid .exv-node-values>span{min-width:0!important;display:flex!important;flex-direction:column!important;gap:4px!important}
#explorer .exv-area-card-grid .exv-node-values b{font-size:clamp(12px,1vw,16px)!important;overflow-wrap:anywhere!important}
#explorer .exv-area-card-grid .exv-node-summary{font-size:11px!important;white-space:normal!important}
#explorer .exv-area-card-grid .exv-node-bar{width:100%!important;min-height:6px!important}
#explorer .exv-area-card-grid .exv-node-foot{margin-top:auto!important;position:static!important;white-space:normal!important;font-size:10px!important;line-height:1.5!important}
@media(max-width:700px){#explorer .exv-area-card-grid{grid-template-columns:1fr!important}}
`;
document.head.append(aliaAreaStyle);

const aliaAreaBarsStyle=document.createElement("style");
aliaAreaBarsStyle.textContent=`
#explorer .exv-area-bars{display:flex!important;flex-direction:column!important;gap:0!important;height:auto!important;min-height:0!important;padding:6px!important;background:#0a293a!important;border:1px solid #326078!important}
#explorer .exv-area-bars .exv-area-bar-row{display:grid!important;grid-template-columns:44px minmax(120px,200px) minmax(0,1fr) 60px!important;grid-template-rows:26px 22px!important;align-items:center!important;column-gap:12px!important;width:100%!important;height:auto!important;min-height:82px!important;padding:14px!important;border:0!important;border-bottom:1px solid #30556a!important;border-radius:0!important;background:transparent!important;overflow:visible!important;text-align:left!important}
#explorer .exv-area-bars .exv-area-bar-row:hover{background:#17475a!important}
#explorer .exv-area-bars .exv-area-bar-icon{grid-column:1;grid-row:1/3;display:grid;place-items:center;width:42px;height:42px;font-size:24px;border:1px solid #35cadb;border-radius:7px;background:#11465b}
#explorer .exv-area-bars .exv-area-bar-row>strong{grid-column:2;grid-row:1;font-size:13px!important;overflow-wrap:anywhere;writing-mode:horizontal-tb!important}
#explorer .exv-area-bars .exv-node-values{display:none!important}
#explorer .exv-area-bars .exv-node-summary{grid-column:4;grid-row:1/3;white-space:nowrap;font-size:14px!important;color:#80f2de;text-align:right}
#explorer .exv-area-bars .exv-node-bar{grid-column:3;grid-row:1/3;max-width:100%;min-width:1px;border-radius:2px;overflow:hidden}
#explorer .exv-area-bars .exv-node-foot{grid-column:2;grid-row:2;position:static!important;white-space:normal!important;font-size:10px!important;line-height:1.4!important;color:#a6c9d8}
@media(max-width:700px){#explorer .exv-area-bars .exv-area-bar-row{grid-template-columns:36px minmax(95px,145px) minmax(0,1fr) 48px!important;gap:7px!important;padding:9px!important}#explorer .exv-area-bars .exv-area-bar-icon{width:34px;height:34px;font-size:19px}#explorer .exv-area-bars .exv-node-summary{font-size:11px!important}}
`;
document.head.append(aliaAreaBarsStyle);


// Diseño aprobado: barras con iconos, codificado, devengado y porcentaje en columnas.
const aliaAreaApprovedStyle=document.createElement("style");
aliaAreaApprovedStyle.textContent=`
#explorer .exv-area-bars .exv-area-bar-row{grid-template-columns:44px minmax(110px,155px) minmax(100px,1fr) minmax(75px,100px) minmax(75px,100px) 65px!important;column-gap:10px!important}
#explorer .exv-area-bars .exv-node-values{display:contents!important}
#explorer .exv-area-bars .exv-node-values>span{display:flex!important;flex-direction:column!important;align-items:flex-end!important;justify-content:center!important;gap:4px!important;grid-row:1/3!important;min-width:0!important}
#explorer .exv-area-bars .exv-node-values>span:first-child{grid-column:4!important}
#explorer .exv-area-bars .exv-node-values>span:last-child{grid-column:5!important}
#explorer .exv-area-bars .exv-node-values small{font-size:9px!important;color:#9bc3d5!important}
#explorer .exv-area-bars .exv-node-values b{font-size:12px!important;white-space:nowrap!important;font-variant-numeric:tabular-nums!important}
#explorer .exv-area-bars .exv-node-summary{grid-column:6!important}
#explorer .exv-area-bars .exv-node-bar{grid-column:3!important}
@media(max-width:980px){#explorer .exv-area-bars .exv-area-bar-row{grid-template-columns:36px minmax(100px,135px) minmax(80px,1fr) 80px 80px 52px!important;gap:6px!important;padding:8px!important}#explorer .exv-area-bars .exv-node-values b{font-size:10px!important}}
@media(max-width:670px){#explorer .exv-area-bars .exv-area-bar-row{grid-template-columns:36px minmax(0,1fr) 70px 70px!important;grid-template-rows:auto auto auto!important}#explorer .exv-area-bars .exv-area-bar-icon{grid-column:1!important;grid-row:1!important}#explorer .exv-area-bars .exv-area-bar-row>strong{grid-column:2!important;grid-row:1!important}#explorer .exv-area-bars .exv-node-foot{grid-column:2!important;grid-row:2!important}#explorer .exv-area-bars .exv-node-bar{grid-column:1/4!important;grid-row:3!important}#explorer .exv-area-bars .exv-node-summary{grid-column:4!important;grid-row:3!important}#explorer .exv-area-bars .exv-node-values>span:first-child{grid-column:3!important;grid-row:1/3!important}#explorer .exv-area-bars .exv-node-values>span:last-child{grid-column:4!important;grid-row:1/3!important}}
`;
document.head.append(aliaAreaApprovedStyle);

const aliaAreaTotalsStyle=document.createElement("style");
aliaAreaTotalsStyle.textContent=`
#explorer .exv-area-approved-head{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 14px;border-bottom:1px solid #31586b}
#explorer .exv-area-approved-head>div{display:flex;flex-direction:column;gap:4px}
#explorer .exv-area-approved-head strong{font-size:15px;color:#e1f7ff}
#explorer .exv-area-approved-head small{font-size:11px;color:#9fc9db}
#explorer .exv-area-approved-legend{font-size:10px;color:#7fe5dd;white-space:pre-wrap}
#explorer .exv-area-approved-total{display:grid;grid-template-columns:minmax(160px,210px) minmax(100px,1fr) minmax(75px,100px) minmax(75px,100px) 65px;align-items:center;gap:10px;margin-top:10px;padding:14px;border:1px solid #36768c;border-radius:6px;background:#10394c}
#explorer .exv-area-approved-total-identity{display:flex;flex-direction:column;gap:5px}
#explorer .exv-area-approved-total-identity strong{font-size:14px}
#explorer .exv-area-approved-total-identity small{font-size:10px;color:#a9ccdc}
#explorer .exv-area-approved-total-bar{height:23px;background:#2a536d}
#explorer .exv-area-approved-total-bar>span{display:block;height:100%;background:linear-gradient(90deg,#30c6df,#6de8c8)}
#explorer .exv-area-approved-total>strong{text-align:right;font-size:12px;font-variant-numeric:tabular-nums}
#explorer .exv-area-approved-total>strong:last-child{color:#81f2de}
@media(max-width:980px){#explorer .exv-area-approved-total{grid-template-columns:minmax(110px,145px) minmax(70px,1fr) 80px 80px 52px;gap:6px;padding:9px}#explorer .exv-area-approved-total>strong{font-size:10px}}
@media(max-width:670px){#explorer .exv-area-approved-total{grid-template-columns:1fr 1fr;gap:10px}#explorer .exv-area-approved-total-identity{grid-column:1/-1}#explorer .exv-area-approved-total-bar{grid-column:1/-1}#explorer .exv-area-approved-legend{font-size:9px}}
`;
document.head.append(aliaAreaTotalsStyle);

const aliaAreaExecutionFix=document.createElement("style");
aliaAreaExecutionFix.textContent=`
#explorer .exv-area-bars .exv-node-bar{width:100%!important;max-width:100%!important;min-width:0!important;background:#2a536d!important}
#explorer .exv-area-bars .exv-node-bar>span{display:block!important;height:100%!important;background:#31c9dc!important}
#explorer .exv-area-approved-total-bar{background:#2a536d!important}
#explorer .exv-area-approved-total-bar>span{background:#31c9dc!important}
#explorer .exv-area-approved-legend{display:flex!important;align-items:center!important;flex-wrap:wrap!important;gap:14px!important;color:#b4d6e3!important}
#explorer .exv-area-approved-legend>span{display:inline-flex;align-items:center;gap:6px}
#explorer .exv-area-approved-legend i{display:inline-block;width:11px;height:11px;border-radius:2px}
#explorer .exv-area-legend-executed i{background:#31c9dc}
#explorer .exv-area-legend-pending i{background:#2a536d}
#explorer .exv-unit-management-trigger{display:flex!important;align-items:center!important;gap:16px!important}
#explorer .exv-global-icon{display:grid;place-items:center;flex:0 0 48px;width:48px;height:48px;border:1px solid #31d8e4;border-radius:10px;background:#104256;color:#57e8f1;font-size:35px;line-height:1}
@media(max-width:600px){#explorer .exv-global-icon{width:40px;height:40px;flex-basis:40px;font-size:28px}}
`;
document.head.append(aliaAreaExecutionFix);

const aliaReferenceIcons=document.createElement("style");
aliaReferenceIcons.textContent=`
#explorer .exv-global-icon{background:transparent!important;border:0!important;color:#41e5f1!important}
#explorer .exv-global-icon svg{display:block;filter:drop-shadow(0 0 5px rgba(37,211,232,.35))}
#explorer .exv-area-bars .exv-area-bar-icon.exv-area-icon-admin{color:#69e8ac!important;background:linear-gradient(145deg,#123d3c,#135642)!important;border-color:#4fdb9b!important}
#explorer .exv-area-icon-admin svg{display:block;max-width:80%;max-height:80%}
`;
document.head.append(aliaReferenceIcons);

const aliaBalancedTreemapStyle=document.createElement("style");
aliaBalancedTreemapStyle.textContent=`
#explorer .exv-balanced-treemap{position:relative!important;display:block!important;min-height:320px!important;height:340px!important;padding:0!important;border:1px solid #326078!important;background:#092537!important;overflow:hidden!important}
#explorer .exv-balanced-treemap .exv-area-approved-head{position:absolute!important;top:0;left:0;right:0;height:65px;z-index:2;background:#092537}
#explorer .exv-balanced-treemap .exv-area-block{position:absolute!important;top:65px!important;height:calc(100% - 65px)!important;min-height:0!important;display:flex!important;flex-direction:column!important;align-items:stretch!important;justify-content:center!important;gap:10px!important;padding:17px 14px!important;border:3px solid #092537!important;border-radius:7px!important;overflow:hidden!important;text-align:left!important;box-sizing:border-box!important;background:#124b64!important}
#explorer .exv-balanced-treemap .exv-area-block:nth-of-type(3n+2){background:#15546a!important}
#explorer .exv-balanced-treemap .exv-area-block:nth-of-type(3n+3){background:#16485b!important}
#explorer .exv-balanced-treemap .exv-area-block:hover{filter:brightness(1.15);border-color:#45d6e3!important}
#explorer .exv-balanced-treemap .exv-area-block>strong{font-size:clamp(11px,1.1vw,17px)!important;line-height:1.2!important;overflow-wrap:anywhere!important;writing-mode:horizontal-tb!important}
#explorer .exv-balanced-treemap .exv-area-block .exv-node-values{display:flex!important;flex-direction:column!important;gap:7px!important;min-width:0!important}
#explorer .exv-balanced-treemap .exv-area-block .exv-node-values>span{display:flex!important;flex-direction:column!important;align-items:flex-start!important;gap:3px!important}
#explorer .exv-balanced-treemap .exv-area-block .exv-node-values small{font-size:9px!important;color:#b2d6e4!important}
#explorer .exv-balanced-treemap .exv-area-block .exv-node-values b{font-size:clamp(11px,1.15vw,16px)!important;white-space:normal!important;overflow-wrap:anywhere!important}
#explorer .exv-balanced-treemap .exv-area-block .exv-node-summary{font-size:13px!important;color:#8bf1db!important}
#explorer .exv-balanced-treemap .exv-area-block .exv-node-bar{height:9px!important;flex-shrink:0!important}
#explorer .exv-balanced-treemap .exv-area-block .exv-node-foot{position:static!important;font-size:10px!important;line-height:1.4!important;overflow-wrap:anywhere!important;white-space:normal!important}
#explorer .exv-balanced-treemap .exv-area-bar-icon{display:grid!important;place-items:center!important;width:42px!important;height:42px!important;flex-shrink:0!important;font-size:23px!important;border:1px solid #35cadb!important;border-radius:7px!important;background:#10465b!important}
#explorer .exv-balanced-treemap .exv-area-icon-admin{color:#69e8ac!important;background:#145340!important;border-color:#4fdb9b!important}
@media(max-width:700px){#explorer .exv-balanced-treemap{height:auto!important;min-height:0!important;display:flex!important;flex-direction:column!important}#explorer .exv-balanced-treemap .exv-area-approved-head{position:static!important;height:auto!important}#explorer .exv-balanced-treemap .exv-area-block{position:static!important;width:100%!important;height:auto!important;min-height:160px!important;flex:1 1 auto!important}}
`;
document.head.append(aliaBalancedTreemapStyle);

const aliaStackedTreemapStyle=document.createElement("style");
aliaStackedTreemapStyle.textContent=`
#explorer .exv-balanced-treemap:has(.exv-treemap-main){height:455px!important}
#explorer .exv-balanced-treemap .exv-treemap-main{top:65px!important;height:calc(100% - 65px)!important}
#explorer .exv-balanced-treemap .exv-treemap-top{top:65px!important;height:calc((100% - 65px)/2)!important}
#explorer .exv-balanced-treemap .exv-treemap-bottom{top:calc(65px + (100% - 65px)/2)!important;height:calc((100% - 65px)/2)!important}
#explorer .exv-balanced-treemap .exv-treemap-top,#explorer .exv-balanced-treemap .exv-treemap-bottom{gap:5px!important;padding:12px 14px!important;justify-content:center!important}
#explorer .exv-balanced-treemap .exv-treemap-top .exv-area-bar-icon,#explorer .exv-balanced-treemap .exv-treemap-bottom .exv-area-bar-icon{width:32px!important;height:32px!important;font-size:19px!important}
#explorer .exv-balanced-treemap .exv-treemap-top>strong,#explorer .exv-balanced-treemap .exv-treemap-bottom>strong{font-size:14px!important;white-space:normal!important;word-break:normal!important;overflow-wrap:normal!important}
#explorer .exv-balanced-treemap .exv-treemap-top .exv-node-values,#explorer .exv-balanced-treemap .exv-treemap-bottom .exv-node-values{flex-direction:row!important;flex-wrap:wrap!important;gap:14px!important}
#explorer .exv-balanced-treemap .exv-treemap-top .exv-node-values>span,#explorer .exv-balanced-treemap .exv-treemap-bottom .exv-node-values>span{min-width:0!important;flex:1 1 90px!important}
#explorer .exv-balanced-treemap .exv-treemap-top .exv-node-values b,#explorer .exv-balanced-treemap .exv-treemap-bottom .exv-node-values b{font-size:13px!important;overflow-wrap:normal!important;word-break:normal!important}
#explorer .exv-balanced-treemap .exv-treemap-top .exv-node-bar,#explorer .exv-balanced-treemap .exv-treemap-bottom .exv-node-bar{height:7px!important}
#explorer .exv-balanced-treemap .exv-treemap-top .exv-node-foot,#explorer .exv-balanced-treemap .exv-treemap-bottom .exv-node-foot{font-size:9px!important}
@media(max-width:700px){#explorer .exv-balanced-treemap:has(.exv-treemap-main){height:auto!important}#explorer .exv-balanced-treemap .exv-treemap-main,#explorer .exv-balanced-treemap .exv-treemap-top,#explorer .exv-balanced-treemap .exv-treemap-bottom{top:auto!important;height:auto!important;min-height:175px!important}}
`;
document.head.append(aliaStackedTreemapStyle);

const aliaTreemapStandardBars=document.createElement("style");
aliaTreemapStandardBars.textContent=`
/* Barra uniforme: porcentaje de ejecución en turquesa y saldo pendiente en azul. */
#explorer .exv-balanced-treemap .exv-area-block .exv-node-bar{
 display:block!important;position:relative!important;width:100%!important;max-width:100%!important;
 height:9px!important;min-height:9px!important;flex:0 0 9px!important;
 margin:0!important;padding:0!important;border:0!important;border-radius:0!important;
 background:#082c3e!important;overflow:hidden!important;box-sizing:border-box!important
}
#explorer .exv-balanced-treemap .exv-area-block .exv-node-bar>span{
 display:block!important;height:100%!important;min-height:9px!important;margin:0!important;
 background:#62e5d2!important;border:0!important;border-radius:0!important
}
#explorer .exv-balanced-treemap .exv-treemap-top,
#explorer .exv-balanced-treemap .exv-treemap-bottom{
 display:grid!important;grid-template-columns:minmax(0,1fr)!important;
 grid-template-rows:32px auto auto 15px 9px auto!important;
 align-content:center!important;align-items:center!important;
 row-gap:5px!important;padding:10px 16px!important;overflow:hidden!important
}
#explorer .exv-balanced-treemap .exv-treemap-top .exv-area-bar-icon,
#explorer .exv-balanced-treemap .exv-treemap-bottom .exv-area-bar-icon{grid-row:1!important}
#explorer .exv-balanced-treemap .exv-treemap-top>strong,
#explorer .exv-balanced-treemap .exv-treemap-bottom>strong{grid-row:2!important;line-height:1.2!important}
#explorer .exv-balanced-treemap .exv-treemap-top .exv-node-values,
#explorer .exv-balanced-treemap .exv-treemap-bottom .exv-node-values{grid-row:3!important;min-height:0!important}
#explorer .exv-balanced-treemap .exv-treemap-top .exv-node-summary,
#explorer .exv-balanced-treemap .exv-treemap-bottom .exv-node-summary{grid-row:4!important}
#explorer .exv-balanced-treemap .exv-treemap-top .exv-node-bar,
#explorer .exv-balanced-treemap .exv-treemap-bottom .exv-node-bar{grid-row:5!important}
#explorer .exv-balanced-treemap .exv-treemap-top .exv-node-foot,
#explorer .exv-balanced-treemap .exv-treemap-bottom .exv-node-foot{grid-row:6!important}
@media(max-width:700px){
 #explorer .exv-balanced-treemap .exv-treemap-top,
 #explorer .exv-balanced-treemap .exv-treemap-bottom{min-height:190px!important}
}
`;
document.head.append(aliaTreemapStandardBars);

function renderPanes(){
 const focus=focusPath();
 for(const pane of ["area"]){
  const own=paneTrails[pane],isFocused=pane===activePane;
  const path=isFocused?own:[],levels=paneOrder[pane],level=levels[path.length];
  const filtered=fundingScope(filterBy(records,focus));
  const root=$("ex-tree-"+pane),crumb=$("ex-path-"+pane);
  root.replaceChildren();crumb.replaceChildren();
  root.parentElement.querySelectorAll(".exv-unit-management,.exv-unit-management-trigger,.exv-area-total-outside").forEach(el=>el.remove());
  const back=$("ex-back-"+pane);
  if(back)back.disabled=!isFocused||!own.length;
  const rootLabel=pane==="area"?"EMPRESA / ÁREAS":"EMPRESA / FINANCIAMIENTO";
  const rootButton=button(rootLabel,()=>{if(pane===activePane)goBackTo(pane,0);else{paneTrails[activePane]=[];activePane=pane;render();}},"exv-pane-crumb");
  crumb.append(rootButton);
  if(isFocused)own.forEach((p,i)=>crumb.append(button("› "+p.value,()=>goBackTo(pane,i+1),"exv-pane-crumb")));
  else if(focus.length){const indicator=document.createElement("span");indicator.className="exv-cross-context";indicator.textContent="FILTRADO POR "+focus.map(p=>p.value).join(" / ");crumb.append(indicator);}
  const allItems=groups(filtered,level);
  const areaMap=pane==="area"&&level==="area";
  const items=areaMap?allItems.filter(item=>sum(item.rows,cut()).budget>0):allItems;
  const total=Math.max(sum(filtered,cut()).budget,1);
  const treemap=areaMap;
  root.classList.toggle("exv-area-treemap",treemap);
  root.classList.toggle("exv-area-card-grid",false);
  root.classList.toggle("exv-area-block-map",false);
  root.classList.toggle("exv-area-bars",false);
  root.classList.toggle("exv-balanced-treemap",areaMap);
  if(pane==="area"&&level==="area"&&isFocused){
   const wrapper=root.parentElement;
   const trigger=button("",()=>{
    unitManagementOpen=!unitManagementOpen;
    trigger.setAttribute("aria-expanded",String(unitManagementOpen));
    trigger.querySelector(".exv-unit-trigger-arrow").textContent=unitManagementOpen?"▴":"▾";
    panel.hidden=!unitManagementOpen;
    root.hidden=unitManagementOpen;
    // Global is an explicit unit-wide selection for the temporal chart too.
    selectedManagement=null;
    renderTemporal(unitManagementOpen?records:filtered,cut());
   },"exv-unit-management-trigger");
   trigger.setAttribute("aria-expanded",String(unitManagementOpen));
   trigger.setAttribute("aria-controls","exv-unit-global-detail");
   const left=document.createElement("span");left.className="exv-unit-trigger-copy";
   const name=document.createElement("strong");name.textContent="GLOBAL · TODA LA UNIDAD";
   const globalIcon=document.createElement("span");globalIcon.className="exv-global-icon";globalIcon.innerHTML=`<svg viewBox="0 0 48 48" width="35" height="35" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="24" cy="24" r="15"/><circle cx="24" cy="24" r="10"/><circle cx="24" cy="24" r="4.5"/><path d="M24 3v11M24 34v11M3 24h11M34 24h11"/></svg>`;globalIcon.setAttribute("aria-hidden","true");
   const subtitle=document.createElement("small");subtitle.textContent="Saldos pendientes de procesos y contratos · Todas las áreas";
   left.append(name,subtitle);
   trigger.prepend(globalIcon);
   const arrow=document.createElement("span");arrow.className="exv-unit-trigger-arrow";arrow.textContent=unitManagementOpen?"▴":"▾";
   trigger.append(left,arrow);
   const panel=buildManagementInsight(filtered,"LECTURA GERENCIAL · TODA LA UNIDAD").insight;
   panel.id="exv-unit-global-detail";
   panel.classList.add("exv-unit-management");
   panel.hidden=!unitManagementOpen;
   root.hidden=unitManagementOpen;
   wrapper.insertBefore(trigger,root);
   wrapper.insertBefore(panel,root);
  }
  if(!(pane==="area"&&level==="area"&&isFocused))root.hidden=false;
  if(!items.length){const empty=document.createElement("p");empty.className="exv-empty";empty.textContent="Sin registros para la selección actual.";root.append(empty);}
  if(areaMap&&items.length){
   const header=document.createElement("div");header.className="exv-area-approved-head";
   const caption=document.createElement("div");caption.innerHTML="<strong>ÁREAS</strong><small>Comparación de presupuesto codificado y devengado</small>";
   const labels=document.createElement("span");labels.className="exv-area-approved-legend";
   labels.innerHTML='<span class="exv-area-legend-executed"><i></i>Devengado</span><span class="exv-area-legend-pending"><i></i>Pendiente de devengar</span>';
   header.append(caption,labels);root.append(header);
  }
  // Keep the managerial balances at area drill-down. Only the obsolete
  // project impact map, scenario slider and ranking were retired.
  if(pane==="area"&&level==="project"&&isFocused&&filtered.length){
   const areaName=path.find(p=>p.key==="area")?.value||"ÁREA";
   const management=buildManagementInsight(filtered,"LECTURA GERENCIAL · "+areaName.toUpperCase()).insight;
   management.classList.add("exv-area-management");
   root.append(management);
  }
  // At area selection, the management balances are the only actionable cards.
  // Processes and contracts are selected from their rankings, not project tiles.
  if(pane==="area"&&level==="project"&&isFocused){
   $("ex-pane-"+pane).classList.toggle("is-active",isFocused);
   continue;
  }
  // Standard drill cards remain available at other navigation levels.
  for(const [index,item] of items.entries()){
   const v=sum(item.rows,cut()),p=percent(v);
   const projects=distinctCodes(item.rows,"project"),processes=distinctCodes(item.rows,"process");
   const card=button("",()=>drillPane(pane,level,item.value),"exv-node exv-node-click");
   card.disabled=!level;
   if(areaMap){
    const icon=/DISTRIBUCI/i.test(item.value)?"⚡":/ADMINISTRATIV/i.test(item.value)?"⚙":/COMERCIAL/i.test(item.value)?"👥":"▣";
    card.classList.add("exv-area-bar-row");
    const iconNode=document.createElement("span");iconNode.className="exv-area-bar-icon";if(/ADMINISTRATIV/i.test(item.value)){
     iconNode.innerHTML=`<svg viewBox="0 0 48 48" width="29" height="29" fill="currentColor" aria-hidden="true"><path d="M20.3 4h7.4l1.4 5.1a15.5 15.5 0 0 1 3.4 1.4l4.6-2.6 5.2 5.2-2.6 4.6a15.5 15.5 0 0 1 1.4 3.4L46 22.5v7.4l-5.1 1.4a15.5 15.5 0 0 1-1.4 3.4l2.6 4.6-5.2 5.2-4.6-2.6a15.5 15.5 0 0 1-3.4 1.4L27.5 48h-7.4l-1.4-5.1a15.5 15.5 0 0 1-3.4-1.4l-4.6 2.6-5.2-5.2 2.6-4.6a15.5 15.5 0 0 1-1.4-3.4L2 29.5v-7.4l5.1-1.4a15.5 15.5 0 0 1 1.4-3.4l-2.6-4.6 5.2-5.2 4.6 2.6a15.5 15.5 0 0 1 3.4-1.4L20.3 4zm3.5 12a9.8 9.8 0 1 0 0 19.6 9.8 9.8 0 0 0 0-19.6zm0 5.2a4.6 4.6 0 1 1 0 9.2 4.6 4.6 0 0 1 0-9.2z" transform="translate(0 -2) scale(.96)"/></svg>`;
     iconNode.classList.add("exv-area-icon-admin");
    }else iconNode.textContent=icon;
    card.append(iconNode);
   }
   if(areaMap){
    card.classList.add("exv-area-block");
    if(index===0&&items.length>1)card.classList.add("exv-area-block-primary");
    card.title=item.value+" · Codificado "+money(v.budget)+" · "+(v.budget/total*100).toFixed(1)+"% del presupuesto · Devengado "+money(v.accrued);
   }
   card.setAttribute("aria-label",item.value+": codificado "+money(v.budget)+", devengado "+money(v.accrued)+". Abrir siguiente nivel");
   if(treemap){
    // Superficie visual suavizada: la mayor área conserva el liderazgo sin ocultar las pequeñas.
    const weights=items.map(x=>Math.sqrt(Math.max(0,sum(x.rows,cut()).budget)));
    const minShare=items.length<=3?0.19:Math.min(0.13,0.7/items.length);
    const maxShare=items.length<=3?0.60:0.48;
    const shares=weights.map(w=>w/(weights.reduce((a,b)=>a+b,0)||1));
    const fixed=new Array(shares.length).fill(null);
    for(let pass=0;pass<shares.length;pass++){
     const open=shares.map((_,i)=>i).filter(i=>fixed[i]===null);
     if(!open.length)break;
     const remaining=1-fixed.reduce((s,v)=>s+(v??0),0);
     const wsum=open.reduce((s,i)=>s+weights[i],0)||1;
     let adjusted=false;
     for(const i of open){
      const candidate=remaining*weights[i]/wsum;
      if(candidate<minShare){fixed[i]=minShare;adjusted=true;break;}
      if(candidate>maxShare){fixed[i]=maxShare;adjusted=true;break;}
     }
     if(!adjusted){for(const i of open)fixed[i]=remaining*weights[i]/wsum;break;}
    }
    if(items.length===3){
     // Bloque principal vertical a la izquierda; dos bloques horizontales apilados a la derecha.
     // Proporción suavizada, no superficie estrictamente proporcional al codificado.
     const main=items.findIndex(x=>sum(x.rows,cut()).budget===Math.max(...items.map(y=>sum(y.rows,cut()).budget)));
     const right=items.map((_,i)=>i).filter(i=>i!==main);
     const position=index===main?"main":index===right[0]?"top":"bottom";
     card.classList.add("exv-treemap-"+position);
     const mainShare=Math.max(.55,Math.min(.63,fixed[main]||.6));
     card.style.left=(position==="main"?0:mainShare*100)+"%";
     card.style.width=(position==="main"?mainShare:1-mainShare)*100+"%";
     card.style.top=position==="bottom"?"50%":"0%";
     card.style.height=position==="main"?"100%":"50%";
    }else{
     const start=100*fixed.slice(0,index).reduce((a,b)=>a+(b||0),0);
     card.style.left=start+"%";card.style.top="0%";
     card.style.width=(100*(fixed[index]||0))+"%";card.style.height="100%";
    }
   }
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
   if(areaMap){
    bar.style.width="100%";
    bar.style.background="#2a536d";
    bar.style.height="23px";
    fill.style.width=Math.max(0,Math.min(100,p)).toFixed(3)+"%";
    fill.style.height="100%";
    fill.style.display="block";
    fill.style.background="linear-gradient(90deg,#30c6df,#6de8c8)";
    summary.textContent=p.toFixed(1)+"%";
    card.title=item.value+" · Codificado "+money(v.budget)+" · Devengado "+money(v.accrued)+" · "+p.toFixed(1)+"% de ejecución";
   }
   card.append(name,values,summary,bar,foot);root.append(card);
  }
  if(areaMap&&items.length){
   const allRows=items.flatMap(item=>item.rows);
   const v=sum(allRows,cut()),p=percent(v);
   const projects=distinctCodes(allRows,"project");
   const processes=distinctCodes(allRows,"process");
   const row=document.createElement("div");row.className="exv-area-approved-total";
   const identity=document.createElement("span");identity.className="exv-area-approved-total-identity";
   const title=document.createElement("strong");title.textContent="TOTAL";
   const meta=document.createElement("small");meta.textContent=items.length+" áreas · "+projects+" proyectos · "+processes+" procesos";
   identity.append(title,meta);
   const bar=document.createElement("span");bar.className="exv-area-approved-total-bar";
   const fill=document.createElement("span");fill.style.width=Math.max(0,Math.min(100,p))+"%";bar.append(fill);
   const cod=document.createElement("strong");cod.textContent=money(v.budget);
   const dev=document.createElement("strong");dev.textContent=money(v.accrued);
   const pct=document.createElement("strong");pct.textContent=p.toFixed(1)+"%";
   row.append(identity,bar,cod,dev,pct);
   // El total va fuera del contenedor de filas: no lo ocultan los estilos ni el scroll del listado.
   row.classList.add("exv-area-total-outside");
   root.insertAdjacentElement("afterend",row);
  }
  $("ex-pane-"+pane).classList.toggle("is-active",isFocused);
 }
}

let selectedManagement=null;
let unitManagementOpen=false;
function renderTemporal(rs,cutMonth){
 if(realMode){renderRealTemporal(rs,cutMonth);return;}
 if(selectedManagement){renderManagementTemporal(rs,cutMonth);return;}
 const host=$("ex-pane-source");if(!host)return;
 host.classList.add("exv-temporal-pane");host.setAttribute("aria-label","Evolución y proyección presupuestaria");
 host.replaceChildren();
 const head=document.createElement("div");head.className="exv-temporal-head";
 const title=document.createElement("div");title.innerHTML='<span class="exv-temporal-eyebrow">RAMA 02 / INTELIGENCIA TEMPORAL</span><h3>EVOLUCIÓN Y PROYECCIÓN</h3><p>Evolución por tiempo · alterna entre porcentaje y dólares</p>';
 const picker=document.createElement("select");picker.className="exv-temporal-picker";picker.setAttribute("aria-label","Indicador financiero");
 for(const [key,label] of [["accrued","% Devengado"],["committed","% Comprometido"],["advance","% Devengado + anticipo"]]){const o=document.createElement("option");o.value=key;o.textContent=label;picker.append(o);}
 picker.value=host.dataset.metric||"accrued";picker.addEventListener("change",()=>{host.dataset.metric=picker.value;renderTemporal(rs,cutMonth);});
 const unitPicker=document.createElement("div");unitPicker.className="exv-temporal-unit-toggle";unitPicker.setAttribute("role","group");unitPicker.setAttribute("aria-label","Seleccionar porcentaje o dólares");
 const activeUnit=host.dataset.unit||"percent";
 for(const [key,label] of [["percent","%"],["usd","USD"]]){
  const choice=document.createElement("button");choice.type="button";choice.className="exv-temporal-unit-choice";choice.textContent=label;
  const selected=activeUnit===key;choice.setAttribute("aria-pressed",String(selected));
  choice.style.cssText="display:inline-flex!important;visibility:visible!important;opacity:1!important;align-items:center;justify-content:center;min-width:60px;min-height:36px;padding:8px 14px;border-radius:7px;cursor:pointer;font-weight:800;font-size:13px;border:1px solid "+(selected?"#64ead5":"#45738a")+";background:"+(selected?"#1c6973":"#102c3c")+";color:"+(selected?"#ffffff":"#b7d7e4")+";";
  choice.addEventListener("click",()=>{host.dataset.unit=key;renderTemporal(rs,cutMonth);});
  unitPicker.append(choice);
 }
 const controls=document.createElement("div");controls.className="exv-temporal-controls";controls.style.cssText="display:flex!important;visibility:visible!important;align-items:center;justify-content:flex-end;gap:10px;flex-wrap:wrap;";
 unitPicker.style.cssText="display:inline-flex!important;visibility:visible!important;gap:5px;padding:3px;border:1px solid #3c7185;border-radius:9px;background:#081d2a;";
 controls.append(picker,unitPicker);
 const context=document.createElement("div");context.className="exv-temporal-context";
 const tags=[...paneTrails[activePane].map(p=>p.value)];
 if(selectedFunding)tags.push(selectedFunding);
 for(const [key,id] of [["area","ex-area"],["source","ex-source"],["project","ex-project"]]){const el=$(id);if(el&&el.value!=="all"&&!tags.includes(el.value))tags.push(el.value);}
 context.textContent=unitManagementOpen&&paneTrails[activePane].length===0?"VISTA GLOBAL · TOTAL UNIDAD ESMERALDAS · TODAS LAS ÁREAS Y FUENTES":tags.length?"SELECCIÓN: "+tags.join(" / "):"VISTA GLOBAL · TODAS LAS ÁREAS Y FUENTES";
 head.append(title,controls);host.append(head,context);
 const metric=picker.value,months=["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];
 // Each synthetic process gets its own cumulative monthly profile. A single
 // multiplier for every scope made all lines geometrically identical.
 const metricValue=(v)=>v[metric==="advance"?"accrued":metric]+(metric==="advance"?v.advance:0);
 const hash=(str)=>{let h=2166136261;for(let i=0;i<str.length;i++){h=Math.imul(h^str.charCodeAt(i),16777619);}return h>>>0;};
 const cutIdx=Math.max(0,Math.min(11,cutMonth-1));
 const processValue=(r,m)=>{
  const seed=hash([r.source,r.area,r.project,r.process].join("|"));
  const sep=metricValue(sum([r],9));
  if(m<=9){
   // Strongly differentiated, positive illustrative monthly profiles:
   // funding sources have distinct disbursement calendars and processes
   // introduce secondary peaks. All profiles reconcile to September.
   const primary={BID:3.0,CAF:6.8,"Recursos propios":8.2}[r.source]||5.2;
   const center=Math.max(1,Math.min(9,primary+((seed>>>5)%7-3)*0.25));
   const width=1.25+((seed>>>12)%5)*0.22;
   const secondary=1.5+((seed>>>19)%7);
   const weights=Array.from({length:9},(_,i)=>{
    const month=i+1;
    const main=Math.exp(-0.5*Math.pow((month-center)/width,2));
    const extra=Math.exp(-0.5*Math.pow((month-secondary)/1.05,2));
    return 0.035+main*1.8+extra*(0.2+((seed>>>23)%6)*0.07);
   });
   const total=weights.reduce((x,y)=>x+y,0);
   return sep*weights.slice(0,m).reduce((x,y)=>x+y,0)/total;
  }
  const v=metricValue(sum([r],m));
  const sensitivity=0.65+((seed>>>8)%16)/20;
  return sep+(v-sep)*sensitivity;
 };
 const raw=months.map((_,i)=>rs.reduce((total,r)=>total+processValue(r,i+1),0));
 // Keep the curve anchored to the displayed value at the selected cut.
 const target=metricValue(sum(rs,cutMonth));
 const anchor=raw[cutIdx];
 const values=raw.map((v,i)=>i<=cutIdx
  ?(anchor>0?v*target/anchor:0)
  :Math.max(0,target+(v-anchor)));
 const budget=sum(rs,cutMonth).budget;
 const rates=values.map(v=>budget>0?Math.max(0,Math.min(100,100*v/budget)):0);
 const inPercent=(host.dataset.unit||"percent")==="percent";
 const chartValues=inPercent?rates:values;
 const projected=chartValues.map((v,i)=>i<=cutIdx?null:v);
 const historical=chartValues.map((v,i)=>i<=cutIdx?v:null);
 const baseline=chartValues[cutIdx];
 const max=inPercent?100:Math.max(1,...chartValues)*1.15;
 const W=620,H=300,L=54,R=20,T=20,B=46;
 const x=i=>L+i*(W-L-R)/11,y=v=>H-B-(v/max)*(H-T-B);
 const svgRoot=document.createElementNS("http://www.w3.org/2000/svg","svg");svgRoot.setAttribute("viewBox","0 0 620 300");svgRoot.setAttribute("role","img");svgRoot.setAttribute("aria-label","Curva histórica simulada hasta el corte y proyección demostrativa posterior");
 svgRoot.classList.add("exv-temporal-svg");
 const add=(tag,attrs,parent=svgRoot)=>{const e=document.createElementNS("http://www.w3.org/2000/svg",tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));parent.append(e);return e;};
 const defs=add("defs",{});const grad=add("linearGradient",{id:"exvTemporalFill",x1:"0",y1:"0",x2:"0",y2:"1"},defs);
 add("stop",{offset:"0%","stop-color":"#54dfd0","stop-opacity":".2"},grad);add("stop",{offset:"100%","stop-color":"#54dfd0","stop-opacity":"0"},grad);
 for(let i=0;i<5;i++){const v=max*i/4,yy=y(v);add("line",{x1:L,x2:W-R,y1:yy,y2:yy,stroke:"#265269","stroke-dasharray":"3 7"});const t=add("text",{x:L-9,y:yy+4,fill:"#85b4c7","font-size":"10","text-anchor":"end"});t.textContent=inPercent?Math.round(v)+"%":(v>=1000000?(v/1000000).toFixed(1)+"M":v>=1000?Math.round(v/1000)+"k":Math.round(v).toString());}
 const coords=arr=>arr.map((v,i)=>v===null?null:[x(i),y(v)]).filter(Boolean);
 const path=points=>points.map(([xx,yy],i)=>(i?"L":"M")+xx.toFixed(1)+" "+yy.toFixed(1)).join(" ");
 const h=coords(historical),p=coords(projected),continuation=projected.some(v=>v!==null)?[[x(cutIdx),y(baseline)],...p]:[];
 if(h.length){add("path",{d:path(h)+" L"+x(cutIdx)+" "+y(0)+" L"+x(0)+" "+y(0)+" Z",fill:"url(#exvTemporalFill)"});add("path",{d:path(h),stroke:"#62ebd1","stroke-width":"3.5",fill:"none","stroke-linejoin":"round","stroke-linecap":"round"});}
 if(continuation.length>1)add("path",{d:path(continuation),stroke:"#f0bd70","stroke-width":"3",fill:"none","stroke-dasharray":"7 6","stroke-linecap":"round"});
 add("line",{x1:x(cutIdx),x2:x(cutIdx),y1:T,y2:H-B,stroke:"#c6d9e5","stroke-dasharray":"4 5","stroke-opacity":".7"});
 const cutLabel=add("text",{x:Math.min(W-60,x(cutIdx)+7),y:15,fill:"#d9f5fa","font-size":"10"});cutLabel.textContent="CORTE";
 for(let i=0;i<12;i++){const t=add("text",{x:x(i),y:H-22,fill:i===cutIdx?"#eaffff":"#8bb5c6","font-size":"10","font-weight":i===cutIdx?"700":"400","text-anchor":"middle"});t.textContent=months[i];}
 h.forEach(([xx,yy],i)=>{const c=add("circle",{cx:xx,cy:yy,r:i===cutIdx?5:2.5,fill:"#70f0d5"});const tip=add("title",{},c);tip.textContent=months[i]+": "+(inPercent?historical[i].toFixed(1)+"%":money(historical[i]));});
 p.forEach(([xx,yy])=>add("circle",{cx:xx,cy:yy,r:3,fill:"#f0bd70"}));
 host.append(svgRoot);
 const legend=document.createElement("div");legend.className="exv-temporal-legend";legend.innerHTML='<span><i class="exv-temporal-real"></i>HISTÓRICO SIMULADO</span><span><i class="exv-temporal-future"></i>PROYECCIÓN DEMO</span>';host.append(legend);
 const info=document.createElement("div");info.className="exv-temporal-info exv-financial-summary";const left=document.createElement("div");left.className="exv-summary-card exv-summary-real";left.innerHTML="<small>VALOR AL CORTE</small><strong>"+(inPercent?baseline.toFixed(1)+"%":money(baseline))+"</strong>";const right=document.createElement("div");right.className="exv-summary-card exv-summary-projected";right.innerHTML="<small>PROYECCIÓN DICIEMBRE</small><strong>"+(inPercent?rates[11].toFixed(1)+"%":money(values[11]))+"</strong>";info.append(left,right);host.append(info);
 const note=document.createElement("p");note.className="exv-temporal-note";note.textContent="SIMULACIÓN · Cada fuente y proceso tiene un calendario mensual demostrativo distinto. Las pendientes y los puntos de inflexión cambian según el filtro; no son movimientos históricos observados ni pronósticos validados. En modo %, el denominador es el codificado de la selección al corte y el eje vertical va de 0% a 100%; en modo USD se muestran montos acumulados.";host.append(note);
}

function managementDemoStatus(type,id,cutMonth){
 const seed=Number((id.match(/\d+/g)||["1"]).at(-1))||1;
 const publication=1+seed%3,award=publication+1+seed%2,contracted=award+2;
 const stages=Array.from({length:12},(_,i)=>i<publication?"POR PUBLICAR":i<award?"PUBLICADO":i<contracted?"ADJUDICADO":"CONTRATADO");
 const dev=Array.from({length:12},(_,i)=>i<contracted?0:Math.min(100,Math.max(0,(i-contracted+1)*13-(i>contracted+2?13:0))));
 const index=Math.max(0,Math.min(11,cutMonth-1)),stage=stages[index];
 let months=0,idle=0;
 for(let i=index;i>=0&&stages[i]===stage;i--)months++;
 for(let i=index;i>0&&dev[i]===dev[i-1];i--)idle++;
 return {stage,months,dev:dev[index],idle};
}
function idleMessage(dev,cutMonth){
 let n=0;for(let i=cutMonth-1;i>0&&dev[i]===dev[i-1];i--)n++;
 return "ATENCIÓN GERENCIAL · "+(n?"Sin incremento del devengado en "+n+" intervalo(s) mensual(es); revisar avance y documentación.":"Se registra avance del devengado en el último intervalo.");
}
function stageMessage(stages,cutMonth){
 const i=Math.max(0,cutMonth-1),stage=stages[i];let n=0;for(let j=i;j>=0&&stages[j]===stage;j--)n++;
 return "ATENCIÓN GERENCIAL · "+stage+" durante "+n+" reporte(s) consecutivo(s); revisar próximo hito.";
}
function renderRealTemporal(rs,cutMonth){
 const host=$("ex-pane-source");host.replaceChildren();host.classList.add("exv-temporal-pane");
 const heading=document.createElement("div");heading.className="exv-temporal-head";
 const title=document.createElement("div");heading.append(title);host.append(heading);
 const choice=selectedManagement;
 const rows=choice?rs.filter(r=>(choice.type==="committed"?(r.contract||r.process):r.process)===choice.id):rs;
 const total=sum(rows,cutMonth);
 const label=choice?(choice.type==="committed"?"CONTRATO ":"PROCESO ")+choice.id:"UNIDAD / ÁREA · DATOS REALES";
 title.innerHTML='<span class="exv-temporal-eyebrow">RAMA 02 / DATOS REALES · CORTE SELECCIONADO</span><h3></h3><p>Información financiera acumulada al reporte · sin interpolación histórica</p>';
 title.querySelector("h3").textContent=label;
 const summary=document.createElement("div");summary.className="exv-contract-variance exv-financial-summary";
 const cards=[["CODIFICADO AÑO N",total.budget],["COMPROMETIDO AÑO N",total.committed],["DEVENGADO AÑO N",total.accrued]];
 for(const [name,value] of cards){
  const card=document.createElement("div");card.className="exv-summary-card";const small=document.createElement("small");small.textContent=name;
  const strong=document.createElement("strong");strong.textContent=money(value);card.append(small,strong);summary.append(card);
 }
 host.append(summary);
 const warning=document.createElement("p");warning.className="exv-temporal-note";
 warning.textContent="DATOS REALES · El archivo contiene los acumulados financieros al corte, pero aún no se ha verificado una serie mensual de devengado real. No se dibujan curvas financieras ficticias ni proyecciones inventadas.";
 host.append(warning);
 if(choice&&choice.type==="committed"){
  const months=["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];
  const physical=months.map((_,i)=>{
   const values=rows.map(r=>r.physicalMonths?.[i]).filter(v=>typeof v==="number"&&Number.isFinite(v));
   return values.length?Math.max(...values)*100:null;
  });
  const graph=document.createElement("div");graph.className="exv-temporal-chart";
  const cap=document.createElement("h4");cap.textContent="AVANCE FÍSICO HISTÓRICO · %";graph.append(cap);
  const chart=document.createElementNS("http://www.w3.org/2000/svg","svg");chart.setAttribute("viewBox","0 0 750 230");chart.style.width="100%";
  const add=(tag,attrs)=>{const el=document.createElementNS("http://www.w3.org/2000/svg",tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));chart.append(el);return el;};
  const x=i=>55+i*59,y=v=>185-v*1.5;
  for(let v=0;v<=100;v+=25){add("line",{x1:55,x2:710,y1:y(v),y2:y(v),stroke:"#3e6274","stroke-dasharray":"3 6"});const t=add("text",{x:44,y:y(v)+4,fill:"#abcbd8","text-anchor":"end","font-size":11});t.textContent=v+"%";}
  const available=physical.map((v,i)=>({v,i})).filter(p=>p.v!==null&&p.i<cutMonth);
  if(available.length){add("polyline",{points:available.map(p=>x(p.i)+","+y(p.v)).join(" "),fill:"none",stroke:"#74a9ff","stroke-width":3});for(const p of available)add("circle",{cx:x(p.i),cy:y(p.v),r:3,fill:"#74a9ff"});}
  months.forEach((m,i)=>{const t=add("text",{x:x(i),y:209,fill:i===9?"#fff":"#9cbecb","font-size":10,"text-anchor":"middle"});t.textContent=m;});
  graph.append(chart);host.append(graph);
  const note=document.createElement("p");note.className="exv-temporal-note";note.textContent="El histórico físico mensual no está disponible en los snapshots actuales. No se interpolan ni inventan valores.";host.append(note);
 }
 if(choice){host.append(button("← VOLVER A EVOLUCIÓN GENERAL",()=>{selectedManagement=null;renderTemporal(rs,cutMonth);},"exv-count-link"));}
}
function renderManagementTemporal(rs,cutMonth){
 if(realMode){renderRealTemporal(rs,cutMonth);return;}
 const host=$("ex-pane-source");host.replaceChildren();host.classList.add("exv-temporal-pane");
 const choice=selectedManagement,type=choice.type,contract=type==="committed";
 const rows=rs.filter(r=>(contract?(r.contract||r.process):r.process)===choice.id);
 const months=["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];
 const heading=document.createElement("div");heading.className="exv-temporal-head";
 const title=document.createElement("div");title.innerHTML='<span class="exv-temporal-eyebrow">RAMA 02 / SEGUIMIENTO DEMO</span><h3></h3><p></p>';
 title.querySelector("h3").textContent=(contract?"CONTRATO ":"PROCESO ")+choice.id;
 title.querySelector("p").textContent=contract?"Evolución financiera y física":"Evolución por hitos · permanencia mensual";
 heading.append(title,button("✕ VOLVER A EVOLUCIÓN GENERAL",()=>{selectedManagement=null;renderTemporal(rs,cutMonth);},"exv-count-link"));host.append(heading);
 // DEMO snapshots are month-end states, not elapsed days.
 const seed=Number((choice.id.match(/\d+/g)||["1"]).at(-1))||1;
 const publication=1+seed%3,award=publication+1+seed%2,contracted=award+2;
 const stages=months.map((_,i)=>i<publication?"POR PUBLICAR":i<award?"PUBLICADO":i<contracted?"ADJUDICADO":"CONTRATADO");
 const milestones=stages.map(stage=>({"POR PUBLICAR":0,"PUBLICADO":20,"ADJUDICADO":30,"CONTRATADO":40})[stage]);
 const totals=sum(rows,cutMonth),commit=totals.committed;
 // All monthly contract series remain synthetic until actual snapshots and planned accrual are connected.
 const dev=months.map((_,i)=>i<contracted?0:Math.min(100,Math.max(0,(i-contracted+1)*13-(i>contracted+2?13:0))));
 const physical=months.map((_,i)=>i<contracted?0:Math.min(100,(i-contracted+1)*15));
 const projected=months.map((_,i)=>i<contracted?0:Math.min(100,(i-contracted+1)*17));
 const series=contract?[
  {name:"DEVENGADO",values:dev,color:"#66e9d1"},
  {name:"AVANCE FÍSICO REAL",values:physical,color:"#74a9ff"},
  {name:"COMPROMETIDO",values:months.map(()=>100),color:"#d7e8f1",dashed:true}
 ]:[{name:"AVANCE DE GESTIÓN",values:milestones,color:"#66e9d1"}];
 const metricChoice=host.dataset.contractMetric||"accrued";
 const unitChoice=host.dataset.contractUnit||"percent";
 const advancePercent=commit?Math.max(0,100*totals.advance/commit):0;
 const metricActual=dev.map((v,i)=>Math.min(100,v+(metricChoice==="advance"?advancePercent*(i+1)/12:0)));
 const metricPlan=projected.map((v,i)=>Math.min(100,v+(metricChoice==="advance"?advancePercent*(i+1)/12:0)));
 const unitScale=unitChoice==="usd"?commit/100:1;
 if(contract){
  const controls=document.createElement("div");controls.className="exv-temporal-controls exv-contract-controls";controls.style.cssText="display:flex!important;visibility:visible!important;align-items:center;justify-content:flex-end;gap:10px;flex-wrap:wrap;";
  const picker=document.createElement("select");picker.className="exv-temporal-picker";picker.setAttribute("aria-label","Indicador del contrato");
  for(const [value,label] of [["accrued","Devengado"],["advance","Devengado + anticipo"]]){const opt=document.createElement("option");opt.value=value;opt.textContent=label;picker.append(opt);}
  picker.value=metricChoice;picker.addEventListener("change",()=>{host.dataset.contractMetric=picker.value;renderManagementTemporal(rs,cutMonth);});
  const units=document.createElement("div");units.className="exv-temporal-unit-toggle";units.setAttribute("role","group");units.setAttribute("aria-label","Seleccionar porcentaje o dólares");units.style.cssText="display:inline-flex!important;visibility:visible!important;gap:5px;padding:3px;border:1px solid #3c7185;border-radius:9px;background:#081d2a;";
  for(const [value,label] of [["percent","%"],["usd","USD"]]){
   const btn=document.createElement("button");btn.type="button";btn.className="exv-temporal-unit-choice";btn.textContent=label;btn.setAttribute("aria-pressed",String(unitChoice===value));
   const selected=unitChoice===value;btn.style.cssText="display:inline-flex!important;visibility:visible!important;opacity:1!important;align-items:center;justify-content:center;min-width:60px;min-height:36px;padding:8px 14px;border-radius:7px;cursor:pointer;font-weight:800;font-size:13px;border:1px solid "+(selected?"#64ead5":"#45738a")+";background:"+(selected?"#1c6973":"#102c3c")+";color:"+(selected?"#ffffff":"#b7d7e4")+";";
   btn.addEventListener("click",()=>{host.dataset.contractUnit=value;renderManagementTemporal(rs,cutMonth);});units.append(btn);
  }
  controls.append(picker,units);heading.append(controls);
 }
 const toggles=document.createElement("div");toggles.className="exv-temporal-legend";
 const visible=new Set(series.map(s=>s.name)),visibleStages=new Set(["POR PUBLICAR","PUBLICADO","ADJUDICADO","CONTRATADO"]);
 const chart=document.createElement("div");
 const draw=()=>{
  chart.replaceChildren();const W=620,H=300,L=52,R=18,T=22,B=48,x=i=>L+i*(W-L-R)/11,y=v=>H-B-v*(H-T-B)/100;
  const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");svg.setAttribute("viewBox","0 0 620 300");svg.classList.add("exv-temporal-svg");svg.setAttribute("role","img");svg.setAttribute("aria-label",contract?"Curvas DEMO de contrato":"Etapas mensuales DEMO del proceso");
  const add=(tag,attrs)=>{const e=document.createElementNS("http://www.w3.org/2000/svg",tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));svg.append(e);return e;};
  if(!contract){
   const colors={"POR PUBLICAR":"#d8a45e","PUBLICADO":"#3e9dd0","ADJUDICADO":"#a28be3","CONTRATADO":"#47bfa5"};
   const cutIndex=Math.max(0,Math.min(11,cutMonth-1));
   const runs=[];
   for(let i=0;i<=cutIndex;i++){
    const stage=stages[i],last=runs[runs.length-1];
    if(last&&last.stage===stage)last.end=i;else runs.push({stage,start:i,end:i});
   }
   for(const run of runs){
    if(!visibleStages.has(run.stage))continue;
    const left=run.start===0?L:x(run.start)-((x(1)-x(0))/2);
    const right=run.end===11?W-R:x(run.end)+((x(1)-x(0))/2);
    add("rect",{x:left,y:T,width:right-left,height:H-T-B,fill:colors[run.stage],"fill-opacity":run.end===cutIndex?".20":".11"});
    if(run.start>0)add("line",{x1:left,x2:left,y1:T,y2:H-B,stroke:colors[run.stage],"stroke-width":1,"stroke-dasharray":"4 5","stroke-opacity":".7"});
    const center=(left+right)/2,wide=right-left>75;
    if(wide){
     const label=add("text",{x:center,y:T+15,fill:colors[run.stage],"font-size":10,"font-weight":700,"text-anchor":"middle"});label.textContent=run.stage;
     const span=add("text",{x:center,y:T+29,fill:"#c0d7e1","font-size":9,"text-anchor":"middle"});span.textContent=months[run.start]+"–"+months[run.end]+" · "+(run.end-run.start+1)+" rep.";
    }else{
     const label=add("text",{x:center,y:T+16,fill:colors[run.stage],"font-size":9,"font-weight":700,"text-anchor":"middle"});label.textContent=run.stage==="POR PUBLICAR"?"P/PUB":run.stage==="ADJUDICADO"?"ADJ.":run.stage==="CONTRATADO"?"CONT.":"PUB.";
    }
   }
   const cutX=x(cutIndex);
   add("line",{x1:cutX,x2:cutX,y1:T,y2:H-B,stroke:"#d5f8fa","stroke-width":1.5,"stroke-dasharray":"4 4","stroke-opacity":".8"});
   const cutLabel=add("text",{x:Math.min(W-R-18,Math.max(L+18,cutX)),y:T-7,fill:"#d5f8fa","font-size":10,"text-anchor":"middle"});cutLabel.textContent="CORTE";
  }

  for(let i=0;i<=4;i++){const v=i*25;add("line",{x1:L,x2:W-R,y1:y(v),y2:y(v),stroke:"#315b6d","stroke-dasharray":"3 6"});const t=add("text",{x:L-8,y:y(v)+4,fill:"#a9cbd7","font-size":11,"text-anchor":"end"});t.textContent=unitChoice==="usd"?money(commit*v/100):v+"%";}
  const cutIndex=Math.max(0,Math.min(11,cutMonth-1));
  if(contract){
   add("line",{x1:x(cutIndex),x2:x(cutIndex),y1:T,y2:H-B,stroke:"#d5f8fa","stroke-width":1.5,"stroke-dasharray":"4 5","stroke-opacity":".8"});
   const cutLabel=add("text",{x:x(cutIndex),y:T-7,fill:"#d5f8fa","font-size":10,"text-anchor":"middle"});cutLabel.textContent="CORTE";
  }
  const drawLine=(values,color,{dashed=false,reference=false,delay=0,duration=1.7}={})=>{
   if(!values.length)return;
   const path=add("path",{d:values.map((p,i)=>(i?"L":"M")+x(p.i)+" "+y(p.v)).join(" "),stroke:color,"stroke-width":reference?1.8:3,fill:"none","stroke-linejoin":"round"});
   if(dashed)path.setAttribute("stroke-dasharray",reference?"3 7":"9 6");
   if(reference)path.classList.add("exv-trend-reference");
   else{
    path.classList.add("exv-trend-animated");
    path.style.animationDelay=delay+"s";
    path.style.animationDuration=duration+"s";
   }
   if(!reference)values.forEach((p,i)=>{
    const dot=add("circle",{cx:x(p.i),cy:y(p.v),r:2.6,fill:color,class:"exv-trend-point"});
    dot.style.animationDelay=(delay+duration*(values.length===1?1:i/(values.length-1)))+"s";
    dot.style.animationDuration=".15s";
    dot.style.animationFillMode="both";
   });
  };
  if(contract&&visible.has("DEVENGADO")){
   const realPoints=metricActual.slice(0,cutIndex+1).map((v,i)=>({i,v}));
   const areaPoints=[{i:0,v:0},...realPoints,{i:cutIndex,v:0}];
   const path=add("path",{d:areaPoints.map((p,i)=>(i?"L":"M")+x(p.i)+" "+y(p.v)).join(" ")+" Z",fill:"#42d8c5","fill-opacity":".14",stroke:"none"});
   path.classList.add("exv-trend-animated");path.style.animationDuration="2s";
  }
  for(const item of series){
   if(!visible.has(item.name))continue;
   if(contract&&item.name==="DEVENGADO"){
    // First draw observed accrual through cutoff, then continue from the actual cutoff value.
    drawLine(metricActual.slice(0,cutIndex+1).map((v,i)=>({i,v})),"#66e9d1",{duration:2});
    add("circle",{cx:x(cutIndex),cy:y(metricActual[cutIndex]),r:5.5,fill:"#66e9d1",stroke:"#dffff9","stroke-width":1.2});
    if(cutIndex<11){
     const points=[{i:cutIndex,v:metricActual[cutIndex]}];
     for(let i=cutIndex+1;i<12;i++)points.push({i,v:Math.min(100,Math.max(0,metricActual[cutIndex]+metricPlan[i]-metricPlan[cutIndex]))});
     drawLine(points,"#f0bd70",{dashed:true,delay:2,duration:1.6});
    }
   }else{
    const values=item.values.slice(0,contract&&item.name==="COMPROMETIDO"?12:cutIndex+1);
    drawLine(values.map((v,i)=>({i,v})),item.color,{dashed:!!item.dashed,reference:item.name==="COMPROMETIDO",duration:2});
   }
  }
  if(!contract){const cutIndex=Math.max(0,Math.min(11,cutMonth-1));const future=add("rect",{x:x(cutIndex)+((x(1)-x(0))/2),y:T,width:Math.max(0,W-R-x(cutIndex)-((x(1)-x(0))/2)),height:H-T-B,fill:"#071c2b","fill-opacity":".56"});}
  months.forEach((m,i)=>{const t=add("text",{x:x(i),y:H-22,fill:i===cutIndex?"#ffffff":"#a9cbd7","font-size":i===cutIndex?11:10,"font-weight":i===cutIndex?800:400,"text-anchor":"middle"});t.textContent=m;});
  chart.append(svg);
  if(contract){
   const legend=document.createElement("div");legend.className="exv-contract-legend";
   for(const [color,label,dashed] of [["#66e9d1","HISTÓRICO SIMULADO",false],["#f0bd70","PROYECCIÓN DEMO",true],["#74a9ff","AVANCE FÍSICO REAL · %",false],["#d7e8f1","COMPROMETIDO",true]]){
    const entry=document.createElement("span");entry.className="exv-contract-legend-entry";const swatch=document.createElement("i");swatch.style.borderTop="3px "+(dashed?"dashed ":"solid ")+color;
    const labelNode=document.createElement("span");labelNode.textContent=label;entry.append(swatch,labelNode);legend.append(entry);
   }
   chart.append(legend);
  }
  if(!contract){
   const note=document.createElement("p");note.className="exv-temporal-note";
   const current=stages[Math.max(0,cutMonth-1)];let duration=0;
   for(let i=cutMonth-1;i>=0&&stages[i]===current;i--)duration++;
   note.textContent="DEMO · Estado al corte: "+current+" · "+duration+" reporte(s) mensuales consecutivos en la misma etapa. Se cuentan reportes, no días.";
   chart.append(note);
  }
  if(contract){
   const kpis=document.createElement("div");kpis.className="exv-contract-variance exv-financial-summary";
   const current=Math.max(0,Math.min(11,cutMonth-1));
   const forecastDecember=Math.min(100,Math.max(0,metricActual[current]+metricPlan[11]-metricPlan[current]));
   const fmt=v=>unitChoice==="usd"?money(commit*v/100):v+"%";
   for(const [label,value] of [["VALOR AL CORTE",fmt(metricActual[current])],["PROYECCIÓN DICIEMBRE",fmt(forecastDecember)],["AVANCE FÍSICO · "+months[current],physical[current].toFixed(1)+"%"]]){
    const box=document.createElement("div");box.className="exv-summary-card "+(label==="VALOR AL CORTE"?"exv-summary-real":label==="PROYECCIÓN DICIEMBRE"?"exv-summary-projected":"exv-summary-physical");const cap=document.createElement("small");cap.textContent=label;const num=document.createElement("strong");num.textContent=value;box.append(cap,num);kpis.append(box);
   }
   chart.append(kpis);
  }
  const action=document.createElement("p");action.className="exv-management-attention";action.textContent=contract?(idleMessage(dev,cutMonth)):(stageMessage(stages,cutMonth));chart.append(action);
 };
 for(const s of series){const b=button("✓ "+s.name,()=>{if(visible.has(s.name))visible.delete(s.name);else visible.add(s.name);b.setAttribute("aria-pressed",String(visible.has(s.name)));draw();},"exv-count-link");b.setAttribute("aria-pressed","true");toggles.append(b);}
 if(!contract){for(const stage of ["POR PUBLICAR","PUBLICADO","ADJUDICADO","CONTRATADO"]){const b=button("▧ "+stage,()=>{if(visibleStages.has(stage))visibleStages.delete(stage);else visibleStages.add(stage);b.setAttribute("aria-pressed",String(visibleStages.has(stage)));draw();},"exv-count-link");b.setAttribute("aria-pressed","true");toggles.append(b);}}
 if(!contract){
  const status=document.createElement("div");status.className="exv-management-stage-summary";
  const currentIndex=Math.max(0,Math.min(11,cutMonth-1));
  let from=currentIndex;while(from>0&&stages[from-1]===stages[currentIndex])from--;
  const completed=[...new Set(stages.slice(0,currentIndex+1))];
  for(const stage of ["POR PUBLICAR","PUBLICADO","ADJUDICADO","CONTRATADO"]){
   const block=document.createElement("div");block.className="exv-management-stage-card";
   block.dataset.current=String(stages[currentIndex]===stage);
   const label=document.createElement("small");label.textContent=stage;
   const value=document.createElement("strong");
   if(!completed.includes(stage))value.textContent="PENDIENTE";
   else {const indices=stages.slice(0,currentIndex+1).map((v,i)=>v===stage?i:-1).filter(i=>i>=0);value.textContent=months[indices[0]]+" – "+months[indices.at(-1)];}
   const foot=document.createElement("span");foot.textContent=!completed.includes(stage)?"Sin registro al corte":stages[currentIndex]===stage?"ETAPA ACTUAL · "+(currentIndex-from+1)+" reportes":"Etapa superada";
   block.append(label,value,foot);status.append(block);
  }
  host.append(status);
 }
 host.append(toggles,chart);draw();
}
function clearAreaExplorer(){
 paneTrails.area=[];
 paneTrails.source=[];
 activePane="area";
 selectedFunding=null;
 selectedManagement=null;
 unitManagementOpen=false;
 override=null;
 for(const id of ["ex-area","ex-source","ex-project"]){
  const control=$(id);if(control&&Array.from(control.options).some(o=>o.value==="all"))control.value="all";
 }
 render();
}
const clearAreaButton=$("ex-clear-area");
if(clearAreaButton)clearAreaButton.addEventListener("click",clearAreaExplorer);
const aliaAreaActionsStyle=document.createElement("style");
aliaAreaActionsStyle.textContent=`
#explorer .exv-pane-actions{display:flex;align-items:center;gap:8px;margin-left:auto}
#explorer .exv-pane-actions .exv-pane-reset{white-space:nowrap}
#explorer #ex-clear-area{border-color:#42b4c4;color:#a5f5f0}
#explorer #ex-clear-area:hover{background:#164758}
`;
document.head.append(aliaAreaActionsStyle);

function goBackTo(pane,length){selectedManagement=null;paneTrails[pane]=paneTrails[pane].slice(0,length);activePane=pane;override=null;render();}
let override=null;
function render(requested){selectedManagement=null;if(requested)override=requested;syncFilters();const currentPath=paneTrails[activePane],rs=fundingScope(filterBy(records,currentPath)),c=cut(),v=sum(rs,c),level=override||paneOrder[activePane][currentPath.length];
const committedRate=v.budget?100*v.committed/v.budget:0,accruedRate=percent(v),advanceRate=v.budget?100*(v.accrued+v.advance)/v.budget:0;
$("ex-budget").textContent=money(v.budget);
$("ex-committed").textContent=money(v.committed);
$("ex-accrued").textContent=money(v.accrued);
$("ex-advance").textContent=money(v.accrued+v.advance);
$("ex-committed-rate").textContent=committedRate.toFixed(1)+"%";
$("ex-rate").textContent=accruedRate.toFixed(1)+"%";
$("ex-advance-rate").textContent=advanceRate.toFixed(1)+"%";
for(const [id,rate] of [["ex-committed-progress",committedRate],["ex-accrued-progress",accruedRate],["ex-advance-progress",advanceRate]])$(id).style.width=Math.max(0,Math.min(100,rate))+"%";
renderFundingComposition(filterBy(records,currentPath).filter(r=>["area","project"].every(key=>{const el=$(key==="area"?"ex-area":"ex-project");return el.value==="all"||r[key]===el.value;})));renderPanes();renderTemporal(unitManagementOpen&&currentPath.length===0?records:rs,c);
$("ex-context").textContent=["CNEL EP · ESMERALDAS",...currentPath.map(p=>p.value)].join(" / ");
const monthLabels=["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];
$("ex-period").textContent=(realMode?"CORTE REAL · ":"CORTE DEMO · ")+(monthLabels[c-1]||"—")+" 2026";
const crumbs=$("ex-breadcrumb");crumbs.replaceChildren();{const rootCrumb=document.createElement("span");rootCrumb.className="exv-crumb";rootCrumb.textContent="◉ EMPRESA";crumbs.append(rootCrumb);}if(selectedFunding)crumbs.append(button("✕ FINANCIAMIENTO: "+selectedFunding,()=>{selectedFunding=null;render();},"exv-crumb"));currentPath.forEach((p,i)=>crumbs.append(button("› "+p.value,()=>goBackTo(activePane,i+1),"exv-crumb")));
$("ex-title").textContent=level?"Mapa jerárquico · "+names[level]:"Presupuesto total codificado";$("ex-table-title").textContent=level?"Detalle por "+names[level]:"Consolidado de empresa";$("ex-column").textContent=level?names[level]:"Empresa";
const list=groups(rs,level),map=$("ex-map"),body=$("ex-rows");map.replaceChildren();body.replaceChildren();for(const g of list){map.append(tile(g,level,v.budget));const a=sum(g.rows,c),tr=document.createElement("tr");for(const cell of [g.value,money(a.budget),money(a.committed),money(a.accrued),money(a.accrued+a.advance),percent(a).toFixed(1)+"%"]){const td=document.createElement("td");td.textContent=cell;tr.append(td);}const td=document.createElement("td");if(level)td.append(button("EXPLORAR →",()=>drillPane(activePane,level,g.value),"exv-link"));tr.append(td);body.append(tr);}
$("ex-back").disabled=!paneTrails[activePane].length&&!override;$("ex-sankey").hidden=true;$("ex-map").hidden=false;
}
for(const pane of ["area"]){
 $("ex-back-"+pane).addEventListener("click",()=>goBack(pane));
}
$("ex-home").addEventListener("click",goHome);
$("ex-back").addEventListener("click",()=>goBack(activePane));
$("ex-cut").addEventListener("change",()=>{
 if(realMode){loadStagedCut(Number($("ex-cut").value));return;}
 render();
});
for(const id of ["ex-area","ex-source","ex-project"])$(id).addEventListener("change",render);
render();
function activateReal(data){
 if(!data||data.mode!=="REAL"||!Array.isArray(data.records)||!data.records.length)return;
 records=data.records.map(r=>({...r,budget:Number(r.budget)||0,committed:Number(r.committed)||0,accrued:Number(r.accrued)||0,advance:Number(r.advance)||0}));
 realMode=true;selectedManagement=null;unitManagementOpen=false;
 paneTrails.area=[];activePane="area";trail=[];branch=null;override=null;
 const selectedMonth=Number(data.month)||Number(Object.keys(data.report_dates||{})[0]?.slice(5,7))||10;
 const cutSelect=$("ex-cut");
 if(Array.isArray(data.available_months)){
  const labels=["ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO","JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"];
  cutSelect.replaceChildren();
  for(const month of data.available_months){
   const option=document.createElement("option");option.value=String(month);option.textContent=labels[month-1]+" 2026";cutSelect.append(option);
  }
 }
 cutSelect.value=String(selectedMonth);
 cutSelect.disabled=!Array.isArray(data.available_months)||data.available_months.length<2;
 const marker=document.querySelector("#explorer .exv-demo");if(marker)marker.textContent="● DATOS REALES · "+Object.keys(data.report_dates||{}).join(", ");
 render();
}

let stagedRequest=0;
function loadStagedCut(month){
 const request=++stagedRequest;
 const url="/__alia_explorer_preview"+(month?"?month="+encodeURIComponent(month):"");
 fetch(url,{cache:"no-store"}).then(r=>r.ok?r.json():null).then(data=>{
  if(request!==stagedRequest)return;
  if(data?.mode==="REAL"&&data.records?.length){activateReal(data);return;}
  if(!realMode)fetch("/__alia_data",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(activateReal).catch(()=>{});
 }).catch(()=>{});
}
loadStagedCut();
})();
