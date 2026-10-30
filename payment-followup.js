"use strict";
(()=>{
 const host=document.getElementById('alia-payment-followup');if(!host)return;
 const months=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
 const money=v=>v===null||v===undefined?'Sin dato':Number(v).toLocaleString('es-EC',{style:'currency',currency:'USD',maximumFractionDigits:2});
 const normal=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const statuses={in_month:'Con devengo en el mes',later:'Con devengo posterior',not_observed:'Sin devengo observado',missing:'Información incompleta',future:'Mes aún no observado',cash_only:'Transferencias registradas · conciliar'};
 let config=null,data=null,request=0,initialized=false;
 const hero=el('section',undefined,'pf-hero');hero.append(el('div','RAMA NUEVA / TRAZABILIDAD DE PROGRAMACIÓN','eyebrow'),el('h2','Lo programado y su ejecución'),el('p','Elige el mes que programaste y sigue esos contratos hasta el último corte disponible. Conserva la programación de su corte original y distingue devengos de transferencias con evidencia.'));
 const controls=el('div',undefined,'pf-controls');
 const select=(label,id)=>{const wrap=el('label',label),s=el('select');s.id=id;wrap.append(s);controls.append(wrap);return s;};
 const year=select('Ejercicio','pf-year'),month=select('Mes programado','pf-month'),basis=select('Programación a comparar','pf-basis'),plan=select('Corte de programación','pf-plan-cut'),observed=select('Seguimiento hasta el corte','pf-observed-cut');
 const fill=(s,opts,value)=>{s.replaceChildren();for(const [v,label] of opts){const o=el('option',label);o.value=String(v);s.append(o);}if(value!==undefined&&[...s.options].some(o=>o.value===String(value)))s.value=String(value);};
 fill(month,months.map((m,i)=>[i+1,m]));fill(basis,[['adjusted','Línea base ajustada'],['initial','Línea base inicial']]);
 const contract=select('Contrato / proceso en la gráfica','pf-contract');fill(contract,[['','Todos los programados']]);contract.onchange=()=>{if(data)render();};
 const advanceLabel=el('label',undefined,'pf-check'),advance=el('input');advance.type='checkbox';advance.id='pf-advance';advanceLabel.append(advance,el('span','Incluir anticipos en transferencias (separados del devengo)'));controls.append(advanceLabel);hero.append(controls);
 const feedback=el('div','Abre esta rama para consultar los originales locales.','pf-source');feedback.setAttribute('role','status');
 const content=el('div');host.append(hero,feedback,content);
 function yearCuts(){return config.cuts.filter(c=>Number(c.year)===Number(year.value));}
 function setPeriods(reset=false){
  const cuts=yearCuts();const oldObserved=reset?null:observed.value;fill(observed,cuts.map(c=>[c.token,String(c.month).padStart(2,'0')+'/'+c.year+' · '+c.file]),oldObserved||cuts.at(-1)?.token);
  setPlan(reset);
 }
 function setPlan(reset=false){
  const cut=yearCuts().find(c=>c.token===observed.value),cuts=yearCuts().filter(c=>c.month<=(cut?.month||12));
  const previous=reset?null:plan.value,preferred=cuts.filter(c=>c.month<=Number(month.value)).at(-1)||cuts.at(-1);
  fill(plan,cuts.map(c=>[c.token,String(c.month).padStart(2,'0')+'/'+c.year+' · '+c.file]),previous&&cuts.some(c=>c.token===previous)?previous:preferred?.token);
 }
 async function initialize(){
  if(initialized)return;initialized=true;feedback.textContent='Consultando cortes de originales…';
  try{const r=await fetch('/__alia_payment_config',{cache:'no-store'});config=await r.json();if(!r.ok)throw Error(config.error||'No se pudieron consultar los cortes');if(!config.cuts.length)throw Error('No hay originales reconstruidos. Verifica los archivos en el Centro de importación.');fill(year,config.years.map(y=>[y,String(y)]),config.default_year);month.value=String(config.cuts.at(-1).month);setPeriods(true);await load();}
  catch(e){initialized=false;feedback.textContent=e.message;feedback.className='pf-error';}
 }
 async function load(){
  if(!config)return;const ticket=++request;feedback.className='pf-source';feedback.textContent='Consultando programación y ejecución sin modificar registros…';content.setAttribute('aria-busy','true');
  const query=new URLSearchParams({year:year.value,month:month.value,plan:plan.value,observed:observed.value,basis:basis.value,advance:advance.checked?'1':'0'});
  try{const r=await fetch('/__alia_payment_followup?'+query,{cache:'no-store'}),body=await r.json();if(ticket!==request)return;if(!r.ok)throw Error(body.error||'No se pudo construir el seguimiento');data=body;fill(contract,[['','Todos los programados'],...body.rows.map(r=>[JSON.stringify([r.contract,r.process_code]),(r.contract||'Sin contrato')+' · '+r.process_code])],contract.value);feedback.textContent='Programación: '+body.plan_source.file+' ('+body.plan_source.sha256.slice(0,10)+') · Ejecución observada: '+body.observed_source.file+' ('+body.observed_source.sha256.slice(0,10)+') · '+body.summary.groups+' contrato/proceso(s) con programación en '+months[body.programmed_month-1]+'.';render();}
  catch(e){if(ticket===request){feedback.className='pf-error';feedback.textContent=e.message;content.replaceChildren();}}finally{if(ticket===request)content.removeAttribute('aria-busy');}
 }
 year.onchange=()=>{setPeriods(true);load();};month.onchange=()=>{setPlan(true);load();};observed.onchange=()=>{setPlan();load();};plan.onchange=basis.onchange=advance.onchange=load;
 function sum(rows,key){const values=rows.map(r=>r[key]).filter(v=>v!==null&&v!==undefined);return values.length?values.reduce((a,b)=>a+b,0):null;}
 function render(){
  content.replaceChildren();
  const selectedRows=contract.value?data.rows.filter(r=>JSON.stringify([r.contract,r.process_code])===contract.value):data.rows;
  const cards=el('div',undefined,'pf-cards');
  for(const [label,value,note] of [
   ['PROGRAMADO EN '+months[data.programmed_month-1].toUpperCase(),sum(selectedRows,'planned'),'Según el corte de programación seleccionado'],
   ['DEVENGO / EJECUCIÓN EN EL MES',sum(selectedRows,'execution_in_month'),'Importes del bloque de ejecución mensual'],
   ['DEVENGO POSTERIOR HASTA '+months[data.observed_month-1].toUpperCase(),sum(selectedRows,'execution_later'),'De estos contratos; vínculo con la cuota por conciliar'],
   ['TRANSFERIDO DESDE EL MES',sum(selectedRows,'transferred_since_month'),'Facturas netas'+(data.include_advance?' + anticipos':'')+' con fecha, trámite e importe, sin repetición ambigua']]){
    const card=el('article',undefined,'pf-card');card.append(el('small',label),el('strong',money(value)),el('span',note,'pf-muted'));cards.append(card);
  }
  content.append(cards,el('p',data.interpretation,'pf-warning'));
  const reviewCount=selectedRows.reduce((n,r)=>n+r.review_events,0);if(reviewCount)content.append(el('p',reviewCount+' registro(s) de trámite requieren revisión. Sus importes no se suman automáticamente como transferencias independientes.','pf-warning'));
  const chartPanel=el('section',undefined,'pf-panel');chartPanel.append(el('h3','Programación y ejecución mensual del grupo seleccionado'),el('p',(contract.value?'Contrato '+(selectedRows[0]?.contract||'sin número')+' · ':'Sólo contratos/procesos ')+ 'programados en '+months[data.programmed_month-1]+'. Haz clic en un mes para cambiar el grupo.','pf-note'));
  const legend=el('div',undefined,'pf-legend');for(const [label,color] of [['Programación seleccionada','#75aaf0'],['Devengo / ejecución mensual (matriz)','#71d6bd'],['Transferido con datos completos','#e8b76e']]){const n=el('span'),i=el('i');i.style.setProperty('--legend',color);n.append(i,document.createTextNode(label));legend.append(n);}chartPanel.append(legend);
  if(selectedRows.length)chartPanel.append(chart(selectedRows));else chartPanel.append(el('p','No hay contratos o procesos con un valor programado en este mes y corte.','pf-empty'));
  chartPanel.append(el('p',data.period_note+' Los importes parciales por datos ausentes se identifican en el detalle.','pf-note'));content.append(chartPanel);
  const panel=el('section',undefined,'pf-panel');panel.append(el('h3','Detalle por contrato y proceso'),el('p','Abre «Meses y trámites» para revisar la fecha, el importe y la fila fuente de cada pago. No se asignan automáticamente transferencias a una cuota programada.','pf-note'));
  const filters=el('div',undefined,'pf-controls'),searchLabel=el('label','Buscar contrato, proceso, administrador o trámite'),search=el('input');search.type='search';search.placeholder='Escribe nombre o número…';searchLabel.append(search);filters.append(searchLabel);
  const stateLabel=el('label','Evidencia de ejecución'),state=el('select');fill(state,[['all','Todos'],...Object.entries(statuses).map(([key,label])=>[key,label]),['review','Con trámites por revisar']]);stateLabel.append(state);filters.append(stateLabel);panel.append(filters);
  const results=el('div');panel.append(results);content.append(panel);
  function update(){const terms=normal(search.value).trim().split(/\s+/).filter(Boolean);const rows=selectedRows.filter(r=>terms.every(t=>normal([r.contract,r.process_code,...r.process_names,...r.administrators,...r.payments.map(e=>e.procedure)].join(' ')).includes(t))&&(state.value==='all'||state.value==='review'&&r.review_events>0||r.status===state.value));results.replaceChildren(el('p',rows.length+' de '+selectedRows.length+' contrato/proceso(s)','pf-note'));results.append(table(rows));}
  search.oninput=state.onchange=update;update();
 }
 function chart(selectedRows){
  const chartData=selectedRows.length===data.rows.length?data.chart:Array.from({length:12},(_,i)=>{
   const records=selectedRows.map(r=>r.monthly[i]);return {month:i+1,planned:sum(records,'planned'),executed:sum(records,'executed'),transferred:sum(records,'transferred'),missing_execution_rows:records.reduce((n,r)=>n+r.execution_coverage.rows-r.execution_coverage.known,0)};
  });
  const wrap=el('div',undefined,'pf-chart-wrap'),ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.classList.add('pf-chart');svg.setAttribute('viewBox','0 0 1200 330');svg.setAttribute('role','group');svg.setAttribute('aria-label','Comparación mensual de programación, ejecución y transferencias del grupo seleccionado');
  const add=(tag,attrs,text)=>{const n=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;svg.append(n);return n;};
  const max=Math.max(1,...chartData.flatMap(m=>[m.planned,m.executed,m.transferred].filter(v=>v!==null).map(Math.abs))),L=98,R=22,T=25,H=245,W=1200-L-R,step=W/12;
  const signed=chartData.some(m=>[m.planned,m.executed,m.transferred].some(v=>v<0));const zero=signed?T+H/2:T+H,scale=(signed?H/2:H)/max;
  for(let i=0;i<=4;i++){const v=max*i/4,y=zero-v*scale;add('line',{x1:L,x2:1178,y1:y,y2:y,stroke:'#274959','stroke-dasharray':'3 4'});add('text',{x:L-10,y:y+4,'text-anchor':'end'},(v/1000).toLocaleString('es-EC',{maximumFractionDigits:1})+' mil');}
  if(signed)add('text',{x:98,y:315},'Se incluyen ajustes negativos; barras bajo cero.');
  for(const item of chartData){const x=L+(item.month-1)*step,group=document.createElementNS(ns,'g');group.setAttribute('role','button');group.setAttribute('tabindex','0');group.setAttribute('aria-label','Consultar programación de '+months[item.month-1]);
   const hit=document.createElementNS(ns,'rect');hit.setAttribute('class','pf-month-hit');for(const [k,v] of Object.entries({x:x+1,y:10,width:step-2,height:285,rx:5,fill:item.month===data.programmed_month?'#234658':'transparent','fill-opacity':item.month===data.programmed_month?'.65':'1'}))hit.setAttribute(k,v);group.append(hit);
   const title=document.createElementNS(ns,'title');title.textContent=months[item.month-1]+' · Programado '+money(item.planned)+' · Ejecución '+money(item.executed)+' · Transferencias '+money(item.transferred)+(item.missing_execution_rows?' · Cobertura de ejecución incompleta':'');group.append(title);
   for(const [i,key,color] of [[0,'planned','#75aaf0'],[1,'executed','#71d6bd'],[2,'transferred','#e8b76e']]){const v=item[key];if(v===null)continue;const bar=document.createElementNS(ns,'rect');for(const [k,val] of Object.entries({x:x+12+i*19,y:v>=0?zero-v*scale:zero,width:16,height:Math.max(1,Math.abs(v)*scale),rx:2,fill:color}))bar.setAttribute(k,val);group.append(bar);}
   const text=document.createElementNS(ns,'text');text.setAttribute('x',x+step/2);text.setAttribute('y',295);text.setAttribute('text-anchor','middle');text.textContent=months[item.month-1].slice(0,3);group.append(text);if(item.month>data.observed_month){const t=document.createElementNS(ns,'text');t.setAttribute('x',x+step/2);t.setAttribute('y',309);t.setAttribute('text-anchor','middle');t.setAttribute('style','font-size:9px');t.textContent='sin corte';group.append(t);}
   const selectMonth=()=>{month.value=String(item.month);setPlan(true);load();};group.onclick=selectMonth;group.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectMonth();}};svg.append(group);
  }wrap.append(svg);return wrap;
 }
 function table(rows){
  const wrap=el('div',undefined,'pf-table-wrap'),t=el('table',undefined,'pf-table'),head=el('thead'),tr=el('tr');for(const label of ['Contrato / proceso','Administrador','Programado · '+months[data.programmed_month-1],'Ejecutado en el mes','Ejecutado después','Transferencias desde el mes','Trámites / evidencia','Seguimiento'])tr.append(el('th',label));head.append(tr);t.append(head);const body=el('tbody');
  for(const r of rows){const row=el('tr');const identity=el('td');identity.append(el('strong',r.contract||'Sin contrato'),el('span',r.process_code,'pf-muted'),el('div',r.process_names.join(' · ')||'Nombre de proceso ausente en fuente'));row.append(identity,el('td',r.administrators.join(' · ')||'Sin administrador en fuente'));
   for(const key of ['planned','execution_in_month','execution_later','transferred_since_month']){const cell=el('td',money(r[key]),'pf-money');if(key==='execution_later'&&r.later_months.length)cell.append(el('span',r.later_months.map(m=>months[m-1]).join(', '),'pf-muted'));row.append(cell);}
   const evidence=el('td'),window=r.payments.filter(e=>(data.include_advance||e.kind==='Factura')&&(e.month===null||e.month>=data.programmed_month&&e.month<=data.observed_month));const procedures=[...new Set(window.map(e=>e.procedure).filter(Boolean))];evidence.textContent=procedures.slice(0,3).join(' · ')||'Sin trámite en este período';if(procedures.length>3)evidence.append(el('span','+'+(procedures.length-3)+' en el detalle','pf-muted'));if(r.review_events)evidence.append(el('span',r.review_events+' registro(s) por conciliar','pf-muted'));row.append(evidence);
   const action=el('td'),badge=el('span',statuses[r.status],'pf-badge');badge.dataset.status=r.status;const button=el('button','Meses y trámites','pf-action');button.type='button';button.setAttribute('aria-expanded','false');action.append(badge);if(r.partial_execution)action.append(el('span','Cobertura mensual parcial','pf-muted'));if(r.monthly_reconciliation_difference)action.append(el('span','Diferencia entre ejecución mensual y devengado anual: revisar fuente','pf-muted'));action.append(el('br'),button);row.append(action);body.append(row);
   const detail=el('tr',undefined,'pf-detail');detail.hidden=true;const cell=el('td');cell.colSpan=8;detail.append(cell);body.append(detail);button.onclick=()=>{detail.hidden=!detail.hidden;button.setAttribute('aria-expanded',String(!detail.hidden));if(!detail.hidden&&!cell.childNodes.length)renderDetail(cell,r);};
  }if(!rows.length){const row=el('tr'),cell=el('td','No hay resultados para estos filtros.','pf-empty');cell.colSpan=8;row.append(cell);body.append(row);}t.append(body);wrap.append(t);return wrap;
 }
 function smallTable(headers,rows,caption){const t=el('table',undefined,'pf-table');if(caption)t.append(el('caption',caption));const head=el('thead'),tr=el('tr');headers.forEach(h=>tr.append(el('th',h)));head.append(tr);t.append(head);const body=el('tbody');for(const values of rows){const row=el('tr');values.forEach(v=>row.append(el('td',v)));body.append(row);}if(!rows.length){const r=el('tr'),c=el('td','No constan registros para esta selección.');c.colSpan=headers.length;r.append(c);body.append(r);}t.append(body);return t;}
 function renderDetail(cell,r){
  cell.append(el('h4','De la programación a los meses posteriores'),el('p','Programación: '+data.plan_source.file+' · filas '+r.plan_rows.join(', ')+'. Ejecución: '+data.observed_source.file+' · filas '+(r.observed_rows.join(', ')||'no aparece en el corte')+'.','pf-note'));
  cell.append(smallTable(['Mes','Programado','Devengo / ejecución','Transferido con datos completos','Cobertura de ejecución'],r.monthly.map(m=>[months[m.month-1],money(m.planned),money(m.executed),money(m.transferred),m.month>data.observed_month?'Sin corte':m.execution_coverage.known+'/'+m.execution_coverage.rows+' filas']), 'Meses del ejercicio · Sin dato no equivale a cero'));
  cell.append(el('h4','Pagos y trámites registrados en la matriz'));
  const label=el('label',undefined,'pf-note'),all=el('input');all.type='checkbox';label.append(all,document.createTextNode(' Ver también pagos anteriores al mes programado y otros registros del contrato'));cell.append(label);const ledger=el('div');cell.append(ledger);
  const draw=()=>{const events=r.payments.filter(e=>all.checked||e.month===null||e.month>=data.programmed_month&&e.month<=data.observed_month);ledger.replaceChildren(smallTable(['Tipo / pago','Número de trámite / caso','Fecha transferencia','Valor registrado','Mes','Origen','Revisión'],events.map(e=>[e.kind+(e.payment_number?' '+e.payment_number:''),e.procedure||'Ausente en fuente',e.date||'Sin fecha',money(e.amount),e.month?months[e.month-1]:'No determinado','Fila '+e.source_row+' · IDs '+e.column_ids.join('/'),e.issues.join(' · ')||((e.kind==='Anticipo'&&!data.include_advance)?'Anticipo separado; no incluido en suma':'Datos completos; vínculo con cuota por conciliar')]),data.observed_source.file));};all.onchange=draw;draw();
 }
 const nav=document.querySelector('.nav[data-page="payments"]');nav?.addEventListener('click',initialize);
 const filters=document.querySelector('main > .filters'),exportButton=document.getElementById('export');for(const button of document.querySelectorAll('.nav'))button.addEventListener('click',()=>{const active=button.dataset.page==='payments';if(filters)filters.style.display=active?'none':'';if(exportButton)exportButton.hidden=active;});
 document.getElementById('open-payment-followup')?.addEventListener('click',()=>{nav.click();window.scrollTo({top:0,behavior:'smooth'});});
})();
