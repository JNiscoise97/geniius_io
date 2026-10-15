"""Rapport et vérification PT06 A."""
import hashlib
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];DIR=ROOT/'docs/07_ARCHITECTURE/preuves'

def main():
    raw=DIR/'RESULTATS_PROTOTYPE_PT06.json';d=json.loads(raw.read_text(encoding='utf-8'));errors=[]
    def check(ok,label):
        if not ok:errors.append(label)
    check(d['fatal'] is None and d['verdict']=='PARTIEL_API_COMPATIBILITE','campagne incomplète')
    check([c['id'] for c in d['cases']]==[f'PT06-A{n:02d}' for n in range(1,9)],'inventaire')
    check(not d['PT06_clos'] and not d['MFA_qualifie'] and d['metadata']['HTTP_bind']=='127.0.0.1' and d['metadata']['temporary_files_removed'],'portée/nettoyage')
    for n,c in enumerate(d['cases'],1):
        check(c['status']=='PASS','cas en échec')
        if c['status']!='PASS':continue
        check(c['journal_intact'] and c['before']['objects']==c['after']['objects'],'effet canonique ou journal altéré')
        if n in (4,5):check(c['http_traces'][0]==c['http_traces'][1] and c['http_traces'][0]['status']==404,'oracle HTTP observable')
        if n==3:check([t['status'] for t in c['http_traces']]==[202,202,409] and len(c['after']['receipts'])==1,'rejeu/conflit incorrect')
        if n==6:check([t['status'] for t in c['http_traces']]==[426,202,200],'ancien client permissif')
        if n==8:check([t['status'] for t in c['http_traces']]==[200,401,401],'session ancienne réutilisée')
    for name,h in d['sha256_sources'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'source modifiée '+name)
    report=DIR/'RAPPORT_PROTOTYPE_PT06.md'
    lines=['# PT06 — Lot A : contrats API et compatibilité','',
           '**14 octobre 2026 — huit essais réussis ; PT06 partiel, non clos.**','',
           'Serveur HTTP standard sur 127.0.0.1/port éphémère, requêtes via socket et effets SQLite WAL/FULL. Garde globale conservée pour les GET jusqu’à remise des en-têtes/corps ; réception technique commise avant accusé 202. Aucun objet canonique intégré dans ce lot.','',
           '| Cas | Expérience | Verdict |','|---|---|---|']
    lines += [f"| {c['id']} | {c['label']} | {c['status']} |" for c in d['cases']]
    lines += ['', 'Cible cachée et absente ont le même statut, les mêmes en-têtes et le même corps ; mauvais contexte compte/appareil ne révèle pas la cible. Les refus d’enveloppe/opération ne créent pas de reçu. Réception répétée garde un reçu ; même origine avec autre contenu retourne conflit sans remplacement. 202 confirme seulement la réception, jamais intégration ou validation scientifique.','',
              'Client version 1 : réplique refusée, dépôt de format sûr accepté ; fichier témoin du journal local conservé. Conversion synthétique v1→v2 trace le convertisseur et conserve l’enveloppe originale ; concept ambigu en attente sans décision automatique. Session active vérifiée à chaque requête.','',
              'Tokens, personnes/appareils et X-Client-Version de fixture : pas validation d’authentification, MFA ou négociation sécurisée. Ancien client prétendant une capacité fausse, TLS/proxy, attaques réseau, rôles/MLD complets et confidentialité temporelle NF10 restent réservés. Conservation d’un fichier témoin n’atteste pas une récupération authentifiée des deltas ou un client local implémenté. Valeurs 1/2/4096 sont réservées au banc.','',
              '[Résultats et sorties HTTP](RESULTATS_PROTOTYPE_PT06.json), [banc](../../../spec/prototypes/pt06/README.md). Coût cloud nul. Lots B–F non exécutés ; aucun gel ou choix de pile.','']
    if not errors:
        report.write_text('\n'.join(lines),encoding='utf-8')
        files=[raw,report,Path(__file__).resolve()]+[ROOT/name for name in d['sha256_sources']]
        proof=dict(prototype='PT06',lot='A',PT06_clos=False,MFA_qualifie=False,
                   sha256={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in files})
        path=DIR/'PREUVES_PROTOTYPE_PT06.json'
        if path.exists():
            old=json.loads(path.read_text(encoding='utf-8'))
            for name,h in old['sha256'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'preuve modifiée '+name)
        if not errors:path.write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(prototype='PT06',passed=sum(c['status']=='PASS' for c in d['cases']),errors=errors)))
    raise SystemExit(bool(errors))

if __name__=='__main__':main()
