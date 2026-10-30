"""Monthly program/devengo matrix and exact invoice-before-VAT amount matching."""
from collections import defaultdict
from decimal import Decimal
from payment_followup import MONTHS, choices, token, source, clean, decimal, dollars, entity, group_records, series, normalized
from original_records import load_cut


def cents(value):return int((value*100).quantize(Decimal('1')))

def match_amount(target,invoices,max_states=131072):
    if target is None:return {'status':'missing','procedures':[],'matches':[]}
    total=cents(target)
    if total==0:return {'status':'zero','procedures':[],'matches':[]}
    if total<0:return {'status':'adjustment','procedures':[],'matches':[]}
    if any(i['cents']<0 for i in invoices):return {'status':'adjustment_review','procedures':[],'matches':[]}
    usable=[i for i in invoices if i['cents']>0 and i['cents']<=total]
    # Find the common one/two/three-invoice cases cheaply, including duplicated amounts.
    quick=[];seen=set();by_amount=defaultdict(list)
    for index,item in enumerate(usable):by_amount[item['cents']].append(index)
    def add_quick(indices):
        key=tuple(sorted(indices))
        if key not in seen:
            seen.add(key);quick.append(tuple(usable[i]['key'] for i in key))
    for i,item in enumerate(usable):
        if item['cents']==total:add_quick((i,))
        for j in by_amount.get(total-item['cents'],[]):
            if j>i:add_quick((i,j))
            if len(quick)>=2:break
        if len(quick)>=2:break
    if len(quick)<2 and len(usable)<=256:
        for i in range(len(usable)):
            for j in range(i+1,len(usable)):
                for k in by_amount.get(total-usable[i]['cents']-usable[j]['cents'],[]):
                    if k>j:add_quick((i,j,k))
                    if len(quick)>=2:break
                if len(quick)>=2:break
            if len(quick)>=2:break
    if len(quick)>=2:
        lookup={i['key']:i for i in usable};alternatives=[[lookup[k] for k in keys] for keys in quick[:2]]
        return {'status':'ambiguous','procedures':sorted({i['procedure'] for group in alternatives for i in group if i['procedure']}),'matches':alternatives}
    mid=len(usable)//2
    if 2**max(mid,len(usable)-mid)>max_states:
        # Many repeated assignment amounts are cheaper as reachable sums than as subsets.
        states={0:((),)}
        for item in usable:
            following=dict(states)
            for subtotal,witnesses in states.items():
                target_sum=subtotal+item['cents']
                if target_sum>total:continue
                found=list(following.get(target_sum,()))
                for witness in witnesses:
                    candidate=witness+(item['key'],)
                    if candidate not in found and len(found)<2:found.append(candidate)
                following[target_sum]=tuple(found)
            states=following
            if len(states.get(total,()))>=2:break
            if len(states)>max_states:return {'status':'limit','procedures':[],'matches':[]}
        lookup={i['key']:i for i in usable}
        witnesses=states.get(total,())
        alternatives=[[lookup[k] for k in keys] for keys in witnesses]
        return {'status':'unique' if len(witnesses)==1 else 'ambiguous' if witnesses else 'unmatched',
                'procedures':sorted({i['procedure'] for group in alternatives for i in group if i['procedure']}),'matches':alternatives}
    def subsets(items):
        states=[(0,())]
        for item in items:
            states += [(value+item['cents'],ids+(item['key'],)) for value,ids in states if value+item['cents']<=total]
        return states
    left=subsets(usable[:mid]);right=defaultdict(list)
    for value,ids in subsets(usable[mid:]):
        if len(right[value])<2:right[value].append(ids)
    witnesses=[]
    for value,ids in left:
        for others in right.get(total-value,[]):
            witness=ids+others
            if witness and witness not in witnesses:witnesses.append(witness)
            if len(witnesses)==2:break
        if len(witnesses)==2:break
    lookup={i['key']:i for i in usable}
    alternatives=[[lookup[k] for k in keys] for keys in witnesses]
    numbers=sorted({i['procedure'] for alternative in alternatives for i in alternative if i['procedure']})
    return {'status':'unique' if len(witnesses)==1 else 'ambiguous' if witnesses else 'unmatched',
            'procedures':numbers,'matches':alternatives}

def validate_range_schema(batch):
    cat={int(c['id']):c for c in batch['column_catalog']}
    for start in (508,523,538):
        for i,name in enumerate(MONTHS):
            if normalized(cat.get(start+i,{}).get('label'))!=normalized(name):raise ValueError(f'Mes no confirmado en ID{start+i}')
    if not all(w in normalized(cat.get(482,{}).get('label')) for w in ('ESTADO','PROCESO')):raise ValueError('No se confirma estado del proceso ID482')
    for n in range(25):
        number=237+8*n;value=number+1
        if not any(w in normalized(cat.get(number,{}).get('label')) for w in ('TRAMITE','CASO')):raise ValueError(f'Identificador no confirmado ID{number}')
        if not all(w in normalized(cat.get(value,{}).get('label')) for w in ('FACTURADO','SIN','IVA')):raise ValueError(f'Importe sin IVA no confirmado ID{value}')

def invoices_for(records):
    result=[]
    for record in records:
        raw=record['raw_columns']
        for i in range(25):
            number_id=237+i*8;amount_id=number_id+1
            amount=decimal(raw.get(str(amount_id)))
            if amount is None or amount==0:continue
            procedure=clean(raw.get(str(number_id)))
            if procedure in ('0','0.0'):procedure=''
            result.append({'key':str(record['source_row'])+':'+str(i+1),'procedure':procedure,'cents':cents(amount),'amount':dollars(amount),
                           'source_row':record['source_row'],'payment_number':i+1,'number_column':number_id,'amount_column':amount_id})
    return result

def evaluate_range(root,year,start_month,end_month,basis='adjusted',cut_token=None):
    year,start_month,end_month=int(year),int(start_month),int(end_month)
    if not 1<=start_month<=end_month<=12:raise ValueError('El mes inicial debe ser anterior o igual al final (enero–diciembre)')
    if basis not in ('adjusted','initial'):raise ValueError('Programación no válida')
    available=[c for c in choices(root) if int(c['year'])==year]
    if not available:raise ValueError('No hay originales del ejercicio')
    cut=next((c for c in available if token(c)==cut_token),None) if cut_token else available[-1]
    if cut is None:raise ValueError('El corte no pertenece al ejercicio seleccionado')
    batch=load_cut(root,cut);validate_range_schema(batch)
    rows=[];months=list(range(start_month,end_month+1));baseline=523 if basis=='adjusted' else 508
    for identifier,(key,records) in enumerate(sorted(group_records(batch['records']).items()),1):
        planned,pc=series(records,baseline);executed,ec=series(records,538)
        executed=[v if i<int(cut['month']) else None for i,v in enumerate(executed)]
        if not any(planned[m-1] not in (None,0) or executed[m-1] not in (None,0) for m in months):continue
        invoices=invoices_for(records)
        matches={m:match_amount(executed[m-1],invoices) for m in range(1,13)}
        # Never assign one unique invoice to two different execution months.
        uses=defaultdict(list)
        for m,match in matches.items():
            if match['status']=='unique':
                for invoice in match['matches'][0]:uses[invoice['key']].append(m)
        for used_months in uses.values():
            if len(used_months)>1:
                for m in used_months:matches[m]['status']='ambiguous_month'
        def distinct(field):return sorted({clean(r.get(field)) for r in records if clean(r.get(field))})
        statuses=sorted({clean(r['raw_columns'].get('482')) for r in records if clean(r['raw_columns'].get('482'))})
        monthly=[]
        for m in months:
            match=matches[m]
            monthly.append({'month':m,'planned':dollars(planned[m-1]),'executed':dollars(executed[m-1]),
                            'match':match,'program_column':baseline+m-1,'execution_column':538+m-1,
                            'program_coverage':pc[m-1],'execution_coverage':ec[m-1]})
        rows.append({'id':identifier,'contract':key[0],'process_code':key[1],'process_names':distinct('process_name'),
                     'administrators':distinct('contract_administrator'),'process_status':statuses,'monthly':monthly,'invoices':invoices,'source_rows':[r['source_row'] for r in records]})
    chart=[]
    for m in months:
        entry={'month':m}
        for field in ('planned','executed'):
            values=[decimal(r['monthly'][m-start_month][field]) for r in rows]
            good=[v for v in values if v is not None]
            entry[field]=dollars(sum(good,Decimal(0))) if good else None
        chart.append(entry)
    return {'year':year,'start_month':start_month,'end_month':end_month,'months':months,'basis':basis,'source':source(cut),
            'rows':rows,'chart':chart,'column_mapping':{'planned_start':baseline,'executed_start':538,'status':482,'invoice_amount_start':238,'invoice_step':8},
            'matching_rule':'Coincidencia exacta a centavos entre devengado mensual y una o varias facturas sin IVA del contrato/proceso. No acredita transferencia bancaria. Varias combinaciones o reutilización entre meses requieren revisión.',
            'series_labels':['Programado','Devengado']}
