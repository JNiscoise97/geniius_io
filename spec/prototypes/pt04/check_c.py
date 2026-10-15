"""Rapport et vérification PT04 C."""
import hashlib
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
DIR=ROOT/'docs/07_ARCHITECTURE/preuves'

def main():
    raw=DIR/'RESULTATS_PT04_LOT_C.json';d=json.loads(raw.read_text(encoding='utf-8'));errors=[]
    def check(ok,label):
        if not ok:errors.append(label)
    check(d['fatal'] is None and d['verdict']=='PARTIEL_DEPOT_DOCUMENTAIRE','campagne incomplète')
    check([c['id'] for c in d['cases']]==[f'PT04-C{n:02d}' for n in range(1,8)],'inventaire')
    check(not d['PT04_clos'] and not d['NF05_qualifie'] and d['metadata']['temporary_files_removed'],'portée/nettoyage')
    for n,c in enumerate(d['cases'],1):
        check(c['status']=='PASS','cas en échec')
        if c['status']!='PASS':continue
        check(len(c['after']['metadata'])==1,'métadonnées dupliquées')
        check(c['after']['available']==(n!=5),'disponibilité incorrecte')
        if n<=4:
            t=c['traces'][0]
            check(t['exit_code']==73 and t['durable_after']['available']==(n==4),'frontière crash incorrecte')
            check(bool(t['durable_after']['metadata'])==(n==4),'confirmation avant commit')
        if n==5:
            check([t['output']['status'] for t in c['traces']]==['confirmed','unavailable','integrity_refused'],'corruption acceptée')
        if n==6:check(c['traces'][1]['output']=={'status':'unavailable'},'média perdu disponible')
        if n==7:check(c['traces'][-1]['output']=={'status':'conflict'},'conflit ignoré')
    for name,h in d['sha256_sources'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'source modifiée '+name)
    report=DIR/'RAPPORT_PT04_LOT_C.md'
    lines=['# PT04 — Lot C : dépôt documentaire et cohérence base/média','',
           '**Sept scénarios réussis ; PT04 partiel, non clos ; NF05 non qualifié.**','',
           f"Campagne UTC : {d['started_utc']} → {d['ended_utc']}. OS : {d['metadata']['os']}.",'',
           'Fichiers réels synthétiques et métadonnées SQLite WAL/FULL. Écriture de staging, flush/fsync, vérification taille/empreinte et publication par remplacement local ; métadonnées commises ensuite, confirmation après commit seulement. Commandes dans de nouveaux processus, interruptions os._exit aux quatre frontières. Aucune transaction atomique entre fichier et base n’est revendiquée.','',
           '| Cas | Expérience | Verdict |','|---|---|---|']
    lines += [f"| {c['id']} | {c['label']} | {c['status']} |" for c in d['cases']]
    lines += ['', 'Le média publié sans métadonnées est un orphelin récupérable : le rejeu valide son intégrité et complète la base. Après commit avec réponse perdue, le même dépôt est confirmé sans duplication. Un staging partiel n’est jamais déclaré disponible. La consultation vérifie aussi présence, taille et empreinte du média : une ligne en base ne suffit pas.','',
              'Corruption : refus de consultation et refus de réemploi du fichier ; pas de remplacement silencieux. Perte : consultation indisponible, puis réparation depuis la source synthétique disponible et fiable. Un autre contenu sous le même identifiant est refusé avant écrasement. Procédure de réparation avec source perdue et restauration de stockage objet non couvertes.','',
              'fsync et renommage local ne qualifient pas le matériel ni une coupure électrique. Manifeste et autorisation de fixture ; pas authentification, transport, concurrence entre dépôts, chiffrement, stockage objet ou gros volume. Le contrôle à la lecture n’atteste pas une garde pendant remise réseau ; réserves PT02/SEC-03 maintenues. RPO médias et NF05 restent non qualifiés, PER-01–07 ouverts.','',
              'Total PT04 : 21 essais A/B/C. [Résultats](RESULTATS_PT04_LOT_C.json), [banc](../../../spec/prototypes/pt04/README.md). Coût cloud nul.','']
    if not errors:
        report.write_text('\n'.join(lines),encoding='utf-8')
        files=[raw,report,Path(__file__).resolve()]+[ROOT/name for name in d['sha256_sources']]
        proof=dict(prototype='PT04',lot='C',PT04_clos=False,NF05_qualifie=False,
                   sha256={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in files})
        path=DIR/'PREUVES_PT04_LOT_C.json'
        if path.exists():
            old=json.loads(path.read_text(encoding='utf-8'))
            for name,h in old['sha256'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'preuve modifiée '+name)
        if not errors:path.write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(lot='C',passed=sum(c['status']=='PASS' for c in d['cases']),errors=errors)))
    raise SystemExit(bool(errors))

if __name__=='__main__':main()
