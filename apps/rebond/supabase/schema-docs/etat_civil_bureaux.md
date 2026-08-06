# `rebond.etat_civil_bureaux`

Bureaux d'état civil (mairies, services détenteurs de registres). Un bureau
peut détenir plusieurs registres (`etat_civil_registres`) et rédiger
plusieurs actes (`etat_civil_actes`).

## Colonnes

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | uuid | PK, défaut `gen_random_uuid()` | Identifiant |
| `nom` | text | not null | Nom du bureau |
| `commune` / `departement` / `region` | text | nullable | Localisation, texte libre |
| `created_at` / `updated_at` | timestamptz | not null, défaut `now()` | Horodatage |

## Contraintes d'unicité

- `unique (nom, commune, departement, region)` — pas de doublon de bureau à
  localisation identique.

## Relations

- Référencée par `etat_civil_registres.bureau_id` (`CASCADE`) et
  `etat_civil_actes.bureau_id`/`redaction_bureau_id` (`CASCADE`/`SET NULL`).
- Référencée par `etat_civil_repertoires.bureau_id` (`SET NULL`).

## Audit

Trigger `trg_audit_etat_civil_bureaux` → réutilise `public.fn_audit_trigger()`
(fonction schéma-agnostique, non dupliquée) — journalise dans
`public.app_audit_log`, catégorisée `'bureau'` via `fn_map_table_to_entity_kind`.

## Écarts vs `public.etat_civil_bureaux`

`created_at`/`updated_at` passés en `not null` (déjà `default now()` dans
`public`, aucun impact réel).
