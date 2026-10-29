"use strict";
/* ALIA Detail V2: independent, read-only, latest annual cut only. */
(function(root){
 let ticket=0,lastSelection=null;
 const val=v=>String(v??"").trim();
 const number=v=>{if(typeof v==="number")return Number.isFinite(v)?v:0;const t=val(v);if(!t)return 0;const n=t.includes(",")&&t.includes(".")?(t.lastIndexOf(",")>t.lastIndexOf(".")?t.replace(/\./g,"").replace(",","."):t.replace(/,/g,"")):t.replace(",",".");return Number(n)||0;};
 const format=v=>number(v).toLocaleString("es-EC",{style:"currency",currency:"USD",maximumFractionDigits:2});
 const fields=[["process_name",null,"Nombre del proceso"],["contract_administrator",null,"Administrador del contrato"],["budget",null,"Codificado"],["committed",null,"Comprometido"],["accrued",null,"Devengado"],["advance",null,"Anticipo"]];
 let extras=[],hidden=new Set(),columnQuery="";
 function node(tag,text){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;}
 function render({selected,path=[],filter,realMode=true,preserveSelection=false}){
  if(preserveSelection&&!selected?.id)selected=lastSelection;
  lastSelection=selected?.id?{...selected}:null;
  if(!realMode)return;
  const request=++ticket,rootEl=document.getElementById("alia-detail-v2");
  if(!rootEl)return;
  rootEl.replaceChildren();
  const title=node("h3","Detalle de contrato o proceso · último corte anual");
  const status=node("p","");status.className="alia-detail-status";
  rootEl.append(title,status);
  if(!selected?.id){status.textContent="Selecciona un contrato o proceso para consultar el último corte disponible.";return;}
  status.textContent="Consultando último reporte…";
  const isContract=selected.type==="committed"||selected.type==="contract";
  const query=new URLSearchParams({kind:isContract?"contract":"process",id:selected.id});
  fetch("/__alia_original_records?"+query,{cache:"no-store"}).then(async res=>{const body=await res.json();if(!res.ok)throw Error(body.error||"No se pudo consultar originales");return body;}).then(latest=>{
   if(request!==ticket)return;
   const matched=latest.records||[];
   title.textContent=(isContract?"Contrato ":"Proceso ")+selected.id+" · corte "+String(latest.month).padStart(2,"0")+"/"+latest.year;
   if(!matched.length){status.textContent="La selección no figura en el último corte. No se mezclaron meses anteriores.";return;}
   const catalog=latest.column_catalog||[];
   const sourceIds=new Map(catalog.filter(c=>c.mapped_field).map(c=>[c.mapped_field,String(c.id)]));
   const available=new Map(catalog.map(c=>["col:"+c.id,c.label||"Columna "+c.id]));
   const read=(row,field)=>row.raw_columns?.[sourceIds.get(field)]??row[field];
   const controls=node("div");controls.className="alia-detail-controls";
   const searchLabel=node("label","Buscar columna");searchLabel.style.cssText="display:flex;flex-direction:column;gap:6px;flex:1 1 100%";
   const search=node("input");search.type="search";search.placeholder="Buscar por nombre o número…";search.value=columnQuery;search.autocomplete="off";searchLabel.append(search);
   const countLabel=node("span");countLabel.setAttribute("role","status");countLabel.setAttribute("aria-live","polite");countLabel.style.cssText="font-size:12px;color:#9ac4d2;flex:1 1 100%";
   const selector=node("select");selector.setAttribute("aria-label","Columna original");
   const add=node("button","Añadir columna");add.type="button";add.disabled=true;add.onclick=()=>{if(!selector.value||extras.includes(selector.value))return;extras.push(selector.value);render({selected,path,filter,realMode});};
   const searchable=text=>String(text).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
   const populate=()=>{
    const previous=selector.value,tokens=searchable(columnQuery).trim().split(/\s+/).filter(Boolean);
    const choices=[...available].filter(([id,label])=>!extras.includes(id)&&tokens.every(token=>searchable(label+" "+id).includes(token)));
    selector.replaceChildren();const placeholder=node("option",choices.length?"Seleccionar columna original":"Sin columnas coincidentes");placeholder.value="";selector.append(placeholder);
    for(const [id,label] of choices){const option=node("option",label+" ("+id+")");option.value=id;selector.append(option);}
    selector.disabled=!choices.length;if(choices.some(([id])=>id===previous))selector.value=previous;
    add.disabled=!selector.value;countLabel.textContent=choices.length+" columna(s) disponible(s)"+(columnQuery?" para esta búsqueda":"");
   };
   search.addEventListener("input",()=>{columnQuery=search.value;populate();});selector.addEventListener("change",()=>{add.disabled=!selector.value;});populate();
   const clear=node("button","Quitar adicionales");clear.type="button";clear.onclick=()=>{extras=[];hidden=new Set();render({selected,path,filter,realMode});};
   controls.append(searchLabel,selector,countLabel,add,clear);rootEl.append(controls);
   const columns=[["ident","Contrato / proceso"],...fields.filter(f=>!hidden.has(f[0])).map(f=>[f[0],f[2]]),...extras.map(id=>[id,available.get(id)||id])];
   const wrap=node("div");wrap.className="table-wrap";const table=node("table"),thead=node("thead"),tr=node("tr");
   for(const [id,label] of columns){const th=node("th",label);if(id!=="ident"){const remove=node("button"," ×");remove.type="button";remove.setAttribute("aria-label","Quitar "+label);remove.onclick=()=>{if(id.startsWith("col:"))extras=extras.filter(x=>x!==id);else hidden.add(id);render({selected,path,filter,realMode});};th.append(remove);}tr.append(th);}thead.append(tr);table.append(thead);
   const tbody=node("tbody"),line=node("tr");
   const distinct=field=>[...new Set(matched.map(r=>val(read(r,field))).filter(Boolean))];
   const numeric=field=>matched.reduce((sum,r)=>sum+number(read(r,field)),0);
   const values=[(isContract?"CONTRATO ":"PROCESO ")+selected.id,
     ...fields.filter(f=>!hidden.has(f[0])).map(([field])=>["budget","committed","accrued","advance"].includes(field)?format(numeric(field)):distinct(field).join(" · ")||"Sin dato en origen"),
     ...extras.map(id=>{const c=catalog.find(c=>String(c.id)===id.slice(4));return c?.type==="money"?format(matched.reduce((sum,r)=>sum+number(r.raw_columns?.[id.slice(4)]),0)):[...new Set(matched.map(r=>val(r.raw_columns?.[id.slice(4)])).filter(Boolean))].join(" · ")||"Sin dato en origen";})];
   for(const v of values)line.append(node("td",v));tbody.append(line);table.append(tbody);wrap.append(table);rootEl.append(wrap);
   const count=matched.filter(r=>r.raw_columns&&Object.keys(r.raw_columns).length).length;
   status.textContent=latest.file+" · "+latest.sha256.slice(0,12)+" · "+matched.length+" fila(s) del corte "+String(latest.month).padStart(2,"0")+"/"+latest.year+" · "+count+" con columnas originales de "+matched.length+". "+(count<matched.length?"Faltan columnas en el almacenamiento; se requiere reimportar el corte correspondiente.":"");
  }).catch(error=>{if(request===ticket)status.textContent="Error de consulta: "+error.message;});
 }
 root.ALIADetailV2={render};
})(window);
