"""Contrôle des preuves et rapport PT03 C."""
import hashlib
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[3]
DIR=ROOT/'docs/07_ARCHITECTURE/preuves'

def main():
    raw=DIR/'RESULTATS_PT03_LOT_C.json';d=json.loads(raw.read_text(encoding='utf-8'));errors=[]
    def check(ok,label):
        if not ok:errors.append(label)
    check(d['fatal'] is None and d['verdict']=='PARTIEL_LOT_C','campagne incomplète')
    check([c['id'] for c in d['cases']]==[f'PT03-C{n:02d}' for n in range(1,8)],'inventaire')
    check(d['SQL_execute'] and not any(d[k] for k in ('HTTP_execute','chiffrement_execute','PT03_clos')),'portée abusive')
    check(d['metadata']['temporary_files_removed'],'nettoyage')
    for n,c in enumerate(d['cases'],1):
        check(c['status']=='PASS','cas en échec')
        if c['status']!='PASS':continue
        check(c['before']['journal']==c['after']['journal'],'original altéré')
        check(c['before']['replica']==c['after']['replica'],'réplique altérée par migration')
        rows=c['after']['conversion'];check(len(rows)==1,'conversion dupliquée')
        if rows:
            r=rows[0]
            check(r[3]==hashlib.sha256(c['before']['journal'][0][1].encode()).hexdigest(),'provenance')
            check(r[5]==0,'conversion assimilée à validation scientifique')
            check(r[1]==('awaiting' if n in (2,3) else 'converted'),'ambiguïté interprétée')
            if n in (2,3):check(r[2] is None,'conversion permissive')
        if n==4:check(c['after']['context'][1:]==[0,0],'ancien client réactivé')
        if n in (5,6,7):
            first=c['traces'][0];state=first['durable_after']
            check(state['context'][1]==0,'barrière ouverte après erreur')
            check(state['context'][0]==(2 if n==6 else 1),'commit migration non atomique')
            check(state['conversion_table']==(n==6),'DDL partiellement publié')
            if n==7:check(first['output']=={'status':'storage_full','sqlite_errorcode':13},'SQLITE_FULL non observé')
            else:check(first['exit_code']==73,'processus non interrompu')
    for name,h in d['sha256_sources'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'source modifiée '+name)
    report=DIR/'RAPPORT_PT03_LOT_C.md'
    lines=['# PT03 — Lot C : compatibilité et migration','',
           '**Sept scénarios réussis ; PT03 reste partiel, non clos.**','',
           f"Campagne UTC : {d['started_utc']} → {d['ended_utc']}. OS : {d['metadata']['os']}. SQLite : {d['metadata']['sqlite']}.",'',
           'Commandes exécutées dans des processus Python distincts. Barrière consultable fermée durablement avant migration ; DDL, conversions et version de schéma dans une transaction SQLite WAL/FULL. Journal original conservé avec triggers interdisant modification et suppression. Conversion dans une table séparée, empreinte de source, identifiant du convertisseur et absence explicite de validation scientifique.','',
           '| Cas | Expérience | Verdict |','|---|---|---|']
    lines += [f"| {c['id']} | {c['label']} | {c['status']} |" for c in d['cases']]
    lines += ['', 'Référentiel scindé et champ inconnu : aucun choix automatique ni élimination de champ ; original lisible conservé, conversion en attente. Client incapable d’appliquer les protections : consultation fermée même après migration. Une migration réussie ne rouvre la réplique qu’après réconciliation synthétique explicite.','',
              'SQLITE_FULL est réellement produit avec PRAGMA max_page_count et allocation de 2 Mio ; le disque physique reste disponible. La transaction contenant DDL et conversions est annulée, puis rejouée dans un processus sans cette limite. Les interruptions os._exit avant/après commit attestent rollback ou durabilité sur crash de processus, pas résistance à coupure électrique.','',
              'Versions client/protocole/schéma/référentiel et termes synthétiques ; aucune fenêtre de support ou règle scientifique produit ratifiée. Pas de transport ni négociation authentifiée, chiffrement, horloge ou anti-rollback. SYN-01–07 restent ouverts. Lots D–F à exécuter. Total : 21 essais PT03 distincts (A : 8 ; B : 6 ; C : 7).','',
              '[Résultats et traces](RESULTATS_PT03_LOT_C.json), [banc](../../../spec/prototypes/pt03/README.md). Coût cloud nul.','']
    if not errors:
        report.write_text('\n'.join(lines),encoding='utf-8')
        files=[raw,report,Path(__file__).resolve()]+[ROOT/name for name in d['sha256_sources']]
        proof=dict(prototype='PT03',lot='C',PT03_clos=False,sha256={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in files})
        path=DIR/'PREUVES_PT03_LOT_C.json'
        if path.exists():
            old=json.loads(path.read_text(encoding='utf-8'))
            for name,h in old['sha256'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'preuve modifiée '+name)
        if not errors:path.write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(lot='C',passed=sum(c['status']=='PASS' for c in d['cases']),errors=errors)))
    raise SystemExit(bool(errors))

if __name__=='__main__':main()
