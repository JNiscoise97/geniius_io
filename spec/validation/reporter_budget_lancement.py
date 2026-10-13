"""Report ponctuel des contraintes explicites du porteur, sans changer le CDC gelé."""
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
arch=ROOT/'docs/architecture'
p=arch/'GENIIUS_DEPLOIEMENT_V0_1.md'
s=p.read_text(encoding='utf-8').replace('Le porteur indique le 13/10/2026 n’avoir aucune contrainte imposée de langage, hébergement ou budget. Cela ouvre la comparaison, sans signifier ressources illimitées ni engagement tarifaire.',
    'Le porteur a précisé le 13/10/2026 un plafond de 100 € par mois avant abonnements, avec premiers abonnements souhaités en décembre 2026. Il demande de terminer les six prototypes avant le lancement commercial. Aucune contrainte de langage/hébergeur n’est imposée ; capacité et exploitation doivent respecter ce plafond, sans engagement de date de livraison non démontré.')
p.write_text(s,encoding='utf-8')
p=arch/'GENIIUS_ALTERNATIVES_TECHNOLOGIQUES_V0_1.md'
s=p.read_text(encoding='utf-8').replace('Le porteur confirme l’absence de contraintes imposées de langage/hébergement/budget.',
    'Le porteur fixe désormais 100 € par mois avant abonnements, premiers abonnements souhaités en décembre 2026, et achèvement des six prototypes avant lancement commercial. Le langage et l’hébergeur restent ouverts.')
s=s.replace('L’absence de contrainte du porteur ne décide pas les compétences d’une équipe future.',
    'L’absence de contrainte de langage/hébergeur ne décide pas les compétences d’une équipe future. Le budget limité rend prioritaire un banc local sans dépense cloud pour les prototypes ; un fournisseur payant ou un dépassement ne peut être engagé sans arbitrage explicite.')
p.write_text(s,encoding='utf-8')
p=ROOT/'spec/validation/consolider_decisions_architecture.py'
s=p.read_text(encoding='utf-8').replace('Aucune contrainte imposée de langage/hébergement/budget à ce stade.',
    '100 €/mois avant abonnements ; décembre 2026 souhaité ; six prototypes avant lancement. Langage/hébergeur ouverts.')
s=s.replace('Le porteur indique n’avoir aucune contrainte imposée de langage/hébergement/budget.',
    'Le porteur impose 100 €/mois avant abonnements et souhaite les premiers abonnements en décembre 2026 ; les six prototypes passent avant lancement. Langage/hébergeur restent ouverts.')
p.write_text(s,encoding='utf-8')
p=arch/'README.md'
s=p.read_text(encoding='utf-8').replace('Le porteur n’impose à ce stade aucune contrainte de langage/hébergement/budget.',
    'Le porteur impose 100 €/mois avant abonnements, vise décembre 2026 et demande les six prototypes avant lancement commercial ; langage/hébergeur restent ouverts.')
p.write_text(s,encoding='utf-8')
