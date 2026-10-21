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
function drill(key,value){if(key==="area"||key==="source"){choice[key].value=value;view="project";}else if(key==="project"){choice.project.value=value;view="process";}else return;render();}
function render(){sync();const data=subset(),cut=Number($("ex-cut").value),v=sums(data,cut);
$("ex-budget").textContent=fmt(v.budget);$("ex-committed").textContent=fmt(v.committed);$("ex-accrued").textContent=fmt(v.accrued);$("ex-advance").textContent=fmt(v.accrued+v.advance);$("ex-rate").textContent=rate(v).toFixed(1)+"%";
$("ex-context").textContent=["CNEL EP · ESMERALDAS",...Object.entries(selected()).filter(([k,v])=>v!=="all").map(([k,v])=>v)].join(" / ");
$("ex-period").textContent="CORTE DEMO · "+["","", "", "", "", "", "", "", "", "SEP","OCT","NOV","DIC"][cut]+" 2026";
document.querySelectorAll(".exv-tab").forEach(b=>{const on=b.dataset.exview===view;b.classList.toggle("active",on);b.setAttribute("aria-pressed",String(on));});
$("ex-title").textContent="Mapa de "+labels[view].toLowerCase();$("ex-table-title").textContent="Detalle por "+labels[view].toLowerCase();$("ex-column").textContent=labels[view];
const key=view==="total"?null:view;const groups=key?[...new Set(data.map(r=>r[key]))].map(name=>({name,data:data.filter(r=>r[key]===name)})):[{name:"CNEL EP · Unidad Esmeraldas",data}];groups.sort((a,b)=>sums(b.data,cut).budget-sums(a.data,cut).budget);
const map=$("ex-map"),body=$("ex-rows");map.replaceChildren();body.replaceChildren();const total=Math.max(v.budget,1);
for(const [i,g] of groups.entries()){const a=sums(g.data,cut),percent=rate(a),tile=button("",()=>{if(view==="total"){view="area";render();}else drill(key,g.name);},"exv-tile");tile.style.flexGrow=String(Math.max(1,100*a.budget/total));tile.style.background=["linear-gradient(135deg,#155b72,#0a283a)","linear-gradient(135deg,#174c70,#0b243a)","linear-gradient(135deg,#17666b,#0a2b38)"][i%3];const name=document.createElement("b");name.textContent=g.name;const amount=document.createElement("strong");amount.textContent=fmt(a.budget);const small=document.createElement("small");small.textContent=percent.toFixed(1)+"% DEVENGADO";tile.append(name,amount,small);map.append(tile);
const tr=document.createElement("tr");for(const cell of [g.name,fmt(a.budget),fmt(a.committed),fmt(a.accrued),fmt(a.accrued+a.advance),percent.toFixed(1)+"%"]){const td=document.createElement("td");td.textContent=cell;tr.append(td);}const td=document.createElement("td");if(view==="total")td.append(button("ÁREAS →",()=>{view="area";render();},"exv-link"));else if(view!=="process")td.append(button("EXPLORAR →",()=>drill(key,g.name),"exv-link"));else td.textContent="DETALLE";tr.append(td);body.append(tr);}
chart(data);$("ex-back").disabled=view==="total";
}
for(const [key,el] of Object.entries(choice))el.addEventListener("change",()=>{if(key==="area"||key==="source")choice.project.value="all";render();});
$("ex-cut").addEventListener("change",render);
document.querySelectorAll(".exv-tab").forEach(b=>b.addEventListener("click",()=>{view=b.dataset.exview;render();}));
$("ex-home").addEventListener("click",()=>{for(const el of Object.values(choice))el.value="all";view="total";render();});
$("ex-back").addEventListener("click",()=>{view=view==="process"?"project":view==="project"?(choice.area.value!=="all"?"area":choice.source.value!=="all"?"source":"total"):"total";render();});
render();
})();
