"use strict";
/* ALIA Detail V2: independent, read-only, latest annual cut only. */
(function(root){
 let ticket=0;
 const val=v=>String(v??"").trim();
 const key=v=>val(v).toUpperCase();
 const get=(r,field,id)=>{const a=r?.[field];return val(a)!==""?a:r?.raw_columns?.[String(id)];};
 const number=v=>{if(typeof v==="number")return Number.isFinite(v)?v:0;const t=val(v);if(!t)return 0;const n=t.includes(",")&&t.includes(".")?(t.lastIndexOf(",")>t.lastIndexOf(".")?t.replace(/\./g,"").replace(",","."):t.replace(/,/g,"")):t.replace(",",".");return Number(n)||0;};
 const format=v=>number(v).toLocaleString("es-EC",{style:"currency",currency:"USD",maximumFractionDigits:2});
 const fields=[["process_name","17","Nombre del proceso"],["contract_administrator","59","Administrador del contrato"],["budget","498","Codificado"],["committed","500","Comprometido"],["accrued","501","Devengado"],["advance","234","Anticipo"]];
 let extras=[];
 function node(tag,text){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;}
 function render({selected,path=[],filter,realMode=true}){
  if(!realMode)return;
  const request=++ticket,rootEl=document.getElementById("alia-detail-v2");
  if(!rootEl)return;
  rootEl.replaceChildren();
  const title=node("h3","Detalle de contrato o proceso · último corte anual");
  const status=node("p","");status.className="alia-detail-status";
  rootEl.append(title,status);
  if(!selected?.id){status.textContent="Selecciona un contrato o proceso para consultar el último corte disponible.";return;}
  status.textContent="Consultando último reporte…";
  fetch("/__alia_explorer_history",{cache:"no-store"}).then(res=>{if(!res.ok)throw Error("No se pudo consultar el historial");return res.json();}).then(history=>{
   if(request!==ticket)return;
   const cuts=(history.series||[]).filter(x=>Array.isArray(x.records)&&Number.isInteger(Number(x.month))&&Number(x.month)>=1&&Number(x.month)<=12);
   const period=x=>{const y=Number(x.year||String(x.date||"").slice(0,4));return Number.isInteger(y)&&y>=2000?y*12+Number(x.month):-1;};
   cuts.sort((a,b)=>period(b)-period(a));
   const latest=cuts[0];if(!latest||period(latest)<0)throw Error("No hay cortes con año y mes válidos");
   const rows=latest.records; // Selection is global to the latest cut; chart filters must not hide matching contracts.
   const isContract=selected.type==="committed"||selected.type==="contract";
   const idField=isContract?"contract":"process",rawId=isContract?"41":"15";
   const matched=rows.filter(r=>key(get(r,idField,rawId))===key(selected.id));
   title.textContent=(isContract?"Contrato ":"Proceso ")+selected.id+" · corte "+String(latest.month).padStart(2,"0")+"/"+Number(latest.year||String(latest.date||"").slice(0,4));
   if(!matched.length){status.textContent="La selección no figura en el último corte. No se mezclaron meses anteriores.";return;}
   const catalog=latest.column_catalog||[];
   const available=new Map(catalog.map(c=>["col:"+c.id,c.label||"Columna "+c.id]));
   for(const r of latest.records)for(const k of Object.keys(r.raw_columns||{}))if(!available.has("col:"+k))available.set("col:"+k,"Columna "+k);
   const controls=node("div");controls.className="alia-detail-controls";
   const selector=node("select");selector.append(node("option","Seleccionar columna original"));selector.firstChild.value="";
   for(const [id,label] of available){if(extras.includes(id))continue;const option=node("option",label+" ("+id+")");option.value=id;selector.append(option);}
   const add=node("button","Añadir columna");add.type="button";add.onclick=()=>{if(!selector.value||extras.includes(selector.value))return;extras.push(selector.value);render({selected,path,filter,realMode});};
   const clear=node("button","Quitar adicionales");clear.type="button";clear.onclick=()=>{extras=[];render({selected,path,filter,realMode});};
   controls.append(selector,add,clear);rootEl.append(controls);
   const columns=[["ident","Contrato / proceso"],...fields.map(f=>[f[0],f[2]]),...extras.map(id=>[id,available.get(id)||id])];
   const wrap=node("div");wrap.className="table-wrap";const table=node("table"),thead=node("thead"),tr=node("tr");
   for(const [,label] of columns)tr.append(node("th",label));thead.append(tr);table.append(thead);
   const tbody=node("tbody"),line=node("tr");
   const distinct=(field,id)=>[...new Set(matched.flatMap(r=>[r[field],r.raw_columns?.[String(id)]].map(val).filter(Boolean)))];
   const numeric=field=>matched.reduce((sum,r)=>sum+number(get(r,field,fields.find(f=>f[0]===field)?.[1])),0);
   const values=[(isContract?"CONTRATO ":"PROCESO ")+selected.id,
     distinct("process_name","17").join(" · ")||"Sin dato en origen",
     distinct("contract_administrator","59").join(" · ")||"Sin dato en origen",
     ...["budget","committed","accrued","advance"].map(numeric).map(format),
     ...extras.map(id=>[...new Set(matched.map(r=>val(r.raw_columns?.[id.slice(4)])).filter(Boolean))].join(" · ")||"Sin dato en origen")];
   for(const v of values)line.append(node("td",v));tbody.append(line);table.append(tbody);wrap.append(table);rootEl.append(wrap);
   const count=matched.filter(r=>r.raw_columns&&Object.keys(r.raw_columns).length).length;
   status.textContent=matched.length+" fila(s) del corte "+String(latest.month).padStart(2,"0")+"/"+latest.year+" · "+count+" con columnas originales de "+matched.length+". "+(count<matched.length?"Faltan columnas en el almacenamiento; se requiere reimportar el corte correspondiente.":"");
  }).catch(error=>{if(request===ticket)status.textContent="Error de consulta: "+error.message;});
 }
 root.ALIADetailV2={render};
})(window);
