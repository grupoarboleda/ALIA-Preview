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
  row.append(number,title,badge,choose,input);months.append(row);
 }
 issues.replaceChildren();
 const warnings=state.warnings||[];
 for(const w of warnings.slice(0,20)){
  const p=document.createElement("p");p.textContent=w;issues.append(p);
 }
 if(warnings.length>20){const p=document.createElement("p");p.textContent="Y "+(warnings.length-20)+" observaciones adicionales.";issues.append(p);}
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