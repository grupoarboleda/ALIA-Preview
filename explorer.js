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
function renderFundingComposition(rows){
 const track=$("ex-source-composition"),legend=$("ex-source-composition-legend"),totalNode=$("ex-composition-total");
 track.replaceChildren();legend.replaceChildren();
 const grouped=groups(rows,"source"),total=sum(rows,cut()).budget;
 totalNode.textContent="TOTAL "+money(total)+"";
 for(const [i,g] of grouped.entries()){
  const figures=sum(g.rows,cut()),budget=figures.budget,share=total?100*budget/total:0;
  if(share<=0)continue;
  const execution=budget?100*figures.accrued/budget:0;
  const color=fundingColors[i%fundingColors.length];
  const part=document.createElement("button");part.type="button";part.className="exv-source-segment exv-source-selectable";part.setAttribute("aria-pressed",String(selectedFunding===g.value));part.addEventListener("click",()=>{selectedFunding=selectedFunding===g.value?null:g.value;override=null;render();});
  part.style.width=share+"%";part.style.background=color;
  const header=document.createElement("div");header.className="exv-source-segment-header";
  const source=document.createElement("span");source.className="exv-source-name";source.textContent=g.value;
  const pct=document.createElement("strong");pct.className="exv-source-share";pct.textContent=share.toFixed(1)+"%";
  header.append(source,pct);part.append(header);
  const executionLabel=document.createElement("div");executionLabel.className="exv-source-execution-rate";
  executionLabel.textContent=execution.toFixed(1)+"% DEVENGADO";part.append(executionLabel);
  const progress=document.createElement("div");progress.className="exv-source-execution";
  const fill=document.createElement("div");fill.className="exv-source-execution-fill";
  fill.style.width=Math.max(0,Math.min(100,execution))+"%";
  progress.append(fill);part.append(progress);
  part.title=g.value+" · CODIFICADO "+money(budget)+" · PARTICIPACIÓN "+share.toFixed(1)+"% · DEVENGADO "+execution.toFixed(1)+"%";
  part.setAttribute("aria-label","Filtrar por "+g.value+". "+part.title);
  track.append(part);
  const item=document.createElement("div");item.className="exv-source-legend-item";
  const dot=document.createElement("i");dot.style.background=color;
  const label=document.createElement("span");label.textContent=g.value;
  const amount=document.createElement("strong");amount.textContent=money(budget)+" · "+share.toFixed(1)+"% del codificado";
  item.append(dot,label,amount);legend.append(item);
 }
 if(!grouped.length||!total){const empty=document.createElement("span");empty.textContent="SIN PRESUPUESTO PARA ESTA SELECCIÓN";track.append(empty);}
}

function renderPanes(){
 const focus=focusPath();
 for(const pane of ["area"]){
  const own=paneTrails[pane],isFocused=pane===activePane;
  const path=isFocused?own:[],levels=paneOrder[pane],level=levels[path.length];
  const filtered=fundingScope(filterBy(records,focus));
  const root=$("ex-tree-"+pane),crumb=$("ex-path-"+pane);
  root.replaceChildren();crumb.replaceChildren();
  root.parentElement.querySelectorAll(".exv-unit-management,.exv-unit-management-trigger").forEach(el=>el.remove());
  const back=$("ex-back-"+pane);
  if(back)back.disabled=!isFocused||!own.length;
  const rootLabel=pane==="area"?"EMPRESA / ÁREAS":"EMPRESA / FINANCIAMIENTO";
  const rootButton=button(rootLabel,()=>{if(pane===activePane)goBackTo(pane,0);else{paneTrails[activePane]=[];activePane=pane;render();}},"exv-pane-crumb");
  crumb.append(rootButton);
  if(isFocused)own.forEach((p,i)=>crumb.append(button("› "+p.value,()=>goBackTo(pane,i+1),"exv-pane-crumb")));
  else if(focus.length){const indicator=document.createElement("span");indicator.className="exv-cross-context";indicator.textContent="FILTRADO POR "+focus.map(p=>p.value).join(" / ");crumb.append(indicator);}
  const items=groups(filtered,level),total=Math.max(sum(filtered,cut()).budget,1);
  const treemap=pane==="area"&&level==="area"&&items.length>1;
  root.classList.toggle("exv-area-treemap",treemap);
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
   const name=document.createElement("strong");name.textContent="◉ GLOBAL · TODA LA UNIDAD";
   const subtitle=document.createElement("small");subtitle.textContent="Saldos pendientes de procesos y contratos · Todas las áreas";
   left.append(name,subtitle);
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
   const projects=new Set(item.rows.map(r=>r.project)).size,processes=new Set(item.rows.map(r=>r.process)).size;
   const card=button("",()=>drillPane(pane,level,item.value),"exv-node exv-node-click");
   card.disabled=!level;
   card.setAttribute("aria-label",item.value+": codificado "+money(v.budget)+", devengado "+money(v.accrued)+". Abrir siguiente nivel");
   if(treemap){
    const weights=items.map(x=>Math.max(0,sum(x.rows,cut()).budget));
    const all=weights.reduce((a,b)=>a+b,0)||1;
    if(items.length===2){const left=100*weights[0]/all;card.style.left=(index===0?0:left)+"%";card.style.top="0%";card.style.width=(index===0?left:100-left)+"%";card.style.height="100%";}
    else {const left=100*weights[0]/all;const rest=weights.slice(1).reduce((a,b)=>a+b,0)||1;
     if(index===0){card.style.left="0%";card.style.top="0%";card.style.width=left+"%";card.style.height="100%";}
     else{const before=weights.slice(1,index).reduce((a,b)=>a+b,0),height=100*weights[index]/rest;
      card.style.left=left+"%";card.style.top=100*before/rest+"%";card.style.width=(100-left)+"%";card.style.height=height+"%";}
    }
   }
   if(treemap && card.style.height && parseFloat(card.style.height)<34)card.classList.add("exv-node-compact");
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
 title.innerHTML='<span class="exv-temporal-eyebrow">RAMA 02 / DATOS REALES · REPORTE OCTUBRE</span><h3></h3><p>Información financiera acumulada al reporte · sin interpolación histórica</p>';
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
  const available=physical.map((v,i)=>({v,i})).filter(p=>p.v!==null&&p.i<=9);
  if(available.length){add("polyline",{points:available.map(p=>x(p.i)+","+y(p.v)).join(" "),fill:"none",stroke:"#74a9ff","stroke-width":3});for(const p of available)add("circle",{cx:x(p.i),cy:y(p.v),r:3,fill:"#74a9ff"});}
  months.forEach((m,i)=>{const t=add("text",{x:x(i),y:209,fill:i===9?"#fff":"#9cbecb","font-size":10,"text-anchor":"middle"});t.textContent=m;});
  graph.append(chart);host.append(graph);
  const note=document.createElement("p");note.className="exv-temporal-note";note.textContent="Avance físico por mes extraído de las nuevas columnas UH–UQ. Cuando un contrato aparece en varias filas se muestra el máximo reportado provisionalmente; esta regla debe conciliarse con la matriz.";host.append(note);
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
$("ex-context").textContent=["CNEL EP · ESMERALDAS",...currentPath.map(p=>p.value)].join(" / ");$("ex-period").textContent="CORTE DEMO · "+({9:"SEP",10:"OCT",11:"NOV",12:"DIC"}[c])+" 2026";
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
$("ex-cut").addEventListener("change",render);
for(const id of ["ex-area","ex-source","ex-project"])$(id).addEventListener("change",render);
render();
// The workbook stays on this computer: upload is processed only by the local ALIA server.
const importControl=document.createElement("div");importControl.style.cssText="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:10px 0";
const importButton=button("IMPORTAR MATRIZ REAL · XLSX",()=>fileInput.click(),"exv-count-link");
const fileInput=document.createElement("input");fileInput.type="file";fileInput.accept=".xlsx";fileInput.hidden=true;
const importStatus=document.createElement("span");importStatus.style.cssText="font-size:11px;color:#9fd9d6";
importStatus.textContent="MODO DEMO · Sin datos reales importados";
importControl.append(importButton,fileInput,importStatus);
$("ex-home").parentElement.append(importControl);
function activateReal(data){
 if(!data||data.mode!=="REAL"||!Array.isArray(data.records)||!data.records.length)return;
 records=data.records.map(r=>({...r,budget:Number(r.budget)||0,committed:Number(r.committed)||0,accrued:Number(r.accrued)||0,advance:Number(r.advance)||0}));
 realMode=true;selectedManagement=null;unitManagementOpen=false;
 paneTrails.area=[];activePane="area";trail=[];branch=null;override=null;
 $("ex-cut").value="10";$("ex-cut").disabled=true;
 importStatus.textContent="DATOS REALES · "+records.length+" asignaciones · "+Object.keys(data.report_dates||{}).join(", ")+" · "+(data.warnings_count||0)+" alertas";
 render();
}
fileInput.addEventListener("change",async()=>{
 const file=fileInput.files[0];if(!file)return;
 importStatus.textContent="Validando matriz local…";
 try{
  const response=await fetch("/__alia_import",{method:"POST",headers:{"Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},body:file});
  const result=await response.json();
  if(!response.ok||!result.ok)throw Error(result.error||"Error de importación");
  const loaded=await fetch("/__alia_data").then(r=>r.json());activateReal(loaded);
 }catch(error){importStatus.textContent="No se pudo importar: "+error.message;}
});
fetch("/__alia_data").then(r=>r.ok?r.json():null).then(activateReal).catch(()=>{});
})();
