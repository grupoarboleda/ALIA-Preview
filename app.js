"use strict";
// DEMONSTRATION ONLY: Synthetic values, never customer or operational records.
const records=[
{code:"P-001",project:"Modernización de redes",process:"PROC-001",area:"Distribución",budget:1850000,committed:1530000,accrued:1120000,plan:[65000,75000,90000,95000,105000,120000,135000,140000,150000,160000,165000,175000],paid:[45000,70000,80000,85000,92000,110000,125000,128000,132000,0,0,0]},
{code:"P-002",project:"Infraestructura de subestaciones",process:"PROC-002",area:"Infraestructura",budget:2100000,committed:1700000,accrued:960000,plan:[40000,60000,70000,95000,105000,115000,135000,155000,175000,185000,205000,230000],paid:[35000,45000,55000,65000,85000,95000,105000,115000,125000,0,0,0]},
{code:"P-003",project:"Medición inteligente",process:"PROC-003",area:"Comercial",budget:970000,committed:750000,accrued:510000,plan:[25000,35000,45000,55000,65000,75000,85000,95000,105000,115000,125000,145000],paid:[18000,28000,35000,42000,50000,58000,65000,72000,80000,0,0,0]},
{code:"P-004",project:"Rehabilitación de alimentadores",process:"PROC-004",area:"Distribución",budget:1450000,committed:1120000,accrued:750000,plan:[35000,45000,55000,75000,85000,95000,105000,115000,125000,145000,155000,175000],paid:[20000,30000,40000,48000,60000,70000,78000,87000,95000,0,0,0]}
];
const months=["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];
const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat("es-EC",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);
const pct=(n,d)=>d?Math.round(n/d*100):0;
const sum=(arr)=>arr.reduce((a,b)=>a+b,0);
const cumulative=arr=>{let t=0;return arr.map(v=>(t+=v));};
const svgNS="http://www.w3.org/2000/svg";
function svgNode(tag,attrs,parent){const node=document.createElementNS(svgNS,tag);Object.entries(attrs).forEach(([k,v])=>node.setAttribute(k,String(v)));parent.append(node);return node;}
function chart(id,series,cutoff){const svg=$(id);svg.replaceChildren();const max=Math.max(1,...series.flatMap(x=>x.values))*1.12;const width=850,height=250,left=24,right=15,top=18,bottom=24;const x=i=>left+i*(width-left-right)/11,y=v=>height-bottom-v/max*(height-top-bottom);
for(let i=0;i<=4;i++){const yy=top+(height-top-bottom)*i/4;svgNode("line",{x1:left,y1:yy,x2:width-right,y2:yy,stroke:"#2b3954","stroke-dasharray":"4 8"},svg);}
if(cutoff!==undefined){const xx=x(Math.min(11,cutoff-1))+18;svgNode("line",{x1:xx,y1:top,x2:xx,y2:height-bottom,stroke:"#a3b2c9","stroke-dasharray":"4 6",opacity:".5"},svg);}
for(const s of series){const points=s.values.map((v,i)=>[x(i),y(v)]);const d=points.map(([a,b],i)=>(i?"L":"M")+a.toFixed(1)+" "+b.toFixed(1)).join(" ");const path=svgNode("path",{d,fill:"none",stroke:s.color,"stroke-width":3.3,"stroke-linecap":"round","stroke-linejoin":"round",class:"telemetry-line"},svg);const length=path.getTotalLength();path.style.setProperty("--path-length",String(length));points.forEach(([cx,cy],i)=>{if(i===11||i===cutoff-1)svgNode("circle",{cx,cy,r:4,fill:s.color,stroke:"#141e33","stroke-width":2,class:"telemetry-point"},svg);});}}
function signalPlot(id,values,color,options={}) {
 const svg=$(id);if(!svg)return;svg.replaceChildren();
 const width=520,height=190,left=18,right=16,top=17,bottom=23;
 const max=Math.max(1,...values)*1.12,min=options.zero===false?Math.min(0,...values):0;
 const x=i=>left+i*(width-left-right)/Math.max(1,values.length-1);
 const y=v=>height-bottom-(v-min)/(max-min||1)*(height-top-bottom);
 for(let i=0;i<=4;i++){const yy=top+i*(height-top-bottom)/4;svgNode("line",{x1:left,y1:yy,x2:width-right,y2:yy,stroke:"#265067","stroke-dasharray":"2 7",opacity:".8"},svg);}
 for(let i=0;i<values.length;i++){svgNode("line",{x1:x(i),y1:top,x2:x(i),y2:height-bottom,stroke:"#173e52",opacity:".65"},svg);}
 const points=values.map((v,i)=>[x(i),y(v)]);const d=points.map(([a,b],i)=>(i?"L":"M")+a.toFixed(1)+" "+b.toFixed(1)).join(" ");
 if(options.area){const area=d+" L "+x(values.length-1)+" "+(height-bottom)+" L "+x(0)+" "+(height-bottom)+" Z";svgNode("path",{d:area,fill:color,"fill-opacity":".10"},svg);}
 const path=svgNode("path",{d,fill:"none",stroke:color,"stroke-width":"2.7","stroke-linecap":"round","stroke-linejoin":"round",class:"telemetry-line"},svg);path.style.setProperty("--path-length",String(path.getTotalLength()));
 points.forEach(([cx,cy],i)=>{if(i===values.length-1||i===0){svgNode("circle",{cx,cy,r:4,fill:color,class:"telemetry-point"},svg);}});
 if(options.threshold!==undefined){const yy=y(options.threshold);svgNode("line",{x1:left,y1:yy,x2:width-right,y2:yy,stroke:"#ffbe6c","stroke-dasharray":"5 5",opacity:".7"},svg);}
}
function renderSignals(rows,cutoff,budget,accrued,paid){
 const plan=months.map((_,i)=>sum(rows.map(r=>r.plan[i])));
 const payments=months.map((_,i)=>i<cutoff?sum(rows.map(r=>r.paid[i])):0);
 const paidAccum=cumulative(payments);
 signalPlot("signal-execution",plan,"#55e9fa",{area:true});
 signalPlot("signal-convergence",paidAccum.map(v=>budget?100*v/budget:0),"#86f8bf",{area:true,threshold:80});
 const byProject=rows.map(r=>r.budget).sort((a,b)=>b-a);
 signalPlot("signal-distribution",byProject.length?byProject:[0],"#b7a0ff",{area:true});
 $("signal-execution-value").textContent=money(sum(plan));
 $("signal-convergence-value").textContent=pct(paid,budget)+"%";
 $("signal-distribution-value").textContent=String(rows.length).padStart(2,"0");
 $("mission-window").textContent=months[cutoff-1]+" 2026";
 $("mission-state").textContent="ACTUALIZADO";
}
function getFiltered(){const a=$("area").value,p=$("project").value;return records.filter(r=>(a==="all"||r.area===a)&&(p==="all"||r.code===p));}
function render(){const rows=getFiltered(),cutoff=Number($("month").value);const budget=sum(rows.map(r=>r.budget)),committed=sum(rows.map(r=>r.committed)),accrued=sum(rows.map(r=>r.accrued)),paid=sum(rows.map(r=>sum(r.paid.slice(0,cutoff))));$("codificado").textContent=money(budget);$("comprometido").textContent=money(committed);$("devengado").textContent=money(accrued);$("pagado").textContent=money(paid);$("comp-pct").textContent=pct(committed,budget)+"% del codificado";$("dev-pct").textContent=pct(accrued,budget)+"% del codificado";$("paid-pct").textContent="Pagos hasta "+months[cutoff-1];$("balance").textContent=money(budget-accrued);$("ring-value").textContent=pct(accrued,budget)+"%";renderSignals(rows,cutoff,budget,accrued,paid);$("ring").style.background="conic-gradient(#7474fa "+Math.max(0,Math.min(100,pct(accrued,budget)))+"%,#28344b 0%)";
const planned=months.map((_,i)=>sum(rows.map(r=>r.plan[i]))),actual=months.map((_,i)=>i<cutoff?sum(rows.map(r=>r.paid[i])):0);const realCumulative=cumulative(actual).map((v,i)=>i<cutoff?v:null);const lastReal=realCumulative[Math.max(0,cutoff-1)]||0;const forecast=planned.map((_,i)=>i<cutoff?realCumulative[i]:lastReal+sum(planned.slice(cutoff,i+1)));chart("trend",[{values:forecast,color:"#8882ff"},{values:realCumulative.map(v=>v??lastReal),color:"#34d3a5"}],cutoff);chart("monthly",[{values:planned,color:"#8882ff"},{values:actual,color:"#34d3a5"}],cutoff);
$("project-rows").replaceChildren();$("all-rows").replaceChildren();for(const r of rows){const tr=document.createElement("tr");[r.project,r.area,money(r.budget),money(r.accrued)].forEach(v=>{const td=document.createElement("td");td.textContent=v;tr.append(td);});const td=document.createElement("td"),bar=document.createElement("div"),fill=document.createElement("i");bar.className="progress";fill.style.width=Math.min(100,pct(r.accrued,r.budget))+"%";bar.append(fill);td.append(bar);tr.append(td);$("project-rows").append(tr);
const all=document.createElement("tr");[r.code,r.project,r.process,r.area,money(r.budget),money(r.accrued)].forEach(v=>{const td=document.createElement("td");td.textContent=v;all.append(td);});$("all-rows").append(all);}}
function options(id,values){for(const [value,label] of values){const o=document.createElement("option");o.value=value;o.textContent=label;$(id).append(o);}}
options("area",[...new Set(records.map(r=>r.area))].sort().map(x=>[x,x]));options("project",records.map(r=>[r.code,r.project]));["area","project","month"].forEach(id=>$(id).addEventListener("change",render));
$("reset").addEventListener("click",()=>{$("area").value="all";$("project").value="all";$("month").value="9";render();});
const pages={dashboard:["Panel ejecutivo","Seguimiento presupuestario y contractual en un solo lugar."],projects:["Proyectos y procesos","Explora el portafolio de inversiones y sus procesos."],tracking:["Seguimiento mensual","Planificación y ejecución por mes de corte."],feedback:["Observaciones","Tus ideas ayudan a construir ALIA."]};
document.querySelectorAll(".nav").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll(".nav,.page").forEach(el=>el.classList.remove("active"));btn.classList.add("active");$(btn.dataset.page).classList.add("active");$("page-title").textContent=pages[btn.dataset.page][0];$("page-subtitle").textContent=pages[btn.dataset.page][1];}));
$("export").addEventListener("click",()=>{const lines=[["Codigo","Proyecto","Proceso","Area","Codificado","Comprometido","Devengado","Pagado hasta corte"],...getFiltered().map(r=>[r.code,r.project,r.process,r.area,r.budget,r.committed,r.accrued,sum(r.paid.slice(0,Number($("month").value)))] )];const csv="\ufeff"+lines.map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(";")).join("\r\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));a.download="ALIA_preview_demo.csv";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);});
function feedbackText(){return "ALIA Preview — "+$("feedback-module").value+"\n\n"+$("feedback-text").value.trim();}
$("copy-feedback").addEventListener("click",async()=>{if(!$("feedback-text").value.trim()){ $("feedback-status").textContent="Escribe una observación antes de copiar.";return;}try{await navigator.clipboard.writeText(feedbackText());$("feedback-status").textContent="Observación copiada. Puedes pegarla en nuestra conversación.";}catch{$("feedback-status").textContent="No se pudo copiar automáticamente; selecciona el texto y cópialo."; }});
$("github-feedback").addEventListener("click",()=>{if(!$("feedback-text").value.trim()){ $("feedback-status").textContent="Escribe una observación antes de continuar.";return;}const title=encodeURIComponent("[ALIA Preview] "+$("feedback-module").value);const body=encodeURIComponent(feedbackText()+"\n\nNota: No adjuntar datos financieros reales.");window.open("https://github.com/grupoarboleda/ALIA/issues/new?title="+title+"&body="+body,"_blank","noopener,noreferrer");});
$("replay-animation").addEventListener("click",()=>{render();$("mission-state").textContent="REPRODUCIENDO";window.setTimeout(()=>{$("mission-state").textContent="ACTUALIZADO";},2300);});
render();