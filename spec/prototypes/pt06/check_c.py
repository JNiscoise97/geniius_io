"""Rapport et contrôle PT06 C."""
import hashlib
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];DIR=ROOT/'docs/07_ARCHITECTURE/preuves'

def main():
    raw=DIR/'RESULTATS_PT06_LOT_C.json';d=json.loads(raw.read_text(encoding='utf-8'));errors=[]
    def check(ok,label):
        if not ok:errors.append(label)
    check(d['fatal'] is None and d['verdict']=='PARTIEL_LIVRAISON_ROLLBACK','campagne incomplète')
    check([c['id'] for c in d['cases']]==[f'PT06-C{n:02d}' for n in range(1,8)],'inventaire')
    check(not d['PT06_clos'] and not d['deploiement_production_qualifie'] and d['metadata']['temporary_files_removed'],'portée/nettoyage')
    for n,c in enumerate(d['cases'],1):
        check(c['status']=='PASS','cas en échec')
        if c['status']!='PASS':continue
        check(c['before']['contributions']==c['after']['contributions'],'contribution perdue')
        check(c['after']['schema']==2 and c['after']['objects'][0][:2]==c['before']['objects'][0],'downgrade/perte données')
        if n in (2,3):check(c['traces'][0]['exit_code']==73 and not c['traces'][0]['durable_after']['gate'],'panne/barrière absente')
        if n in (4,7):check(c['after']['current']=='v2' and not c['after']['gate'],'rollback/artefact permissif')
        if n==6:check(c['after']['authority']==[0,2] and c['after']['objects'][0][2]==2,'ancienne autorité restaurée')
    for name,h in d['sha256_sources'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'source modifiée '+name)
    report=DIR/'RAPPORT_PT06_LOT_C.md'
    lines=['# PT06 — Lot C : livraison et rollback compatibles','',
           '**14 octobre 2026 — sept essais réussis ; PT06 non clos, déploiement de production non qualifié.**','',
           'Artefacts JSON versionnés contrôlés par SHA256 contre un manifeste de confiance injecté. Barrière persistée avant activation, migration additive DDL/version dans une transaction SQLite WAL/FULL. Processus distincts, interruptions os._exit avant/après commit de migration, reprise depuis état durable.','',
           '| Cas | Expérience | Verdict |','|---|---|---|']
    lines += [f"| {c['id']} | {c['label']} | {c['status']} |" for c in d['cases']]
    lines += ['', 'v1 est incompatible avec le schéma 2 et les protections courantes : rollback refusé et porte fermée. v1.1 est explicitement déclarée compatible dans le manifeste de fixture : activation sans downgrade ni restauration des données. Contributions et contenus initiaux conservés ; génération de protection matérialisée depuis l’autorité extérieure actuelle.','',
              'C06 conserve allowed=0/génération 2 après rollback, sans restaurer de droits depuis un artefact. La porte technique ouverte indique compatibilité/cohérence et n’accorde pas un accès scientifique ; aucune route de consultation n’est exécutée dans ce lot. La preuve porte sur l’autorité conservée, pas sur toute la politique du Core.','',
              'Manifestes/checksums ne constituent pas une signature ou chaîne de confiance autonome. Compatibilité déclarée de fichiers JSON, pas test d’un binaire ancien, CI/CD, supply chain, traffic shifting ou déploiement distant. Migration additive seulement, sans charge/lectures concurrentes, migration online ou schéma MPD complet. Fenêtre de support, protocole d’activation et responsables produit restent à qualifier.','',
              'Total PT06 : 22 essais A–C. [Résultats](RESULTATS_PT06_LOT_C.json), [banc](../../../spec/prototypes/pt06/README.md). Coût cloud nul. Accessibilité, export/récupération et alternatives/exploitation restent à traiter.','']
    if not errors:
        report.write_text('\n'.join(lines),encoding='utf-8')
        files=[raw,report,Path(__file__).resolve()]+[ROOT/name for name in d['sha256_sources']]
        proof=dict(prototype='PT06',lot='C',PT06_clos=False,deploiement_production_qualifie=False,
                   sha256={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in files})
        path=DIR/'PREUVES_PT06_LOT_C.json'
        if path.exists():
            old=json.loads(path.read_text(encoding='utf-8'))
            for name,h in old['sha256'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'preuve modifiée '+name)
        if not errors:path.write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(lot='C',passed=sum(c['status']=='PASS' for c in d['cases']),errors=errors)))
    raise SystemExit(bool(errors))

if __name__=='__main__':main()
