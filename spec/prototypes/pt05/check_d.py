"""Contrôle et rapport PT05 D, sans qualification de capacité/latence."""
import hashlib
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];DIR=ROOT/'docs/07_ARCHITECTURE/preuves'

def main():
    raw=DIR/'RESULTATS_PT05_LOT_D.json';d=json.loads(raw.read_text(encoding='utf-8'));errors=[]
    def check(ok,label):
        if not ok:errors.append(label)
    check(d['fatal'] is None and d['verdict']=='PARTIEL_ADMISSION_EQUITE','campagne incomplète')
    check([c['id'] for c in d['cases']]==[f'PT05-D{n:02d}' for n in range(1,7)],'inventaire')
    check(not d['PT05_clos'] and not d['capacite_production_qualifiee'] and d['metadata']['temporary_files_removed'],'portée/nettoyage')
    for n,c in enumerate(d['cases'],1):
        check(c['status']=='PASS','cas en échec')
        if c['status']!='PASS':continue
        jobs=c['after']['jobs'];check(all(r[5] in ('done','isolated') for r in jobs),'travail perdu/en attente finale')
        check(len(c['after']['effects'])==sum(r[5]=='done' for r in jobs),'double effet ou effet perdu')
        for t in c['traces']:
            active=[r for r in t['durable_after']['jobs'] if r[5] in ('pending','running')]
            check(len(active)<=12 and sum(r[3] for r in active)<=100,'quota global dépassé')
            check(sum(r[5]=='running' for r in active)<=2,'concurrence dépassée')
        if n==2:
            order=[t['output'] for t in c['traces'] if t['output']['status']=='claimed']
            check([r['actor'] for r in order if r['class']=='background']==['A','B']*3,'équité acteur')
        if n==4:check(any(r[5]=='isolated' and r[6]==3 for r in jobs),'retries non bornés')
        if n==5:check(len(jobs)==1 and any(t['output']['status']=='conflict' for t in c['traces']),'origine dupliquée/conflit effacé')
    for name,h in d['sha256_sources'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'source modifiée '+name)
    report=DIR/'RAPPORT_PT05_LOT_D.md'
    lines=['# PT05 — Lot D : admission et équité sous charge mixte','',
           '**14 octobre 2026 — six essais réussis ; PT05 non clos, capacité de production non qualifiée.**','',
           'Queue SQLite transactionnelle, commandes dans des processus distincts ; quatre admissions identiques concurrentes. Paramètres de fixture : 12 travaux actifs, 8 de fond, 4 par acteur, budget déclaré 100 unités, 2 workers, 3 tentatives, cycle interactif/interactif/fond. Aucun paramètre produit ratifié.','',
           '| Cas | Expérience | Verdict |','|---|---|---|']
    lines += [f"| {c['id']} | {c['label']} | {c['status']} |" for c in d['cases']]
    lines += ['', 'D01 sature huit travaux de fond puis accepte quatre interactifs. D02 répartit six travaux de fond et six interactifs entre quatre acteurs : cycle pondéré et alternance des acteurs de fond, tous terminés. Refus de quota explicite, rejeu d’origine avant quotas, contenu différent refusé. Les tâches isolées sont conservées ; les effets terminés sont uniques.','',
              'D03 laisse un worker de fond occupé et termine un interactif sur l’autre place ; un troisième claim est busy. Les places réservées à l’admission ne sont pas des workers réservés : deux travaux de fond peuvent occuper les deux workers. Aucune préemption ni borne de latence interactive démontrée. D04 injecte le temps, impose une attente exponentielle puis isole après trois échecs, sans bloquer le travail sain.','',
              'Charge finie, poids égaux et temps injecté ; pas preuve universelle d’absence de famine avec arrivées continues, durées variables ou prestataire lent. Budget size déclaratif, pas mémoire/médias réels. Rétention/quotas de stockage pour tâches isolées, classes de sécurité, baux perdus, équité multi-tenant et charge représentative restent réservés. ASY-01–07/MPD-04 non clos.','',
              'Total PT05 : 27 essais A–D. [Résultats](RESULTATS_PT05_LOT_D.json), [banc](../../../spec/prototypes/pt05/README.md). Coût cloud nul.','']
    if not errors:
        report.write_text('\n'.join(lines),encoding='utf-8')
        files=[raw,report,Path(__file__).resolve()]+[ROOT/name for name in d['sha256_sources']]
        proof=dict(prototype='PT05',lot='D',PT05_clos=False,capacite_production_qualifiee=False,
                   sha256={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in files})
        path=DIR/'PREUVES_PT05_LOT_D.json'
        if path.exists():
            old=json.loads(path.read_text(encoding='utf-8'))
            for name,h in old['sha256'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'preuve modifiée '+name)
        if not errors:path.write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(lot='D',passed=sum(c['status']=='PASS' for c in d['cases']),errors=errors)))
    raise SystemExit(bool(errors))

if __name__=='__main__':main()
