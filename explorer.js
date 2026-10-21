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

// Budget-weighted project map and searchable ranking. Each row is a clickable drill target.
const projectControls={area:{query:"",sort:"gap",limit:10},source:{query:"",sort:"gap",limit:10}};
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
 const insight=document.createElement("section");insight.className="exv-management-insight";insight.setAttribute("aria-label","Análisis de prioridad gerencial");
 const baseline=sum(filtered,cut()),gaps=items.map(g=>({name:g.value,...sum(g.rows,cut())})).map(g=>({...g,gap:Math.max(0,g.budget-g.accrued)})).sort((a,b)=>b.gap-a.gap);
 const totalGap=gaps.reduce((n,g)=>n+g.gap,0),top3=gaps.slice(0,3),topGap=top3.reduce((n,g)=>n+g.gap,0);
 const insightTitle=document.createElement("h3");insightTitle.textContent="LECTURA GERENCIAL · ¿DÓNDE INTERVENIR?";
 const insightMetrics=document.createElement("div");insightMetrics.className="exv-management-metrics";
 const balances=[
 ["SALDO POR DEVENGAR",money(totalGap),"pending"],
 ["POR COMPROMETER",money(Math.max(0,baseline.budget-baseline.committed)),"uncommitted"],
 ["COMPROMETIDO POR DEVENGAR",money(Math.max(0,baseline.committed-baseline.accrued)),"committed"],
 ["DEVENGADO / COMPROMETIDO",baseline.committed?(100*baseline.accrued/baseline.committed).toFixed(1)+"%":"N/D",null],
 ["CONCENTRACIÓN TOP 3",totalGap?(100*topGap/totalGap).toFixed(1)+"%":"0.0%",null],
 ["EJECUCIÓN ACTUAL",percent(baseline).toFixed(1)+"%",null]
 ];
 const detail=document.createElement("section");detail.className="exv-balance-detail";detail.hidden=true;
 const detailHead=document.createElement("div");detailHead.className="exv-balance-detail-head";
 const detailTitle=document.createElement("strong");
 const closeDetail=button("✕ CERRAR",()=>{detail.hidden=true;insightMetrics.querySelectorAll("button").forEach(b=>b.setAttribute("aria-expanded","false"));},"exv-balance-close");
 detailHead.append(detailTitle,closeDetail);
 const detailTable=document.createElement("div");detailTable.className="exv-balance-table";
 detail.append(detailHead,detailTable);
 function showBalance(type,label){
  detail.hidden=false;detailTitle.textContent=label+" · DESGLOSE POR PROYECTO Y PROCESO";detailTable.replaceChildren();
  insightMetrics.querySelectorAll("button").forEach(b=>b.setAttribute("aria-expanded",String(b.dataset.balance===type)));
  const entries=filtered.map(r=>{const v=sum([r],cut());return {...r,...v,pending:Math.max(0,v.budget-v.accrued),uncommitted:Math.max(0,v.budget-v.committed),committed:Math.max(0,v.committed-v.accrued)};})
   .filter(r=>r[type]>0).sort((a,b)=>b[type]-a[type]);
  const byProject=new Map();
  for(const r of entries){if(!byProject.has(r.project))byProject.set(r.project,[]);byProject.get(r.project).push(r);}
  for(const [project,rows] of byProject){
   const projectTotal=rows.reduce((v,r)=>v+r[type],0);
   const group=document.createElement("details");group.className="exv-balance-project";group.open=byProject.size<=3;
   const summary=document.createElement("summary");summary.textContent=project+" · "+money(projectTotal)+" · "+rows.length+" proceso(s)";group.append(summary);
   for(const r of rows){const line=document.createElement("div");line.className="exv-balance-process";
    const process=document.createElement("span");process.textContent=r.process+" · "+r.source;
    const amount=document.createElement("strong");amount.textContent=money(r[type]);
    line.append(process,amount);group.append(line);}
   detailTable.append(group);
  }
  if(!entries.length){const empty=document.createElement("p");empty.textContent="No hay saldos positivos en esta selección.";detailTable.append(empty);}
 }
 for(const [label,value,type] of balances){
  const card=document.createElement(type?"button":"div"),small=document.createElement("small"),strong=document.createElement("strong");
  if(type){card.type="button";card.className="exv-balance-action";card.dataset.balance=type;card.setAttribute("aria-expanded","false");card.title="Ver proyectos y procesos que componen este saldo";card.addEventListener("click",()=>showBalance(type,label));}
  small.textContent=label+(type?" ↗":"");strong.textContent=value;card.append(small,strong);insightMetrics.append(card);
 }
 insight.append(insightTitle,insightMetrics,detail);

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
  if(level==="project"&&items.length){projectExplorer(pane,root,items,filtered);$("ex-pane-"+pane).classList.toggle("is-active",isFocused);continue;}
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
function render(requested){if(requested)override=requested;syncFilters();const currentPath=paneTrails[activePane],rs=filterBy(records,currentPath),c=cut(),v=sum(rs,c),level=override||paneOrder[activePane][currentPath.length];
const committedRate=v.budget?100*v.committed/v.budget:0,accruedRate=percent(v),advanceRate=v.budget?100*(v.accrued+v.advance)/v.budget:0;
$("ex-budget").textContent=money(v.budget);
$("ex-committed").textContent=money(v.committed);
$("ex-accrued").textContent=money(v.accrued);
$("ex-advance").textContent=money(v.accrued+v.advance);
$("ex-committed-rate").textContent=committedRate.toFixed(1)+"%";
$("ex-rate").textContent=accruedRate.toFixed(1)+"%";
$("ex-advance-rate").textContent=advanceRate.toFixed(1)+"%";
for(const [id,rate] of [["ex-committed-progress",committedRate],["ex-accrued-progress",accruedRate],["ex-advance-progress",advanceRate]])$(id).style.width=Math.max(0,Math.min(100,rate))+"%";
renderPanes();
$("ex-context").textContent=["CNEL EP · ESMERALDAS",...currentPath.map(p=>p.value)].join(" / ");$("ex-period").textContent="CORTE DEMO · "+({9:"SEP",10:"OCT",11:"NOV",12:"DIC"}[c])+" 2026";
const crumbs=$("ex-breadcrumb");crumbs.replaceChildren();crumbs.append(button("◉ EMPRESA",goHome,"exv-crumb"));currentPath.forEach((p,i)=>crumbs.append(button("› "+p.value,()=>goBackTo(activePane,i+1),"exv-crumb")));
$("ex-title").textContent=level?"Mapa jerárquico · "+names[level]:"Presupuesto total codificado";$("ex-table-title").textContent=level?"Detalle por "+names[level]:"Consolidado de empresa";$("ex-column").textContent=level?names[level]:"Empresa";
const list=groups(rs,level),map=$("ex-map"),body=$("ex-rows");map.replaceChildren();body.replaceChildren();for(const g of list){map.append(tile(g,level,v.budget));const a=sum(g.rows,c),tr=document.createElement("tr");for(const cell of [g.value,money(a.budget),money(a.committed),money(a.accrued),money(a.accrued+a.advance),percent(a).toFixed(1)+"%"]){const td=document.createElement("td");td.textContent=cell;tr.append(td);}const td=document.createElement("td");if(level)td.append(button("EXPLORAR →",()=>drillPane(activePane,level,g.value),"exv-link"));tr.append(td);body.append(tr);}
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
