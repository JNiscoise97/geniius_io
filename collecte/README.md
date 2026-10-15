# Collecte de mémoire — kit de terrain

**But :** recueillir les témoignages **dès maintenant**, avec un téléphone, sans attendre GENIIUS, et sans rien perdre de ce que Journal et Rebond exploiteront plus tard. Chaque champ des modèles correspond à un attribut du [MCD](../docs/02_MCD/GENIIUS_MCD.md) (partie 12, « Journal ») : l'import futur sera une transcription mécanique, pas une réinterprétation.

**Principe** (MCD § 12, CDCF § 18) : un entretien est une **source**. Il produit un `DOCUMENT` de nature `témoignage`, que Rebond exploitera comme n'importe quel document : enregistrement, minutes, transcription, mentions. Journal y ajoute la structure de l'entretien : question exacte, réponse spontanée, indice montré, réaction.

## Contenu

| Fichier | Usage |
|---|---|
| [`PROTOCOLE_ENTRETIEN.md`](PROTOCOLE_ENTRETIEN.md) | Une page à garder sous les yeux pendant l'entretien. |
| [`TEXTE_CONSENTEMENT.md`](TEXTE_CONSENTEMENT.md) | À lire au début de l'enregistrement ; la réponse est enregistrée. |
| [`MODELE_FICHE_SESSION.md`](MODELE_FICHE_SESSION.md) | À copier dans le dossier de chaque entretien et à remplir **le jour même**. |
| [`MODELE_REGISTRE_TEMOINS.csv`](MODELE_REGISTRE_TEMOINS.csv) | Un registre unique des personnes interrogées et de leurs consentements (ouvrable dans un tableur). |

## Où ranger les enregistrements

**Jamais dans ce dépôt git** : ce sont des données personnelles de personnes vivantes. Gardez-les dans un dossier privé synchronisé (par exemple un dossier « GENIIUS_COLLECTE » sur votre cloud personnel), avec **une seconde copie** sur un autre support, faite le jour même.

```
GENIIUS_COLLECTE/
  REGISTRE_TEMOINS.csv
  2026-10-15_T001_01/                 ← un dossier par entretien : date_témoin_rang
    ENREGISTREMENT_ORIGINAL.m4a       ← le fichier du téléphone, jamais retouché ni renommé dans son contenu
    FICHE_SESSION.md                  ← copie remplie de MODELE_FICHE_SESSION.md
    INDICE_01_photo_mariage.jpg       ← tout ce qui a été montré, numéroté comme dans la fiche
  2026-10-15_T001_02/                 ← deuxième entretien avec la même personne
  2026-10-18_T002_01/
```

**Règles**
- Un identifiant par personne interrogée (`T001`, `T002`…), attribué une fois pour toutes dans le registre. Les noms ne figurent que dans le registre, pas dans les noms de dossiers.
- Le fichier audio original n'est **jamais modifié** : ni découpe, ni amélioration, ni conversion. Une version retravaillée, si un jour elle est utile, est un **nouveau** fichier à côté (MCD : une `REPRODUCTION` dérivée, l'original reste la référence).
- Une correction ultérieure ne réécrit pas la fiche : elle s'ajoute, datée, en bas (MCD, RG-J03 : la déclaration initiale n'est jamais réécrite).

## Correspondance avec le modèle (pour l'import futur)

| Ce que vous notez | Entité / attribut du MCD |
|---|---|
| Le dossier d'un entretien | `SESSION_MEMOIRE` |
| Type, date, lieu, mode, contexte, statut du témoin | `SESSION_MEMOIRE.type`, `.date`, `.lieu`, `.mode`, `.contexte`, `.statut_temoin` |
| La personne interrogée (registre) | `PERSONNE` liée par `TEMOIN` ; protection : `regime_protection = vivant attesté` |
| Les autres présents | `PRESENT` (rôle : présent, intervenant, traducteur) |
| Vous | `INTERVIEWER` (→ `UTILISATEUR`) |
| Le fichier audio | `FICHIER` → `REPRODUCTION` (type `enregistrement`) du `DOCUMENT` (nature `témoignage`) produit par la session (`PRODUIRE_DOC`) |
| Chaque question et ce qui suit | `ECHANGE` (rang, question_texte_exact, caractere_question), minuté par une `ZONE` (plage temporelle) |
| La réponse avant tout indice | `REPONSE` phase `spontanée`, avec `etat_memoire` (D-36) et `mode_connaissance` (D-37) |
| Ce qui a été montré | `INDICE` (type, description, moment) |
| La réponse après l'indice | `REPONSE` phase `après indice`, liée à l'indice (RG-J01) |
| Une question à reposer plus tard | `RELANCE` (date prévue, note de délicatesse) |
| Le consentement oral | `CONSENTEMENT` (portée, décision, texte_version, horodatage, mode_recueil) |
| Une restriction demandée (« pas avant ma mort ») | `EMBARGO` |
| Ce que la personne veut transmettre à quelqu'un plus tard | `CAPSULE` |
