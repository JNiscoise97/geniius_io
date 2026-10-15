"""Rapport d'observations navigateur, pas certification WCAG."""
import hashlib
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];DIR=ROOT/'docs/07_ARCHITECTURE/preuves'

def main():
    raw=DIR/'RESULTATS_PT06_LOT_D.json';d=json.loads(raw.read_text(encoding='utf-8'));errors=[]
    def check(ok,label):
        if not ok:errors.append(label)
    check(d['fatal'] is None and d['verdict']=='PARTIEL_ACCESSIBILITE_NAVIGATEUR','campagne incomplète')
    check([c['id'] for c in d['cases']]==[f'PT06-D{n:02d}' for n in range(1,7)],'inventaire')
    check(not any(d[k] for k in ('PT06_clos','WCAG_conformite_globale','lecteur_ecran_test')) and d['browser_closed'] and d['metadata']['temporary_files_removed'],'portée/nettoyage')
    check(all(c['status']=='PASS' for c in d['cases']),'cas en échec')
    if all(c['status']=='PASS' for c in d['cases']):
        check([f['id'] for f in d['cases'][1]['evidence']['focus']]==['skip','origin','delta','send'],'ordre clavier')
        check(d['cases'][2]['evidence']['focus']=='errors' and d['cases'][2]['evidence']['role']=='alert','erreur non exposée')
        check(d['cases'][3]['evidence']['live']=='polite','statut non exposé')
        check(d['cases'][4]['evidence']['saved']==d['cases'][3]['evidence']['saved'],'delta perdu après refus')
        check(d['cases'][5]['evidence']['scroll']<=d['cases'][5]['evidence']['client'],'débordement horizontal')
        check(len(d['API_after']['receipts'])==1,'dépôt non exécuté ou dupliqué')
    for name,h in d['sha256_sources'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'source modifiée '+name)
    report=DIR/'RAPPORT_PT06_LOT_D.md'
    lines=['# PT06 — Lot D : accessibilité d’un parcours réel de banc','',
           '**14 octobre 2026 — six essais navigateur réussis ; PT06 non clos ; conformité WCAG globale non qualifiée.**','',
           f"Navigateur : {d['browser_version']}. OS : {d['metadata']['os']}.",'',
           'Page HTML réelle servie sur 127.0.0.1, Chromium headless avec profil temporaire dédié, clavier via CDP et arbre d’accessibilité du navigateur. Le formulaire poste réellement à l’API A et reçoit un accusé technique durable. Aucun framework de production choisi.','',
           '| Cas | Observation | Verdict |','|---|---|---|']
    lines += [f"| {c['id']} | {c['label']} | {c['status']} |" for c in d['cases']]
    lines += ['', 'L’arbre AX expose noms/rôles des champs et du bouton. Tab suit le lien d’évitement, référence, texte et bouton ; outline calculé 3 px. Entrée valide puis envoie, erreur focus sur résumé role=alert, champs aria-invalid, réussite role=status/aria-live=polite. Après révocation de session, refus API et texte de l’auteur conservé dans localStorage de fixture. Reflow à largeur 320 CSS px sans débordement horizontal observé.','',
              'Le premier navigateur sandbox expirait sur Page.enable ; résultat conservé dans l’historique. Le deuxième essai révélait des événements Entrée incomplets dans le harnais ; correction rawKeyDown/char/keyUp et rejeu, sans modification du formulaire pour masquer l’échec. Résultats historiques conservés. Des connexions auxiliaires interrompues par le navigateur ont produit des resets serveur ; les requêtes du parcours ont été vérifiées par leur effet durable et leur affichage.','',
              'Aucun lecteur d’écran NVDA/JAWS/VoiceOver testé : rôle/live dans AX ne prouvent pas annonce sonore ou ordre de lecture effectif. Clavier injecté par CDP, pas observation utilisateur ; focus/contraste global, zoom, modalités mobiles, erreurs réseau complètes et toutes les pages non qualifiés. La règle CSS et ses styles calculés ne suffisent pas à certifier tous les critères WCAG.','',
              'Page locale unique, tokens et endpoint de révocation de test ; localStorage clair pour texte synthétique seulement. Ce stockage n’est pas une preuve du journal chiffré du client produit, et le parcours ne qualifie pas MFA/TLS. [Focus visible, W3C](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html) et [messages de statut, W3C](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) expliquent les exigences prises comme référence ; aucune conformité globale déduite.','',
              'Total PT06 : 28 essais A–D. [Résultats et observations](RESULTATS_PT06_LOT_D.json), [page de banc](../../../spec/prototypes/pt06/accessibility.html), [commandes](../../../spec/prototypes/pt06/README.md). Profil navigateur et fichiers temporaires retirés ; coût cloud nul.','']
    if not errors:
        report.write_text('\n'.join(lines),encoding='utf-8')
        histories=[DIR/'historique'/name for name in ('RESULTATS_PT06_LOT_D_SANDBOX_CDP_TIMEOUT.json','RESULTATS_PT06_LOT_D_AVANT_CORRECTION_ENTREE_CLAVIER.json')]
        files=[raw,report,Path(__file__).resolve(),*histories]+[ROOT/name for name in d['sha256_sources']]
        proof=dict(prototype='PT06',lot='D',PT06_clos=False,WCAG_conformite_globale=False,lecteur_ecran_test=False,
                   sha256={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in files})
        path=DIR/'PREUVES_PT06_LOT_D.json'
        if path.exists():
            old=json.loads(path.read_text(encoding='utf-8'))
            for name,h in old['sha256'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'preuve modifiée '+name)
        if not errors:path.write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(lot='D',passed=sum(c['status']=='PASS' for c in d['cases']),errors=errors)))
    raise SystemExit(bool(errors))

if __name__=='__main__':main()
