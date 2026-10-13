import hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
DIR=ROOT/'docs/07_ARCHITECTURE/preuves'
def main():
    path=DIR/'RESULTATS_PROTOTYPE_PT01.json'
    d=json.loads(path.read_text(encoding='utf-8'))
    good=sum(c['statut']=='PASS' for c in d['cases'])
    sources={n:hashlib.sha256((ROOT/n).read_bytes()).hexdigest()==h for n,h in d['sha256_sources'].items()}
    closed=d['PT01_clos_integralement'] and all(sources.values()) and d['fatal'] is None
    out=['# PT01 — Clôture du périmètre prototype','',f'**{d["verdict"]} : {good}/{len(d["cases"])} scénarios réussis. Clôture PT01 : {closed}.**','',
    'La règle ratifiée le 13/10/2026 est consignée dans [DC-AUTH-01](../../04_CONTRAT_AUTORISATION/GENIIUS_AMENDEMENT_TEMPOREL_DC_AUTH_01.md). Le droit doit être valide au contrôle final Core sous gardes conservées jusqu’au commit. Le commit physique peut survenir après échéance. Toute nouvelle sortie réévalue les droits actuels.','',
    f'Campagne UTC : {d["started_utc"]} → {d["ended_utc"]}.',f'Serveur : {d["metadata"].get("postgresql_version")}.',f'Image : {d["metadata"].get("image_id")}.',
    f'Conteneur retiré : {d["metadata"].get("container_removed")}. Réseau none, aucun port publié ni montage hôte. Coût cloud engagé : 0 €.','',
    '[Résultats et traces](RESULTATS_PROTOTYPE_PT01.json). [Schéma](../../../spec/prototypes/pt01/schema.sql) et [runner](../../../spec/prototypes/pt01/run.py).','',
    '| Cas | Objet | Verdict |','|---|---|---|']
    for c in d['cases']:
        out.append(f'| {c["id"]} | {c["objet"]} | {c["statut"]} |')
        if c['erreur']:out.append('\nIncident : '+c['erreur'])
    if d['fatal']:out.append('\nIncident de campagne : '+d['fatal'])
    out+=['','## Preuve temporelle','']
    for c in d['cases']:
        for t in c['traces']:
            if t['phase']=='borne_logique_observee':
                o=t['observation']
                out += [f'- Contrôle final : {o["checked_at"]}.',f'- Échéance : {o["expires_at"]}.',f'- Horodatage de commit : {o["commit_timestamp"]}.']
    out+=['','PT01-03 refuse et annule tous les effets si l’échéance précède le contrôle final. PT01-11 force SET CONSTRAINTS sans certificat final : refus et rollback. PT01-12 injecte une pause après le contrôle final, observe zéro effet canonique depuis une autre connexion, puis accepte le commit tardif ; une révocation reste bloquée jusqu’au commit. Lecture et rejeu après révocation sont refusés. PT01-13 annule aussi le certificat et refuse une nouvelle tentative après échéance.','',
    'Le runner représente le Core de confiance. Il appelle finalize_fixture comme dernière instruction métier avant COMMIT. Les réponses SQL internes avant commit sont provisoires. Le demandeur ne possède pas le rôle SQL technique ; sa compromission n’est pas couverte. La sortie HTTP après confirmation du commit reste à éprouver dans PT02. L’injection de pause est réservée au banc.','',
    '[CE01/CE02 historiques](historique/PT01_AVANT_ARBITRAGE/RESULTATS_PROTOTYPE_PT01.json) restent des échecs de la borne physique initiale, sans reclassement rétroactif. Le timestamp PostgreSQL ne mesure pas la fin du flush WAL ni la visibilité.','',
    '## Portée de clôture','',
    'PT01-L01 est clos pour la règle ratifiée et ce corpus réduit. SEC-01 dispose de preuves SQL de garde et d’instant logique final ; transposition au moteur V1.6 complet, MPD et déploiement reste requise. Aucun gel d’architecture ni choix de pile ne découle de PT01. PT02 à PT06 restent à exécuter.','',
    *['- '+v for v in d['limites']],'',
    '[Contraintes différées PostgreSQL](https://www.postgresql.org/docs/16/sql-createtrigger.html) et [horodatage de commit](https://www.postgresql.org/docs/16/functions-info.html). Les verdicts viennent des exécutions consignées.','']
    report=DIR/'RAPPORT_PROTOTYPE_PT01.md'
    report.write_text('\n'.join(out),encoding='utf-8')
    amendment=ROOT/'docs/04_CONTRAT_AUTORISATION/GENIIUS_AMENDEMENT_TEMPOREL_DC_AUTH_01.md'
    proof={'prototype':'PT01','SQL_execute':d['SQL_execute'],'verdict':d['verdict'],'sources_conformes_execution':sources,'PT01_clos':closed,'architecture_gelee':False,
    'sha256':{str(p.relative_to(ROOT)).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest() for p in [path,report,amendment,Path(__file__).resolve(),Path(__file__).with_name('check_results.py'),Path(__file__).with_name('PROTOCOL.md')]}}
    (DIR/'PREUVES_PROTOTYPE_PT01.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(d['verdict'],good,'scénarios ; clôture PT01 :',closed)
    raise SystemExit(not closed)
if __name__=='__main__':main()
