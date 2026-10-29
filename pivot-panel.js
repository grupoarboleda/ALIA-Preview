"use strict";
/* ALIA configurable pivot: latest imported snapshot, read-only. */
(function(){
 function start(){
  const engine=window.ALIADataEngine,anchor=document.getElementById("ex-table-title");
  if(!engine||!anchor||document.getElementById("alia-pivot"))return;
  const panel=document.createElement("section");panel.id="alia-pivot";
  panel.style.cssText="margin:22px 0;padding:16px;border:1px solid #32687b;border-radius:12px;background:#092b3b;color:#e6faff";
  const title=document.createElement("h3");title.textContent="Análisis dinámico · último corte";title.style.margin="0 0 10px";
  const note=document.createElement("p");note.style.cssText="font-size:12px;color:#9cc5d0";note.textContent="Agrupa por columnas de la matriz y calcula indicadores sin modificar los datos importados. Solo utiliza el último reporte.";
  const controls=document.createElement("div");controls.style.cssText="display:flex;gap:9px;flex-wrap:wrap;align-items:end";
  const status=document.createElement("p");status.style.cssText="font-size:12px;color:#9cc5d0";
  const output=document.createElement("div");output.style.overflowX="auto";
  panel.append(title,note,controls,status,output);
  anchor.parentElement.append(panel);
  const field=(label,options)=>{
   const wrap=document.createElement("label");wrap.style.cssText="font-size:12px;display:flex;flex-direction:column;gap:4px";
   wrap.append(document.createTextNode(label));
   const select=document.createElement("select");select.style.cssText="padding:7px;background:#113a4c;color:white;border:1px solid #487a8a;max-width:260px";
   for(const [value,text] of options){const opt=document.createElement("option");opt.value=value;opt.textContent=text;select.append(opt);}
   wrap.append(select);controls.append(wrap);return select;
  };
  const dimension=field("Agrupar por",[]);
  const second=field("Subgrupo",[]);
  const measure=field("Valor a calcular",[]);
  const operation=field("Operación",[["sum","Suma"],["count","Conteo"],["distinct","Recuento distinto"],["avg","Promedio"],["min","Mínimo"],["max","Máximo"]]);
  const go=document.createElement("button");go.textContent="CALCULAR";go.style.cssText="padding:8px 13px;border-radius:7px;background:#167b91;color:white;border:0;cursor:pointer";controls.append(go);
  let records=[];
  const fill=(select,items)=>{select.replaceChildren();for(const [value,label] of items){const opt=document.createElement("option");opt.value=value;opt.textContent=label;select.append(opt);}};
  const render=()=>{
   output.replaceChildren();
   if(!records.length){status.textContent="El último corte no contiene registros.";return;}
   const dims=[dimension.value,second.value].filter(Boolean);
   if(!dims.length){status.textContent="Selecciona una columna de agrupación.";return;}
   const result=engine.group(records,{dimensions:dims,measures:[{field:measure.value,op:operation.value,as:"result"}]});
   const table=document.createElement("table");table.style.cssText="width:100%;border-collapse:collapse;font-size:12px";
   const head=document.createElement("tr");
   for(const name of [...dims,operation.selectedOptions[0].textContent+" · "+measure.selectedOptions[0].textContent]){
    const th=document.createElement("th");th.textContent=name;th.style.cssText="padding:8px;text-align:left;border-bottom:1px solid #487a8a";head.append(th);
   }
   table.append(head);
   for(const item of result.slice(0,500)){
    const tr=document.createElement("tr");
    for(const value of [...dims.map(d=>item.dimensions[d]),item.values.result]){
     const td=document.createElement("td");td.textContent=value===null||value===undefined?"(vacío)":typeof value==="number"?value.toLocaleString("es-EC",{maximumFractionDigits:2}):String(value);
     td.style.cssText="padding:7px;border-bottom:1px solid #214a59";tr.append(td);
    }table.append(tr);
   }
   output.append(table);
   status.textContent=result.length+" grupo(s); "+records.length+" filas del último corte. "+(result.length>500?"Se muestran los primeros 500 grupos.":"")+" Los saldos de cortes distintos nunca se suman entre sí.";
  };
  go.addEventListener("click",render);
  status.textContent="Consultando matrices existentes…";
  fetch("/__alia_explorer_history",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("Historial no disponible");return r.json();}).then(history=>{
   const cut=engine.latest(history.series||[]);
   if(!cut)throw Error("No existen cortes con registros");
   records=cut.records;
   const catalog=engine.describe(records);
   const options=catalog.filter(x=>x.id!=="raw_columns").map(x=>[x.id,x.label+" ("+x.id+")"]);
   fill(dimension,options);fill(second,[["","Sin subgrupo"],...options]);fill(measure,options);
   for(const [select,candidates] of [[dimension,["area","contract","col:19","col:41"]],[measure,["budget","col:498"]]]){
    const found=candidates.find(key=>[...select.options].some(opt=>opt.value===key));if(found)select.value=found;
   }
   status.textContent="Último corte: "+String(cut.month).padStart(2,"0")+"/"+(cut.year||"año no informado")+" · "+records.length+" filas";
  }).catch(e=>{status.textContent="No se pudo construir el análisis: "+e.message;});
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();
