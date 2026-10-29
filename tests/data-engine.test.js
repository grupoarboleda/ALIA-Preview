"use strict";
// Run in browser after data-engine.js: ALIADataEngineTests.run()
(function(root){
 function run(){
  const e=root.ALIADataEngine;
  const assert=(condition,message)=>{if(!condition)throw Error(message);};
  const rows=[
   {contract:"32-2026",budget:100,raw_columns:{"17":"Obra A","59":"Ing. A","600":"X"}},
   {contract:"32-2026",budget:200,raw_columns:{"17":"Obra A","59":"Ing. A","600":"Y"}},
   {contract:"33-2026",budget:50,raw_columns:{"17":"Obra B","59":"Ing. B","600":"Z"}}
  ];
  const before=JSON.stringify(rows);
  assert(e.resolve(rows[0],"process_name")==="Obra A","Name lookup");
  assert(e.resolve(rows[0],"contract_administrator")==="Ing. A","Administrator lookup");
  assert(e.resolve(rows[0],"col:600")==="X","Arbitrary column lookup");
  assert(e.describe(rows).some(f=>f.id==="col:600"),"Catalog preserves arbitrary columns");
  const result=e.group(rows,{dimensions:["contract"],measures:[{field:"budget",op:"sum",as:"total"},{field:"process_name",op:"distinct",as:"names"}]});
  assert(result.length===2&&result.find(x=>x.dimensions.contract==="32-2026").values.total===300,"Grouping and sum");
  assert(result.find(x=>x.dimensions.contract==="32-2026").values.names===1,"Distinct count");
  assert(e.latest([{year:2025,month:12,records:[]},{year:2026,month:5,records:[]},{year:2026,month:3,records:[]}]).month===5,"Latest chronological month");
  assert(JSON.stringify(rows)===before,"Source records unchanged");
  return {passed:7,failed:0};
 }
 root.ALIADataEngineTests={run};
})(typeof window!=="undefined"?window:globalThis);
