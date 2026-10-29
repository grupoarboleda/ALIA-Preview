"""Immutable originals + a separate analytical read model. Never rewrites financial history."""
import argparse
import datetime
import hashlib
import json
import os
import tempfile
import threading
from pathlib import Path
from importador_matriz import inspect_file, norm

VERSION = 'originals-v2'
_LOCK = threading.RLock()

def read(path, default=None):
    try:
        return json.loads(path.read_text(encoding='utf-8'))
    except FileNotFoundError:
        return default

def atomic(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temp = tempfile.mkstemp(dir=path.parent, prefix='.pending-')
    try:
        with os.fdopen(fd, 'w', encoding='utf-8') as fp:
            json.dump(obj, fp, ensure_ascii=False, allow_nan=False)
            fp.flush()
            os.fsync(fp.fileno())
        os.replace(temp, path)
    finally:
        Path(temp).unlink(missing_ok=True)

def seal(root, content, filename, year, month):
    """Keep exact workbook once and complete parsed rows; publish no cut until validated."""
    if not 2000 <= int(year) <= 2200 or not 1 <= int(month) <= 12:
        raise ValueError('Invalid year/month')
    digest = hashlib.sha256(content).hexdigest()
    folder = Path(root)/'originals'/digest
    with _LOCK:
        saved = read(folder/f'records-{VERSION}.json')
        if saved and saved.get('version') == VERSION:
            if hashlib.sha256((folder/'source.xlsx').read_bytes()).hexdigest() != digest:
                raise ValueError('Archived source integrity failure')
            return saved
        folder.mkdir(parents=True, exist_ok=True)
        fd, temp = tempfile.mkstemp(suffix='.xlsx', dir=folder)
        try:
            with os.fdopen(fd, 'wb') as fp:
                fp.write(content)
            batch = inspect_file(temp, assigned_month=month, assigned_year=year)
            if any(i.get('code') == 'COLUMN_MISMATCH' for i in batch['issues']):
                raise ValueError('Source headers do not match the declared dictionary')
            ids = {str(c['id']) for c in batch['column_catalog']}
            if not ids or not batch['records'] or any(set(r['raw_columns']) != ids for r in batch['records']):
                raise ValueError('Incomplete original column coverage')
            os.replace(temp, folder/'source.xlsx')
            batch.update(version=VERSION, file=Path(filename).name)
            atomic(folder/f'records-{VERSION}.json', batch)
            return batch
        finally:
            Path(temp).unlink(missing_ok=True)

def register_cut(root, batch, year, month, filename):
    cut = {'year':int(year), 'month':int(month), 'sha256':batch['sha256'],
           'file':Path(filename).name, 'version':VERSION,
           'imported_at':datetime.datetime.now(datetime.timezone.utc).isoformat()}
    # Same source/period is idempotent; a changed source is a new immutable revision.
    path=Path(root)/'original-cuts'/f'{int(year):04d}-{int(month):02d}-{batch["sha256"]}-{VERSION}.json'
    with _LOCK:
        if not path.exists(): atomic(path,cut)
    return cut

def existing_cuts(root):
    root=Path(root)
    cuts=[]
    manifest=read(root/'manifest.json',{})
    for key, meta in manifest.get('months',{}).items():
        if not str(key).isdigit(): continue
        month=int(key)
        snap=read(root/'monthly'/f'{month:02d}.json',{})
        if not snap: continue
        year=int(snap.get('year') or str(snap.get('date',''))[:4])
        cuts.append({**meta,'year':year,'month':month,'snapshot':snap})
    for path in (root/'original-cuts').glob('*.json'):
        cut=read(path)
        if cut and cut.get('version')==VERSION: cuts.append(cut)
    return cuts

def latest(root):
    cuts=existing_cuts(root)
    if not cuts: return None
    return max(cuts,key=lambda c:(int(c['year']),int(c['month']),bool(c.get('snapshot')),c.get('imported_at','')))

def load_cut(root, cut):
    registered=Path(root)/'original-cuts'/f"{int(cut['year']):04d}-{int(cut['month']):02d}-{cut['sha256']}-{VERSION}.json"
    batch=read(Path(root)/'originals'/cut['sha256']/f'records-{VERSION}.json') if registered.exists() else None
    if not batch or batch.get('version')!=VERSION:
        raise ValueError('Original incompleto: reconstruir el archivo exacto del corte '+str(cut['year'])+'-'+str(cut['month']))
    ids={str(c['id']) for c in batch['column_catalog']}
    if batch.get('sha256')!=cut['sha256'] or any(set(r.get('raw_columns',{}))!=ids for r in batch['records']):
        raise ValueError('Original column integrity failure')
    return batch

def detail(root, identity=None, kind='contract'):
    if kind not in ('contract','process'):
        raise ValueError('Invalid entity kind')
    cut=latest(root)
    if not cut: return {'mode':'DEMO','series':[]}
    batch=load_cut(root,cut)
    from importaciones_backend import to_explorer
    records=[to_explorer({**r,'report_date':f"{int(cut['year']):04d}-{int(cut['month']):02d}-01"}) for r in batch['records']]
    if identity is not None:
        field='contract' if kind=='contract' else 'process'
        records=[r for r in records if norm(r.get(field))==norm(identity)]
    return {'mode':'REAL','year':cut['year'],'month':cut['month'],
            'file':cut['file'],'sha256':cut['sha256'],'source':'IMMUTABLE_ORIGINALS',
            'column_catalog':batch['column_catalog'],'records':records,
            'coverage':{'complete':True,'columns':len(batch['column_catalog']),'rows':len(records)},
            'financial_rule':'SUM_ASSIGNMENT_ROWS_WITHIN_ONE_CUT_ONLY'}

def repair(root, source_dirs, apply=False):
    """Explicit reconstruction: never overwrite legacy snapshots/current/manifest."""
    result=[]
    manifest=read(Path(root)/'manifest.json',{})
    for month, meta in sorted(manifest.get('months',{}).items(),key=lambda x:int(x[0])):
        snap=read(Path(root)/'monthly'/f'{int(month):02d}.json',{})
        year=int(snap.get('year') or str(snap.get('date',''))[:4])
        digest=meta['sha256']; filename=Path(meta['file']).name
        if ((Path(root)/'original-cuts'/f'{year:04d}-{int(month):02d}-{digest}-{VERSION}.json').exists()
                and read(Path(root)/'originals'/digest/f'records-{VERSION}.json',{}).get('version')==VERSION):
            result.append({'year':year,'month':int(month),'status':'ALREADY_COMPLETE'});continue
        path=next((Path(d)/filename for d in source_dirs if (Path(d)/filename).is_file() and hashlib.sha256((Path(d)/filename).read_bytes()).hexdigest()==digest),None)
        if path is None:
            result.append({'year':year,'month':int(month),'status':'EXACT_SOURCE_REQUIRED','file':filename});continue
        if not apply:
            result.append({'year':year,'month':int(month),'status':'REBUILD_AVAILABLE','file':filename});continue
        batch=seal(root,path.read_bytes(),filename,year,int(month))
        originals={r['source_row']:r for r in batch['records']}
        if len(originals)!=len(snap['records']): raise ValueError('Source row count mismatch')
        for row in snap['records']:
            original=originals.get(row.get('sourceRow'))
            if original is None or norm(row.get('process'))!=original['process_key'] or norm(row.get('contract'))!=original['contract_key']:
                raise ValueError('Source row identity mismatch; legacy data unchanged')
            for field in ('budget','committed','accrued'):
                if abs(float(row.get(field,0))-float(original.get(field,0)))>0.005:
                    raise ValueError('Financial reconciliation failed; legacy data unchanged')
        register_cut(root,batch,year,int(month),filename)
        result.append({'year':year,'month':int(month),'status':'REBUILT','rows':len(originals),'columns':len(batch['column_catalog'])})
    return {'ok':True,'cuts':result,'legacy_modified':False}

if __name__=='__main__':
    ap=argparse.ArgumentParser()
    ap.add_argument('--data-root',type=Path,default=Path.home()/'.alia_local_data')
    ap.add_argument('--source-dir',action='append',required=True)
    ap.add_argument('--apply',action='store_true')
    args=ap.parse_args()
    print(json.dumps(repair(args.data_root,args.source_dir,args.apply),ensure_ascii=True))
