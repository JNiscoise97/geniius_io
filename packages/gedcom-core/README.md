# 📦 @geniius/gedcom-core

à lancer
pnpm --filter @geniius/gedcom-core build

**Bibliothèque TypeScript (sans UI)** dédiée au format GEDCOM, conçue pour être réutilisée par toutes les applications de l’écosystème **Geniius.io**.

## 🎯 Objectifs
- Parser un fichier **GEDCOM 5.5 / 5.5.1**
- **Normaliser** les données imparfaites (noms, dates, lieux, pointeurs)
- Générer un **bundle de données canonique** conforme à `@geniius/schema`
- Fournir des **exports prêts à consommer** pour :
  - `Echo` (gestion contacts et mémoire vivante)
  - `Rebond` (analyse des actes, graph relations, tableaux enrichis)

---

## 🧱 Modularité garantie

Tous les utilisateurs peuvent installer les apps qu’ils veulent, mais elles s’appuient toujours sur les mêmes libs communes :

| Utilisateur | Applications installées possibles | Librairies communes |
|---|---|---|
| User 1 | Echo | `@geniius/schema`, `@geniius/gedcom-core` |
| User 2 | Echo + Rebond | `@geniius/schema`, `@geniius/gedcom-core` |
| User 3 | Rebond | `@geniius/schema`, `@geniius/gedcom-core` |
| User 4 | Echo + Rebond + Gedcom Manager | `@geniius/schema`, `@geniius/gedcom-core` |

> Tant que tu respectes la règle : **les apps importent les libs, jamais l’inverse**, tu peux packager et distribuer chaque app indépendamment.

---

## 🗂️ Structure recommandée

```

packages/gedcom-core/
src/
    index.ts
    parser/
        gedcomParser.ts
        astBuilder.ts
    normalizers/
        nameNormalizer.ts
        dateNormalizer.ts
        placeNormalizer.ts
        xrefResolver.ts
    validators/
        personCoherence.ts
        unionCoherence.ts
        pointerCoherence.ts
    exporters/
        rebondExporter.ts
        echoExporter.ts
        jsonExporter.ts
    diff/
        gedcomHasher.ts
        gedcomDiff.ts

````

---

## ⚙️ API Publique (exemples d’usage)

### 1) Parser GEDCOM → Bundle Geniius canonique

```ts
import { parseGedcom, toGeniiusBundle } from "@geniius/gedcom-core";

const gedcomText = await file.text();
const ast = parseGedcom(gedcomText);
const bundle = toGeniiusBundle(ast);
````

### 2) Valider la cohérence des données (optionnel)

```ts
import { validateBundle } from "@geniius/gedcom-core";

const report = validateBundle(bundle);
console.log(report.errors);
```

### 3) Exporter les données vers les apps

```ts
import { toRebondImport, toEchoDataset } from "@geniius/gedcom-core";

const rebondPayload = toRebondImport(bundle);
const echoDataset = toEchoDataset(bundle);
```

### 4) Versioning : Hash + diff entre 2 GEDCOM

```ts
import { hashGedcom, diffBundles } from "@geniius/gedcom-core";

const h1 = hashGedcom(textV1);
const h2 = hashGedcom(textV2);
const changes = diffBundles(parseGedcomToBundle(textV1), parseGedcomToBundle(textV2));
```

---

## 🚀 Lancer les apps séparément

```bash
pnpm --dir apps/rebond dev
pnpm --dir apps/echo dev:web
```

---

## 🧠 Orchestrer les 2 apps ensemble

1. Installer `concurrently` à la racine :

```bash
pnpm add -D concurrently -w
```

2. Ajouter dans le `package.json` racine :

```json
"scripts": {
  "dev:rebond": "pnpm --dir apps/rebond dev",
  "dev:echo": "pnpm --dir apps/echo dev:web",
  "dev": "concurrently -n REBOND,ECHO \"pnpm run dev:rebond\" \"pnpm run dev:echo\""
}
```

3. Lancer ensemble :

```bash
pnpm dev
```

---

## 📤 Packaging / distribution modulaire (plus tard)

### Option 1 : distribution locale monorepo

Tu ne publies rien, tu builds uniquement ce que tu veux :

```bash
pnpm --filter rebond build
pnpm --filter echo build
```

### Option 2 : distribution modulaire via registry npm (public ou privé)

Tu publies uniquement les libs :

* `@geniius/schema`
* `@geniius/gedcom-core`

Puis chaque app peut être installée comme :

```bash
pnpm add @geniius/schema
pnpm add @geniius/gedcom-core
pnpm add @echo/web  # ou @rebond/app, etc.
```

> Ce modèle te permettra un jour de distribuer **Echo, Rebond, Gedcom Manager** à différents utilisateurs **sans duplication**, tant que tous s’appuient sur la même lib GEDCOM et le même schéma.

---

## ✅ Conclusion

Oui, ton projet peut devenir **100% modulaire et distribuable**.

Tu construis aujourd’hui :

* un moteur GEDCOM centralisé
* un schéma canonique stable
* plusieurs apps qui le consomment indépendamment

…et demain tu peux packager Geniius **selon les besoins exacts des utilisateurs** 💪🌳
