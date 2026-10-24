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
message.insertAdjacentElement("afterend",auditPanel);
function auditLine(label,value){const p=document.createElement("p");const b=document.createElement("strong");b.textContent=label+": ";p.append(b,document.createTextNode(String(value)));return p;}
const issueNames={
 ADVANCE_RESEMBLES_EXCEL_DATE:"Aviso antiguo: importe confundido con posible fecha",
 COLUMN_MISMATCH:"El encabezado no coincide con el diccionario",
 INVALID_NUMBER:"Valor no numérico en un campo que requiere número",
 MISSING_PROCESS_CODE:"Falta el código del proceso",
 PHYSICAL_OUT_OF_RANGE:"Avance físico fuera del rango permitido",
 INVALID_REPORT_DATE:"Fecha de reporte no válida",
 NO_INTERNAL_REPORT_DATE:"La fecha de corte real no está verificada",
 MULTIPLE_REPORT_DATES:"Se encontraron varias fechas de reporte"
};
function describeIssue(issue){
 const legacy=issue.code==="ADVANCE_RESEMBLES_EXCEL_DATE";
 const label=issueNames[issue.code]||"Observación de validación";
 const where=[issue.row?"Fila "+issue.row:null,issue.column?"columna "+issue.column:null,issue.field?"campo "+issue.field:null].filter(Boolean).join(" · ");
 const value=issue.value===undefined?"":" · Valor: "+issue.value;
 const advice=legacy?" · Aviso de una carga anterior. El número por sí solo no demuestra que sea una fecha. Vuelve a cargar este mes para recalcular sin esta regla.":issue.code==="COLUMN_MISMATCH"?" · Comprobar número de columna y encabezado.":" · Revisar en el archivo original.";
 return (legacy?"AVISO ANTIGUO · ":"")+label+(where?" · "+where:"")+value+advice;
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
  const detail=document.createElement("details");const detailTitle=document.createElement("summary");detailTitle.textContent="Ver "+data.issues.length+" observaciones (fila, columna, motivo)";detail.append(detailTitle);
  for(const issue of data.issues){const p=document.createElement("p");p.textContent=describeIssue(issue);detail.append(p);}
  auditPanel.append(detail);
  if(data.issues.some(x=>x.code==="ADVANCE_RESEMBLES_EXCEL_DATE"))auditPanel.append(auditLine("Importante","Estas observaciones son de una carga anterior. La regla fue retirada; vuelve a cargar el archivo para corregir los importes y recalcular la auditoría."));
  const catalog=document.createElement("details");const title=document.createElement("summary");title.textContent="Diccionario detectado: "+(data.column_catalog||[]).length+" columnas";catalog.append(title);
  for(const col of (data.column_catalog||[]))catalog.append(auditLine("#"+col.id+" · "+col.column,col.label+(col.mapped_field?" [ALIA: "+col.mapped_field+"]":"")));
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