# Schéma `rebond`

Ce répertoire historise toutes les opérations SQL réalisées sur le nouveau schéma
`rebond` du projet Supabase `bokjqorxzjxfqcignhci` — par opposition au schéma
`public` legacy, où vivent encore toutes les tables historiques de l'ancienne
app (`ref_unites_documentaires`, `corpus`, `citations`, etc.).

Objectif : reconstruire proprement la base, table par table, plutôt que de
continuer à empiler des correctifs sur le schéma `public`. Chaque table migrée
passe par le même processus :

1. Revue de conception (cohérence avec les tables déjà migrées)
2. Documentation dans `schema-docs/<table>.md`
3. Script de création dans `migrations/<timestamp>_create_<table>.sql`
4. Script de migration des données `public.<table>` → `rebond.<table>`
5. Bascule du code d'`apps/rebond` sur `rebond.<table>`

## Structure

- `migrations/` — scripts SQL numérotés chronologiquement (convention identique
  à `supabase/migrations/` à la racine du repo, pour rester compatible avec le
  CLI Supabase si on décide de le lier plus tard). Chaque fichier est
  idempotent-safe autant que possible (`IF NOT EXISTS` sur ce qui le permet).
- `schema-docs/` — un fichier `.md` par table : à quoi elle sert, ses colonnes,
  ses relations, et les écarts volontaires par rapport à sa définition
  d'origine dans `public`.

## État d'avancement

| Table `public` | Table `rebond` | Créée | Données migrées | Code branché |
|---|---|---|---|---|
| `ref_institution_type` | `rebond.ref_institution_type` | ✅ script prêt | ✅ script prêt | ⬜ |
| `ref_depot_type` | `rebond.ref_depot_type` | ✅ script prêt | ✅ script prêt | ⬜ |
| `ref_mode_acces` | `rebond.ref_mode_acces` | ✅ script prêt | ✅ script prêt | ⬜ |
| `ref_plateforme_kind` | `rebond.ref_plateforme_kind` | ✅ script prêt | ✅ script prêt | ⬜ |
| `ref_plateformes` | `rebond.ref_plateformes` | ✅ script prêt | ✅ script prêt | ⬜ |
| `ref_institutions` | `rebond.ref_institutions` | ✅ script prêt | ✅ script prêt | ⬜ |
| `ref_depots` | `rebond.ref_depots` | ✅ script prêt | ✅ script prêt | ⬜ |

"Créée"/"Données migrées" = script écrit et historisé ici, **pas encore exécuté**
contre la base réelle (aucun outil d'exécution SQL direct n'est disponible dans
cet environnement — CLI Supabase non lié, pas de `psql`). "Code branché" = le
service `apps/rebond` interroge réellement `rebond.<table>` au lieu de
`public.<table>`.
