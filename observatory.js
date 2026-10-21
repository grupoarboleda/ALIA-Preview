"use strict";
/* V3 exploratory prototype. ALL row-level data below are SYNTHETIC.
   The preliminary report aggregates shown in HTML are not derived from these rows. */
(()=>{
const companies=["CNEL EP · Esmeraldas"];
const areas=["Distribución","Comercial","Administrativa Financiera"];
const sources=["Recursos propios","BID","CAF","Mixta"];
const demo=[
["Distribución","BID","Rehabilitación de redes MT","LIC-001",920000],
["Distribución","BID","Rehabilitación de redes MT","LIC-002",380000],
["Distribución","CAF","Modernización de subestaciones","CONS-003",670000],
["Distribución","Recursos propios","Mejoramiento de alimentadores","OBR-004",530000],
["Distribución","Mixta","Telemedición de redes","SUM-005",450000],
["Comercial","BID","Medición inteligente","SUM-006",610000],
["Comercial","Recursos propios","Atención y conexión","SERV-007",340000],
["Comercial","CAF","Reducción de pérdidas comerciales","CONS-008",570000],
["Administrativa Financiera","Recursos propios","Infraestructura operativa","OBR-009",280000],
["Administrativa Financiera","Mixta","Sistemas de información","SERV-010",390000],
["Administrativa Financiera","CAF","Equipamiento institucional","SUM-011",220000]
].map((r,i)=>({id:i+1,company:companies[0],area:r[0],source:r[1],project:r[2],process:r[3],commitment:r[4]}));
const $=id=>document.getElementById(id),selectors={company:$("obs-company"),source:$("obs-source"),area:$("obs-area"),project:$("obs-project"),process:$("obs-process")};
const labels={company:"Empresa",source:"Fuente",area:"Área",project:"Proyecto",process:"Proceso"};
const format=n=>new Intl.NumberFormat("es-EC",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);
const clean=v=>v&&v!=="all"?v:null;
function selected(){return Object.fromEntries(Object.entries(selectors).map(([k,el])=>[k,clean(el.value)]));}
function filtered(except){const state=selected();return demo.filter(r=>Object.entries(state).every(([key,val])=>key===except||!val||r[key]===val));}
function unique(rows,key){return [...new Set(rows.map(r=>r[key]))].sort((a,b)=>a.localeCompare(b,"es"));}
function setOptions(key,values){const el=selectors[key],old=el.value;el.replaceChildren();const all=document.createElement("option");all.value="all";all.textContent="Todos";el.append(all);for(const value of values){const option=document.createElement("option");option.value=value;option.textContent=value;el.append(option);}el.value=values.includes(old)?old:"all";}
function syncOptions(){// Every selector is constrained by the remaining active selections.
 for(const key of Object.keys(selectors)){setOptions(key,unique(filtered(key),key));}}
function makeButton(text,click,css=""){const b=document.createElement("button");b.type="button";b.textContent=text;b.className=css;b.addEventListener("click",click);return b;}
function hierarchy(){const route=$("obs-route").value==="source"?["company","source","area","project","process"]:["company","area","project","process"];const state=selected(),idx=route.findIndex(key=>!state[key]);const active=idx<0?route.length-1:idx;const key=route[active];const parent=$("obs-hierarchy");parent.replaceChildren();const rows=filtered();const categories=unique(rows,key);if(!categories.length){parent.textContent="No hay registros en esta combinación.";return;}
 const totals=categories.map(name=>({name,total:rows.filter(r=>r[key]===name).reduce((a,r)=>a+r.commitment,0)})).sort((a,b)=>b.total-a.total);
 const max=Math.max(...totals.map(x=>x.total),1);
 for(const entry of totals){const b=makeButton("",()=>{selectors[key].value=entry.name;update();},"obs-hierarchy-item");const title=document.createElement("span");title.textContent=entry.name;const value=document.createElement("strong");value.textContent=format(entry.total);const track=document.createElement("i");const fill=document.createElement("em");fill.style.width=(entry.total/max*100)+"%";track.append(fill);b.append(title,value,track);parent.append(b);}
}
function treemap(){const rows=filtered(),el=$("obs-treemap");el.replaceChildren();const state=selected();const key=!state.source&&$("obs-route").value==="source"?"source":!state.area?"area":!state.project?"project":"process";const entries=unique(rows,key).map(name=>({name,total:rows.filter(r=>r[key]===name).reduce((a,r)=>a+r.commitment,0)})).sort((a,b)=>b.total-a.total);
 const total=entries.reduce((a,b)=>a+b.total,0)||1;const palette=["#0d657c","#144b7e","#16596b","#24616b","#214c74","#13586d","#1d5365"];
 for(const [i,e] of entries.entries()){const cell=makeButton("",()=>{selectors[key].value=e.name;update();},"obs-tile");cell.style.flexGrow=String(Math.max(1,e.total/total*100));cell.style.flexBasis=(entries.length>5?"24%":"31%");cell.style.background="linear-gradient(145deg,"+palette[i%palette.length]+",#091c2b)";const title=document.createElement("span");title.textContent=e.name;const value=document.createElement("strong");value.textContent=format(e.total);const share=document.createElement("small");share.textContent=(e.total/total*100).toFixed(1)+"% DE MUESTRA";cell.append(title,value,share);el.append(cell);}
 if(!entries.length){el.textContent="Sin datos para la selección.";}
}
function breadcrumb(){const el=$("obs-path");el.replaceChildren();const state=selected(),route=$("obs-route").value==="source"?["company","source","area","project","process"]:["company","area","project","process"];
 el.append(makeButton("INICIO",()=>{$("obs-clear").click();},"obs-crumb"));for(const key of route){if(!state[key])break;const b=makeButton(labels[key]+": "+state[key],()=>{const pos=route.indexOf(key);for(const downstream of route.slice(pos+1))selectors[downstream].value="all";update();},"obs-crumb");el.append(b);}
}
function table(){const rows=filtered(),body=$("obs-rows");body.replaceChildren();$("obs-count").textContent=rows.length+" registros sintéticos · no representan los 122 registros del reporte";for(const r of rows){const tr=document.createElement("tr");for(const val of [r.company,r.source,r.area,r.project,r.process,format(r.commitment)]){const td=document.createElement("td");td.textContent=val;tr.append(td);}body.append(tr);}}
function update(){syncOptions();breadcrumb();hierarchy();treemap();table();}
for(const [key,el] of Object.entries(selectors))el.addEventListener("change",()=>{if(key==="company"&&el.value==="all"){for(const k of Object.keys(selectors).filter(k=>k!=="company"))selectors[k].value="all";}update();});
$("obs-route").addEventListener("change",update);
$("obs-clear").addEventListener("click",()=>{for(const el of Object.values(selectors))el.value="all";update();});
$("obs-download").addEventListener("click",()=>{const rows=filtered(),lines=[["Empresa","Fuente","Área","Proyecto","Proceso","Compromiso DEMO"],...rows.map(r=>[r.company,r.source,r.area,r.project,r.process,r.commitment])];const csv="\ufeff"+lines.map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(";")).join("\r\n");const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download="ALIA_observatorio_muestra_sintetica.csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);});
update();
})();
