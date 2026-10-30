"use strict";
(()=>{
 const host=document.getElementById('alia-payment-followup');if(!host)return;
 const months=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
 const money=v=>v===null||v===undefined?'Sin dato':Number(v).toLocaleString('es-EC',{style:'currency',currency:'USD',maximumFractionDigits:2});
 const normal=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const matchLabels={unique:'Pagos consecutivos coincidentes',review:'Revisar Pagos',missing:'Sin devengado registrado',zero:'Sin devengo'};
 const colors={planned:'#439fff',pending:'#e59aff',executed:'#32d6ac',unplanned:'#ffb54d'};
 const caseLabels={pending:'Programado No devengado',unplanned:'Devengado No Programado',over_plan:'Devengado sobre lo programado'};
 let config=null,data=null,request=0,initialized=false,tableResize=null,reviewMonth=null,reviewCase="";
 const hero=el('section',undefined,'pf-hero');hero.append(el('div','PROGRAMACIÓN Y DEVENGADO MENSUAL','eyebrow'),el('h2','Lo programado frente a lo devengado'),el('p','Elige un rango de meses. Compara únicamente programación y devengado, y consulta los trámites o casos que coinciden con las facturas sin IVA de cada contrato.'));
 const controls=el('div',undefined,'pf-controls');
 const select=(label,id)=>{const wrap=el('label',label),s=el('select');s.id=id;wrap.append(s);controls.append(wrap);return s;};
 const fill=(s,opts,value)=>{s.replaceChildren();for(const [v,label] of opts){const o=el('option',label);o.value=String(v);s.append(o);}if(value!==undefined&&[...s.options].some(o=>o.value===String(value)))s.value=String(value);};
 const year=select('Ejercicio','pf-year'),basis=select('Programación a comparar','pf-basis'),start=select('Desde','pf-start'),end=select('Hasta','pf-end');
 fill(start,months.map((m,i)=>[i+1,m]));fill(end,months.map((m,i)=>[i+1,m]));fill(basis,[['adjusted','Línea base de pagos ajustada'],['initial','Línea base de pagos inicial']]);hero.append(controls);
 const advanced=el('details',undefined,'pf-source'),summary=el('summary','Fuente de datos · último corte disponible'),cutLabel=el('label','Corte de matriz'),cut=el('select');cut.id='pf-data-cut';cutLabel.append(cut);advanced.append(summary,cutLabel);
 const feedback=el('div','Abre esta sección para consultar la matriz local.','pf-source');feedback.setAttribute('role','status');
 const resultFilters=el('div',undefined,'pf-controls'),searchLabel=el('label','Buscar contrato, proceso, administrador o trámite'),search=el('input');search.type='search';search.placeholder='Busca por número o nombre…';searchLabel.append(search);resultFilters.append(searchLabel);
 const stateLabel=el('label','Estado del proceso'),state=el('select');state.id='pf-state';stateLabel.append(state);resultFilters.append(stateLabel);
 const content=el('div');host.append(hero,advanced,feedback,resultFilters,content);
 function yearCuts(){return config.cuts.filter(c=>Number(c.year)===Number(year.value));}
 function setCuts(){const cuts=yearCuts();fill(cut,cuts.map(c=>[c.token,String(c.month).padStart(2,'0')+'/'+c.year+' · '+c.file]),cuts.at(-1)?.token);}
 async function initialize(){
  if(initialized)return;initialized=true;
  try{const r=await fetch('/__alia_payment_config',{cache:'no-store'});config=await r.json();if(!r.ok)throw Error(config.error||'No se pudieron consultar las matrices');if(!config.cuts.length)throw Error('No hay originales disponibles.');fill(year,config.years.map(y=>[y,String(y)]),config.default_year);setCuts();const last=yearCuts().at(-1)?.month||12;end.value=String(last);start.value=String(Math.max(1,last-2));await load();}
  catch(e){initialized=false;feedback.textContent=e.message;feedback.className='pf-error';}
 }
 async function load(){
  if(!config)return;const ticket=++request;feedback.className='pf-source';feedback.textContent='Consultando programación, devengado y facturas sin IVA…';content.setAttribute('aria-busy','true');
  const query=new URLSearchParams({year:year.value,start:start.value,end:end.value,basis:basis.value,cut:cut.value});
  try{const r=await fetch('/__alia_payment_followup?'+query,{cache:'no-store'}),body=await r.json();if(ticket!==request)return;if(!r.ok)throw Error(body.error||'No se pudo construir el análisis');data=body;reviewCase='';if(!body.months.includes(reviewMonth))reviewMonth=body.end_month;const old=state.value;fill(state,[['','Todos los estados'],...[...new Set(body.rows.flatMap(r=>r.process_status))].sort().map(s=>[s,s])],old);summary.textContent='Fuente: '+body.source.file+' · corte '+String(body.source.month).padStart(2,'0')+'/'+body.year;feedback.textContent=body.rows.length+' contrato/proceso(s) con programación o devengado entre '+months[body.start_month-1]+' y '+months[body.end_month-1]+'. Programación y devengado proceden de '+body.source.file+'.';render();}
  catch(e){if(ticket===request){feedback.className='pf-error';feedback.textContent=e.message;content.replaceChildren();}}finally{if(ticket===request)content.removeAttribute('aria-busy');}
 }
 year.onchange=()=>{setCuts();load();};basis.onchange=cut.onchange=load;
 start.onchange=()=>{if(Number(start.value)>Number(end.value))end.value=start.value;load();};end.onchange=()=>{if(Number(end.value)<Number(start.value))start.value=end.value;load();};
 search.oninput=state.onchange=()=>{if(data)render();};
 const total=(rows,month,field)=>{const values=rows.map(r=>r.monthly.find(m=>m.month===month)?.[field]).filter(v=>v!==null&&v!==undefined);return values.length?values.reduce((a,b)=>a+b,0):null;};
 function render(){
  tableResize?.disconnect();
  content.replaceChildren();const terms=normal(search.value).trim().split(/\s+/).filter(Boolean);
  const rows=data.rows.filter(r=>terms.every(t=>normal([r.contract,r.process_code,...r.process_names,...r.administrators,...r.invoices.map(i=>i.procedure)].join(' ')).includes(t))&&(!state.value||r.process_status.includes(state.value)));
  const comparisonTotal=(month,field)=>{const vals=rows.map(r=>r.monthly.find(m=>m.month===month)?.comparison?.[field]).filter(v=>v!==null&&v!==undefined);return vals.length?vals.reduce((a,b)=>a+b,0):null;};
  const values=data.months.map(m=>({month:m,planned:total(rows,m,'planned'),executed:total(rows,m,'executed'),covered:comparisonTotal(m,'covered'),pending:comparisonTotal(m,'pending'),unplanned:comparisonTotal(m,'unplanned'),over_plan:comparisonTotal(m,'over_plan')}));
  const tableRows=reviewCase?rows.filter(r=>(r.monthly.find(m=>m.month===reviewMonth)?.comparison?.[reviewCase]||0)>0):rows;
  const cards=el('div',undefined,'pf-cards pf-two-cards');for(const [key,label,color] of [['planned','PROGRAMADO EN EL RANGO',colors.planned],['executed','DEVENGADO EN EL RANGO',colors.executed]]){const nums=values.map(v=>v[key]).filter(v=>v!==null),card=el('article',undefined,'pf-card'),strong=el('strong',money(nums.length?nums.reduce((a,b)=>a+b,0):null));strong.style.color=color;card.append(el('small',label),strong,el('span',months[data.start_month-1]+' – '+months[data.end_month-1]+' · '+data.year,'pf-muted'));cards.append(card);}content.append(cards);
  const chartPanel=el('section',undefined,'pf-panel');chartPanel.append(el('h3','Programado y devengado por mes'));
  const legend=el('div',undefined,'pf-legend');for(const [label,color] of [['Programado',colors.planned],['Programado No devengado',colors.pending],['Devengado',colors.executed],['Devengado No programado',colors.unplanned]]){const item=el('span'),swatch=el('i');swatch.style.setProperty('--legend',color);item.append(swatch,document.createTextNode(label));legend.append(item);}chartPanel.append(legend);
  if(rows.length)chartPanel.append(chart(values));else chartPanel.append(el('p','No hay contratos para estos filtros.','pf-empty'));
  renderReview(chartPanel,values);chartPanel.append(el('p','Devengado: columnas mensuales de pagos ejecutados de la matriz. No se utiliza el importe neto transferido ni la columna de multas. Meses posteriores al corte: sin dato.','pf-note'));content.append(chartPanel);
  const panel=el('section',undefined,'pf-panel');panel.id='pf-monthly-detail';panel.append(el('h3','Detalle mensual por contrato'),el('p',tableRows.length+' de '+rows.length+' contrato/proceso(s)'+(reviewCase?' · '+months[reviewMonth-1]+': '+caseLabels[reviewCase]+'. La gráfica conserva el grupo general.':'.')+' Desplaza la tabla para consultar los meses del rango. Pulsa un trámite para revisar las facturas coincidentes.','pf-note'));
  if(reviewCase){const reset=el('button','Quitar filtro de diferencias','pf-action');reset.type='button';reset.onclick=()=>{reviewCase='';render();};panel.append(reset);}
  const scroll=el('div',undefined,'pf-table-wrap pf-range-wrap'),table=el('table',undefined,'pf-table pf-range-table');
  const head=el('thead'),top=el('tr'),bottom=el('tr');for(const label of ['ID','Contrato / proceso','Administrador']){const th=el('th',label);th.rowSpan=2;top.append(th);}
  for(const month of data.months){const th=el('th',months[month-1]);th.colSpan=3;th.className='pf-month-group';top.append(th);for(const label of ['Programado','Devengado','N.º trámite / caso'])bottom.append(el('th',label));}
  const status=el('th','Estado del proceso');status.rowSpan=2;top.append(status);head.append(top,bottom);table.append(head);
  const body=el('tbody');for(const r of tableRows){const tr=el('tr'),identity=el('td');identity.append(el('strong',r.contract||'Sin contrato'),el('span',r.process_code,'pf-muted'),el('div',r.process_names.join(' · ')||'Sin nombre en fuente'));tr.append(el('td',String(r.id)),identity,el('td',r.administrators.join(' · ')||'Sin administrador en fuente'));
   for(const m of r.monthly){tr.append(el('td',money(m.planned),'pf-money'),el('td',money(m.executed),'pf-money'));const cell=el('td');cell.dataset.month=String(m.month);const match=m.match;
    if(['zero','missing'].includes(match.status)){cell.textContent=match.status==='zero'?'—':'Sin dato';}
    else{const button=el('button',match.status==='unique'&&match.procedures.length?match.procedures.join(' · '):(matchLabels[match.status]||'Revisar Pagos'),'pf-action pf-match');button.type='button';button.dataset.match=match.status;button.title=matchLabels[match.status];button.onclick=()=>showInvoices(r,m);cell.append(button);if(match.status==='unique'&&match.matches[0].some(i=>!i.procedure))cell.append(el('span','Factura sin número en la fuente','pf-muted'));}
    tr.append(cell);
   }tr.append(el('td',r.process_status.join(' · ')||'Sin estado en fuente'));body.append(tr);
  }
  if(!tableRows.length){const tr=el('tr'),td=el('td','No hay resultados.','pf-empty');td.colSpan=4+3*data.months.length;tr.append(td);body.append(tr);}
  table.append(body);const foot=el('tfoot'),f=el('tr'),label=el('th','TOTAL DEL FILTRO');label.colSpan=3;f.append(label);for(const m of data.months)f.append(el('td',money(total(tableRows,m,'planned')),'pf-money'),el('td',money(total(tableRows,m,'executed')),'pf-money'),el('td','—'));f.append(el('td',''));foot.append(f);table.append(foot);scroll.append(table);
  const topScroll=el('div',undefined,'pf-top-scroll'),spacer=el('div');topScroll.setAttribute('aria-label','Desplazamiento horizontal de los meses');topScroll.tabIndex=0;topScroll.append(spacer);panel.append(topScroll,scroll);content.append(panel);
  topScroll.onscroll=()=>{if(scroll.scrollLeft!==topScroll.scrollLeft)scroll.scrollLeft=topScroll.scrollLeft;};scroll.onscroll=()=>{if(topScroll.scrollLeft!==scroll.scrollLeft)topScroll.scrollLeft=scroll.scrollLeft;};tableResize=new ResizeObserver(()=>spacer.style.width=table.scrollWidth+'px');tableResize.observe(table);requestAnimationFrame(()=>spacer.style.width=table.scrollWidth+'px');
  content.append(el('p','Trámites: pagos consecutivos del último al primero, sin saltos ni combinaciones arbitrarias. Se revisan los meses del más reciente al anterior sin reutilizar pagos. Si la secuencia no coincide con el devengado: Revisar Pagos.','pf-note'));
 }
 function renderReview(panel,values){
  const controls=el('div',undefined,'pf-review-controls'),label=el('label','Mes para revisar'),select=el('select');select.id='pf-review-month';fill(select,data.months.map(m=>[m,months[m-1]]),reviewMonth);label.append(select);controls.append(label);
  const clear=el('button','Ver todos los contratos','pf-action');clear.type='button';clear.onclick=()=>{reviewCase='';render();};controls.append(clear);panel.append(controls);
  select.onchange=()=>{reviewMonth=Number(select.value);reviewCase='';render();};const selected=values.find(v=>v.month===reviewMonth),cards=el('div',undefined,'pf-review-cards');
  const summary=el('div',undefined,'pf-month-summary');summary.dataset.month=String(reviewMonth);
  const planned=selected?.planned,executed=selected?.executed;
  const ratio=reviewMonth>data.source.month||planned===null||planned===undefined||executed===null||executed===undefined?'Sin dato':planned>0?(executed/planned*100).toLocaleString('es-EC',{minimumFractionDigits:2,maximumFractionDigits:2})+'%':planned===0?'Sin base programada':'No aplicable';
  for(const [key,title,value,caption] of [['planned','Total Programado',money(planned),months[reviewMonth-1]+' · '+data.year],['executed','Total Devengado',money(executed),months[reviewMonth-1]+' · '+data.year],['fulfillment','% de cumplimiento',ratio,'Devengado ÷ Programado × 100']]){
   const item=el('article',undefined,'pf-month-metric');item.dataset.metric=key;item.append(el('small',title),el('strong',value),el('span',caption,'pf-muted'));summary.append(item);
  }panel.append(summary);
  for(const [key,title] of Object.entries(caseLabels)){const button=el('button',undefined,'pf-review-case');button.type='button';button.dataset.case=key;button.setAttribute('aria-pressed',String(reviewCase===key));button.disabled=reviewMonth>data.source.month;button.append(el('span',title),el('strong',money(selected?.[key])),el('small',button.disabled?'Mes aún sin observación':'Ver contratos en la tabla ↓'));button.onclick=()=>{reviewCase=key;render();document.getElementById('pf-monthly-detail')?.scrollIntoView({behavior:'smooth',block:'start'});};cards.append(button);}panel.append(cards,el('p','Los importes se comparan por contrato/proceso antes de sumarse. La franja ámbar incluye devengado sin programación y el exceso; las tarjetas los separan. El cumplimiento es Devengado ÷ Programado y puede superar el 100%.','pf-note'));
 }
 function chart(values){
  const wrap=el('div',undefined,'pf-chart-wrap'),ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.classList.add('pf-chart');svg.setAttribute('viewBox','0 0 1200 320');svg.setAttribute('role','group');svg.setAttribute('aria-label','Programado y devengado con diferencias por contrato. Selecciona un mes para revisar.');
  const add=(tag,attrs,text,parent=svg)=>{const n=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;parent.append(n);return n;};
  const max=Math.max(1,...values.flatMap(v=>[v.planned,v.executed].filter(v=>v!==null).map(Math.abs))),signed=values.some(v=>v.planned<0||v.executed<0),L=105,T=24,H=235,step=1070/values.length,zero=signed?T+H/2:T+H,scale=(signed?H/2:H)/max;
  for(let i=0;i<=4;i++){const value=max*i/4,y=zero-value*scale;add('line',{x1:L,x2:1175,y1:y,y2:y,stroke:'#2a4b5b','stroke-dasharray':'3 4'});add('text',{x:L-10,y:y+4,'text-anchor':'end'},(value/1000).toLocaleString('es-EC',{maximumFractionDigits:1})+' mil');}
  for(const [i,item] of values.entries()){
   const middle=L+step*(i+.5),width=Math.min(44,step*.24),group=add('g',{role:'button',tabindex:0,'aria-label':'Revisar '+months[item.month-1]});
   add('rect',{x:L+i*step+3,y:12,width:step-6,height:293,rx:5,fill:item.month===reviewMonth?'#20465a':'transparent','fill-opacity':'.35'},undefined,group);
   for(const [j,key,color] of [[0,'planned',colors.planned],[1,'executed',colors.executed]]){
    const value=item[key];if(value===null)continue;const x=middle+(j===0?-width-3:3);
    const bar=add('rect',{x,y:value>=0?zero-value*scale:zero,width,height:Math.max(1,Math.abs(value)*scale),rx:3,fill:color,'data-series':key,'data-month':item.month},undefined,group);
    add('title',{},months[item.month-1]+' · '+(key==='planned'?'Programado':'Devengado')+': '+money(value),bar);
    if(value>=0&&item.month<=data.source.month){
     if(key==='planned'&&item.pending>0){const segment=add('rect',{x,y:zero-value*scale,width,height:Math.min(value,item.pending)*scale,fill:colors.pending,'data-difference':'pending','data-month':item.month},undefined,group);add('title',{},'Programado sin devengo registrado: '+money(item.pending),segment);}
     if(key==='executed'){
      const excess=(item.unplanned||0)+(item.over_plan||0);if(excess>0){const segment=add('rect',{x,y:zero-value*scale,width,height:Math.min(value,excess)*scale,fill:colors.unplanned,'data-difference':'unplanned','data-month':item.month},undefined,group);add('title',{},'Sin programación registrada: '+money(item.unplanned)+' · Sobre lo programado: '+money(item.over_plan),segment);}
     }
    }
   }
   add('text',{x:middle,y:286,'text-anchor':'middle'},months[item.month-1],group);if(item.executed===null)add('text',{x:middle,y:305,'text-anchor':'middle',style:'font-size:10px'},'Devengado sin dato',group);
   const choose=()=>{reviewMonth=item.month;reviewCase='';render();};group.onclick=choose;group.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose();}};
  }wrap.append(svg);return wrap;
 }
 function showInvoices(row,month){
  const dialog=el('dialog',undefined,'pf-invoice-dialog'),close=el('button','Cerrar ×','pf-action');close.type='button';close.onclick=()=>dialog.close();dialog.append(close,el('h3',(row.contract||row.process_code)+' · '+months[month.month-1]),el('p','Devengado: '+money(month.executed)+' · '+matchLabels[month.match.status],'pf-source'));
  if(month.match.reason)dialog.append(el('p',month.match.reason,'pf-note'));
  month.match.matches.forEach((invoices,index)=>{dialog.append(el('h4','Secuencia del último pago hacia atrás'+' · '+invoices.length+' factura(s)'));for(const invoice of invoices)dialog.append(el('p',(invoice.procedure?'Trámite/caso '+invoice.procedure:'Sin número en fuente')+' · '+money(invoice.amount)+' sin IVA · pago '+invoice.payment_number+' · fila '+invoice.source_row+' · columna '+invoice.amount_column,'pf-note'));});
  dialog.append(el('h4','Facturas del contrato en la matriz'),el('p',data.source.file+' · filas '+row.source_rows.join(', '),'pf-note'));
  const t=el('table',undefined,'pf-table'),head=el('tr');for(const label of ['Pago','Trámite / caso','Facturado sin IVA','Fila','Columna'])head.append(el('th',label));t.append(head);for(const invoice of [...row.invoices].sort((a,b)=>b.payment_number-a.payment_number||a.source_row-b.source_row)){const tr=el('tr');for(const value of [invoice.payment_number,invoice.procedure||'Sin número',money(invoice.amount),invoice.source_row,invoice.amount_column])tr.append(el('td',String(value)));t.append(tr);}dialog.append(t,el('p','Se suman facturas sin IVA consecutivas del último pago hacia atrás. No se saltan pagos ni se reutilizan en meses ya conciliados. Si no coincide: Revisar Pagos.','pf-note'));dialog.addEventListener('close',()=>dialog.remove(),{once:true});document.body.append(dialog);dialog.showModal();
 }
 document.querySelector('.nav[data-page="payments"]')?.addEventListener('click',initialize);
 const filters=document.querySelector('main > .filters'),exportButton=document.getElementById('export');for(const button of document.querySelectorAll('.nav'))button.addEventListener('click',()=>{const active=button.dataset.page==='payments';if(filters)filters.style.display=active?'none':'';if(exportButton)exportButton.hidden=active;});
 document.getElementById('open-payment-followup')?.addEventListener('click',()=>{document.querySelector('.nav[data-page="payments"]').click();window.scrollTo({top:0,behavior:'smooth'});});
})();
