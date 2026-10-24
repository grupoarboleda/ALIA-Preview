"use strict";
// Centro de importación ALIA: 12 cortes mensuales, cargas locales, confirmación explícita.
(()=>{
const $=id=>document.getElementById(id);
const names=["ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO","JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"];
const months=$("alia-import-months"),files=$("alia-import-files"),message=$("alia-import-feedback"),issues=$("alia-import-issues");
const activate=$("alia-import-activate");
let state={months:{},active:false};
function show(text,bad=false){message.textContent=text;message.classList.toggle("alia-import-error",bad);}
function draw(){
 const uploaded=Object.keys(state.months||{}).length;
 $("alia-import-count").textContent=uploaded+" / 12";
 $("alia-import-state").textContent=state.active?"ACTIVO":uploaded===12?"LISTO PARA REVISIÓN":uploaded?"EN PREPARACIÓN":"SIN CARGAS";
 $("alia-import-updated").textContent=state.active?"Datos reales activados":"Solo en este equipo";
 activate.disabled=uploaded!==12||state.active||!!state.blocked;
 months.replaceChildren();
 for(let i=1;i<=12;i++){
  const row=document.createElement("div");row.className="alia-import-month";
  const data=state.months[String(i)];
  const number=document.createElement("span");number.className="alia-import-month-num";number.textContent=String(i).padStart(2,"0");
  const title=document.createElement("div");title.className="alia-import-month-name";
  const strong=document.createElement("strong");strong.textContent=names[i-1];
  const detail=document.createElement("small");detail.textContent=data?data.file+" · "+data.records+" filas · "+data.date:"Esperando matriz XLSX";
  title.append(strong,detail);
  const badge=document.createElement("span");badge.className="alia-import-month-status"+(data?" is-loaded":"");
  badge.textContent=data?"CARGADO":"PENDIENTE";
  const input=document.createElement("input");input.type="file";input.accept=".xlsx";input.hidden=true;
  input.addEventListener("change",async()=>{if(input.files[0])await upload(input.files[0],i);input.value="";});
  const choose=document.createElement("button");choose.className="outline";choose.type="button";
  choose.textContent=data?"REEMPLAZAR":"CARGAR";choose.addEventListener("click",()=>input.click());
  if(data){const audit=document.createElement("button");audit.type="button";audit.className="outline";audit.textContent="AUDITAR";audit.addEventListener("click",()=>showAudit(i));row.append(number,title,badge,audit,choose,input);}else{row.append(number,title,badge,choose,input);}months.append(row);
 }
 issues.replaceChildren();
 const warnings=state.warnings||[];
 for(const w of warnings.slice(0,20)){
  const p=document.createElement("p");p.textContent=w;issues.append(p);
 }
 if(warnings.length>20){const p=document.createElement("p");p.textContent="Y "+(warnings.length-20)+" observaciones adicionales.";issues.append(p);}
}
const auditPanel=document.createElement("section");
auditPanel.id="alia-audit-panel";
auditPanel.style.cssText="margin-top:16px;padding:18px;border:1px solid #32738b;border-radius:6px;background:#0b2332;color:#d7f4ff;overflow:auto;max-height:560px";
auditPanel.hidden=true;
auditPanel.style.borderRadius="12px";
auditPanel.style.maxHeight="75vh";
auditPanel.style.background="#0b2332";
const auditCss=document.createElement("style");
auditCss.textContent="#alia-audit-panel .alia-audit-toolbar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:16px 0}#alia-audit-panel .alia-audit-toolbar input{flex:2;min-width:210px}#alia-audit-panel .alia-audit-toolbar select{flex:1;min-width:190px}#alia-audit-panel .alia-audit-count{font-size:12px;opacity:.8}#alia-audit-panel .alia-audit-results{overflow-x:auto}#alia-audit-panel .alia-audit-table{width:100%;border-collapse:collapse;font-size:13px;text-align:left}#alia-audit-panel .alia-audit-table th{background:#153b50;white-space:nowrap}#alia-audit-panel .alia-audit-table td,#alia-audit-panel .alia-audit-table th{padding:11px;border-bottom:1px solid #315064;vertical-align:top}#alia-audit-panel .alia-audit-table tbody tr:hover{background:#18394a}#alia-audit-panel .alia-audit-table small{display:block;opacity:.7;margin-top:4px}#alia-audit-panel .alia-audit-detail{max-width:420px;line-height:1.5;padding:10px 0;overflow-wrap:anywhere}#alia-audit-panel .alia-audit-detail[hidden]{display:none}#alia-audit-panel .alia-audit-pagination{display:flex;align-items:center;justify-content:center;gap:16px;padding:16px}#alia-audit-panel button{cursor:pointer}";
document.head.append(auditCss);
message.insertAdjacentElement("afterend",auditPanel);
function auditLine(label,value){const p=document.createElement("p");const b=document.createElement("strong");b.textContent=label+": ";p.append(b,document.createTextNode(String(value)));return p;}
const issueNames={
 ADVANCE_VALUE_CONFLICT:"Importe de anticipo requiere revisión",
 INVALID_MONETARY_CELL:"Importe no numérico en columna monetaria",
 INVALID_DATE_CELL:"Fecha no válida en campo de fecha",
 INVALID_MONETARY_VALUE:"Importe almacenado no numérico",
 PHYSICAL_PERCENT_OUT_OF_RANGE:"Avance físico fuera del intervalo 0–100 %",
 INVALID_PHYSICAL_PERCENT:"Avance físico no numérico",
 COLUMN_IDS_INCOMPLETE:"Identificadores incompletos del diccionario",
 COLUMN_MISMATCH:"El encabezado no coincide con el diccionario",
 INVALID_NUMBER:"Valor no numérico en un campo que requiere número",
 MISSING_PROCESS_CODE:"Falta el código del proceso",
 PHYSICAL_OUT_OF_RANGE:"Avance físico fuera del rango permitido",
 INVALID_REPORT_DATE:"Fecha de reporte no válida",
 NO_INTERNAL_REPORT_DATE:"La fecha de corte real no está verificada",
 MULTIPLE_REPORT_DATES:"Se encontraron varias fechas de reporte"
};
function describeIssue(issue, catalog=[]){
 const knownIds={advance:502,budget:497,committed:499,accrued:500,accrued_advance:504,physical:226};
 const id=issue.id??knownIds[issue.field]??null;
 const entry=catalog.find(x=>Number(x.id)===Number(id))||catalog.find(x=>x.column===issue.column);
 const label=issueNames[issue.code]||"Observación de validación";
 const parts=[label,id!=null?"ID "+id:null,entry?.label||issue.field,entry?.block,
              issue.column||entry?.column?"Columna Excel "+(issue.column||entry.column):null,
              issue.row?"Fila "+issue.row:null,issue.value!==undefined?"Valor "+issue.value:null,
              issue.detail||null].filter(Boolean);
 return parts.join(" · ");
}

async function showAudit(month){
 auditPanel.hidden=false;auditPanel.replaceChildren(auditLine("AUDITORÍA","Consultando mes "+month+"…"));
 show("Abriendo auditoría de "+names[month-1]+". Consulta el panel debajo de este mensaje.");
 auditPanel.scrollIntoView({behavior:"smooth",block:"start"});
 try{
  const data=await request("/__alia_import_audit?month="+month);
  auditPanel.replaceChildren();
  const heading=document.createElement("h3");heading.textContent="AUDITORÍA · "+names[month-1];auditPanel.append(heading);
  auditPanel.append(auditLine("Archivo",data.file),auditLine("Filas",data.records),
    auditLine("Columnas numeradas catalogadas",(data.column_catalog||[]).length),
    auditLine("Fecha",data.date_origin==="ASSIGNED_MONTH_NOT_VERIFIED"?"Mes asignado, fecha real de corte sin verificar":data.date_origin));
  const totals=data.totals||{};
  auditPanel.append(auditLine("Totales acumulados (no movimientos del mes)",
    "Codificado "+totals.budget+" · Comprometido "+totals.committed+" · Devengado "+totals.accrued));
  if((data.identical_financial_months||[]).length)auditPanel.append(auditLine("ADVERTENCIA: totales financieros idénticos a los meses",data.identical_financial_months.join(", ")));
  const summary=document.createElement("h4");summary.textContent="Observaciones por tipo";auditPanel.append(summary);
  for(const [code,count] of Object.entries(data.issue_counts||{}))auditPanel.append(auditLine(issueNames[code]||code,count));
  const entries=data.issues||[];
  const catalogEntries=data.column_catalog||[];
  const toolbar=document.createElement("div");toolbar.className="alia-audit-toolbar";
  const search=document.createElement("input");search.type="search";search.placeholder="Buscar fila, columna, valor o motivo…";search.setAttribute("aria-label","Buscar observaciones");
  const typeFilter=document.createElement("select");typeFilter.setAttribute("aria-label","Filtrar por tipo de observación");
  for(const [value,label] of [["","Todos los tipos"],...Object.keys(data.issue_counts||{}).map(code=>[code,issueNames[code]||code])]){
   const opt=document.createElement("option");opt.value=value;opt.textContent=label;typeFilter.append(opt);
  }
  const counter=document.createElement("span");counter.className="alia-audit-count";
  const exportBtn=document.createElement("button");exportBtn.type="button";exportBtn.className="outline";exportBtn.textContent="Exportar CSV";
  const clearBtn=document.createElement("button");clearBtn.type="button";clearBtn.className="outline";clearBtn.textContent="Limpiar filtros";
  toolbar.append(search,typeFilter,counter,exportBtn,clearBtn);auditPanel.append(toolbar);
  const results=document.createElement("div");results.className="alia-audit-results";auditPanel.append(results);
  let page=1;const pageSize=15;
  function issueMeta(issue){
   const knownIds={advance:502,budget:497,committed:499,accrued:500,accrued_advance:504,physical:226};
   const id=issue.id??knownIds[issue.field]??null;
   const col=catalogEntries.find(x=>Number(x.id)===Number(id))||catalogEntries.find(x=>x.column===issue.column);
   return {id,col,label:issueNames[issue.code]||issue.code||"Observación",
    field:col?.label||issue.expected||issue.field||"No identificado",
    block:col?.block||"Sin bloque identificado",
    letter:issue.column||col?.column||null};
  }
  function filtered(){
   const q=search.value.trim().toLocaleLowerCase("es");
   return entries.filter(issue=>{
    if(typeFilter.value&&issue.code!==typeFilter.value)return false;
    if(!q)return true;
    const m=issueMeta(issue);
    return [issue.row,issue.value,issue.code,m.id,m.field,m.block,m.letter,describeIssue(issue,catalogEntries)]
     .some(x=>String(x??"").toLocaleLowerCase("es").includes(q));
   });
  }
  function csvEscape(x){const s=String(x??"");return '"'+s.replace(/"/g,'""')+'"';}
  function render(){
   const visible=filtered();const pages=Math.max(1,Math.ceil(visible.length/pageSize));page=Math.min(page,pages);
   counter.textContent=visible.length+" de "+entries.length+" observaciones";results.replaceChildren();
   if(!visible.length){const empty=document.createElement("p");empty.textContent="No hay observaciones con estos filtros.";results.append(empty);return;}
   const table=document.createElement("table");table.className="alia-audit-table";
   const thead=document.createElement("thead");const header=document.createElement("tr");
   for(const label of ["Estado","Fila","Columna ID","Campo / bloque","Valor","Detalle"]){const th=document.createElement("th");th.textContent=label;header.append(th);}
   thead.append(header);table.append(thead);
   const tbody=document.createElement("tbody");
   for(const issue of visible.slice((page-1)*pageSize,page*pageSize)){
    const m=issueMeta(issue);const tr=document.createElement("tr");
    const cells=[
      "Revisar",
      issue.row??"—",m.id??"—",m.field,issue.value??"—"
    ];
    cells.forEach((value,i)=>{const td=document.createElement("td");td.textContent=String(value);if(i===3){const small=document.createElement("small");small.textContent=m.block;td.append(document.createElement("br"),small);}tr.append(td);});
    const td=document.createElement("td");const btn=document.createElement("button");btn.type="button";btn.className="outline";btn.textContent="Ver";
    btn.setAttribute("aria-expanded","false");
    const detail=document.createElement("div");detail.className="alia-audit-detail";detail.hidden=true;
    detail.textContent=describeIssue(issue,catalogEntries);
    const copy=document.createElement("button");copy.type="button";copy.className="outline";copy.textContent="Copiar referencia";
    copy.addEventListener("click",()=>{const ref=m.letter&&issue.row?m.letter+issue.row:"ID "+(m.id??"?")+", fila "+(issue.row??"?");navigator.clipboard?.writeText(ref+" — "+m.field+" — valor "+(issue.value??"")).then(()=>{copy.textContent="Copiado";}).catch(()=>{copy.textContent="No se pudo copiar";});});
    detail.append(document.createElement("br"),copy);
    btn.addEventListener("click",()=>{detail.hidden=!detail.hidden;btn.setAttribute("aria-expanded",String(!detail.hidden));btn.textContent=detail.hidden?"Ver":"Ocultar";});
    td.append(btn,detail);tr.append(td);tbody.append(tr);
   }
   table.append(tbody);results.append(table);
   const nav=document.createElement("div");nav.className="alia-audit-pagination";
   const prev=document.createElement("button");prev.type="button";prev.className="outline";prev.textContent="Anterior";prev.disabled=page===1;prev.onclick=()=>{page--;render();};
   const next=document.createElement("button");next.type="button";next.className="outline";next.textContent="Siguiente";next.disabled=page===pages;next.onclick=()=>{page++;render();};
   const status=document.createElement("span");status.textContent="Página "+page+" de "+pages;nav.append(prev,status,next);results.append(nav);
  }
  search.addEventListener("input",()=>{page=1;render();});typeFilter.addEventListener("change",()=>{page=1;render();});
  clearBtn.addEventListener("click",()=>{search.value="";typeFilter.value="";page=1;render();});
  exportBtn.addEventListener("click",()=>{
   const rows=[["Tipo","Fila Excel","ID columna","Letra Excel","Campo","Bloque","Valor","Descripción"]];
   for(const issue of filtered()){const m=issueMeta(issue);rows.push([m.label,issue.row,m.id,m.letter,m.field,m.block,issue.value,describeIssue(issue,catalogEntries)]);}
   const csv="\uFEFF"+rows.map(row=>row.map(csvEscape).join(";")).join("\r\n");
   const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});const url=URL.createObjectURL(blob);
   const a=document.createElement("a");a.href=url;a.download="ALIA_auditoria_"+String(month).padStart(2,"0")+".csv";a.click();URL.revokeObjectURL(url);
  });
  render();

  const catalog=document.createElement("details");const title=document.createElement("summary");title.textContent="Diccionario detectado: "+(data.column_catalog||[]).length+" columnas";catalog.append(title);
  for(const col of (data.column_catalog||[])){
   const p=document.createElement("p");
   const heading=document.createElement("strong");
   heading.textContent="#"+col.id+" · "+col.column+" · "+col.label;
   p.append(heading);
   const block=col.block||"Otros campos de la matriz";
   p.append(document.createTextNode(" — "+block+(col.subblock?" / "+col.subblock:"")+(col.field_in_subblock?" / "+col.field_in_subblock:"")));
   catalog.append(p);
  }
  auditPanel.append(catalog);
  show("Auditoría de "+names[month-1]+" disponible en el panel superior.");
 }catch(e){auditPanel.replaceChildren(auditLine("Error",e.message));show("Error de auditoría: "+e.message,true);}
}
async function request(path,options){
 let response;try{response=await fetch(path,{cache:"no-store",...options});}catch{throw Error("No se pudo conectar al servidor local de ALIA. El servicio puede estar cerrado o necesitar reiniciarse para cargar el nuevo importador.");}
 let data;try{data=await response.json();}catch{throw Error("El servidor local aún no responde con el módulo de importación. Cierra la ventana de ALIA Local y vuelve a iniciar ALIA Local; después actualiza la página.");}
 if(!response.ok||data.ok===false)throw Error(data.error||"No se pudo completar la operación");
 return data;
}
async function refresh(){
 try{const result=await request("/__alia_import_status");state=result;draw();}
 catch(e){show(e.message,true);}
}
async function upload(file,month=null){
 if(!file.name.toLowerCase().endsWith(".xlsx"))return show("Selecciona un archivo XLSX válido.",true);
 show("Validando "+file.name+"…");
 try{
  const result=await request("/__alia_import_stage",{
   method:"POST",headers:{"Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","X-ALIA-Month":month?String(month):"auto","X-ALIA-Filename":encodeURIComponent(file.name)},body:file
  });
  show("Cargado "+file.name+" para "+names[result.month-1]+". "+result.records+" filas; "+result.warnings+" observaciones. Los datos del explorador no se han reemplazado.");
  await refresh();
 }catch(e){show(file.name+": "+e.message,true);}
}
files.addEventListener("change",async()=>{
 const list=Array.from(files.files||[]);files.disabled=true;
 for(let i=0;i<list.length;i++)await upload(list[i]);
 files.disabled=false;files.value="";
});
$("alia-import-review").addEventListener("click",refresh);
activate.addEventListener("click",async()=>{
 if(!confirm("¿Activar las 12 matrices mensuales verificadas? Reemplazará el conjunto activo de ALIA; las matrices originales permanecerán guardadas localmente."))return;
 activate.disabled=true;show("Consolidando 12 cortes mensuales…");
 try{
  const result=await request("/__alia_import_activate",{method:"POST"});
  show("Se activaron "+result.months+" meses y "+result.records+" filas del último corte. Abre el Explorador financiero y actualiza la página.");
  await refresh();
 }catch(e){show(e.message,true);await refresh();}
});
refresh();
})();