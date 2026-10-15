"""Rapport des mesures PT05 E, sans extrapolation de capacité produit."""
import hashlib
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];DIR=ROOT/'docs/07_ARCHITECTURE/preuves'

def main():
    raw=DIR/'RESULTATS_PT05_LOT_E.json';d=json.loads(raw.read_text(encoding='utf-8'));errors=[]
    manifest=json.loads((ROOT/'spec/prototypes/pt05/capacity_profile.json').read_text(encoding='utf-8'))
    def check(ok,label):
        if not ok:errors.append(label)
    check(d['fatal'] is None and d['verdict']=='PARTIEL_MESURES_LOCALES','campagne incomplète')
    check([c['id'] for c in d['cases']]==[f'PT05-E{n:02d}' for n in range(1,8)],'inventaire')
    check(not any(d[k] for k in ('PT05_clos','MPD04_fixe','capacite_production_qualifiee','budget_mensuel_estime')),'qualification abusive')
    check(d['metadata']['temporary_files_removed'],'nettoyage')
    expected=[(p['name'],load) for p in manifest['profiles'] for load in manifest['loads']]
    actual=[]
    for c in d['cases'][:6]:
        check(c['status']=='PASS','cas en échec')
        if c['status']!='PASS':continue
        actual.append((c['profile']['name'],c['load']))
        check(len(c['samples'])==manifest['repetitions'],'répétitions manquantes')
        check(c['maximum_ms']==max(s['elapsed_ms'] for s in c['samples']),'maximum tronqué')
        for sample in c['samples']:
            check(sample['signals']==c['profile']['nodes']-1 and not sample['pending_after'] and sample['scientific_status']=='reexamen','fausse complétude')
            check(all(r['status'] in ('propagation_en_cours','reexamen') for r in sample['reads']),'lecture permissive')
    check(actual==expected,'profil/paliers modifiés')
    alert=d['cases'][-1];check(alert['status']=='PASS' and alert['pending_preserved'] and alert['read_status']=='propagation_en_cours','barrière levée au dépassement')
    for name,h in d['sha256_sources'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'source modifiée '+name)
    report=DIR/'RAPPORT_PT05_LOT_E.md'
    lines=['# PT05 — Lot E : délais et ressources sur profil déclaré','',
           '**14 octobre 2026 — sept cas réussis, 30 répétitions mesurées ; PT05 non clos, MPD-04 non fixé.**','',
           f"OS : {d['metadata']['os']}. Python : {d['metadata']['python']}.",'',
           'Le manifeste DIAGNOSTIC-01 est écrit avant collecte : chaîne 64, étoile 256, arbre binaire 511 nœuds ; solo puis deux threads de lectures (100 appels maximum chacun), cinq répétitions par condition, ordre fixe, aucune exclusion. Réutilise réellement le mécanisme de propagation B. Temps monotone de début de correction à commit/contrôle de tous les signalements ; démarre avant transaction directe, donc inclut son coût et l’instrumentation.','',
           '| Graphe | Charge | Médiane ms | Maximum ms | Lectures réalisées | Pic Python KiB |','|---|---|---:|---:|---:|---:|']
    for c in d['cases'][:6]:
        if c['status']=='PASS':lines.append(f"| {c['profile']['name']} | {c['load']} | {c['median_ms']:.3f} | {c['maximum_ms']:.3f} | {sum(len(s['reads']) for s in c['samples'])} | {max(s['python_peak_tracemalloc_bytes'] for s in c['samples'])/1024:.1f} |")
    lines += ['', 'Toutes les distributions et les débits sont publiés dans les résultats. Le pic tracemalloc porte sur les allocations Python, pas la RSS ni la mémoire native SQLite. CPU du processus inclut les threads et leur terminaison ; espace des fichiers observé, pas patrimoine média. Les threads peuvent attendre le verrou global ; aucun chevauchement effectif garanti à chaque répétition.','',
              'Les maxima et p95 nearest-rank de cinq observations coïncident ; aucun percentile de population ni délai maximal garanti déduit. Ordre fixe, petite taille, charge finie et cache/poste variable : une condition chargée peut apparaître plus rapide qu’une condition solo. Aucune conclusion causale ou extrapolation de capacité issue de cette seule différence.','',
              'E07 impose volontairement un budget zéro à la fixture après correction : alerte diagnostique et barrière conservée, sans finalisation. Ce cas ne qualifie pas un timeout de production ni une supervision périodique ; il ne fixe pas MPD-04. Un dépassement ne peut pas supprimer l’impact pour satisfaire un délai.','',
              'Coût cloud engagé : 0 €. Le poste, l’exploitation, stockage/réseau et prestataires ne sont pas chiffrés ; aucun budget mensuel estimé ou capacité de production qualifiée. ASY-01–07, profils NF et MPD-04 restent ouverts. Total PT05 : 34 cas A–E. [Résultats et séries](RESULTATS_PT05_LOT_E.json), [banc](../../../spec/prototypes/pt05/README.md).','']
    if not errors:
        report.write_text('\n'.join(lines),encoding='utf-8')
        files=[raw,report,Path(__file__).resolve()]+[ROOT/name for name in d['sha256_sources']]
        proof=dict(prototype='PT05',lot='E',PT05_clos=False,MPD04_fixe=False,
                   sha256={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in files})
        path=DIR/'PREUVES_PT05_LOT_E.json'
        if path.exists():
            old=json.loads(path.read_text(encoding='utf-8'))
            for name,h in old['sha256'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'preuve modifiée '+name)
        if not errors:path.write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(lot='E',passed=sum(c['status']=='PASS' for c in d['cases']),errors=errors)))
    raise SystemExit(bool(errors))

if __name__=='__main__':main()
