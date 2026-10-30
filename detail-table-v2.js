"use strict";
/* ALIA Detail V2: independent, read-only, latest annual cut only. */
(function(root){
 let ticket=0,lastSelection=null,pickerEvents=null;
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
  pickerEvents?.abort();pickerEvents=null;
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
   const aliases=new Map(catalog.map(c=>["col:"+c.id,(c.aliases||[]).join(" ")]));
   const read=(row,field)=>row.raw_columns?.[sourceIds.get(field)]??row[field];
   const controls=node("div");controls.className="alia-detail-controls";
   const picker=node("div");picker.className="alia-column-picker";
   const trigger=node("button","Seleccionar columna original ▾");trigger.type="button";trigger.setAttribute("role","combobox");trigger.setAttribute("aria-label","Columna original");trigger.setAttribute("aria-haspopup","listbox");trigger.setAttribute("aria-expanded","false");trigger.setAttribute("aria-controls","alia-column-options");
   const popup=node("div");popup.className="alia-column-popup";popup.hidden=true;
   const searchLabel=node("label","Buscar en las columnas");searchLabel.className="alia-column-search";
   const search=node("input");search.type="search";search.placeholder="Escribe parte del nombre o número…";search.value=columnQuery;search.autocomplete="off";searchLabel.append(search);
   const countLabel=node("div");countLabel.className="alia-column-count";countLabel.setAttribute("role","status");countLabel.setAttribute("aria-live","polite");
   const list=node("div");list.id="alia-column-options";list.setAttribute("role","listbox");list.setAttribute("aria-label","Columnas originales");
   popup.append(searchLabel,countLabel,list);picker.append(trigger,popup);
   let chosen="";
   const close=(focus=false)=>{popup.hidden=true;trigger.setAttribute("aria-expanded","false");if(focus)trigger.focus();};
   const add=node("button","Añadir columna");add.type="button";add.disabled=true;add.onclick=()=>{if(!chosen||extras.includes(chosen))return;extras.push(chosen);render({selected,path,filter,realMode});};
   const searchable=text=>String(text).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
   const populate=()=>{
    const tokens=searchable(columnQuery).trim().split(/\s+/).filter(Boolean);
    const choices=[...available].filter(([id,label])=>!extras.includes(id)&&tokens.every(token=>searchable(label+" "+id+" "+(aliases.get(id)||"")).includes(token)));
    list.replaceChildren();
    for(const [id,label] of choices){
     const option=node("button",label+" ("+id+")");option.type="button";option.tabIndex=-1;option.dataset.columnId=id;option.setAttribute("role","option");option.setAttribute("aria-selected",String(id===chosen));
     option.onclick=()=>{chosen=id;trigger.textContent=label+" ("+id+") ▾";add.disabled=false;for(const item of list.children)item.setAttribute("aria-selected",String(item===option));close(true);};
     option.onkeydown=e=>{if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();(e.key==="ArrowDown"?option.nextElementSibling||list.firstElementChild:option.previousElementSibling||list.lastElementChild)?.focus();}};
     list.append(option);
    }
    if(!choices.length)list.append(node("p","No hay columnas que coincidan con la búsqueda."));
    countLabel.textContent=choices.length+" columna(s) disponible(s)";
   };
   search.addEventListener("input",()=>{columnQuery=search.value;populate();});
   search.addEventListener("keydown",e=>{if(e.key==="ArrowDown"){e.preventDefault();list.querySelector('[role="option"]')?.focus();}if(e.key==="Enter"){e.preventDefault();if(list.querySelectorAll('[role="option"]').length===1)list.querySelector('[role="option"]').click();}});
   trigger.onclick=()=>{if(!popup.hidden){close();return;}popup.hidden=false;trigger.setAttribute("aria-expanded","true");search.focus();search.select();};
   trigger.onkeydown=e=>{if(e.key==="ArrowDown"){e.preventDefault();popup.hidden=false;trigger.setAttribute("aria-expanded","true");search.focus();}};
   pickerEvents=new AbortController();
   document.addEventListener("pointerdown",e=>{if(!picker.contains(e.target))close();},{signal:pickerEvents.signal});
   picker.addEventListener("keydown",e=>{if(e.key==="Escape"){e.preventDefault();e.stopPropagation();close(true);}});
   picker.addEventListener("focusout",e=>{if(e.relatedTarget&&!picker.contains(e.relatedTarget))close();});populate();
   const clear=node("button","Quitar adicionales");clear.type="button";clear.onclick=()=>{extras=[];hidden=new Set();render({selected,path,filter,realMode});};
   controls.append(picker,add,clear);rootEl.append(controls);
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
