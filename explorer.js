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
 // Saldos gerenciales por entidad completa, nunca por fila aislada.
 // Sin comprometer: procesos con codificado positivo y compromiso TOTAL igual a cero.
 // Sin devengar: contratos con compromiso positivo y devengado inferior al compromiso.
 const balanceRows=filtered.map(r=>{const v=sum([r],cut());return {...r,...v};});
 const processGroups=new Map(),contractGroups=new Map();
 for(const r of balanceRows){
  const processId=String(r.process||"").trim();
  if(processId){
   if(!processGroups.has(processId))processGroups.set(processId,[]);
   processGroups.get(processId).push(r);
  }
  const contractId=String(r.contract||r.process||"").trim();
  if(contractId){
   if(!contractGroups.has(contractId))contractGroups.set(contractId,[]);
   contractGroups.get(contractId).push(r);
  }
 }
 const uncommittedEntries=[...processGroups].map(([id,rows])=>{
  const budget=rows.reduce((n,r)=>n+r.budget,0);
  const committed=rows.reduce((n,r)=>n+r.committed,0);
  return {id,rows,total:budget};
 }).filter(x=>x.total>0&&Math.abs(x.rows.reduce((n,r)=>n+r.committed,0))<0.005);
 const undevengedEntries=[...contractGroups].map(([id,rows])=>{
  const committed=rows.reduce((n,r)=>n+r.committed,0);
  const accrued=rows.reduce((n,r)=>n+r.accrued,0);
  return {id,rows,total:Math.max(0,committed-accrued)};
 }).filter(x=>x.total>0);
 const balances=[
  {label:"SALDO SIN COMPROMETER",type:"uncommitted",description:"Procesos con codificado > 0 y comprometido = 0"},
  {label:"SALDO SIN DEVENGAR",type:"committed",description:"Comprometido − Devengado"}
 ];
 const balanceStats=type=>{
  const entries=type==="uncommitted"?uncommittedEntries:undevengedEntries;
  return {entries,amount:entries.reduce((v,r)=>v+r.total,0),projects:entries.length};
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
  const ranking=balanceStats(type).entries.map(({id,rows,total})=>({project:id,rows,total})).sort((a,b)=>b.total-a.total);
  const note=document.createElement("p");note.className="exv-balance-ranking-note";
  note.textContent=ranking.length+(type==="uncommitted"?" procesos":" contratos")+" con saldo · Prioridad por monto pendiente. Selecciona uno para ver su evolución.";
  detailTable.append(note);
  const rankingHeader=document.createElement("div");
  rankingHeader.className="exv-balance-ranking-header";
  const entityHeader=document.createElement("span");
  entityHeader.textContent=type==="uncommitted"?"PROCESO":"CONTRATO";
  const amountHeader=document.createElement("span");
  amountHeader.textContent=type==="uncommitted"?"MONTO POR COMPROMETER":"MONTO POR DEVENGAR";
  rankingHeader.append(entityHeader,amountHeader);
  detailTable.append(rankingHeader);
  const rankingRoot=document.createElement("div");rankingRoot.className="exv-balance-ranking";detailTable.append(rankingRoot);
  let showAll=false;
  const paint=()=>{
   rankingRoot.replaceChildren();
   const shown=showAll?ranking:ranking.slice(0,5);
   for(const [i,{project,rows,total}] of shown.entries()){
    const current=managementDemoStatus(type,project,cut());
    const item=button("",()=>{
     selectedManagement={type,id:project};
     renderLatestDetailTable();
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
  const info=document.createElement("span");info.className="exv-balance-info";info.textContent="i";info.title="¿Qué significa este saldo?";info.setAttribute("role","button");info.tabIndex=0;
  info.setAttribute("aria-label","Explicación de "+label);info.setAttribute("aria-expanded","false");
  const explanation=document.createElement("span");explanation.className="exv-balance-explanation";explanation.hidden=true;
  const helpTitle=document.createElement("strong");helpTitle.textContent=type==="uncommitted"?"¿Qué dinero falta comprometer?":"¿Qué dinero falta devengar?";
  const helpBody=document.createElement("span");
  helpBody.textContent=type==="uncommitted"
   ?"Aquí se muestra el presupuesto de los procesos que todavía no tienen ningún compromiso registrado. Si un proceso ya tiene algún compromiso, no aparece en esta lista."
   :"Aquí se muestra cuánto falta devengar de los contratos que ya tienen dinero comprometido. Si un contrato está completamente devengado, no aparece en esta lista.";
  const helpFooter=document.createElement("span");helpFooter.textContent=type==="uncommitted"
   ?"El total reúne el presupuesto de esos procesos, sin contar un mismo proceso dos veces."
   :"El total suma lo que falta devengar en esos contratos, sin contar un mismo contrato dos veces.";
  explanation.append(helpTitle,helpBody,helpFooter);
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

const aliaHarmonicTreemapStyle=document.createElement("style");
aliaHarmonicTreemapStyle.textContent=`
/* Regla armónica: espacio legible en bloques secundarios, sin superponer datos. */
#explorer .exv-balanced-treemap:has(.exv-treemap-main){height:535px!important}
#explorer .exv-balanced-treemap .exv-treemap-top,
#explorer .exv-balanced-treemap .exv-treemap-bottom{
 display:flex!important;flex-direction:column!important;align-items:stretch!important;
 justify-content:flex-start!important;gap:9px!important;padding:17px 20px!important;
 overflow:hidden!important
}
#explorer .exv-balanced-treemap .exv-treemap-top .exv-node-values,
#explorer .exv-balanced-treemap .exv-treemap-bottom .exv-node-values{
 display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;
 gap:12px!important;flex:0 0 auto!important;width:100%!important
}
#explorer .exv-balanced-treemap .exv-treemap-top .exv-node-values>span,
#explorer .exv-balanced-treemap .exv-treemap-bottom .exv-node-values>span{
 display:flex!important;flex-direction:column!important;align-items:flex-start!important;
 min-width:0!important;gap:5px!important
}
#explorer .exv-balanced-treemap .exv-treemap-top .exv-node-values b,
#explorer .exv-balanced-treemap .exv-treemap-bottom .exv-node-values b{
 font-size:clamp(12px,1.25vw,17px)!important;line-height:1.25!important;
 white-space:nowrap!important;overflow:visible!important;word-break:normal!important
}
#explorer .exv-balanced-treemap .exv-treemap-top .exv-node-summary,
#explorer .exv-balanced-treemap .exv-treemap-bottom .exv-node-summary{
 position:static!important;flex:0 0 auto!important;line-height:1.2!important;
 margin-top:2px!important
}
#explorer .exv-balanced-treemap .exv-treemap-top .exv-node-bar,
#explorer .exv-balanced-treemap .exv-treemap-bottom .exv-node-bar{
 position:static!important;flex:0 0 9px!important;min-height:9px!important;
 margin:0!important;width:100%!important
}
#explorer .exv-balanced-treemap .exv-treemap-top .exv-node-foot,
#explorer .exv-balanced-treemap .exv-treemap-bottom .exv-node-foot{
 margin-top:auto!important;position:static!important;flex:0 0 auto!important
}
@media(max-width:700px){
 #explorer .exv-balanced-treemap:has(.exv-treemap-main){height:auto!important}
 #explorer .exv-balanced-treemap .exv-treemap-top,
 #explorer .exv-balanced-treemap .exv-treemap-bottom{min-height:240px!important}
}
`;
document.head.append(aliaHarmonicTreemapStyle);

const aliaTreemapAlignedCards=document.createElement("style");
aliaTreemapAlignedCards.textContent=`
/* Todas las áreas usan una misma plantilla: título en línea y barra a la misma altura. */
#explorer .exv-balanced-treemap .exv-area-block{
 display:grid!important;grid-template-columns:minmax(0,1fr)!important;
 grid-template-rows:46px 68px 18px 9px minmax(0,1fr) auto!important;
 align-content:stretch!important;justify-content:stretch!important;
 justify-items:stretch!important;align-items:start!important;
 row-gap:9px!important;padding:18px!important;overflow:hidden!important
}
#explorer .exv-balanced-treemap .exv-area-block .exv-treemap-heading{
 display:flex!important;flex-direction:row!important;align-items:center!important;
 gap:12px!important;width:100%!important;min-width:0!important;grid-row:1!important
}
#explorer .exv-balanced-treemap .exv-area-block .exv-treemap-heading>strong{
 font-size:clamp(12px,1.1vw,18px)!important;line-height:1.15!important;
 overflow-wrap:normal!important;word-break:normal!important;writing-mode:horizontal-tb!important;
 white-space:normal!important
}
#explorer .exv-balanced-treemap .exv-area-block .exv-treemap-heading .exv-area-bar-icon{
 display:grid!important;place-items:center!important;flex:0 0 42px!important;
 width:42px!important;height:42px!important;margin:0!important
}
#explorer .exv-balanced-treemap .exv-area-block .exv-node-values{
 grid-row:2!important;display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;
 gap:12px!important;width:100%!important;margin:0!important;min-height:0!important
}
#explorer .exv-balanced-treemap .exv-area-block .exv-node-values>span{
 display:flex!important;flex-direction:column!important;gap:5px!important;align-items:flex-start!important;
 min-width:0!important;margin:0!important
}
#explorer .exv-balanced-treemap .exv-area-block .exv-node-values b{
 font-size:clamp(12px,1.3vw,19px)!important;white-space:nowrap!important;line-height:1.3!important;
 overflow-wrap:normal!important;word-break:normal!important
}
#explorer .exv-balanced-treemap .exv-area-block .exv-node-summary{
 grid-row:3!important;position:static!important;margin:0!important;font-size:12px!important;
 line-height:18px!important;align-self:center!important
}
#explorer .exv-balanced-treemap .exv-area-block .exv-node-bar{
 grid-row:4!important;position:static!important;width:100%!important;max-width:100%!important;
 height:9px!important;min-height:9px!important;margin:0!important;align-self:start!important
}
#explorer .exv-balanced-treemap .exv-area-block .exv-node-foot{
 grid-row:6!important;position:static!important;align-self:end!important;
 margin:0!important;padding-top:8px!important;border-top:1px solid #38617a!important;
 font-size:10px!important;line-height:1.3!important
}
@media(max-width:700px){
 #explorer .exv-balanced-treemap .exv-area-block{grid-template-rows:46px 68px 18px 9px minmax(12px,1fr) auto!important;min-height:215px!important}
 #explorer .exv-balanced-treemap .exv-area-block .exv-node-values b{font-size:13px!important}
}
`;
document.head.append(aliaTreemapAlignedCards);

const aliaHideAreaCounts=document.createElement("style");
aliaHideAreaCounts.textContent=`
/* Solo en el mapa de áreas y su fila TOTAL: ocultar recuentos. */
#explorer .exv-balanced-treemap .exv-area-block .exv-node-foot{display:none!important}
#explorer .exv-area-approved-total .exv-area-approved-total-identity small{display:none!important}
`;
document.head.append(aliaHideAreaCounts);

const aliaBalanceRankingHeaderStyle=document.createElement("style");
aliaBalanceRankingHeaderStyle.textContent=`
#explorer .exv-balance-ranking-header{display:grid;grid-template-columns:minmax(0,1fr) minmax(125px,42%);gap:12px;align-items:center;padding:10px 16px;margin:10px 0 6px;border-bottom:1px solid #42768d;color:#85dfe8;font-size:11px;font-weight:800;letter-spacing:.07em}
#explorer .exv-balance-ranking-header span:last-child{text-align:right}
#explorer .exv-balance-ranking-header{
 position:sticky!important;top:0!important;z-index:20!important;
 background:#081e2e!important;box-shadow:0 3px 0 #081e2e!important;
 margin-top:0!important;margin-bottom:4px!important;
}
#explorer .exv-balance-table{isolation:isolate!important;scroll-padding-top:42px!important}

@media(max-width:520px){#explorer .exv-balance-ranking-header{grid-template-columns:minmax(0,1fr) minmax(115px,50%);font-size:10px;padding:9px}}
`;
document.head.append(aliaBalanceRankingHeaderStyle);

const aliaBalanceHelpPolish=document.createElement("style");
aliaBalanceHelpPolish.textContent=`
#explorer .exv-balance-action .exv-balance-info{
 display:grid!important;place-items:center!important;box-sizing:border-box!important;
 width:29px!important;height:29px!important;min-width:29px!important;min-height:29px!important;
 border:1px solid #8ed6e4!important;border-radius:50%!important;
 background:rgba(4,34,50,.75)!important;color:#d9faff!important;
 font-family:Georgia,serif!important;font-size:19px!important;font-style:italic!important;
 font-weight:700!important;line-height:1!important;box-shadow:none!important;
 text-shadow:none!important;outline:0!important;cursor:help!important
}
#explorer .exv-balance-action .exv-balance-info:hover,
#explorer .exv-balance-action .exv-balance-info:focus-visible{
 background:#12516a!important;border-color:#73f1e7!important;
 outline:2px solid #73f1e7!important;outline-offset:3px!important
}
#explorer .exv-balance-action .exv-balance-explanation:not([hidden]){
 display:flex!important;flex-direction:column!important;gap:9px!important;
 padding:15px 17px!important;font-size:13px!important;line-height:1.55!important;
 font-weight:400!important;white-space:normal!important
}
#explorer .exv-balance-action .exv-balance-explanation strong{
 color:#8bf3e5!important;font-size:14px!important;line-height:1.3!important
}
#explorer .exv-balance-action .exv-balance-explanation span:last-child{
 color:#a5d2de!important;border-top:1px solid #305b6c!important;
 padding-top:8px!important
}
`;
document.head.append(aliaBalanceHelpPolish);

const aliaRealHistoryStyle=document.createElement("style");
aliaRealHistoryStyle.textContent=`
#explorer .exv-real-history-panel{border:1px solid #31657c;background:#0a2537;padding:18px;margin-top:20px}
#explorer .exv-real-history-panel h4{font-size:14px;letter-spacing:.08em;color:#c6f7fa;margin:0 0 12px}
#explorer .exv-real-history-controls select{background:#0d3448;color:#d9faff;border:1px solid #43869c;padding:8px}
#explorer .exv-real-history-legend{display:flex;flex-wrap:wrap;gap:10px;margin:14px 0}
#explorer .exv-real-history-toggle{background:#102f41;border:1px solid #38657a;padding:7px 10px;cursor:pointer;font-weight:700}
#explorer .exv-real-history-toggle[aria-pressed="false"]{opacity:.38;text-decoration:line-through}
#explorer .exv-real-history-plot{width:100%;overflow-x:auto}
#explorer .exv-real-history-plot svg{min-width:430px}
`;
document.head.append(aliaRealHistoryStyle);

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
    const heading=document.createElement("div");heading.className="exv-treemap-heading";
    heading.append(iconNode);
    card._areaHeading=heading;
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
     // Regla armónica: raíz cuarta del codificado + reserva mínima de legibilidad.
     // Mantiene jerarquía financiera sin que el área mayor monopolice el lienzo.
     const budgets=items.map(x=>Math.max(0,sum(x.rows,cut()).budget));
     const harmonic=budgets.map(b=>Math.pow(b,0.25));
     const harmonicTotal=harmonic.reduce((a,b)=>a+b,0)||1;
     const mainShare=Math.max(.52,Math.min(.57,harmonic[main]/harmonicTotal));
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
   if(areaMap&&card._areaHeading){card._areaHeading.append(name);card.append(card._areaHeading,values,summary,bar);}else card.append(name,values,summary,bar,foot);
   root.append(card);
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
   identity.append(title);
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
let aliaHistoricalCuts=null;
let aliaHistoryRequest=null;
function ensureRealHistory(){
 if(aliaHistoricalCuts)return Promise.resolve(aliaHistoricalCuts);
 if(!aliaHistoryRequest)aliaHistoryRequest=fetch("/__alia_explorer_history",{cache:"no-store"})
  .then(r=>{if(!r.ok)throw Error("No se pudo consultar el historial");return r.json();})
  .then(data=>{aliaHistoricalCuts=Array.isArray(data.series)?data.series:[];return aliaHistoricalCuts;})
  .catch(()=>{aliaHistoryRequest=null;return [];});
 return aliaHistoryRequest;
}
function renderRealHistoryChart(host,cutMonth){
 const panel=document.createElement("section");panel.className="exv-real-history-panel";
 const heading=document.createElement("h4");heading.textContent="EVOLUCIÓN FINANCIERA · CORTES REALES";
 const controls=document.createElement("div");controls.className="exv-real-history-controls";
 const mode=document.createElement("select");mode.setAttribute("aria-label","Presentación de la evolución");
 for(const [value,label] of [["acc","Acumulado"],["delta","Variación mensual"],["pct","% del codificado"]]){const o=document.createElement("option");o.value=value;o.textContent=label;mode.append(o);}
 controls.append(mode);panel.append(heading,controls);
 const legend=document.createElement("div");legend.className="exv-real-history-legend";
 const active=new Set(["budget","committed","accrued"]);
 const series=[["budget","Codificado","#48c9e3"],["committed","Comprometido","#f1c36b"],["accrued","Devengado","#6ee2bd"]];
 for(const [field,label,color] of series){
  const btn=document.createElement("button");btn.type="button";btn.className="exv-real-history-toggle";btn.setAttribute("aria-pressed","true");btn.textContent="● "+label;btn.style.color=color;
  btn.addEventListener("click",()=>{if(active.has(field))active.delete(field);else active.add(field);btn.setAttribute("aria-pressed",String(active.has(field)));draw();});legend.append(btn);
 }
 panel.append(legend);
 const plot=document.createElement("div");plot.className="exv-real-history-plot";panel.append(plot);
 const note=document.createElement("p");note.className="exv-temporal-note";panel.append(note);
 host.append(panel);
 let cuts=[];
 const fmt=v=>mode.value==="pct"?v.toFixed(1)+"%":money(v);
 const selection=selectedManagement;
 const path=paneTrails[activePane]||[];
 const filters={area:$("ex-area")?.value,source:$("ex-source")?.value,project:$("ex-project")?.value};
 const selectedSource=selectedFunding;
 const match=r=>{
  if(path.some(p=>String(r[p.key]||"")!==String(p.value)))return false;
  if(selectedSource&&r.source!==selectedSource)return false;
  for(const [k,v] of Object.entries(filters))if(v&&v!=="all"&&r[k]!==v)return false;
  if(selection&&(selection.type==="committed"?(r.contract||r.process):r.process)!==selection.id)return false;
  return true;
 };
 function draw(){
  plot.replaceChildren();
  if(!cuts.length){note.textContent="No hay reportes mensuales disponibles para esta selección.";return;}
  const data=cuts.map(c=>({month:c.month,values:Object.fromEntries(series.map(([key])=>[key,c[key]]))}));
  if(mode.value==="delta")data.forEach((d,i)=>{for(const [key] of series)d.values[key]=i?cuts[i][key]-cuts[i-1][key]:null;});
  if(mode.value==="pct")data.forEach((d,i)=>{for(const [key] of series)d.values[key]=cuts[i].budget>0?100*cuts[i][key]/cuts[i].budget:null;});
  const nums=data.flatMap(d=>series.filter(([k])=>active.has(k)).map(([k])=>d.values[k]).filter(v=>v!==null&&Number.isFinite(v)));
  const hi=Math.max(1,...nums,0),lo=Math.min(0,...nums);
  const y=v=>190-(v-lo)/(hi-lo||1)*158,x=i=>55+(data.length===1?310:i*630/(data.length-1));
  const chart=document.createElementNS("http://www.w3.org/2000/svg","svg");chart.setAttribute("viewBox","0 0 750 240");chart.setAttribute("role","img");chart.setAttribute("aria-label","Evolución mensual de los importes financieros");chart.style.width="100%";
  const add=(tag,attrs,parent=chart)=>{const e=document.createElementNS("http://www.w3.org/2000/svg",tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));parent.append(e);return e;};
  for(let i=0;i<=4;i++){const v=lo+(hi-lo)*i/4;add("line",{x1:55,x2:690,y1:y(v),y2:y(v),stroke:"#31566b","stroke-dasharray":"4 6"});const t=add("text",{x:49,y:y(v)+4,fill:"#a6c8d8","text-anchor":"end","font-size":"10"});t.textContent=mode.value==="pct"?v.toFixed(0)+"%":Math.round(v/1000)+"k";}
  const months=["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];
  data.forEach((d,i)=>{const t=add("text",{x:x(i),y:216,fill:"#b3d7e5","text-anchor":"middle","font-size":"10"});t.textContent=months[d.month-1]||d.month;});
  for(const [key,label,color] of series){if(!active.has(key))continue;
   let pathText="",started=false;
   data.forEach((d,i)=>{const v=d.values[key];if(v===null||!Number.isFinite(v)){started=false;return;}pathText+=(started?" L":" M")+x(i)+" "+y(v);started=true;});
   if(pathText)add("path",{d:pathText,fill:"none",stroke:color,"stroke-width":"3","stroke-linejoin":"round"});
   data.forEach((d,i)=>{const v=d.values[key];if(v===null||!Number.isFinite(v))return;const dot=add("circle",{cx:x(i),cy:y(v),r:4,fill:color});const tip=add("title",{},dot);tip.textContent=label+" · "+months[d.month-1]+": "+fmt(v);});
  }
  plot.append(chart);
  note.textContent="Solo se muestran cortes realmente cargados. En variación mensual, cada punto compara dos reportes consecutivos disponibles; el primero no tiene comparación. No se estiman meses faltantes.";
 }
 mode.addEventListener("change",draw);
 ensureRealHistory().then(all=>{
  if(!panel.isConnected)return;
  cuts=all.filter(s=>s.month<=cutMonth).map(s=>{
   const rows=s.records.filter(match);
   const totals=sum(rows,s.month);
   return {month:s.month,budget:totals.budget,committed:totals.committed,accrued:totals.accrued};
  }).sort((a,b)=>a.month-b.month);
  draw();
 });
}
function renderMonthlyExecutionChart(host,rows,cutMonth,physicalContract=null){
 const section=document.createElement("section");section.className="exv-real-history-panel";
 const heading=document.createElement("h4");heading.textContent="CURVA DE DEVENGADO · REAL, PROYECCIÓN Y LÍNEA BASE";const chartHeader=document.createElement("div");chartHeader.className="exv-monthly-chart-header";chartHeader.append(heading);section.append(chartHeader);
 const valid=rows.filter(r=>Array.isArray(r.actualMonthly)&&Array.isArray(r.plannedMonthly)&&Array.isArray(r.baselineMonthly));
 if(!valid.length){
  const msg=document.createElement("p");msg.className="exv-temporal-note";
  msg.textContent="Los reportes ya cargados no contienen todavía el detalle mensual de las columnas 508–519, 523–534 y 538–549. No se mostrarán curvas estimadas. Es necesario recuperar esas columnas de la matriz original sin modificar los importes existentes.";
  section.append(msg);
  const picker=document.createElement("input");picker.type="file";picker.accept=".xlsx";picker.hidden=true;
  const button=document.createElement("button");button.type="button";button.className="exv-real-history-toggle";button.textContent="RECUPERAR SERIES DEL EXCEL ORIGINAL · "+String(cutMonth).padStart(2,"0")+"/2026";
  const status=document.createElement("p");status.className="exv-temporal-note";
  button.addEventListener("click",()=>picker.click());
  picker.addEventListener("change",async()=>{
   const file=picker.files?.[0];if(!file)return;
   button.disabled=true;status.textContent="Comprobando que el archivo sea exactamente el mismo que ya está cargado…";
   try{
    const response=await fetch("/__alia_enrich_monthly",{method:"POST",headers:{"X-ALIA-Month":String(cutMonth),"X-ALIA-Filename":encodeURIComponent(file.name),"Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},body:file});
    const result=await response.json();if(!response.ok||!result.ok)throw Error(result.error||"No se pudo recuperar la serie");
    status.textContent="Series recuperadas. Actualizando la gráfica…";
    loadStagedCut(cutMonth);
   }catch(e){status.textContent="No se modificó la carga: "+e.message;}finally{button.disabled=false;picker.value="";}
  });
  section.append(button,picker,status);host.append(section);return;
 }
 const budget=rows.reduce((n,r)=>n+(Number(r.budget)||0),0);
 // Presupuesto codificado histórico: cada mes usa su propio reporte, no el del corte.
 let milestoneRows=rows;
 const budgetByMonth=Array(12).fill(null);
 const physicalByMonth=Array(12).fill(null);
 const budgetScope=rows.map(r=>({area:r.area,project:r.project,source:r.source,process:r.process,sourceRow:r.sourceRow}));
 const budgetAll=rows.length===records.length;
 const same=(a,b)=>String(a??"")===String(b??"");
 const inScope=r=>budgetAll||budgetScope.some(k=>same(k.area,r.area)&&same(k.project,r.project)&&same(k.source,r.source)&&same(k.process,r.process)&&same(k.sourceRow,r.sourceRow));
 const chartStarted=performance.now();
 const chartToken=Symbol("chart");
 section._budgetToken=chartToken;
 fetch("/__alia_explorer_history",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(data=>{
  if(section._budgetToken!==chartToken||!section.isConnected||!Array.isArray(data?.series))return;
  if(physicalContract){
   const recovered=[];
   for(const entry of data.series){
    for(const r of entry.records||[]){
     if(String(r.contract||r.process)===String(physicalContract))recovered.push(r);
    }
   }
   milestoneRows=recovered.length?recovered:rows;
  }
  for(const entry of data.series){
   const month=Number(entry.month);
   if(month>=1&&month<=12&&Array.isArray(entry.records))
   {
    const matching=entry.records.filter(physicalContract
      ?r=>String(r.contract||r.process)===String(physicalContract)
      :inScope);
    budgetByMonth[month-1]=matching.reduce((n,r)=>n+(Number(r.budget)||0),0);
    if(physicalContract){
     const measurements=matching.map(r=>{
      const raw=r.physical;
      if(raw===null||raw===undefined||raw==="")return null;
      const n=Number(raw);
      if(!Number.isFinite(n)||n<0)return null;
      return {value:n<=1?n*100:n,weight:Math.max(0,Number(r.contractAmount)||Number(r.budget)||0)};
     }).filter(Boolean);
     if(measurements.length){
      const weight=measurements.reduce((n,r)=>n+r.weight,0);
      physicalByMonth[month-1]=weight>0
       ?measurements.reduce((n,r)=>n+r.value*r.weight,0)/weight
       :measurements.reduce((n,r)=>n+r.value,0)/measurements.length;
     }
    }
   }
  }
  // El primer trazado comienza de inmediato. Al llegar el historial se
  // incorporan las capas adicionales sin borrar ni reiniciar el SVG.
  const svg=plot.querySelector("svg");
  if(svg&&physicalContract){
   const ns="http://www.w3.org/2000/svg";
   const add=(tag,attrs)=>{const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));svg.append(e);return e;};
   const dated=milestoneRows.map(r=>({advance:r.advance_paid_date,start:r.contract_start_date,paid:Number(r.advance)||0}));
   const advance=dated.filter(r=>r.paid>0&&r.advance).map(r=>r.advance).sort()[0];
   const start=dated.filter(r=>r.start).map(r=>r.start).sort()[0];
   const eventDate=dated.some(r=>r.paid>0)?advance:start;
   if(eventDate){
    const dt=new Date(eventDate+"T12:00:00");
    if(!Number.isNaN(dt.getTime())&&dt.getFullYear()===2026){
     const month=dt.getMonth(),px=65+month*59;
     const line=add("line",{x1:px,x2:px,y1:38,y2:268,stroke:"#eac87b","stroke-width":1.3,"stroke-dasharray":"2 8",opacity:0});
     const dot=add("circle",{cx:px,cy:38,r:9,fill:"#d9b75c",stroke:"#fff1bb","stroke-width":1.5,opacity:0,role:"button",tabindex:0});
     const detail=(advance?"ANTICIPO PAGADO":"INICIO DEL CONTRATO")+" · "+eventDate.split("-").reverse().join("/");
     const tip=document.createElementNS(ns,"title");tip.textContent=detail;dot.append(tip);
     dot.style.cursor="pointer";
     const show=()=>{pointDetail.style.display="block";pointDetail.textContent=detail;};
     dot.addEventListener("click",show);dot.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();show();}});
     const elapsed=performance.now()-chartStarted;
     const revealAt=3000*month/Math.max(1,cutMonth-1);
     const wait=Math.max(0,revealAt-elapsed);
     const reveal=()=>{if(!svg.isConnected)return;line.setAttribute("opacity",".65");dot.setAttribute("opacity","1");};
     if(wait)window.setTimeout(reveal,wait);else reveal();
    }
   }
   const physical=lines.find(l=>l.label==="Avance físico");
   if(physical&&active.has(physical.label)){
    const points=physicalByMonth.map((v,i)=>v===null||i>=cutMonth?null:[i,v]).filter(Boolean);
    if(points.length){
     const poly=add("polyline",{points:points.map(p=>(65+p[0]*59)+","+(268-225*p[1]/100)).join(" "),fill:"none",stroke:physical.color,"stroke-width":3,"stroke-linecap":"round","stroke-linejoin":"round"});
     const len=poly.getTotalLength();
     if(len>0&&typeof poly.animate==="function"){
      const elapsed=performance.now()-chartStarted;
      poly.animate([{strokeDasharray:String(len),strokeDashoffset:String(len)},{strokeDasharray:String(len),strokeDashoffset:"0"}],{duration:3000,delay:-Math.min(3000,elapsed),fill:"both"});
     }
    }
   }
  }
 }).catch(()=>{});
 const totals={baseline:Array(12).fill(0),planned:Array(12).fill(0),actual:Array(12).fill(0)};
 for(const r of valid){
  for(let i=0;i<12;i++){
   for(const [field,key] of [["baseline","baselineMonthly"],["planned","plannedMonthly"],["actual","actualMonthly"]]){
    const v=r[key][i];if(v!==null&&v!==undefined&&Number.isFinite(Number(v)))totals[field][i]+=Number(v);
   }
  }
 }
 const cumulative=arr=>{let n=0;return arr.map(v=>(n+=v));};
 const baseline=cumulative(totals.baseline);
 const real=cumulative(totals.actual);
 const projection=real.slice();
 for(let i=cutMonth;i<12;i++)projection[i]=projection[i-1]+totals.planned[i];
 const lines=[
  {label:"Línea base inicial",color:"#a88bff",points:baseline.map((v,i)=>[i,v])},
  {label:"Devengado real",color:"#25e1bd",points:real.map((v,i)=>i<cutMonth?[i,v]:null).filter(Boolean)},
  {label:"Proyección vigente",color:"#ffb443",points:projection.map((v,i)=>i>=cutMonth-1?[i,v]:null).filter(Boolean)},
  {label:"Codificado anual",color:"#6e9dce",points:Array.from({length:12},(_,i)=>[i,budget])},
  ...(physicalContract?[{label:"Avance físico",color:"#f4a8e8",points:[]}]:[])
 ];
 // Los valores históricos de codificado se cargan de forma asíncrona.
 const codedLine=lines.find(l=>l.label==="Codificado anual");
 const active=new Set(lines.filter(l=>!physicalContract||["Devengado real","Proyección vigente","Avance físico"].includes(l.label)).map(l=>l.label));
 let unit="%";
 const controls=document.createElement("div");controls.style.cssText="display:flex;gap:6px;align-items:center;flex-wrap:nowrap;margin:0";
 const unitButtons={};
 for(const value of ["%","USD"]){const btn=document.createElement("button");btn.type="button";btn.className="exv-real-history-toggle";btn.textContent=value;btn.style.cssText="padding:7px 14px;border:1px solid #4e9db2;background:#092b3c;color:#c6e9f2;cursor:pointer";btn.onclick=()=>{unit=value;draw()};unitButtons[value]=btn;controls.append(btn);}
 const legend=document.createElement("div");legend.className="exv-real-history-legend";
 legend.style.cssText="display:flex;flex-wrap:wrap;gap:10px;margin:12px 0 6px";
 const plot=document.createElement("div");plot.className="exv-real-history-plot";
 const footer=document.createElement("p");footer.className="exv-temporal-note";
 footer.textContent="Línea base: programación inicial · Real: pagos registrados hasta el corte · Proyección: programación de meses pendientes · Codificado: valor de cada reporte mensual en USD y referencia del 100% en porcentaje.";
 if(physicalContract)footer.textContent+=" · Avance físico: columna 226 (0–100%). Hito dorado: fecha de anticipo pagado (235), o inicio de contrato (50) si no hay anticipo; solo cuando la fecha esté disponible en los datos cargados.";
 chartHeader.append(controls);section.append(plot,legend,footer);host.append(section);
 const pointDetail=document.createElement("div");
 pointDetail.className="exv-chart-point-detail";
 pointDetail.style.cssText="display:none;margin:8px 0;padding:10px 14px;border:1px solid #3d8398;border-radius:6px;background:#103449;color:#e3f6fb;font-weight:600";
 pointDetail.setAttribute("aria-live","polite");
 plot.after(pointDetail);
 const monthNames=["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
 const showPoint=(line,point)=>{
  const i=point[0],value=point[1];
  const monthBudget=budgetByMonth[i];
  const reference=monthBudget!==null&&monthBudget>0?monthBudget:budget;
  const pct=line.label==="Avance físico"?value.toFixed(1)+"%":line===codedLine?"100.0%":reference>0?(100*value/reference).toFixed(1)+"%":"Sin codificado";
  const referenceLabel=monthBudget!==null?"codificado de "+monthNames[i]:"codificado del corte (referencia)";
  pointDetail.style.display="block";
  pointDetail.textContent=line.label==="Avance físico"?"AVANCE FÍSICO · "+monthNames[i].toUpperCase()+" · "+pct+" acumulado":line.label.toUpperCase()+" · "+monthNames[i].toUpperCase()+" · "+money(value)+" · "+pct+" del "+referenceLabel;
 };
 const ns="http://www.w3.org/2000/svg";
 function draw(){
  for(const [value,btn] of Object.entries(unitButtons)){const selected=unit===value;btn.setAttribute("aria-pressed",String(selected));btn.style.background=selected?"#166176":"#092b3c";btn.style.borderColor=selected?"#6fe7e0":"#4e9db2";}
  plot.replaceChildren();
  const physicalLine=lines.find(l=>l.label==="Avance físico");
  if(physicalLine)physicalLine.points=physicalByMonth.map((v,i)=>v===null||i>=cutMonth?null:[i,v]).filter(Boolean);
  codedLine.points=unit==="%"?Array.from({length:12},(_,i)=>[i,budget]):budgetByMonth.map((v,i)=>v===null?null:[i,v]).filter(Boolean);const visible=lines.filter(l=>active.has(l.label));
  const convert=(v,isBudget=false,isPhysical=false)=>isPhysical?v:(unit==="%"?(isBudget?100:(budget>0?v/budget*100:0)):v);
  const high=unit==="%"?100:Math.max(1,...visible.filter(l=>l.label!=="Avance físico").flatMap(l=>l.points.map(p=>p[1])));
  const svg=document.createElementNS(ns,"svg");svg.setAttribute("viewBox","0 0 760 320");svg.style.width="100%";svg.setAttribute("role","img");svg.setAttribute("aria-label",physicalContract?"Evolución financiera y avance físico mensual del contrato":"Evolución mensual real, proyectada, línea base y codificado");
  const make=(tag,attrs,parent=svg)=>{const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));parent.append(e);return e;};
  const x=i=>65+i*59,y=(v,isBudget=false,isPhysical=false)=>268-225*convert(v,isBudget,isPhysical)/(isPhysical?100:high);
  for(let k=0;k<=4;k++){const yy=268-k*56.25;make("line",{x1:65,x2:714,y1:yy,y2:yy,stroke:"#31536b","stroke-dasharray":"3 5"});const t=make("text",{x:58,y:yy+3,"text-anchor":"end",fill:"#aacbd9","font-size":"11"});t.textContent=unit==="%"?(25*k)+"%":Math.round(high*k/4000)+"k";}
  ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"].forEach((m,i)=>{const t=make("text",{x:x(i),y:295,"text-anchor":"middle",fill:i===cutMonth-1?"#74f5e8":"#bbdbe8","font-size":"10","font-weight":i===cutMonth-1?"bold":"normal"});t.textContent=m;});
  // Hito contractual discreto: anticipo efectivamente pagado; si no existe, inicio.
  if(physicalContract){
   const dated=milestoneRows.map(r=>({advance:r.advance_paid_date,start:r.contract_start_date,paid:Number(r.advance)||0}));
   const advanceDates=dated.filter(r=>r.paid>0&&r.advance).map(r=>r.advance).sort();
   const startDates=dated.filter(r=>r.start).map(r=>r.start).sort();
   const advanceDate=advanceDates[0]||null;
   const hasPaidAdvance=dated.some(r=>r.paid>0);
   const eventDate=hasPaidAdvance?advanceDate:(startDates[0]||null);
   if(eventDate){
    const dt=new Date(eventDate+"T12:00:00");
    if(!Number.isNaN(dt.getTime())&&dt.getFullYear()===2026){
     const m=dt.getMonth(),px=x(m);
     make("line",{x1:px,x2:px,y1:38,y2:268,stroke:"#eac87b","stroke-width":"1.3","stroke-dasharray":"2 8",opacity:".65","pointer-events":"none"});
     const hit=make("circle",{cx:px,cy:38,r:9,fill:"#d9b75c",stroke:"#fff1bb","stroke-width":"1.5",role:"button",tabindex:"0","aria-label":advanceDate?"Fecha de pago del anticipo":"Fecha de inicio del contrato"});
     hit.style.cursor="pointer";
     const eventText=(advanceDate?"ANTICIPO PAGADO":"INICIO DEL CONTRATO")+" · "+eventDate.split("-").reverse().join("/");
     const tip=make("title",{},hit);tip.textContent=eventText;
     const show=()=>{pointDetail.style.display="block";pointDetail.textContent=eventText;};
     hit.addEventListener("click",show);
     hit.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();show();}});
    }
   }
  }
  const cutX=x(Math.max(0,Math.min(11,cutMonth-1)));
  make("line",{x1:cutX,x2:cutX,y1:31,y2:268,stroke:"#8edce6","stroke-width":"1.5","stroke-dasharray":"5 5",opacity:".8"});
  const cutLabel=make("text",{x:Math.min(cutX+6,674),y:22,fill:"#9cece6","font-size":"10"});cutLabel.textContent="CORTE";
  for(const l of visible){if(!l.points.length)continue;
   if(l.label==="Devengado real"&&l.points.length>1){const first=l.points[0],last=l.points[l.points.length-1];make("polygon",{points:[x(first[0])+",268",...l.points.map(p=>x(p[0])+","+y(p[1],l===codedLine,l===physicalLine)),x(last[0])+",268"].join(" "),fill:l.color,opacity:".09"});}
   const path=make("polyline",{points:l.points.map(p=>x(p[0])+","+y(p[1],l===codedLine,l===physicalLine)).join(" "),fill:"none",stroke:l.color,"stroke-width":l.label==="Devengado real"?"3.8":"3","stroke-linecap":"round","stroke-linejoin":"round", "stroke-dasharray":l.label==="Proyección vigente"?"9 6":"none"});
   path.dataset.aliaSeries=l.label;

   for(const p of l.points){
    if(l.label==="Proyección vigente")continue;
    const px=x(p[0]),py=y(p[1],l===codedLine,l===physicalLine);
    const dot=make("circle",{cx:px,cy:py,r:3.5,fill:l.color,"pointer-events":"none",opacity:"0"});
    const wait=3000*Math.min(p[0],cutMonth-1)/Math.max(1,cutMonth-1);
    if(typeof dot.animate==="function")dot.animate([{opacity:0},{opacity:1}],{duration:120,delay:wait,fill:"forwards"});
    else dot.setAttribute("opacity","1");
    const hit=make("circle",{cx:px,cy:py,r:11,fill:"transparent",role:"button",tabindex:"0","aria-label":"Consultar "+l.label+" de "+monthNames[p[0]]});
    hit.style.cursor="pointer";
    const tip=make("title",{},hit);tip.textContent=l.label+" · "+monthNames[p[0]]+" · "+(l===physicalLine?p[1].toFixed(1)+"%":money(p[1]));
    hit.addEventListener("click",()=>showPoint(l,p));
    hit.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();showPoint(l,p);}});
   }
  }
  // Proyección: puntos consultables, conservando la línea naranja discontinua.
  const forecast=lines.find(l=>l.label==="Proyección vigente");
  if(active.has("Proyección vigente")){
   for(const p of forecast.points){
    const px=x(p[0]),py=y(p[1]);
    const hit=make("circle",{cx:px,cy:py,r:11,fill:"transparent",role:"button",tabindex:"0","aria-label":"Consultar proyección de "+monthNames[p[0]]});
    hit.style.cursor="pointer";
    // Marcadores discretos en cada mes proyectado, incluidos noviembre y diciembre.
    // Se revelan junto con la línea, no antes de la animación.
    if(p[0]>cutMonth-1){
     const marker=make("circle",{cx:px,cy:py,r:p[0]===11?4.6:4,fill:"#ffb443",stroke:"#ffe4ad","stroke-width":"1.5","pointer-events":"none",opacity:"0"});
     marker.dataset.aliaProjectionMonth=String(p[0]);
    }
    const tip=make("title",{},hit);tip.textContent="Proyección · "+monthNames[p[0]]+" · "+money(p[1]);
    hit.addEventListener("click",()=>showPoint(forecast,p));
    hit.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();showPoint(forecast,p);}});
   }
  }
  // Solo el marcador visual en la gráfica; el porcentaje va en la cuarta tarjeta.
  const realLine=lines.find(line=>line.label==="Devengado real");
  const realEnd=realLine&&realLine.points.length?realLine.points[realLine.points.length-1]:null;
  let realHalo=null,realRing=null;
  if(realEnd&&active.has("Devengado real")){
   const px=x(realEnd[0]),py=y(realEnd[1]);
   realHalo=make("circle",{cx:px,cy:py,r:12,fill:"#25e1bd",opacity:".15","pointer-events":"none"});
   realHalo.style.visibility="hidden";
   realRing=make("circle",{cx:px,cy:py,r:7.5,fill:"#082c3d",stroke:"#5effd8","stroke-width":"2.8","pointer-events":"none"});
   const core=make("circle",{cx:px,cy:py,r:4.2,fill:"#baffed","pointer-events":"none"});
   realRing.style.visibility="hidden";core.style.visibility="hidden";
   window.setTimeout(()=>{if(svg.isConnected){realHalo.style.visibility="visible";realRing.style.visibility="visible";core.style.visibility="visible";}},3000);
   const tip=make("title",{},core);
   tip.textContent="Devengado al corte: "+(budget>0?(100*realEnd[1]/budget).toFixed(1)+"%":"sin codificado");
  }
  plot.append(svg);
  // Animar solo después de insertar SVG en el DOM. En Firefox getTotalLength
  // puede fallar sobre geometrías desconectadas y cancelar el gráfico entero.
  try {
   const reduced=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
   if(reduced){for(const marker of svg.querySelectorAll("[data-alia-projection-month]"))marker.setAttribute("opacity","1");}
   if(!reduced){
    const paths=[...svg.querySelectorAll("polyline[data-alia-series]")];
    const duration=3000;
    // La proyección empieza exclusivamente al finalizar el trazado real.
    const realPath=paths.find(path=>path.dataset.aliaSeries==="Devengado real");
    let realAnimation=null;
    const animateStroke=path=>{
     if(!path||typeof path.animate!=="function")return null;
     const len=path.getTotalLength();
     if(!Number.isFinite(len)||len<=0)return null;
     return path.animate([{strokeDasharray:String(len),strokeDashoffset:String(len)},{strokeDasharray:String(len),strokeDashoffset:"0"}],{duration,fill:"both",easing:"ease-in-out"});
    };
    for(const path of paths){
     if(path.dataset.aliaSeries==="Proyección vigente")continue;
     const animation=animateStroke(path);
     if(path===realPath)realAnimation=animation;
    }
    if(realHalo&&realRing&&typeof realHalo.animate==="function"){
     realHalo.animate([{r:9,opacity:.30},{r:17,opacity:.06},{r:9,opacity:.30}],{duration:1900,iterations:Infinity,easing:"ease-in-out"});
     realRing.animate([{strokeWidth:2.8},{strokeWidth:4.2},{strokeWidth:2.8}],{duration:1900,iterations:Infinity,easing:"ease-in-out"});
    }
    const projectionPath=paths.find(path=>path.dataset.aliaSeries==="Proyección vigente");
    if(projectionPath&&typeof projectionPath.animate==="function"){
     // La proyección se dibuja desde el último punto real hasta diciembre.
     // Una máscara SVG revela el trazo discontinuo sin alterar su patrón.
     const projected=lines.find(line=>line.label==="Proyección vigente");
     const startIndex=projected&&projected.points.length?projected.points[0][0]:Math.max(0,cutMonth-1);
     const endIndex=projected&&projected.points.length?projected.points[projected.points.length-1][0]:11;
     const reveal=document.createElementNS(ns,"clipPath");
     const revealId="alia-projection-clip-"+Math.random().toString(36).slice(2);
     reveal.setAttribute("id",revealId);
     const mask=document.createElementNS(ns,"rect");
     const startX=x(startIndex),width=Math.max(0,x(endIndex)-startX);
     mask.setAttribute("x",String(startX-3));
     mask.setAttribute("y","0");
     mask.setAttribute("width","0");
     mask.setAttribute("height","320");
     reveal.append(mask);
     svg.insertBefore(reveal,svg.firstChild);
     projectionPath.setAttribute("clip-path","url(#"+revealId+")");
     // SVG SMIL anima el ancho real de la máscara en Firefox; el trazo
     // naranja permanece discontinuo y se descubre progresivamente.
     const revealWidth=width+9;
     const sweep=document.createElementNS(ns,"animate");
     sweep.setAttribute("attributeName","width");
     sweep.setAttribute("from","0");
     sweep.setAttribute("to",String(revealWidth));
     sweep.setAttribute("dur","1.8s");
     sweep.setAttribute("begin","indefinite");
     sweep.setAttribute("fill","freeze");
     mask.append(sweep);
     const startProjection=()=>{
      if(!svg.isConnected)return;
      if(typeof sweep.beginElement==="function")sweep.beginElement();
      else mask.setAttribute("width",String(revealWidth));
      const markers=[...svg.querySelectorAll("[data-alia-projection-month]")];
      for(const marker of markers){
       const month=Number(marker.dataset.aliaProjectionMonth);
       const delay=width>0?Math.max(0,1800*(x(month)-startX)/width):0;
       if(typeof marker.animate==="function"){
        marker.animate([{opacity:0},{opacity:1}],{duration:140,delay,fill:"forwards"});
       }else marker.setAttribute("opacity","1");
      }
     };
     if(realAnimation)realAnimation.finished.then(startProjection).catch(startProjection);
     else startProjection();
    }
   }
  }catch(error){console.warn("ALIA: animación opcional omitida",error);}
 }
 for(const l of lines){const b=document.createElement("button");b.type="button";b.className="exv-real-history-toggle";b.style.cssText="display:inline-flex;align-items:center;gap:6px;padding:7px 10px;border:1px solid #335c71;background:#0d3043;color:#d8eff5;cursor:pointer";const mark=document.createElement("span");mark.textContent="━";mark.style.color=l.color;mark.style.fontSize="18px";const label=document.createElement("span");label.textContent=l.label;b.append(mark,label);b.setAttribute("aria-pressed",String(active.has(l.label)));b.style.opacity=active.has(l.label)?"1":".4";b.onclick=()=>{if(active.has(l.label))active.delete(l.label);else active.add(l.label);b.setAttribute("aria-pressed",String(active.has(l.label)));b.style.opacity=active.has(l.label)?"1":".4";draw();};legend.append(b);}
 // Dibujar inmediatamente con las series financieras disponibles.
 draw();
}

if(!document.getElementById("alia-monthly-chart-polish")){const style=document.createElement("style");style.id="alia-monthly-chart-polish";style.textContent=`#explorer .exv-monthly-chart-header{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:4px}#explorer .exv-monthly-chart-header h4{margin:0}#explorer .exv-monthly-chart-header button{min-width:48px;text-align:center}#explorer .exv-real-history-plot svg{min-width:0}#explorer .exv-real-history-legend{justify-content:center}#explorer .exv-real-history-panel{overflow:hidden}@keyframes aliaMonthlyReveal{from{stroke-dashoffset:1200}to{stroke-dashoffset:0}}@media(prefers-reduced-motion:reduce){#explorer .exv-real-history-plot *{animation:none!important}}@media(max-width:560px){#explorer .exv-monthly-chart-header{align-items:flex-start}#explorer .exv-monthly-chart-header h4{max-width:65%}}`;document.head.append(style);}
function renderRealTemporal(rs,cutMonth){
 const host=$("ex-pane-source");host.replaceChildren();host.classList.remove("exv-reserved-pane");host.classList.add("exv-temporal-pane");
 const heading=document.createElement("div");heading.className="exv-temporal-head";
 const title=document.createElement("div");heading.append(title);host.append(heading);
 const choice=selectedManagement;
 const rows=choice?rs.filter(r=>(choice.type==="committed"?r.contract:r.process)===choice.id):rs;
 const total=sum(rows,cutMonth);
 const label=choice?(choice.type==="committed"?"CONTRATO ":"PROCESO ")+choice.id:"UNIDAD / ÁREA · DATOS REALES";
 title.innerHTML='<span class="exv-temporal-eyebrow">RAMA 02 / DATOS REALES · CORTE SELECCIONADO</span><h3></h3><p>Información financiera acumulada al reporte · sin interpolación histórica</p>';
 title.querySelector("h3").textContent=label;
 if(choice?.type==="committed"){
  const headingLine=title.querySelector("h3");
  headingLine.style.display="flex";headingLine.style.alignItems="center";headingLine.style.gap="9px";
  const info=document.createElement("button");info.type="button";info.className="exv-contract-info";
  info.textContent="i";info.setAttribute("aria-label","Información del contrato "+choice.id);
  info.setAttribute("aria-expanded","false");info.title="Nombre del proceso y administrador del contrato";
  const panel=document.createElement("div");panel.className="exv-contract-info-panel";panel.hidden=true;
  const unique=(field)=>[...new Set(rows.map(r=>String(r[field]||r.raw_columns?.[field==="process_name"?"17":"59"]||"").trim()).filter(Boolean))];
  const processNames=unique("process_name");
  const admins=unique("contract_administrator");
  const addDetail=(name,values)=>{const line=document.createElement("div");const cap=document.createElement("strong");cap.textContent=name;const val=document.createElement("p");val.textContent=values.length?values.join(" · "):"No disponible en los datos cargados";line.append(cap,val);panel.append(line);};
  addDetail("Nombre del proceso",processNames);
  addDetail("Administrador del contrato",admins);
  info.addEventListener("click",async()=>{
   panel.hidden=!panel.hidden;
   info.setAttribute("aria-expanded",String(!panel.hidden));
   if(panel.hidden)return;
   const fields=panel.querySelectorAll("p");
   fields[0].textContent="Consultando último reporte cargado…";
   fields[1].textContent="Consultando último reporte cargado…";
   try{
    // Metadata-only read: no change to the selected cut, financial records or chart.
    const response=await fetch("/__alia_explorer_history",{cache:"no-store"});
    if(!response.ok)throw Error("Historial no disponible");
    const history=await response.json();
    const series=Array.isArray(history.series)?history.series:[];
    const latest=series.reduce((best,item)=>!best||Number(item.month)>Number(best.month)?item:best,null);
    const contract=String(choice.id||"").trim().toUpperCase();
    const matches=(latest?.records||[]).filter(r=>{
     const raw=r.raw_columns||{};
     return [r.contract,raw["41"],raw["47"]].some(value=>String(value||"").trim().toUpperCase()===contract);
    });
    const values=(field,id)=>[...new Set(matches.map(r=>String(r[field]||r.raw_columns?.[id]||"").trim()).filter(Boolean))];
    if(panel.hidden)return;
    const names=values("process_name","17"),admins=values("contract_administrator","59");
    fields[0].textContent=names.length?names.join(" · "):"No disponible en el último reporte cargado";
    fields[1].textContent=admins.length?admins.join(" · "):"No disponible en el último reporte cargado";
    let source=panel.querySelector(".exv-contract-info-source");
    if(!source){source=document.createElement("small");source.className="exv-contract-info-source";panel.append(source);}
    source.textContent=latest?"Fuente: reporte "+String(latest.month).padStart(2,"0")+" · último mes cargado":"No hay reportes mensuales cargados";
   }catch(error){
    if(panel.hidden)return;
    fields[0].textContent="No se pudo consultar el último reporte";
    fields[1].textContent="Verifica la conexión con ALIA Local";
   }
  });
  headingLine.append(info);title.append(panel);
 }
 const summary=document.createElement("div");summary.className="exv-contract-variance exv-financial-summary";
 const cards=[["CODIFICADO AÑO N",total.budget],["COMPROMETIDO AÑO N",total.committed],["DEVENGADO AÑO N",total.accrued],["% DEVENGADO",total.budget>0?(100*total.accrued/total.budget).toFixed(1)+"%":"—"]];
 for(const [name,value] of cards){
  const card=document.createElement("div");card.className="exv-summary-card";const small=document.createElement("small");small.textContent=name;
  const strong=document.createElement("strong");strong.textContent=typeof value==="number"?money(value):value;card.append(small,strong);summary.append(card);
 }
 summary.style.display="grid";summary.style.gridTemplateColumns="repeat(4,minmax(0,1fr))";summary.style.gap="10px";
 for(const card of summary.children){card.style.minWidth="0";card.style.padding="14px 12px";card.querySelector("strong").style.fontSize="clamp(15px,1.65vw,25px)";}
 const rateCard=summary.lastElementChild;rateCard.style.borderColor="#5effd8";rateCard.querySelector("strong").style.color="#71f5dd";
 host.append(summary);
 const warning=document.createElement("p");warning.className="exv-temporal-note";
 warning.textContent="Los gráficos utilizan exclusivamente los cortes mensuales cargados. Los valores son acumulados al cierre de cada reporte, no pagos del mes.";
 host.append(warning);
 renderMonthlyExecutionChart(host,rows,cutMonth,choice?.type==="committed"?choice.id:null);
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
// Isolated detail table: always uses the latest staged report, never the chart's selected cut.
let latestDetailMonth=null,latestDetailYear=null,detailTableRequest=0;
function latestDetailSnapshot(){
 // A fresh request on each render avoids stale snapshots after an import.
 // The history endpoint is the authoritative collection of loaded monthly cuts.
 return fetch("/__alia_explorer_history",{cache:"no-store"})
  .then(response=>{if(!response.ok)throw Error("Historial no disponible");return response.json();})
  .then(history=>{
   const series=Array.isArray(history.series)?history.series:[];
   const valid=series.filter(item=>Array.isArray(item.records)&&Number.isInteger(Number(item.month))&&Number(item.month)>=1&&Number(item.month)<=12);
   if(!valid.length)throw Error("Sin reportes mensuales");
   const period=item=>{
    const year=Number(item.year||String(item.date||item.report_date||"").match(/^\d{4}/)?.[0]||2026);
    return year*12+Number(item.month);
   };
   const latest=window.ALIADataEngine?.latest(valid)||valid.reduce((best,item)=>!best||period(item)>period(best)?item:best,null);
   latestDetailMonth=Number(latest.month);
   latestDetailYear=Number(latest.year||String(latest.date||latest.report_date||"").match(/^\d{4}/)?.[0]||2026);
   return latest.records;
  });
}
// Rebuilt detail: one selected contract/process, latest loaded snapshot only.
const detailExtraFields=[];
function setupDetailFieldPicker(rows){
 const body=$("ex-rows"),table=body?.closest("table"),heading=$("ex-table-title");
 if(!table||!heading)return;
 let control=document.getElementById("alia-detail-field-picker");
 if(!control){
  control=document.createElement("div");control.id="alia-detail-field-picker";
  control.style.cssText="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:12px 0;color:#9ed6e5;font-size:12px";
  const label=document.createElement("label");label.textContent="AÑADIR COLUMNA ";
  const select=document.createElement("select");select.id="alia-detail-field-select";select.style.cssText="max-width:290px;background:#0b2c3d;color:#e8fcff;padding:7px;border:1px solid #31778a";
  const add=button("AÑADIR +",()=>{
   if(!select.value||detailExtraFields.includes(select.value))return;
   detailExtraFields.push(select.value);renderLatestDetailTable();
  },"exv-link");
  const clear=button("QUITAR ADICIONALES",()=>{detailExtraFields.length=0;renderLatestDetailTable();},"exv-link");
  label.append(select);control.append(label,add,clear);
  heading.parentElement.append(control);
 }
 const select=document.getElementById("alia-detail-field-select");
 const catalog=window.ALIADataEngine?.describe(rows)||[];
 const used=new Set(["contract","process_name","contract_administrator","budget","committed","accrued","advance",...detailExtraFields]);
 select.replaceChildren();
 const empty=document.createElement("option");empty.value="";empty.textContent="Seleccionar campo disponible";select.append(empty);
 for(const field of catalog.filter(f=>!used.has(f.id)&&f.id!=="raw_columns")){
  const option=document.createElement("option");option.value=field.id;option.textContent=field.label+" ("+field.id+")";select.append(option);
 }
 const head=table.querySelector("thead tr");
 if(!head)return;
 head.querySelectorAll("[data-alia-extra]").forEach(el=>el.remove());
 const action=head.lastElementChild;
 for(const field of detailExtraFields){
  const th=document.createElement("th");th.dataset.aliaExtra=field;th.textContent=catalog.find(f=>f.id===field)?.label||field;
  head.insertBefore(th,action);
 }
}
function renderLatestDetailTable(){
 if(!realMode)return;
 const request=++detailTableRequest;
 const body=$("ex-rows"),heading=$("ex-table-title"),column=$("ex-column");
 const path=paneTrails[activePane].map(p=>({...p}));
 const choice=selectedManagement?{...selectedManagement}:null;
 const pathProcess=path.find(p=>p.key==="process");
 const selected=choice|| (pathProcess?{type:"process",id:pathProcess.value}:null);
 column.textContent="Contrato / proceso";
 body.replaceChildren();
 const notice=message=>{
  body.replaceChildren();
  const tr=document.createElement("tr"),td=document.createElement("td");
  td.colSpan=9+detailExtraFields.length;td.textContent=message;tr.append(td);body.append(tr);
 };
 if(!selected){
  heading.textContent="Detalle del contrato o proceso seleccionado";
  notice("Selecciona un contrato o proceso para consultar su último reporte. No se muestran listados generales.");
  return;
 }
 heading.textContent="Detalle de "+selected.id+" · consultando último reporte";
 notice("Consultando la última matriz cargada…");
 latestDetailSnapshot().then(latest=>{
  if(request!==detailTableRequest||!realMode)return;
  const normalize=value=>String(value??"").trim().toUpperCase();
  const scope=fundingScope(filterBy(latest,path));
  const identity=(row,field,index)=>normalize(row[field]??row.raw_columns?.[index]);
  const matched=scope.filter(row=>selected.type==="committed"
   ?identity(row,"contract","41")===normalize(selected.id)
   :identity(row,"process","15")===normalize(selected.id));
  heading.textContent="Detalle de "+selected.id+" · "+String(latestDetailMonth).padStart(2,"0")+"/"+latestDetailYear;
  if(!matched.length){notice("El contrato o proceso seleccionado no consta en la última matriz cargada.");return;}
  setupDetailFieldPicker(latest);
  const rawCoverage=matched.filter(row=>row.raw_columns&&Object.keys(row.raw_columns).length>0).length;
  let audit=document.getElementById("alia-detail-data-audit");
  if(!audit){audit=document.createElement("small");audit.id="alia-detail-data-audit";heading.parentElement.append(audit);}
  audit.style.cssText="display:block;color:#8cbac7;margin-top:5px";
  audit.textContent=rawCoverage===matched.length
   ?"Origen: "+matched.length+" fila(s), columnas originales disponibles; "+Object.keys(matched[0].raw_columns||{}).length+" campos en primera fila"
   :"Origen incompleto: "+rawCoverage+" de "+matched.length+" filas incluyen columnas originales. Revisar respuesta del importador local.";
  const total=sum(matched,latestDetailMonth);
  const tr=document.createElement("tr");
  const contract=identity(matched[0],"contract","41");
  const label=(selected.type==="committed"||contract?"CONTRATO ":"PROCESO ")+(selected.type==="committed"?selected.id:contract||selected.id);
  const distinctMetadata=(field,index)=>{
   const values=matched.flatMap(row=>[row[field],row.raw_columns?.[index],window.ALIADataEngine?.resolve(row,"col:"+index)]).map(value=>String(value??"").trim()).filter(Boolean);
   return [...new Set(values)];
  };
  const processNames=distinctMetadata("process_name","17");
  const administrators=distinctMetadata("contract_administrator","59");
  for(const value of [label,processNames.join(" · ")||"No registrado",administrators.join(" · ")||"No registrado",money(total.budget),money(total.committed),money(total.accrued),money(total.accrued+total.advance),percent(total).toFixed(1)+"%"]){
   const td=document.createElement("td");td.textContent=value;tr.append(td);
  }
  for(const field of detailExtraFields){
   const values=[...new Set(matched.map(row=>window.ALIADataEngine?.resolve(row,field)).filter(value=>value!==null&&value!==undefined&&value!=="").map(String))];
   const td=document.createElement("td");td.textContent=values.length?values.join(" · "):"No disponible en los registros recibidos";tr.append(td);
  }
  const action=document.createElement("td");
  action.textContent="SELECCIONADO";
  tr.append(action);body.replaceChildren(tr);
 }).catch(error=>{
  if(request!==detailTableRequest)return;
  heading.textContent="Detalle del contrato o proceso seleccionado";
  notice("No se pudo verificar el último reporte: "+error.message);
 });
}
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
if(realMode)renderLatestDetailTable();
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

if(!document.getElementById("alia-contract-info-css")){
 const style=document.createElement("style");style.id="alia-contract-info-css";
 style.textContent="#explorer .exv-contract-info{width:23px;height:23px;border-radius:50%;border:1.5px solid #7ce8e4;background:#123b4b;color:#b7faff;font-size:14px;font-weight:800;cursor:pointer;padding:0;line-height:19px;flex-shrink:0}#explorer .exv-contract-info:hover,#explorer .exv-contract-info[aria-expanded=true]{background:#267d85;color:white}#explorer .exv-contract-info-panel{margin:10px 0 12px;padding:14px 16px;background:#0b2b3c;border:1px solid #32687b;border-radius:10px;max-width:680px}#explorer .exv-contract-info-panel[hidden]{display:none}#explorer .exv-contract-info-panel strong{font-size:11px;letter-spacing:.04em;color:#7fd7e6;text-transform:uppercase}#explorer .exv-contract-info-panel p{margin:5px 0 12px;font-size:14px;color:#e7f9fc;white-space:normal}#explorer .exv-contract-info-panel div:last-child p{margin-bottom:0}";
 document.head.append(style);
}
