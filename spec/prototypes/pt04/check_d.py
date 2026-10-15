"""Contrôle de purge opérationnelle, sans effacement forensique revendiqué."""
import hashlib
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
DIR=ROOT/'docs/07_ARCHITECTURE/preuves'

def main():
    raw=DIR/'RESULTATS_PT04_LOT_D.json';d=json.loads(raw.read_text(encoding='utf-8'));errors=[]
    def check(ok,label):
        if not ok:errors.append(label)
    check(d['fatal'] is None and d['verdict']=='PARTIEL_PURGE_CONSERVATION','campagne incomplète')
    check([c['id'] for c in d['cases']]==[f'PT04-D{n:02d}' for n in range(1,7)],'inventaire')
    check(not any(d[k] for k in ('PT04_clos','NF05_qualifie','effacement_forensique_demontre')) and d['metadata']['temporary_files_removed'],'portée/nettoyage')
    for n,c in enumerate(d['cases'],1):
        check(c['status']=='PASS','cas en échec')
        if c['status']!='PASS':continue
        check(c['after']['objects']==[['other',None]] and not c['after']['media'],'purge opérationnelle incomplète')
        check(c['after']['derived']==[['index-other','other']] and c['after']['tasks']==[['job-other','other']],'dérivés/tâches ou tiers altérés')
        completed=[t for t in c['traces'] if t['exit_code']==0]
        check(completed and not completed[0]['output']['fixture_scope_complete'],'sauvegarde résiduelle ignorée')
        check(completed[-1]['output']['fixture_scope_complete']==(n==5),'inventaire/sauvegardes non opposables')
        if n in (2,3):check(c['traces'][0]['exit_code']==73 and not c['traces'][0]['durable_after']['visible'],'panne/barrière absente')
    for name,h in d['sha256_sources'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'source modifiée '+name)
    report=DIR/'RAPPORT_PT04_LOT_D.md'
    lines=['# PT04 — Lot D : purge, dérivés et sauvegardes','',
           '**Six scénarios réussis ; PT04 non clos ; aucun effacement forensique démontré.**','',
           f"Campagne UTC : {d['started_utc']} → {d['ended_utc']}. OS : {d['metadata']['os']}.",'',
           'Corpus fini de trois objets liés (racine et deux copies), index/tâches associés et fichiers distincts ; un objet tiers sert de témoin de non-destruction. Registre de portée extérieur préinitialisé. Barrière fermée avant transaction canonique, fichiers retirés ensuite, réouverture après nettoyage. Interruptions de processus et restauration réelle de SQLite et fichiers de sauvegarde.','',
           '| Cas | Expérience | Verdict |','|---|---|---|']
    lines += [f"| {c['id']} | {c['label']} | {c['status']} |" for c in d['cases']]
    lines += ['', 'Le succès opérationnel ne déclare pas disparition des sauvegardes : fixture_scope_complete reste faux tant qu’une sauvegarde connue subsiste ou que l’inventaire est incomplet. D05 retire uniquement les fichiers de sauvegarde synthétiques créés par le banc, puis constate absence de résidu dans ce périmètre déclaré. Ce booléen n’est pas un statut juridique ou une certification de purge complète du produit.','',
              'D04 restaure réellement la base et les médias anciens ; la sauvegarde porte une barrière fermée et le registre extérieur actuel réapplique les retraits avant ouverture. Registre courant et portée sont supposés fiables ; le banc ne calcule pas toute filiation ni toutes les copies possibles. Dépôts à fichiers mutualisés, clés partagées, exceptions de conservation et terminaux déconnectés non couverts.','',
              'DELETE SQLite et unlink ne démontrent pas effacement forensique des pages, WAL, fichiers temporaires, supports, snapshots ou copies externes. Aucun seuil de durée/rétention adopté ; absence de résidu vaut seulement pour les magasins visibles du corpus fini. NF05 et PER-01–07 restent ouverts.','',
              'Total PT04 : 27 essais A–D. [Résultats](RESULTATS_PT04_LOT_D.json), [banc](../../../spec/prototypes/pt04/README.md). Coût cloud nul.','']
    if not errors:
        report.write_text('\n'.join(lines),encoding='utf-8')
        files=[raw,report,Path(__file__).resolve()]+[ROOT/name for name in d['sha256_sources']]
        proof=dict(prototype='PT04',lot='D',PT04_clos=False,effacement_forensique_demontre=False,
                   sha256={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in files})
        path=DIR/'PREUVES_PT04_LOT_D.json'
        if path.exists():
            old=json.loads(path.read_text(encoding='utf-8'))
            for name,h in old['sha256'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'preuve modifiée '+name)
        if not errors:path.write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(lot='D',passed=sum(c['status']=='PASS' for c in d['cases']),errors=errors)))
    raise SystemExit(bool(errors))

if __name__=='__main__':main()
