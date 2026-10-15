"""Rapport et contrôle PT06 E, export et réimport isolé."""
import hashlib
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];DIR=ROOT/'docs/07_ARCHITECTURE/preuves'

def main():
    raw=DIR/'RESULTATS_PT06_LOT_E.json';d=json.loads(raw.read_text(encoding='utf-8'));errors=[]
    def check(ok,label):
        if not ok:errors.append(label)
    check(d['fatal'] is None and d['verdict']=='PARTIEL_EXPORT_RECUPERATION','campagne incomplète')
    check([c['id'] for c in d['cases']]==[f'PT06-E{n:02d}' for n in range(1,7)],'inventaire')
    check(not d['PT06_clos'] and not d['reversibilite_patrimoine_complet_qualifiee'] and d['metadata']['temporary_files_removed'],'portée/nettoyage')
    for n,c in enumerate(d['cases'],1):
        check(c['status']=='PASS','cas en échec')
        if c['status']!='PASS':continue
        if n in (1,2):check(c['after']['control_import_status']=='control_imported','réimport manquant')
        if n in (2,3):check(c['traces'][0]['exit_code']==73 and not c['traces'][0]['completed'],'interruption/faux achèvement')
        if n==3:check(not c['after']['completed'] and c['traces'][-1]['output']=={'status':'reconcile_required'},'révocation contournée')
        if n==4:check(c['after']['control_import_status']=='integrity_refused','corruption importée')
        if n==5:check(c['after']['control_import_status']=='format_refused','schéma inconnu interprété')
        if n==6:check(not c['after']['completed'] and all(not t['published'] for t in c['traces']),'contexte étranger exporté')
    for name,h in d['sha256_sources'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'source modifiée '+name)
    report=DIR/'RAPPORT_PT06_LOT_E.md'
    lines=['# PT06 — Lot E : export patrimonial et récupération','',
           '**14 octobre 2026 — six essais réussis ; PT06 non clos, réversibilité complète non qualifiée.**','',
           'Export réel de deux objets visibles, leurs versions/provenance/protections déclarées et médias, vers fichiers JSON/base64 ; troisième objet caché omis. Manifeste comporte format/protocole/schéma/référentiel, contexte/génération et empreintes. SQLite sous garde jusqu’à publication locale de chaque portion (flush/fsync/replace) ; contrôle final avant manifeste d’achèvement.','',
           '| Cas | Expérience | Verdict |','|---|---|---|']
    lines += [f"| {c['id']} | {c['label']} | {c['status']} |" for c in d['cases']]
    lines += ['', 'Panne réelle os._exit après première portion : aucun manifeste d’achèvement, reprise recontrôle/reproduit les portions sans doublon. Retrait du second objet avec changement de génération : reprise ancienne refusée, aucune seconde portion publiée. La première portion déjà délivrée n’est pas effacée à distance, conformément à la limite des contenus sortis du contrôle serveur.','',
              'Réimport de contrôle : schéma supporté, chemins/identifiants simples, ensemble manifeste/fichiers et empreintes du JSON/média vérifiés avant transaction de création dans une base isolée. Comparaison complète des lignes aux sources visibles (y compris bytes média). Corruption/schéma inconnu : aucune base import créée. Les protections copiées sont des métadonnées, jamais une nouvelle permission ; aucun import dans le Core ou les données du projet.','',
              'Pas manifeste signé ou authenticité fournisseur, stockage/réseau final, archiving/compression, gros volume, quotas/attaques d’archive ou import concurrent. Compte/appareil et autorité de fixture ; pas moteur complet de droits ou récupération authentifiée d’un journal réel. fsync/replace local ne qualifient pas une coupure matérielle. Export contrôlé à la remise filesystem, pas qualification de la sortie HTTP.','',
              'Total PT06 : 34 essais A–E. [Résultats](RESULTATS_PT06_LOT_E.json), [banc](../../../spec/prototypes/pt06/README.md). Coût cloud nul. Lot F (alternatives/budget/exploitation) et réserves de recette restent ouverts.','']
    if not errors:
        report.write_text('\n'.join(lines),encoding='utf-8')
        files=[raw,report,Path(__file__).resolve()]+[ROOT/name for name in d['sha256_sources']]
        proof=dict(prototype='PT06',lot='E',PT06_clos=False,reversibilite_patrimoine_complet_qualifiee=False,
                   sha256={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in files})
        path=DIR/'PREUVES_PT06_LOT_E.json'
        if path.exists():
            old=json.loads(path.read_text(encoding='utf-8'))
            for name,h in old['sha256'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'preuve modifiée '+name)
        if not errors:path.write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(lot='E',passed=sum(c['status']=='PASS' for c in d['cases']),errors=errors)))
    raise SystemExit(bool(errors))

if __name__=='__main__':main()
