// transcriptionMarkers.registry.ts
// Registry configurable : markers génériques + markers par type_acte.
// Objectif : ne pas écrire de RegExp à la main sauf cas très spécifique.

export type ActeType = 'naissance' | 'mariage' | 'deces' | 'reconnaissance' | 'divers' | string;

export type MarkerDef = {
  label: string;

  /**
   * phrases = matching "loose" (casse/accents/ponctuation ignorés).
   * Mets plusieurs variantes si nécessaire.
   */
  phrases?: string[];

  /**
   * Regex brute (optionnel) si tu veux un cas très spécifique.
   * On l’applique sur le texte brut avec flags 'iu'.
   */
  regexRaw?: string;

  /**
   * continuable = si une page se termine sur ce label,
   * on rattache le début de la page suivante à cette section.
   */
  continuable?: boolean;

  /**
   * priority (optionnel) : à égalité d’index, prend celui avec plus petite priorité.
   */
  priority?: number;
};

export type MarkerProfile = {
  continuableLabels?: string[]; // si tu préfères un set global, mais on supporte aussi marker.continuable
  markers: MarkerDef[];
};

export type MarkerRegistry = {
  generic: MarkerProfile;
  byType: Record<string, Partial<MarkerProfile> & { markers?: MarkerDef[] }>;
};

// ------------------------
// CONFIG PAR DÉFAUT
// ------------------------

export const MARKERS_REGISTRY: MarkerRegistry = {
  generic: {
    markers: [
      // En-tête : selon tes actes, adapte
      { label: 'En-tête', phrases: ['aujourd hui', "aujourd'huy", 'lan'] },

      // Comparants
      {
        label: 'Comparants',
        phrases: ['par devant nous', 'par-devant nous', 'par devant le maire', 'devant nous'],
        continuable: true,
      },

      // Témoins
      {
        label: 'Témoins',
        phrases: ['en presence', 'en présence', 'en présence de'],
        continuable: true,
      },

      // Signatures
      {
        label: 'Signatures',
        phrases: [
          'et lecture faite',
          'lecture faite',
          "nous l'avons signe",
          'nous avons signe',
          'ont signe',
          'ont signé',
        ],
        continuable: true,
      },

      // Bas de page
      { label: 'Bas de page', phrases: ['pour copie conforme'] },
    ],
  },

  byType: {
    naissance: {
      markers: [
        {
          label: 'Déclaration',
          phrases: ['a declare', 'a déclaré', 'est ne', 'est né', 'est nee', 'est née'],
          priority: 5,
        },
        {
          label: 'Parents',
          phrases: ['fils de', 'fille de', 'de lui', 'de la mere', 'de la mère'],
          priority: 6,
        },
      ],
    },

    mariage: {
      markers: [
        // 1) En-tête & contexte (ancre “solide”, pas trop générique)
        {
          label: 'En-tête & contexte',
          phrases: [
            'aujourd hui',
            "maire et officier de l'etat civil",
            "maire et officier de l'état civil",
            'arrondissement',
            'ile guadeloupe',
            'nous etant transporte',
            'nous étant transporté',
          ],
          priority: 1,
        },

        // 2) Comparution (formule très stable)
        {
          label: 'Comparution',
          phrases: [
            'par devant nous sont comparus',
            'par devant nous ont comparu',
            'sont comparus publiquement',
            'toutes portes etant ouvertes',
            'toutes portes étant ouvertes',
          ],
          priority: 2,
        },

        // 3) Époux (ancre sur “le sieur … âgé de …” => évite qu’il se recapture plus tard)
        {
          label: 'Époux',
          phrases: [
            'le sieur',
            'age de',
            'âgé de',
            'majeur ainsi que le constate',
            "acte d'inscription de nouveau affranchi",
            'fils legitime',
            'fils légitime',
          ],
          priority: 3,
        },

        // 4) Épouse (ancre sur “et demoiselle … âgée de …”)
        {
          label: 'Épouse',
          phrases: [
            'et demoiselle',
            'demoiselle',
            'agee de',
            'âgée de',
            'mineure ainsi que le constate',
            'fille legitime',
            'fille légitime',
          ],
          priority: 4,
        },

        // 5) Formalités préalables (⚠️ phrase complète pour éviter le micro-bloc “les futurs époux et leurs”)
        {
          label: 'Formalités préalables',
          phrases: [
            'les futurs epoux et leurs temoins interpellés',
            'les futurs époux et leurs témoins interpellés',
            'contrat de mariage',
            'ont repondu negativement',
            'ont répondu négativement',
            'publications ont ete faites',
            'publications ont été faites',
          ],
          priority: 5,
        },

        // 6) Célébration du mariage (continuable car coupé par [SAUT_DE_PAGE])
        {
          label: 'Célébration du mariage',
          phrases: [
            'aucune opposition',
            'apres avoir donne lecture',
            'après avoir donné lecture',
            'code napoleon',
            'code napoléon',
            'nous avons demande aux futurs epoux',
            'nous avons demandé aux futurs époux',
            'nous avons declare au nom de la loi',
            'nous avons déclaré au nom de la loi',
            'sont unis par le mariage',
          ],
          continuable: true,
          priority: 6,
        },

        // 7) Légitimation d’enfant (ou déclaration d’enfant)
        {
          label: 'Légitimation d’enfant',
          phrases: [
            'aussitot les dits epoux',
            'aussitôt les dits époux',
            "etre ne d'eux un enfant",
            "être né d'eux un enfant",
            'un enfant du sexe',
            'inscrit sur les registres',
          ],
          priority: 7,
        },

        // 8) Témoins (⚠️ ancre sur la vraie formule, pas sur “témoins” dans la phrase précédente)
        {
          label: 'Témoins',
          phrases: [
            'de tout ce nous avons dresse le present acte en presence des sieurs',
            'de tout ce nous avons dressé le présent acte en présence des sieurs',
            'en presence des sieurs',
            'en présence des sieurs',
          ],
          priority: 8,
        },

        // 9) Signatures
        {
          label: 'Signatures',
          phrases: [
            'et lecture faite du present acte',
            'et lecture faite du présent acte',
            "nous l'avons signe",
            "nous l'avons signé",
            'ont declare ne le savoir',
            'ont déclaré ne le savoir',
          ],
          priority: 9,
        },

        // 10) Bas de page
        {
          label: 'Bas de page',
          phrases: [
            'pour copie conforme',
            'minute detruite',
            'minute détruite',
            'incendie du palais de justice',
            'arrete de m le gouverneur',
            'arrêté de m. le gouverneur',
          ],
          priority: 10,
        },
      ],
    },

    deces: {
      markers: [
        {
          label: 'Décès',
          phrases: ['est decede', 'est décédé', 'est morte', 'est mort'],
          priority: 5,
        },
        { label: 'Déclarants', phrases: ['sur la declaration', 'sur la déclaration'], priority: 6 },
      ],
    },
  },
};

// ------------------------
// BUILDER
// ------------------------

/**
 * Fusion : generic + byType[type_acte]
 * - byType peut ajouter des markers ou surcharger un label existant (même label => merge phrases)
 */
export function getMarkersForActeType(typeActe?: ActeType | null): MarkerProfile {
  const base = MARKERS_REGISTRY.generic;
  const specific = (typeActe ? MARKERS_REGISTRY.byType[typeActe] : undefined) ?? {};

  const merged: MarkerDef[] = [];

  const addOrMerge = (m: MarkerDef) => {
    const existing = merged.find((x) => x.label === m.label);
    if (!existing) {
      merged.push({ ...m });
      return;
    }
    // merge phrases + regexRaw + flags
    existing.phrases = uniq([...(existing.phrases ?? []), ...(m.phrases ?? [])]);
    existing.regexRaw = m.regexRaw ?? existing.regexRaw;
    existing.continuable = m.continuable ?? existing.continuable;
    existing.priority = m.priority ?? existing.priority;
  };

  for (const m of base.markers) addOrMerge(m);
  for (const m of specific.markers ?? []) addOrMerge(m);

  // fallback
  return {
    markers: merged,
  };
}

function uniq(arr: string[]) {
  return Array.from(new Set(arr.map((s) => s.trim()).filter(Boolean)));
}
