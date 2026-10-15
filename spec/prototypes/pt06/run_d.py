"""PT06 D : navigateur Chromium réel, clavier/CDP et arbre d'accessibilité."""
import hashlib
import json
import platform
import subprocess
import tempfile
import threading
from datetime import datetime,timezone
from http.server import ThreadingHTTPServer
from pathlib import Path
import run as api
ROOT=api.ROOT;HERE=Path(__file__).resolve().parent
OUT=ROOT/'docs/07_ARCHITECTURE/preuves/RESULTATS_PT06_LOT_D.json'

class Handler(api.Handler):
    def do_GET(self):
        if self.path=='/ui':
            body=(HERE/'accessibility.html').read_bytes();self.send_response_only(200);self.send_header('Content-Type','text/html; charset=utf-8');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
        else:self.handle_api()
    def do_POST(self):
        if self.path=='/control/revoke':
            with api.closing(api.connect()) as c:c.execute("UPDATE session SET active=0 WHERE token='S1'")
            self.response(200,{'status':'fixture_revoked'})
        else:self.handle_api()

def main():
    started=datetime.now(timezone.utc).isoformat();fatal=None;result={};server=None
    try:
        with tempfile.TemporaryDirectory(prefix='geniius-pt06-d-') as temp:
            folder=Path(temp);api.DATABASE=folder/'api.sqlite';api.reset()
            browser=Path('C:/Program Files/Google/Chrome/Application/chrome.exe')
            if not browser.exists():browser=Path('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe')
            server=ThreadingHTTPServer(('127.0.0.1',0),Handler);thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
            try:
                r=subprocess.run(['node',str(HERE/'browser_d.mjs'),str(browser),str(folder/'browser-profile'),f'http://127.0.0.1:{server.server_port}/ui'],capture_output=True,text=True,encoding='utf-8',timeout=90)
                result=json.loads(r.stdout);result['API_after']=api.state()
            finally:server.shutdown();server.server_close();thread.join(timeout=5)
    except Exception as exc:fatal=repr(exc)
    sources=[HERE/name for name in ('run_d.py','browser_d.mjs','accessibility.html','run.py','PROTOCOL.md')]
    data=dict(prototype='PT06',lot='D',started_utc=started,ended_utc=datetime.now(timezone.utc).isoformat(),
              cases=result.get('cases',[]),fatal=fatal or result.get('fatal'),browser_version=result.get('browser_version'),browser_closed=result.get('browser_closed'),API_after=result.get('API_after'),
              PT06_clos=False,WCAG_conformite_globale=False,lecteur_ecran_test=False,
              metadata=dict(os=platform.platform(),HTTP_bind='127.0.0.1',temporary_files_removed=not fatal,cloud_cost_euros=0),
              limits=['Navigateur headless réel et événements clavier CDP, pas utilisateur/lecteur écran NVDA/JAWS/VoiceOver.',
                      'Arbre AX/rôles live vérifiés, annonce sonore et ordre de lecture réels non qualifiés.',
                      'Outline calculé et reflow 320px, pas audit contraste/zoom/global WCAG ou plateforme mobile.',
                      'Parcours unique avec sessions de fixture, pas identité réelle ni produit final.'],
              sha256_sources={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sources})
    data['verdict']='PARTIEL_ACCESSIBILITE_NAVIGATEUR' if not data['fatal'] and len(data['cases'])==6 and all(c['status']=='PASS' for c in data['cases']) and data['browser_closed'] else 'FAIL'
    OUT.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(dict(verdict=data['verdict'],cases=data['cases'],fatal=data['fatal']),ensure_ascii=False))
    raise SystemExit(data['verdict']=='FAIL')

if __name__=='__main__':main()
