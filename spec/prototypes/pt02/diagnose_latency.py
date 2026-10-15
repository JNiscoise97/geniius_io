"""Diagnostic SQL séparé, pas une recette de confidentialité de l'API."""
import contextlib
import hashlib
import json
import random
import statistics
import time
import uuid
from datetime import datetime,timezone
from pathlib import Path
from types import SimpleNamespace
import run as h
from outils import jumeau_sans
import relational_probe

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[2]
OUT=ROOT/'docs/07_ARCHITECTURE/preuves/DIAGNOSTIC_SQL_LATENCE_PT02.json'

def measure(actor,target):
    with h.db.Session('pt02_reader') as s:
        sql="""BEGIN; CREATE TEMP TABLE timings(value double precision) ON COMMIT DROP;
DO $measure$ DECLARE started timestamptz; r json; BEGIN
FOR i IN 1..220 LOOP started:=clock_timestamp();
r:=pt02_auth.render(ACTOR,TARGET,NULL);
IF r IS NOT NULL THEN RAISE EXCEPTION 'Accès inattendu'; END IF;
IF i>20 THEN INSERT INTO timings VALUES(EXTRACT(EPOCH FROM (clock_timestamp()-started))*1000); END IF;
END LOOP; END $measure$;
SELECT json_agg(value) FROM timings; COMMIT"""
        sql=sql.replace('ACTOR',relational_probe.literal(actor)).replace('TARGET',relational_probe.literal(target))
        rows=s.query(sql)
        return json.loads(next(row for row in rows if row.startswith('[')))

def main():
    h.db.NAME='geniius-pt02-sqltime-'+uuid.uuid4().hex[:10]
    created=False;results=[];kernel_checks=[];fatal=None;metadata={};start=datetime.now(timezone.utc).isoformat()
    try:
        image=json.loads(h.db.docker('image','inspect','postgres:16-alpine').stdout)[0]
        metadata={'image_id':image['Id'],'network':'none','memory_bytes':536870912,'cpus':1,'cloud_cost_euros':0}
        h.db.docker('run','--detach','--rm','--name',h.db.NAME,'--network','none','--memory','512m','--cpus','1',
                    '--env','POSTGRES_HOST_AUTH_METHOD=trust','--env','POSTGRES_DB=pt01',image['Id'])
        created=True;deadline=time.monotonic()+45
        while time.monotonic()<deadline:
            logs=h.db.docker('logs',h.db.NAME,check=False)
            if 'PostgreSQL init process complete' in logs.stdout+logs.stderr and h.db.docker('exec',h.db.NAME,'pg_isready','-U','postgres',check=False).returncode==0:break
            time.sleep(.3)
        else:raise RuntimeError('PostgreSQL non prêt')
        for path in [HERE.parent/'pt01/schema.sql',HERE/'schema.sql',HERE/'relational.sql']:
            h.db.docker('cp',str(path),h.db.NAME+':/tmp/schema.sql')
            h.db.docker('exec',h.db.NAME,'psql','-X','-v','ON_ERROR_STOP=1','-U','postgres','-d','pt01','-f','/tmp/schema.sql')
        with h.db.Session() as admin:
            metadata['postgresql_version']=admin.query('SELECT version()')[-1]
            for label in ('hp_active_sans_fondement','hi_active_expiree','ascendant_manquant'):
                f=h.build_model()
                if label=='hp_active_sans_fondement':
                    source=f.deleg('TIT',('acteur','V'),['voir'],('objet',f.priv),repartager=True)
                    dependent=f.deleg('V',('acteur','W'),['voir'],('objet',f.priv));f.ok(f.s.clore('TIT',source))
                    actor='W';target=f.priv
                    alteration='UPDATE pt02_auth.hab SET active=true WHERE id='+relational_probe.literal(dependent)
                elif label=='hi_active_expiree':
                    dependent=f.deleg('RS',('acteur','V'),['voir'],('objet',f.o),echeance=3);f.s.avancer(4)
                    actor='V';target=f.o
                    alteration='UPDATE pt02_auth.hab SET active=true WHERE id='+relational_probe.literal(dependent)
                else:
                    target=f.ok(f.s.reutiliser('RS2',f.o,'Q'));actor='RS2'
                    alteration="UPDATE pt02_auth.object SET parent='absent' WHERE id="+relational_probe.literal(target)
                relational_probe.load(admin,f)
                admin.query('BEGIN; SELECT 1 FROM pt01.authority WHERE id=1 FOR UPDATE; '+alteration+
                            '; UPDATE pt01.authority SET epoch=epoch+1; SELECT pt02_auth.compile_projection(); COMMIT')
                direct=admin.query('SELECT pt02_auth.allowed('+relational_probe.literal(actor)+','+
                                   relational_probe.literal(target)+',NULL,(SELECT day FROM pt02_auth.clock))')[-1]
                fresh=admin.query('SELECT EXISTS(SELECT 1 FROM pt02_auth.projection_generation g JOIN pt01.authority a ON a.epoch=g.epoch '
                                  'JOIN pt02_auth.clock c ON c.day=g.day WHERE g.ready)')[-1]
                with h.db.Session('pt02_reader') as reader:
                    rendered=reader.query('SELECT pt02_auth.render('+relational_probe.literal(actor)+','+
                                          relational_probe.literal(target)+',NULL)')[-1]
                assert direct=='f' and fresh=='t' and rendered=='',(label,direct,fresh,rendered)
                kernel_checks.append({'id':label,'direct_allowed':False,'generation_coherente':True,'projection_allowed':False})
            for family in ('personnel_cache','hp_rompue'):
                f=h.build_model();actor='LEC';target=f.priv
                if family=='hp_rompue':
                    source=f.deleg('TIT',('acteur','V'),['voir'],('objet',target),repartager=True)
                    f.deleg('V',('acteur','W'),['voir'],('objet',target));f.ok(f.s.clore('TIT',source));actor='W'
                twin=SimpleNamespace(s=jumeau_sans(f.s,target));rng=random.Random(20261013)
                for n in range(12):
                    order=['hidden','absent'];rng.shuffle(order);values={}
                    for world in order:
                        relational_probe.load(admin,f if world=='hidden' else twin)
                        values[world]=measure(actor,target)
                    result={'family':family,'round':n,'order':order,'iterations_per_state':200,
                            'hidden_ms':values['hidden'],'absent_ms':values['absent'],
                            'hidden_median_ms':statistics.median(values['hidden']),
                            'absent_median_ms':statistics.median(values['absent'])}
                    results.append(result)
                print(family,'12 blocs SQL mesurés',flush=True)
    except Exception as exc:fatal=type(exc).__name__+': '+str(exc)
    finally:
        if created:
            with contextlib.suppress(Exception):metadata['container_removed']=h.db.docker('rm','--force',h.db.NAME,check=False).returncode==0
    result={'started_utc':start,'ended_utc':datetime.now(timezone.utc).isoformat(),'nature':'Mesure serveur de la fonction SQL, sans HTTP ; diagnostic uniquement',
            'metadata':metadata,'results':results,'kernel_checks':kernel_checks,'fatal':fatal,'NF10_conforme':False,
            'limitations':['20 itérations de chauffe exclues avant 200 mesures par état, protocole fixé dans le script.',
                           'Petit corpus et mêmes identifiants ; boucles corrélées, pas échantillons indépendants.',
                           'Coût appels et clock_timestamp inclus ; pas preuve d exploitation HTTP ni de conformité NF10.'],
            'sha256_sources':{str(p.relative_to(ROOT)).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest()
                              for p in [Path(__file__).resolve(),HERE/'run.py',HERE/'relational.sql',HERE/'relational_probe.py',ROOT/'spec/autorisation/modele.py',ROOT/'spec/autorisation/tests/outils.py']}}
    OUT.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    raise SystemExit(bool(fatal) or not metadata.get('container_removed'))
if __name__=='__main__':main()
