"""Read-only cohort analysis: scheduled month vs monthly execution and payment evidence.
No allocation of a transfer to a scheduled installment is inferred.
"""
import datetime
import unicodedata
from collections import defaultdict
from decimal import Decimal, InvalidOperation
from pathlib import Path
from original_records import existing_cuts, load_cut
from importador_matriz import report_date

MONTHS=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

def clean(v):return str('' if v is None else v).strip()
def normalized(v):return ''.join(c for c in unicodedata.normalize('NFD',clean(v).upper()) if not unicodedata.combining(c))
def decimal(v):
    if v is None or clean(v)=='':return None
    try:
        n=Decimal(str(v))
        return n if n.is_finite() else None
    except InvalidOperation:return None

def dollars(v):return float(v.quantize(Decimal('.01'))) if v is not None else None

def choices(root):
    unique={}
    for c in existing_cuts(root):
        key=(int(c['year']),int(c['month']),c['sha256'])
        if key not in unique or c.get('snapshot'):unique[key]=c
    return sorted(unique.values(),key=lambda c:(int(c['year']),int(c['month']),bool(c.get('snapshot')),c.get('imported_at','')))

def token(c):return f"{int(c['year'])}-{int(c['month']):02d}-{c['sha256']}"
def source(c):return {k:c[k] for k in ('year','month','file','sha256')}|{'token':token(c)}
def configuration(root):
    cuts=choices(root)
    return {'years':sorted({c['year'] for c in cuts}), 'cuts':[source(c) for c in cuts],
            'default_year':cuts[-1]['year'] if cuts else None}

def validate(batch):
    catalog={int(c['id']):c for c in batch['column_catalog']}
    for start in (508,523,538):
        for i,label in enumerate(MONTHS):
            if normalized(catalog.get(start+i,{}).get('label'))!=normalized(label):
                raise ValueError(f'El catálogo no confirma mes {label} en ID{start+i}')
    for i in range(25):
        for offset,words in ((0,['TRAMITE']),(6,['FECHA','TRANSFERENCIA']),(7,['TOTAL','PAGADO'])):
            identifier=237+i*8+offset
            if not ((offset==0 and any(w in normalized(catalog.get(identifier,{}).get('label')) for w in ('TRAMITE','CASO'))) or (offset!=0 and all(w in normalized(catalog.get(identifier,{}).get('label')) for w in words))):
                raise ValueError(f'No se confirma semántica de pagos ID{identifier}')
    return catalog

def entity(r):return (clean(r.get('contract_key')),clean(r.get('process_key')))
def group_records(records):
    groups=defaultdict(list)
    for r in records:groups[entity(r)].append(r)
    return groups

def series(rows,start):
    totals=[];coverage=[]
    for i in range(12):
        vals=[decimal(r['raw_columns'].get(str(start+i))) for r in rows]
        valid=[v for v in vals if v is not None]
        totals.append(sum(valid,Decimal(0)) if valid else None)
        coverage.append({'known':len(valid),'rows':len(rows)})
    return totals,coverage

def events(records,year,catalog=None):
    result=[]
    for r in records:
        raw=r['raw_columns']
        for i in range(26):
            advance=i==25
            ids=(233,235,234) if advance else (237+i*8,243+i*8,244+i*8)
            procedure,date_value,amount=(raw.get(str(k)) for k in ids)
            if clean(procedure) in ('0','0.0'):procedure=''
            if not clean(procedure) and decimal(amount) in (None,Decimal(0)) and (not clean(date_value) or decimal(date_value)==0):continue
            iso=report_date(date_value) if date_value is not None and clean(date_value) and decimal(date_value)!=0 else None
            date=datetime.date.fromisoformat(iso) if iso else None
            value=decimal(amount)
            issues=[]
            if not date:issues.append('Fecha ausente o no interpretable')
            elif date.year!=year:issues.append('Fecha fuera del ejercicio seleccionado')
            if value is None:issues.append('Importe ausente o no numérico')
            if not clean(procedure):issues.append('Número de trámite ausente')
            result.append({'entity':entity(r),'kind':'Anticipo' if advance else 'Factura','payment_number':None if advance else i+1,
                           'procedure':clean(procedure),'procedure_field':'payment_procedure_number','procedure_label':(catalog or {}).get(ids[0],{}).get('label','Número de trámite'),'date':iso,'month':date.month if date and date.year==year else None,
                           'amount':value,'source_row':r['source_row'],'column_ids':list(ids),'issues':issues,'ambiguous':False})
    repeated=defaultdict(list)
    for e in result:
        if e['procedure']:
            # Same contract/procedure/date across assignments cannot safely be summed as independent bank transfers.
            owner=e['entity'][0] or 'PROCESS:'+e['entity'][1]
            repeated[(owner,normalized(e['procedure']),e['date'],e['kind'])].append(e)
    for values in repeated.values():
        if len(values)>1:
            for e in values:e['ambiguous']=True;e['issues'].append('Trámite repetido: conciliar asignaciones antes de sumar')
    return result

def analyze(root,year,month,plan_token=None,observed_token=None,basis='adjusted',include_advance=False):
    year,month=int(year),int(month)
    if not 1<=month<=12:raise ValueError('Mes programado fuera de rango')
    if basis not in ('adjusted','initial'):raise ValueError('Línea base no válida')
    cuts=[c for c in choices(root) if int(c['year'])==year]
    if not cuts:raise ValueError('No hay originales para el ejercicio')
    def selected(value):
        found=next((c for c in cuts if token(c)==value),None)
        if found is None:raise ValueError('Corte solicitado no disponible')
        return found
    observation=selected(observed_token) if observed_token else cuts[-1]
    eligible=[c for c in cuts if int(c['month'])<=min(month,int(observation['month']))]
    plan=selected(plan_token) if plan_token else (eligible[-1] if eligible else observation)
    if int(plan['month'])>int(observation['month']):raise ValueError('La programación no puede provenir de un corte posterior al seguimiento')
    planned_batch=load_cut(root,plan);observed_batch=load_cut(root,observation)
    validate(planned_batch);observed_catalog=validate(observed_batch)
    plan_groups=group_records(planned_batch['records']);observed_groups=group_records(observed_batch['records'])
    ledger=events(observed_batch['records'],year,observed_catalog)
    by_entity=defaultdict(list)
    for e in ledger:by_entity[e['entity']].append(e)
    rows=[];start=523 if basis=='adjusted' else 508;observed_month=int(observation['month'])
    chart=[{'month':m,'planned':Decimal(0),'executed':Decimal(0) if m<=observed_month else None,'transferred':Decimal(0) if m<=observed_month else None,'missing_execution_rows':0,'known_execution_rows':0} for m in range(1,13)]
    for key,assignments in plan_groups.items():
        planned,plan_coverage=series(assignments,start)
        amount=planned[month-1]
        if amount is None or amount==0:continue
        execution_rows=observed_groups.get(key,[])
        actual,actual_coverage=series(execution_rows,538)
        actual=[v if i<observed_month else None for i,v in enumerate(actual)]
        payments=by_entity.get(key,[])
        eligible_payments=[e for e in payments if (include_advance or e['kind']=='Factura')]
        def safe(e):return not e['issues'] and not e['ambiguous'] and e['month'] is not None and e['month']<=observed_month
        safe_payments=[e for e in eligible_payments if safe(e)]
        cash=[sum((e['amount'] for e in safe_payments if e['month']==m),Decimal(0)) if m<=observed_month else None for m in range(1,13)]
        in_month=actual[month-1] if month<=observed_month else None
        later_months=[i+1 for i in range(month,observed_month) if actual[i] is not None and actual[i]!=0]
        later_values=[actual[i] for i in range(month,observed_month) if actual[i] is not None]
        later=sum(later_values,Decimal(0)) if later_values else None
        window_payments=[e for e in safe_payments if month<=e['month']<=observed_month]
        status=('future' if month>observed_month else 'missing' if not execution_rows else 'in_month' if in_month is not None and in_month!=0 else 'later' if later_months else 'cash_only' if window_payments else 'missing' if in_month is None else 'not_observed')
        review=sum(bool(e['issues']) for e in eligible_payments if e['month'] is None or month<=e['month']<=observed_month)
        def names(field):return sorted({clean(r.get(field)) for r in assignments+execution_rows if clean(r.get(field))})
        accrued_id=next((str(c['id']) for c in observed_catalog.values() if c.get('mapped_field')=='accrued'),None)
        accrued_values=[decimal(r['raw_columns'].get(accrued_id)) for r in execution_rows] if accrued_id else []
        accrued=sum((v for v in accrued_values if v is not None),Decimal(0)) if any(v is not None for v in accrued_values) else None
        monthly_values=[v for v in actual[:observed_month] if v is not None]
        monthly_total=sum(monthly_values,Decimal(0)) if monthly_values else None
        reconciliation_difference=dollars(monthly_total-accrued) if monthly_total is not None and accrued is not None else None
        partial=any(c['known']<c['rows'] for c in actual_coverage[month-1:observed_month])
        row={'contract':key[0],'process_code':key[1],'process_names':names('process_name'),'administrators':names('contract_administrator'),
             'planned':dollars(amount),'execution_in_month':dollars(in_month),'execution_later':dollars(later),'later_months':later_months,
             'transferred_since_month':dollars(sum((e['amount'] for e in window_payments),Decimal(0))),'status':status,
             'review_events':review,'partial_execution':partial,'monthly_reconciliation_difference':reconciliation_difference,'plan_rows':[r['source_row'] for r in assignments], 'observed_rows':[r['source_row'] for r in execution_rows],
             'monthly':[{'month':m,'planned':dollars(planned[m-1]),'executed':dollars(actual[m-1]),'transferred':dollars(cash[m-1]),'execution_coverage':actual_coverage[m-1],'plan_coverage':plan_coverage[m-1]} for m in range(1,13)],
             'payments':[{k:(dollars(v) if k=='amount' else v) for k,v in e.items() if k!='entity'} for e in payments]}
        rows.append(row)
        for i,item in enumerate(chart):
            item['planned']+=planned[i] or Decimal(0)
            if i<observed_month:
                item['executed']+=actual[i] or Decimal(0);item['transferred']+=cash[i] or Decimal(0)
                item['missing_execution_rows']+=len(execution_rows)-actual_coverage[i]['known'];item['known_execution_rows']+=actual_coverage[i]['known']
                if not execution_rows:item['missing_execution_rows']+=len(assignments)
    rows.sort(key=lambda r:(r['contract'],r['process_code']))
    for item in chart:
        if not item['known_execution_rows']:item['executed']=None
    return {'year':year,'programmed_month':month,'observed_month':observed_month,'basis':basis,'include_advance':include_advance,
            'plan_source':source(plan),'observed_source':source(observation),'rows':rows,
            'chart':[{k:dollars(v) if k in ('planned','executed','transferred') else v for k,v in item.items()} for item in chart],
            'summary':{'contracts':len({r['contract'] for r in rows if r['contract']}),'groups':len(rows),'review_events':sum(r['review_events'] for r in rows)},
            'interpretation':'La programación no contiene una clave que la vincule de forma unívoca con una factura. Los devengos y transferencias posteriores son evidencia del contrato, no asignación confirmada de una cuota programada. Transferencias netas y devengos pueden tener bases distintas (IVA, retenciones, amortizaciones). Trámites repetidos o incompletos se muestran, pero se excluyen de transferencias sumables.',
            'period_note':'Meses posteriores al corte: sin observación, no cero. Mes de corte asignado según la importación; no implica certificación de cierre bancario.'}
