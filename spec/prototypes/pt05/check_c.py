"""Rapport et contrôle du prestataire synthétique PT05 C."""
import hashlib
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];DIR=ROOT/'docs/07_ARCHITECTURE/preuves'

def main():
    raw=DIR/'RESULTATS_PT05_LOT_C.json';d=json.loads(raw.read_text(encoding='utf-8'));errors=[]
    def check(ok,label):
        if not ok:errors.append(label)
    check(d['fatal'] is None and d['verdict']=='PARTIEL_EFFETS_EXTERNES','campagne incomplète')
    check([c['id'] for c in d['cases']]==[f'PT05-C{n:02d}' for n in range(1,7)],'inventaire')
    check(not d['PT05_clos'] and not d['prestataire_reel_qualifie'] and d['metadata']['temporary_files_removed'],'portée/nettoyage')
    for n,c in enumerate(d['cases'],1):
        check(c['status']=='PASS','cas en échec')
        if c['status']!='PASS':continue
        check(len(c['after']['effects'])==(0 if n==1 else 1),'effet externe indu/dupliqué')
        if n in (2,3,4):check(c['traces'][0]['exit_code']==73,'perte d’accusé non éprouvée')
        if n==4:
            check(c['after']['operation'][0][2:]==['uncertain',0],'incertitude effacée')
            check(all(t['output']=={'status':'manual_required'} for t in c['traces'][1:]),'relance aveugle')
        if n==5:check(c['after']['operation'][0][2:] == ['external_confirmed_blocked',1] and c['traces'][-1]['output']=={'status':'unavailable'},'révocation contournée')
        if n==6:check(c['traces'][-1]['provider_conflict']=={'status':'conflict'},'collision idempotente acceptée')
    for name,h in d['sha256_sources'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'source modifiée '+name)
    report=DIR/'RAPPORT_PT05_LOT_C.md'
    lines=['# PT05 — Lot C : autorité et effet externe incertain','',
           '**14 octobre 2026 — six essais réussis ; PT05 non clos ; aucun prestataire réel qualifié.**','',
           'Prestataire synthétique dans une base SQLite distincte, appels dans des processus distincts. Aucun message ni paiement réel envoyé. Opération uncertain persistée avant sortie, effet prestataire commis avant perte simulée d’accusé par os._exit, réconciliation avant clôture locale.','',
           '| Cas | Expérience | Verdict |','|---|---|---|']
    lines += [f"| {c['id']} | {c['label']} | {c['status']} |" for c in d['cases']]
    lines += ['', 'Mode search : retrouver le résultat existant sans réexécution. Mode idempotent : reprendre avec la même clé et le même contenu ; prestataire refuse un contenu différent. Résultat confirmé et rejeu local ne provoquent aucune sortie supplémentaire. Sans recherche/idempotence, l’état reste incertain et manual_required : un état privé récupérable, pas un succès ni une relance automatique.','',
              'Retrait avant sortie : aucun effet. Retrait après commit externe : le fait externe est conservé et confirmé en privé, mais l’intégration et la consultation locales sont refusées. Une révocation n’annule pas un effet déjà exécuté à l’extérieur. Compensation, récupération et finalité de prestataire sont des contrats supplémentaires.','',
              'Autorité booléenne et séquences déterministes : pas contrôle concurrent de remise réseau, moteur complet d’autorisations ou fournisseur réel. Résultat de recherche supposé fiable/durable ; eventual consistency, disparition du résultat, rétention/expiration des clés et workflow opérateur non qualifiés. Aucune promesse générale d’effet externe unique sans contrat prestataire. PR11/ASY-05 restent ouverts à recette.','',
              'Total PT05 : 21 essais A–C. [Résultats et traces](RESULTATS_PT05_LOT_C.json), [banc](../../../spec/prototypes/pt05/README.md). Coût cloud nul.','']
    if not errors:
        report.write_text('\n'.join(lines),encoding='utf-8')
        files=[raw,report,Path(__file__).resolve()]+[ROOT/name for name in d['sha256_sources']]
        proof=dict(prototype='PT05',lot='C',PT05_clos=False,prestataire_reel_qualifie=False,
                   sha256={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in files})
        path=DIR/'PREUVES_PT05_LOT_C.json'
        if path.exists():
            old=json.loads(path.read_text(encoding='utf-8'))
            for name,h in old['sha256'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'preuve modifiée '+name)
        if not errors:path.write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(lot='C',passed=sum(c['status']=='PASS' for c in d['cases']),errors=errors)))
    raise SystemExit(bool(errors))

if __name__=='__main__':main()
