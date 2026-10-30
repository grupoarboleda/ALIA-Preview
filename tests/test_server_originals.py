import hashlib
import http.client
import json
import os
import tempfile
import threading
import unittest
from pathlib import Path
from unittest.mock import patch
os.environ['ALIA_DISABLE_SYNC']='1'
from servidor_alia import Handler, ThreadingHTTPServer, ALIAHTTPServer
import importaciones_backend as backend
import original_records as repo
from test_original_records import workbook

class QuietHandler(Handler):
    def log_message(self,*args):pass

class ServerTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name)
        batch=repo.seal(self.root,workbook(),'test.xlsx',2026,10);repo.register_cut(self.root,batch,2026,10,'test.xlsx')
        self.patch=patch.object(backend,'DATA_ROOT',self.root);self.patch.start()
        self.server=ThreadingHTTPServer(('127.0.0.1',0),QuietHandler)
        self.thread=threading.Thread(target=self.server.serve_forever,daemon=True);self.thread.start()
        self.conn=http.client.HTTPConnection('127.0.0.1',self.server.server_port,timeout=10)
    def tearDown(self):
        self.conn.close();self.server.shutdown();self.server.server_close();self.thread.join();self.patch.stop();self.tmp.cleanup()
    def test_large_javascript_exact_and_persistent_http11(self):
        expected=Path('explorer.js').read_bytes();self.assertGreater(len(expected),100000)
        for _ in range(3):
            self.conn.request('GET','/explorer.js');r=self.conn.getresponse();body=r.read()
            self.assertEqual(r.version,11);self.assertEqual(r.status,200)
            self.assertEqual(int(r.getheader('Content-Length')),len(body));self.assertEqual(hashlib.sha256(body).digest(),hashlib.sha256(expected).digest())
    def test_exclusive_local_server_refuses_duplicate_listener(self):
        first=ALIAHTTPServer(('127.0.0.1',0),QuietHandler)
        try:
            with self.assertRaises(OSError):
                second=ALIAHTTPServer(('127.0.0.1',first.server_port),QuietHandler)
                second.server_close()
        finally:first.server_close()

    def test_original_endpoint_scoped_and_invalid_kind(self):
        self.conn.request('GET','/__alia_original_records?kind=contract&id=32-2026');r=self.conn.getresponse();data=json.loads(r.read())
        self.assertEqual(r.status,200);self.assertTrue(all(x['contract']=='32-2026' for x in data['records']));self.assertTrue(data['coverage']['complete']);self.assertIn('no-store',r.getheader('Cache-Control'))
        self.conn.request('GET','/__alia_original_records?kind=invalid');r=self.conn.getresponse();r.read();self.assertEqual(r.status,422)
        self.conn.request('GET','/__alia_original_records?kind=contract&id=OTHER');r=self.conn.getresponse();data=json.loads(r.read());self.assertEqual(data['records'],[])

if __name__=='__main__':unittest.main()
