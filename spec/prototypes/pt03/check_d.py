"""Rapport et contrôle PT03 D, horloge logique injectée."""
import hashlib
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[3]
DIR=ROOT/'docs/07_ARCHITECTURE/preuves'

def main():
    raw=DIR/'RESULTATS_PT03_LOT_D.json';d=json.loads(raw.read_text(encoding='utf-8'));errors=[]
    def check(ok,label):
        if not ok:errors.append(label)
    check(d['fatal'] is None and d['verdict']=='PARTIEL_LOT_D','campagne incomplète')
    check([c['id'] for c in d['cases']]==[f'PT03-D{n:02d}' for n in range(1,12)],'inventaire')
    check(d['SQL_execute'] and not any(d[k] for k in ('HTTP_execute','chiffrement_execute','horloge_OS_qualifiee','PT03_clos')),'portée abusive')
    check(d['metadata']['temporary_files_removed'],'nettoyage')
    for n,c in enumerate(d['cases'],1):
        check(c['status']=='PASS','cas en échec')
        if c['status']!='PASS':continue
        check(c['before']['journal']==c['after']['journal'],'journal altéré')
        if n!=1:check(not c['after']['gate'] and not c['after']['consultable'] and not c['after']['derived_consultable'],'consultation non fermée')
        for t in c['traces']:
            r=t['result']
            if r['allowed']:check(r['upper']<r['expiry'],'borne permissive')
            else:check(not t['durable_after']['gate'],'fermeture non persistée')
        if n==1:check(c['traces'][-1]['result']==c['traces'][-2]['result'],'heure murale influente')
        if n==2:check(c['traces'][-1]['result']=={'allowed':False,'reason':'expired','upper':2000},'égalité échéance admise')
        if n==8:check(c['traces'][-1]['result']['reason']=='reanchor_required','reprise de processus permissive')
    for name,h in d['sha256_sources'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'source modifiée '+name)
    report=DIR/'RAPPORT_PT03_LOT_D.md'
    lines=['# PT03 — Lot D : borne temporelle et fermeture sûre','',
           '**Onze scénarios réussis ; PT03 partiel, non clos. Horloge OS non qualifiée.**','',
           f"Campagne UTC : {d['started_utc']} → {d['ended_utc']}. OS hôte : {d['metadata']['os']}.",'',
           'Banc à temps injecté en unités entières synthétiques : U0 = Ts + aller-retour + incertitude ; U = U0 + temps monotone écoulé + dérive arrondie vers le haut. Accès seulement si U < échéance et continuité, contexte et bornes valides. L’heure murale ne participe pas au calcul. Ancrage en mémoire uniquement ; fermeture persistée à toute discontinuité ou reprise sans ancrage.','',
           '| Cas | Expérience | Verdict |','|---|---|---|']
    lines += [f"| {c['id']} | {c['label']} | {c['status']} |" for c in d['cases']]
    lines += ['', 'Le journal privé, dans un fichier distinct de la réplique, reste inchangé dans tous les cas. La barrière ferme aussi les lectures de dérivés. La réplique est conservée physiquement ; la preuve porte sur le refus de consultation par le client conforme, pas sur un effacement sécurisé.','',
              'D08 lance réellement un nouveau processus qui ne possède aucun ancrage mémoire et ferme une barrière précédemment ouverte. D09 restaure réellement un snapshot SQLite de réplique, puis démarre un nouvel évaluateur qui ne reconstruit pas un ancrage depuis cette base. Un snapshot complet de VM avec mémoire, un terminal compromis ou un accès direct au fichier ne sont pas couverts.','',
              'Veille, durée écoulée, bornes de dérive/incertitude, identité et authentification sont injectées. Aucun test de veille/hibernation ou de redémarrage OS réel, aucune preuve d’horloge sécurisée. Le choix prudent ferme après redémarrage du processus ; la consultation hors ligne continue après redémarrage n’est pas promise. La valeur numérique du banc ne fixe aucune durée ou précision produit.','',
              'Pas de chiffrement ni magasin de clés ; lots E/F et SYN-01–07 restent ouverts. Total : 32 essais PT03 distincts (A : 8 ; B : 6 ; C : 7 ; D : 11). Le résidu de révocation après déconnexion demeure déclaré.','',
              '[Résultats et traces](RESULTATS_PT03_LOT_D.json), [banc](../../../spec/prototypes/pt03/README.md). Coût cloud nul.','']
    if not errors:
        report.write_text('\n'.join(lines),encoding='utf-8')
        files=[raw,report,Path(__file__).resolve()]+[ROOT/name for name in d['sha256_sources']]
        proof=dict(prototype='PT03',lot='D',PT03_clos=False,horloge_OS_qualifiee=False,
                   sha256={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in files})
        path=DIR/'PREUVES_PT03_LOT_D.json'
        if path.exists():
            old=json.loads(path.read_text(encoding='utf-8'))
            for name,h in old['sha256'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'preuve modifiée '+name)
        if not errors:path.write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(lot='D',passed=sum(c['status']=='PASS' for c in d['cases']),errors=errors)))
    raise SystemExit(bool(errors))

if __name__=='__main__':main()
