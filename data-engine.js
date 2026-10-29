"use strict";
/* ALIA universal, non-destructive analytical layer.
   Does not mutate original records or discard raw_columns.
   Works with records supplied by the local importer. */
(function(root){
 const norm=v=>String(v??"").trim();
 const raw=(row,id)=>row?.raw_columns?.[String(id)];
 const resolve=(row,field)=> {
  if(field==="process_name")return row.process_name??raw(row,17);
  if(field==="contract_administrator")return row.contract_administrator??raw(row,59);
  if(/^col:\d+$/.test(field))return raw(row,field.slice(4));
  return row?.[field];
 };
 const describe=(rows,catalog=[])=>{
  const fields=new Map();
  for(const item of catalog){
   const id=String(item.id??item.index??"");
   if(id)fields.set("col:"+id,{id:"col:"+id,label:item.label||item.name||"Columna "+id,source:id});
  }
  for(const row of rows){
   for(const key of Object.keys(row.raw_columns||{})){
    const id="col:"+key;
    if(!fields.has(id))fields.set(id,{id,label:"Columna "+key,source:key});
   }
   for(const key of Object.keys(row)){
    if(key==="raw_columns")continue;
    if(!fields.has(key))fields.set(key,{id:key,label:key,source:key});
   }
  }
  return [...fields.values()];
 };
 const latest=series=>{
  const valid=(series||[]).filter(s=>Array.isArray(s.records)&&Number.isInteger(Number(s.month))&&Number(s.month)>=1&&Number(s.month)<=12);
  const year=s=>Number(s.year||String(s.report_date||s.date||"").match(/^\d{4}/)?.[0]||0);
  return valid.reduce((best,s)=>!best||(year(s)*12+Number(s.month)>year(best)*12+Number(best.month))?s:best,null);
 };
 const group=(rows,{dimensions=[],measures=[],filters=[]}={})=>{
  const selected=(rows||[]).filter(row=>filters.every(f=>f.values?.includes(resolve(row,f.field))));
  const buckets=new Map();
  for(const row of selected){
   const values=dimensions.map(f=>resolve(row,f)??null);
   const key=JSON.stringify(values);
   if(!buckets.has(key))buckets.set(key,{dimensions:Object.fromEntries(dimensions.map((f,i)=>[f,values[i]])),records:[],values:{}});
   buckets.get(key).records.push(row);
  }
  return [...buckets.values()].map(bucket=>{
   for(const m of measures){
    const vals=bucket.records.map(row=>resolve(row,m.field)).filter(v=>v!==null&&v!==undefined&&v!=="");
    const numbers=vals.map(v=>{if(typeof v==="number")return v;if(typeof v!=="string"||!v.trim())return NaN;const t=v.trim().replace(/\s/g,"");const n=t.includes(",")&&t.includes(".")?(t.lastIndexOf(",")>t.lastIndexOf(".")?t.replace(/\./g,"").replace(",","."):t.replace(/,/g,"")):t.replace(",",".");return Number(n);}).filter(Number.isFinite);
    const operation=m.op||"sum";
    bucket.values[m.as||m.field+"_"+operation]=operation==="count"?vals.length:operation==="distinct"?new Set(vals.map(String)).size:operation==="min"?(numbers.length?Math.min(...numbers):null):operation==="max"?(numbers.length?Math.max(...numbers):null):operation==="avg"?(numbers.length?numbers.reduce((a,b)=>a+b,0)/numbers.length:null):numbers.reduce((a,b)=>a+b,0);
   }
   return bucket;
  });
 };
 root.ALIADataEngine=Object.freeze({resolve,describe,latest,group});
})(typeof window!=="undefined"?window:globalThis);
