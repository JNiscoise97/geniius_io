"""Rapport et contrôle PT05 B."""
import hashlib
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];DIR=ROOT/'docs/07_ARCHITECTURE/preuves'

def main():
    raw=DIR/'RESULTATS_PT05_LOT_B.json';d=json.loads(raw.read_text(encoding='utf-8'));errors=[]
    def check(ok,label):
        if not ok:errors.append(label)
    check(d['fatal'] is None and d['verdict']=='PARTIEL_PROPAGATION_GENERATIONS','campagne incomplète')
    check([c['id'] for c in d['cases']]==[f'PT05-B{n:02d}' for n in range(1,7)],'inventaire')
    check(not d['PT05_clos'] and not d['MPD04_fixe'] and d['metadata']['temporary_files_removed'],'portée/nettoyage')
    for n,c in enumerate(d['cases'],1):
        check(c['status']=='PASS','cas en échec')
        if c['status']!='PASS':continue
        check(c['after']['scope'][1]==0 and dict(c['after']['nodes'])['tail']==1,'propagation/impact incohérents')
        reads=[t['output'] for t in c['traces'] if t['action']=='read']
        check(reads==[{'status':'propagation_en_cours'},{'status':'reexamen'}],'validation scientifique implicite')
        if n in (2,3):check(any(t['output']=={'status':'stale_refused'} for t in c['traces']),'ancienne génération permissive')
        if n==2:check(len(c['after']['causes'])==2 and len(c['after']['signals'])==4,'nouvelle cause perdue')
        if n==3:check(dict(c['after']['nodes'])['extra']==1,'nouvelle dépendance oubliée')
        if n==5:check(any(t['output']=={'status':'cycle_refused'} for t in c['traces']),'cycle de production accepté')
        if n==6:check(any(t['exit_code']==73 and t['durable_after']['scope'][1]==1 for t in c['traces']),'barrière après panne absente')
    for name,h in d['sha256_sources'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'source modifiée '+name)
    report=DIR/'RAPPORT_PT05_LOT_B.md'
    lines=['# PT05 — Lot B : propagation et générations','',
           '**14 octobre 2026 — six essais réussis ; PT05 non clos ; MPD-04 non fixé.**','',
           'Petit graphe SQLite réel, mutations et finalisations dans des processus distincts. Marquage direct et barrière conservative au commit de correction. Chaque cause conserve sa version ; ajout de cause ou de dépendance change la génération. Le travail préparé d’une ancienne génération est refusé, puis un nouveau parcours couvre les descendants.','',
           '| Cas | Expérience | Verdict |','|---|---|---|']
    lines += [f"| {c['id']} | {c['label']} | {c['status']} |" for c in d['cases']]
    lines += ['', 'La clôture technique publie les signalements et retire la seule barrière propagation_en_cours ; les impacts restent à 1 et la sortie reexamen. Aucun effacement d’impact ni validation scientifique automatique. Signalements uniques par cause/version/cible, rejeu sans doublon. Le parcours avec ensemble de visites termine sur le cycle join/tail ; une arête créant un cycle de production est refusée sans mutation.','',
              'Les deux causes sont intercalées de manière déterministe, pas commises simultanément. Parcours complet et recalcul final sous verrou sur petit corpus ; frontier durable par unités bornées, croissance, capacité et délai maximal restent à éprouver. Barrière globale conservative, pas choix de périmètre physique ratifié. Les sorties publiques portent uniquement le statut générique ; corpus/rôles, canaux indirects et NF10 non qualifiés. Les causes sont présentes dans les traces privées du banc.','',
              'Indépendance des justifications scientifiques non modélisée ; terminaison de parcours ne la démontre pas. ASY-01–07/MPD-04 et qualification représentative restent ouverts. Total PT05 : 15 essais A/B. [Résultats](RESULTATS_PT05_LOT_B.json), [banc](../../../spec/prototypes/pt05/README.md). Coût cloud nul.','']
    if not errors:
        report.write_text('\n'.join(lines),encoding='utf-8')
        files=[raw,report,Path(__file__).resolve()]+[ROOT/name for name in d['sha256_sources']]
        proof=dict(prototype='PT05',lot='B',PT05_clos=False,MPD04_fixe=False,
                   sha256={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in files})
        path=DIR/'PREUVES_PT05_LOT_B.json'
        if path.exists():
            old=json.loads(path.read_text(encoding='utf-8'))
            for name,h in old['sha256'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'preuve modifiée '+name)
        if not errors:path.write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(lot='B',passed=sum(c['status']=='PASS' for c in d['cases']),errors=errors)))
    raise SystemExit(bool(errors))

if __name__=='__main__':main()
