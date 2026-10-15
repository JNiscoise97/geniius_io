"""Rapport et contrôle de l'exercice combiné PT04 F."""
import hashlib
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];DIR=ROOT/'docs/07_ARCHITECTURE/preuves'

def main():
    raw=DIR/'RESULTATS_PT04_LOT_F.json';d=json.loads(raw.read_text(encoding='utf-8'));errors=[]
    def check(ok,label):
        if not ok:errors.append(label)
    check(d['fatal'] is None and d['verdict']=='PARTIEL_EXERCICE_COMBINE','campagne incomplète')
    check([c['id'] for c in d['cases']]==[f'PT04-F{n:02d}' for n in range(1,5)],'inventaire')
    check(not any(d[k] for k in ('PT04_clos','NF05_qualifie','RPO_RTO_qualifies')) and d['metadata']['temporary_files_removed'],'portée/nettoyage')
    for n,c in enumerate(d['cases'],1):
        check(c['status']=='PASS','cas en échec')
        if c['status']!='PASS':continue
        for t in c['traces']:
            phases=t['phases'];names=[p['phase'] for p in phases]
            check(names[:1]==['barrier_closed'],'barrière initiale absente')
            check(all(a['monotone_ns']<b['monotone_ns'] for a,b in zip(phases,phases[1:])),'chronologie incohérente')
            if t['output'].get('status')=='restored':
                check(names==['barrier_closed','backup_verified','database_restored','authority_reconciled','media_verified','service_opened'],'ouverture prématurée')
            else:check(not t['durable_after']['supervisor_open'],'service exposé après incident')
        if n!=2:
            check(c['after']['application']['objects']==[['keep','current content',1]],'purge non réappliquée')
            check(c['after']['application']['effects']==[['op1','keep','author delta']],'effet non récupéré')
    for name,h in d['sha256_sources'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'source modifiée '+name)
    report=DIR/'RAPPORT_PT04_LOT_F.md'
    lines=['# PT04 — Lot F : exercice combiné de restauration','',
           '**14 octobre 2026 — quatre essais réussis ; PT04 non clos ; NF05/RPO/RTO non qualifiés.**','',
           'Montage réel des primitives A/B/E : archive DPAPI, snapshot SQLite, média, registre de purge/intention/politiques, réconciliation puis ouverture extérieure. Chaque reprise s’exécute dans un nouveau processus ; secret transmis par stdin, phases monotones et durée de tentative enregistrées.','',
           '| Cas | Expérience | Verdict |','|---|---|---|']
    lines += [f"| {c['id']} | {c['label']} | {c['status']} |" for c in d['cases']]
    lines += ['', 'Ordre exigé : fermeture → archive vérifiée → base restaurée → autorité réconciliée → média vérifié → ouverture. Une archive saine ne compense pas une autorité tronquée. Une base réconciliée ne suffit pas si le média restauré est altéré. Panne après commit de réconciliation : porte extérieure fermée, puis nouvelle reprise depuis l’archive avec un effet final unique.','',
              '| Cas/tentative | Durée observée ms | Sortie |','|---|---:|---|']
    for c in d['cases']:
        for i,t in enumerate(c['traces'],1):lines.append(f"| {c['id']}/{i} | {t['elapsed_ms']:.3f} | {t['output'].get('status','interruption')} |")
    lines += ['', 'Ces durées incluent le démarrage Python sur un corpus minuscule ; elles ne mesurent ni un RTO représentatif ni un RPO. Aucun dernier commit récupéré/perdu d’un patrimoine réel n’est qualifié. Objectifs CDC inchangés, recette NF05 réservée.','',
              'Checkpoint/manifeste/secrets fiables injectés, profil Windows courant, stockage sur un seul poste ; pas durabilité indépendante de l’autorité, escrow, transport ou sauvegarde intersite. Média lié à keep ; les binaires/copies purgés et résidus de sauvegarde D restent éprouvés séparément. Service extérieur simulé, aucune lecture concurrente ni sécurité des anciennes sessions sur restaurations répétées qualifiée.','',
              'Total PT04 : 37 essais A–F. [Résultats et phases](RESULTATS_PT04_LOT_F.json), [banc](../../../spec/prototypes/pt04/README.md). Coût cloud nul ; PER-01–07 restent ouverts.','']
    if not errors:
        report.write_text('\n'.join(lines),encoding='utf-8')
        files=[raw,report,Path(__file__).resolve()]+[ROOT/name for name in d['sha256_sources']]
        proof=dict(prototype='PT04',lot='F',PT04_clos=False,NF05_qualifie=False,
                   sha256={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in files})
        path=DIR/'PREUVES_PT04_LOT_F.json'
        if path.exists():
            old=json.loads(path.read_text(encoding='utf-8'))
            for name,h in old['sha256'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'preuve modifiée '+name)
        if not errors:path.write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(lot='F',passed=sum(c['status']=='PASS' for c in d['cases']),errors=errors)))
    raise SystemExit(bool(errors))

if __name__=='__main__':main()
