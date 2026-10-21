"use strict";
/* ALIA financial explorer: all records and historical cuts here are SYNTHETIC.
   The real workbook is not bundled with this public preview. */
(()=>{
const $=id=>document.getElementById(id);
const data=[
{area:"Distribución",source:"BID",project:"Modernización de redes",process:"PROC-001",budget:950000,accrued:580000},
{area:"Distribución",source:"Recursos propios",project:"Modernización de redes",process:"PROC-002",budget:900000,accrued:540000},
{area:"Infraestructura",source:"CAF",project:"Infraestructura de subestaciones",process:"PROC-003",budget:1350000,accrued:630000},
{area:"Infraestructura",source:"Recursos propios",project:"Infraestructura de subestaciones",process:"PROC-004",budget:750000,accrued:330000},
{area:"Comercial",source:"BID",project:"Medición inteligente",process:"PROC-005",budget:600000,accrued:320000},
{area:"Comercial",source:"Recursos propios",project:"Medición inteligente",process:"PROC-006",budget:370000,accrued:190000},
{area:"Distribución",source:"CAF",project:"Rehabilitación de alimentadores",process:"PROC-007",budget:800000,accrued:390000},
{area:"Distribución",source:"Recursos propios",project:"Rehabilitación de alimentadores",process:"PROC-008",budget:650000,accrued:360000}
].map((r,i)=>({...r,id:i}));
const money=n=>new Intl.NumberFormat("es-EC",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);
const rate=(a,b)=>b?100*a/b:0;
const monthFactors={9:[1,1],10:[1.025,1.12],11:[1.04,1.24],12:[1.055,1.34]};
const levels=()=> $("ex-route").value==="source"?["source","area","project","process"]:["area","project","process"];
const labels={source:"Fuente de financiamiento",area:"Área",project:"Proyecto",process:"Proceso"};
let path=[];
const totals=(rows,cut)=>{const factors=monthFactors[cut];return rows.reduce((a,r)=>({budget:a.budget+r.budget*factors[0],accrued:a.accrued+r.accrued*factors[1]}),{budget:0,accrued:0});};
function scoped(){return data.filter(r=>path.every(p=>r[p.key]===p.value));}
function groups(rows,key){const map=new Map();for(const r of rows){if(!map.has(r[key]))map.set(r[key],[]);map.get(r[key]).push(r);}return [...map.entries()].map(([name,items])=>({name,items})).sort((a,b)=>totals(b.items,9).budget-totals(a.items,9).budget);}
function node(tag,attributes,parent){const n=document.createElementNS("http://www.w3.org/2000/svg",tag);for(const [k,v] of Object.entries(attributes))n.setAttribute(k,String(v));parent.append(n);return n;}
function chart(rows){const svg=$("ex-trend");svg.replaceChildren();const cuts=[9,10,11,12],series=cuts.map(c=>totals(rows,c)),max=Math.max(1,...series.map(s=>s.budget))*1.12,w=520,h=230,l=65,r=15,t=22,b=36;
const x=i=>l+i*(w-l-r)/3,y=v=>h-b-v/max*(h-t-b);
for(let i=0;i<5;i++){const yy=t+(h-t-b)*i/4;node("line",{x1:l,y1:yy,x2:w-r,y2:yy,stroke:"#26526b","stroke-dasharray":"4 6"},svg);}
for(const [field,color] of [["budget","#51caff"],["accrued","#78f0c3"]]){const pts=series.map((v,i)=>[x(i),y(v[field])]);const d=pts.map(([px,py],i)=>(i?"L":"M")+px+" "+py).join(" ");const p=node("path",{d,fill:"none",stroke:color,"stroke-width":3,class:"telemetry-line"},svg);p.style.setProperty("--path-length",String(p.getTotalLength()));for(const [px,py] of pts){node("circle",{cx:px,cy:py,r:3.5,fill:color},svg);}}
cuts.forEach((m,i)=>{const label=node("text",{x:x(i),y:h-11,fill:"#98bed0","text-anchor":"middle","font-size":12},svg);label.textContent=["SEP","OCT","NOV","DIC"][i];});
}
function button(text,fn,cls){const b=document.createElement("button");b.type="button";b.textContent=text;b.className=cls;b.addEventListener("click",fn);return b;}
function enter(key,value){path.push({key,value});render();}
function render(){const levelsNow=levels();path=path.filter((p,i)=>levelsNow[i]===p.key);const rows=scoped(),cut=Number($("ex-cut").value),t=totals(rows,cut),index=path.length,next=levelsNow[index];
$("ex-budget").textContent=money(t.budget);$("ex-accrued").textContent=money(t.accrued);$("ex-rate").textContent=rate(t.accrued,t.budget).toFixed(1)+"%";$("ex-balance").textContent=money(t.budget-t.accrued);
const crumbs=$("ex-crumbs");crumbs.replaceChildren();crumbs.append(button("EMPRESA · CNEL EP ESMERALDAS",()=>{path=[];render();},"ex-crumb"));path.forEach((p,i)=>crumbs.append(button(labels[p.key]+": "+p.value,()=>{path=path.slice(0,i+1);render();},"ex-crumb")));
$("ex-title").textContent=next?"Explorar por "+labels[next].toLowerCase():"Detalle del proceso seleccionado";
$("ex-context").textContent=path.length?path.map(p=>p.value).join("  /  "):"Empresa completa · todos los proyectos";
$("ex-column").textContent=next?labels[next]:"Proceso";
const entries=next?groups(rows,next):[{name:path.at(-1)?.value||"Empresa",items:rows}];const totalBudget=t.budget||1;const map=$("ex-map"),body=$("ex-rows");map.replaceChildren();body.replaceChildren();
for(const [i,g] of entries.entries()){const v=totals(g.items,cut),percent=rate(v.accrued,v.budget);const tile=button("",()=>{if(next)enter(next,g.name);},"ex-tile");tile.style.flexGrow=String(Math.max(1,100*v.budget/totalBudget));tile.style.background=["linear-gradient(135deg,#115a74,#0b273b)","linear-gradient(135deg,#134b70,#0b2537)","linear-gradient(135deg,#11616a,#0b2738)"][i%3];
const name=document.createElement("b");name.textContent=g.name;const amount=document.createElement("strong");amount.textContent=money(v.budget);const sub=document.createElement("small");sub.textContent=percent.toFixed(1)+"% DEVENGADO";tile.append(name,amount,sub);map.append(tile);
const tr=document.createElement("tr");for(const value of [g.name,money(v.budget),money(v.accrued),percent.toFixed(1)+"%"]){const td=document.createElement("td");td.textContent=value;tr.append(td);}const td=document.createElement("td");if(next)td.append(button("EXPLORAR →",()=>enter(next,g.name),"ex-link"));else td.textContent="Nivel final";tr.append(td);body.append(tr);}
chart(rows);
$("ex-back").disabled=!path.length;$("ex-back").style.opacity=path.length?"1":".4";
}
$("ex-cut").addEventListener("change",render);$("ex-route").addEventListener("change",()=>{path=[];render();});$("ex-back").addEventListener("click",()=>{path.pop();render();});$("ex-home").addEventListener("click",()=>{path=[];render();});render();
})();
