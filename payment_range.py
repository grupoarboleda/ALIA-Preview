"""Monthly program/devengo matrix and exact invoice-before-VAT amount matching."""
from collections import defaultdict
from decimal import Decimal
from payment_followup import MONTHS, choices, token, source, clean, decimal, dollars, entity, group_records, series, normalized
from original_records import load_cut


def cents(value):return int((value*100).quantize(Decimal('1')))

def match_amount(target,invoices):
    """Walk consecutive recorded payment slots, newest first. Never choose a subset."""
    base={'procedures':[],'matches':[],'consumed_payment_numbers':[]}
    if target is None:return dict(base,status='missing')
    total=cents(target)
    if total==0:return dict(base,status='zero')
    slots=defaultdict(list)
    for invoice in invoices:slots[invoice['payment_number']].append(invoice)
    if not slots:return dict(base,status='review',reason='No hay pagos registrados para conciliar.')
    attempt=[];running=0;used=[]
    for number in range(max(slots),0,-1):
        if number not in slots:
            return dict(base,status='review',reason=f'Falta el pago {number}; no se salta a pagos anteriores.',attempted=attempt)
        current=sorted(slots[number],key=lambda i:(i['source_row'],i['key']))
        attempt.extend(current)
        if any(i.get('cents') is None or not i.get('procedure') for i in current):
            return dict(base,status='review',reason=f'Pago {number} sin número de trámite/caso o importe completo.',attempted=attempt)
        running+=sum(i['cents'] for i in current);used.append(number)
        if running==total:
            return {'status':'unique','procedures':list(dict.fromkeys(i['procedure'] for i in attempt)),
                    'matches':[attempt],'consumed_payment_numbers':used}
    return dict(base,status='review',reason='La suma del último pago hacia el primero no coincide con el devengado.',
                attempted=attempt,sequence_total=running/100,difference=(total-running)/100)


def compare_month(planned,executed,observed=True):
    """Compare within each contract/process, so one contract cannot offset another."""
    if not observed:return {'observed':False,'covered':None,'unplanned':None,'over_plan':None,'pending':None}
    if (planned is not None and planned<0) or (executed is not None and executed<0):
        return {'observed':True,'adjustment':True,'covered':None,'unplanned':None,'over_plan':None,'pending':None}
    p=planned or Decimal(0);d=executed or Decimal(0)
    return {'observed':True,'covered':dollars(min(p,d)),
            'unplanned':dollars(d if p==0 else Decimal(0)),
            'over_plan':dollars(max(d-p,Decimal(0)) if p>0 else Decimal(0)),
            'pending':dollars(max(p-d,Decimal(0))),
            'program_missing':planned is None,'execution_missing':executed is None}


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
            procedure=clean(raw.get(str(number_id)))
            if procedure in ('0','0.0'):procedure=''
            if not procedure and amount in (None,0):continue
            result.append({'key':str(record['source_row'])+':'+str(i+1),'procedure':procedure,'cents':cents(amount) if amount is not None else None,'amount':dollars(amount),
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
        matches={};remaining=list(invoices)
        for month in range(12,0,-1):
            result=match_amount(executed[month-1],remaining);matches[month]=result
            if result['status']=='unique':
                consumed=set(result['consumed_payment_numbers'])
                remaining=[i for i in remaining if i['payment_number'] not in consumed]
        def distinct(field):return sorted({clean(r.get(field)) for r in records if clean(r.get(field))})
        statuses=sorted({clean(r['raw_columns'].get('482')) for r in records if clean(r['raw_columns'].get('482'))})
        monthly=[]
        for m in months:
            match=matches[m]
            monthly.append({'month':m,'planned':dollars(planned[m-1]),'executed':dollars(executed[m-1]),
                            'match':match,'program_column':baseline+m-1,'execution_column':538+m-1,
                            'comparison':compare_month(planned[m-1],executed[m-1],m<=int(cut['month'])),'program_coverage':pc[m-1],'execution_coverage':ec[m-1]})
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
            'matching_rule':'Pagos consecutivos del último al primero, sin saltos ni combinaciones. Se asignan meses observados del más reciente al anterior, sin reutilizar pagos. Si la suma no coincide: Revisar Pagos.',
            'series_labels':['Programado','Devengado']}
