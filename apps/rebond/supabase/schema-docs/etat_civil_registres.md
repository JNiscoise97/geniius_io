# `rebond.etat_civil_registres`

Registres d'état civil (ex. "registre des mariages 1850-1860" d'un bureau
donné). Table la plus richement qualifiée du domaine — 9 FK vers des
référentiels de description archivistique (mode, statut juridique, support,
pagination, norme, langue, régime fiscal du support, fonction du registre).

## Colonnes principales

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | uuid | PK, défaut `gen_random_uuid()` | Identifiant |
| `bureau_id` | uuid | not null, FK → `etat_civil_bureaux` | Bureau détenteur |
| `annee` | integer | not null | Année couverte |
| `type_acte` | text | nullable | **Texte libre**, doublon avec le pivot `etat_civil_registres_type_acte` (voir note) |
| `nombre_actes_estime` / `numero_acte_min` / `numero_acte_max` | integer | nullable | Métadonnées de comptage |
| `transcription_terminee` | boolean | nullable | Statut d'avancement |
| `label` | text | not null | Généré automatiquement (voir section dédiée) |
| `unite_documentaire_id` | uuid | nullable, FK → `ref_unites_documentaires` (cross-schema) | Rattachement au patrimoine documentaire |
| 8 colonnes `registre_*_ref` | uuid | nullable, FK vers des référentiels | Voir section Relations |
| `created_at` / `updated_at` | timestamptz | not null, défaut `now()` | Horodatage |

## Relations

- `bureau_id` → `rebond.etat_civil_bureaux.id`, `CASCADE`.
- `registre_langue_ref` → `rebond.ref_langues.id`, `SET NULL`.
- `registre_fonction_ref`, `registre_mode_ref`, `registre_norme_ref`,
  `registre_ordre_numerotation_ref`, `registre_pagination_ref`,
  `registre_regime_fiscal_support_ref`, `registre_statut_juridique_ref`,
  `registre_support_ref` → `rebond.ref_etat_civil_registre_*` (migrées et
  renommées, FK corrigées — plus aucune trace de cross-schema pour ces 8
  colonnes).
- `unite_documentaire_id` → `rebond.unites_documentaires.id`, `SET NULL`
  (migrée et renommée, FK corrigée).
- Référencée par `etat_civil_registres_type_acte.registre_id` (`CASCADE`),
  `etat_civil_actes.registre_id` (`CASCADE`), `etat_civil_repertoires` (pas
  de FK directe — lien via `bureau_id` uniquement).

## Génération automatique du `label`

`label` est `not null` sans défaut, mais l'app n'en fournit **jamais** de
valeur à l'insertion (`ReferenceWizardPage.tsx`). Deux mécanismes se
complètent :

1. Trigger `trg_set_registre_label` (`BEFORE INSERT/UPDATE`) → appelle
   `rebond.create_registre_label(new.id)`. Au moment de l'insertion, ni la
   ligne elle-même ni ses éventuelles lignes de `etat_civil_registres_type_acte`
   n'existent encore (la ligne est en cours d'insertion, le pivot est inséré
   juste après côté app) → la fonction retombe sur un libellé générique
   ("Registre", "Registre timbré"...) selon `registre_regime_fiscal_support_ref`
   uniquement.
2. Juste après avoir inséré les lignes du pivot type-acte, l'app rappelle
   **directement en RPC** `create_registre_label(p_registre_id)` puis fait un
   `UPDATE` explicite du `label` — cette fois la fonction trouve les types
   d'acte associés et produit un libellé complet (ex. "Registre des naissances
   incluant les reconnaissances").

`rebond.create_registre_label` est une **duplication schéma-consciente** de
`public.create_registre_label` : le corps original interroge
`public.etat_civil_registres`/`public.etat_civil_registres_type_acte`/
`public.ref_ec_type_acte` en dur — inutilisable tel quel pour une ligne qui
vit dans `rebond`. La version `rebond.*` pointe vers les tables `rebond.*` de
ce lot, et reste cross-schema vers `public.ref_registre_regime_fiscal_support`
(pas encore migrée). Voir `supabase/migrations/20260806100029_*.sql`.

## Audit

Trigger `trg_audit_etat_civil_registres` → réutilise `public.fn_audit_trigger()`
telle quelle (schéma-agnostique), catégorisée `'registre'`.

## Écarts vs `public.etat_civil_registres`

- `created_at`/`updated_at` passés en `not null` (déjà `default now()`, sans impact réel).
- Contrainte unique renommée `etat_civil_registres_unique_combo` — l'originale
  (`etat_civil_registres_bureau_annee_type_acte_mode_statut_regime_`) était
  tronquée à la limite des 63 caractères de Postgres, illisible et
  potentiellement ambiguë en cas de collision de troncature.
- Index `idx_ec_registres_*` renommés `idx_etat_civil_registres_*`.

## Note (non corrigée)

`type_acte` (texte libre, écrit par l'app sous forme `"NAISSANCE|MARIAGE"`)
fait doublon avec le pivot normalisé `etat_civil_registres_type_acte`. L'app
écrit toujours activement dans les deux — probablement un reliquat de
l'évolution du modèle (texte libre historique, jamais retiré après l'ajout du
pivot). Non touché : le retirer casserait le code applicatif actuel.
