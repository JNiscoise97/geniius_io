"""Contrôle et rapport PT04 A, sans qualification NF05."""
import hashlib
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
DIR=ROOT/'docs/07_ARCHITECTURE/preuves'

def main():
    raw=DIR/'RESULTATS_PROTOTYPE_PT04.json';d=json.loads(raw.read_text(encoding='utf-8'));errors=[]
    def check(ok,label):
        if not ok:errors.append(label)
    check(d['fatal'] is None and d['verdict']=='PARTIEL_AUTORITE_RESTAURATION','campagne incomplète')
    check([c['id'] for c in d['cases']]==[f'PT04-A{n:02d}' for n in range(1,9)],'inventaire')
    check(d['checkpoint_fiable_injecte'] and not d['PT04_clos'] and not d['NF05_qualifie'],'portée abusive')
    check(d['metadata']['temporary_files_removed'],'nettoyage')
    for n,c in enumerate(d['cases'],1):
        check(c['status']=='PASS','cas en échec')
        if c['status']!='PASS':continue
        if n in (2,3,4):check(not c['after']['open'] and not c['after']['visible'],'ouverture sans autorité actuelle')
        if n in (1,8):check(c['after']['objects']==[['keep','current content',1]] and not c['after']['derived'],'purge incomplète')
        if n in (5,6,7):
            check(c['after']['effects']==[['op1','keep','author delta']],'effet perdu/dupliqué')
            check(c['traces'][-1]['output']=={'status':'open','reconstructed_effects':0},'rejeu non idempotent')
        if n in (5,6,8):
            first=c['traces'][0]
            check(first['exit_code']==73 and not first['durable_after']['open'],'panne/barrière absente')
    for name,h in d['sha256_sources'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'source modifiée '+name)
    report=DIR/'RAPPORT_PROTOTYPE_PT04.md'
    lines=['# PT04 — Lot A : autorité et restauration sous barrière','',
           '**Huit scénarios réussis ; PT04 partiel, non clos ; NF05 non qualifié.**','',
           f"Campagne UTC : {d['started_utc']} → {d['ended_utc']}. OS : {d['metadata']['os']}. SQLite : {d['metadata']['sqlite']}.",'',
           'Transactions SQLite WAL/FULL, snapshots sauvegardés/restaurés via backup, commandes dans de nouveaux processus. Fermeture persistée avant contrôle ; ouverture seulement après comparaison du registre à un checkpoint courant puis réapplication des purges et réconciliation des effets dans la transaction applicative. Intention, effet canonique et accusé sont trois frontières distinctes ; interruptions réelles os._exit après intention ou effet.','',
           '| Cas | Expérience | Verdict |','|---|---|---|']
    lines += [f"| {c['id']} | {c['label']} | {c['status']} |" for c in d['cases']]
    lines += ['', 'Le registre est comparé intégralement par empreinte et génération au checkpoint. Le cas A04 retire une purge en gardant la génération : le service reste fermé. Le cas A03 restaure une ancienne autorité SQLite alors que le checkpoint courant reste extérieur. Ce témoin est fourni par l’orchestrateur du banc, pas un mécanisme de confiance autonome.','',
              'A07 restaure réellement la base applicative avant un effet dont l’intention et le reçu restent dans le registre extérieur. La reprise reconstruit l’effet, puis le rejeu ne crée aucun doublon. A06 retrouve un effet commis avant perte de l’accusé ; A05 complète une intention dont l’effet n’avait pas encore été commis. Ces effets sont déterministes et locaux ; aucune nouvelle exécution aveugle d’un paiement ou d’une notification externe n’est qualifiée.','',
              'La politique candidate ferme la reprise sur conflit d’effet ou reconstruction non admissible, mais ces deux branches ne sont pas encore éprouvées dans ce lot. Les restrictions/fermetures complètes, secrets indisponibles et sauvegardes compromises restent également à tester.','',
              'Limites : checkpoint/droits fiables injectés, fichiers sur même poste, pas de domaines de panne indépendants ou de signature. Retour simultané de toutes les données et du témoin non couvert. Chiffrement, clés, médias, capacité et RPO/RTO représentatifs non éprouvés. Les objectifs CDC restent ouverts à recette ; aucun résultat NF05 acquis. PER-01–07 restent ouverts.','',
              '[Résultats et traces](RESULTATS_PROTOTYPE_PT04.json), [protocole initial](../../../spec/prototypes/pt04/PROTOCOL.md), [banc](../../../spec/prototypes/pt04/README.md). Coût cloud nul.','']
    if not errors:
        report.write_text('\n'.join(lines),encoding='utf-8')
        files=[raw,report,Path(__file__).resolve()]+[ROOT/name for name in d['sha256_sources']]
        proof=dict(prototype='PT04',lot='A',PT04_clos=False,NF05_qualifie=False,
                   sha256={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in files})
        path=DIR/'PREUVES_PROTOTYPE_PT04.json'
        if path.exists():
            old=json.loads(path.read_text(encoding='utf-8'))
            for name,h in old['sha256'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'preuve modifiée '+name)
        if not errors:path.write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(prototype='PT04',passed=sum(c['status']=='PASS' for c in d['cases']),PT04_clos=False,errors=errors)))
    raise SystemExit(bool(errors))

if __name__=='__main__':main()
