// useEntityStore.ts

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { generateUUID } from '@/lib/uuid';
import type { ActeurFields, Entity, Mention } from '@/types/analyse';
import { toast } from 'sonner';
import { updateIndividuIdentite, updateIndividuIdentiteByIndividuId } from '@/lib/individus';

type ActeurFieldsWithIndividu = ActeurFields & { individu?: any; mentions?: any; entityId?: any };
export function sanitizeActeurFields(input: ActeurFieldsWithIndividu): Omit<ActeurFields, 'label'> {
  const {
    label: _label,
    individu: _individu,
    mentions: _mentions,
    entityId: _entityId,
    ...rest
  } = input;
  return rest;
}

type EntityStore = {
  entities: Entity[];
  loading: boolean;
  error: string | null;
  categories: { id: string; categorie: string; sous_categorie: string; ordre: number }[];
  fetchEntities: (acte_id: string, source_acte: string) => Promise<void>;
  addEntity: (
    acte_id: string,
    data: Omit<Entity, 'id' | 'created_at' | 'updated_at'>,
  ) => Promise<string | null>;
  updateEntity: (id: string, patch: Partial<Entity>) => Promise<void>;
  deleteEntity: (id: string) => Promise<void>;
  fetchCategories: () => Promise<void>;
  groupedCategories: Record<string, string[]>;
  fetchCategoryById: (id: string) => Promise<{
    id: string;
    categorie: string;
    sous_categorie: string;
    ordre: number;
  } | null>;
  addMentionToEntity: (params: {
    entite_id: string;
    bloc_id: string;
    start: number;
    end: number;
    preview?: string;
  }) => Promise<void>;
  updateEntityMentions: (entityId: string, mentions: Mention[]) => void;
  fetchMentionsForEntity: (entiteId: string) => Promise<Mention[]>;
  deleteMention: (mentionId: string) => Promise<void>;
  getMentions: () => Mention[];
};

export const useEntityStore = create<EntityStore>((set, get) => ({
  entities: [],
  categories: [],
  groupedCategories: {},
  loading: false,
  error: null,

  fetchEntities: async (acte_id, source_table) => {
    set({ loading: true, error: null });

    const { data: entitesData, error: entitesError } = await supabase
      .from('transcription_entites')
      .select(
        `
    id,
    acte_id,
    label,
    categorie_id,
    categorie:transcription_entite_categories!transcription_entites_categorie_id_fkey (
      id, categorie, sous_categorie, code, ordre
    ),
    mapping:transcription_entites_mapping!transcription_entites_mapping_entite_id_fkey (
      cible_type,
      cible_id,
      acteur:transcription_entites_acteurs (
        *,
        mentions_toponymes:mentions_toponymes!mentions_toponymes_acteur_id_fkey (
          id, toponyme_id, fonction, forme_originale, note, path_toponyme_ids, path_labels,
          toponyme:toponymes!mentions_toponymes_toponyme_id_fkey (
            id, libelle,
            lieu:lieux!toponymes_lieu_id_fkey ( id, type )
          )
        ),

        categories_couleur:transcription_acteur_categorie_couleur!transcription_acteur_categories_couleur_acteur_id_fkey (
          categorie_couleur_id,
          ref:ref_categorie_couleur!transcription_acteur_categories_coule_categorie_couleur_id_fkey ( id, code, label, label_m, label_f, invariable )
        ),

        filiations:transcription_acteur_filiation!transcription_acteur_filiations_acteur_id_fkey (
          filiation_id,
          ref:ref_filiation!transcription_acteur_filiations_filiation_id_fkey ( id, code, label )
        ),

        professions:transcription_acteur_profession!transcription_acteur_profession_acteur_id_fkey (
          profession_id, position,
          ref:ref_profession!transcription_acteur_profession_profession_id_fkey ( id, code, label, label_m, label_f, invariable )
        ),

        qualites:transcription_acteur_qualite!transcription_acteur_qualites_acteur_id_fkey (
          qualite_id,
          ref:ref_qualite!transcription_acteur_qualites_qualite_id_fkey ( id, code, label, genre )
        ),

        situations_fiscales:transcription_acteur_situation_fiscale!transcription_acteur_situations_fiscales_acteur_id_fkey (
          situation_fiscale_id,
          ref:ref_situation_fiscale!transcription_acteur_situations_fisca_situation_fiscale_id_fkey ( id, code, label, label_m, label_f, invariable )
        ),

        situations_matrimoniales:transcription_acteur_situation_matrimoniale!transcription_acteur_situation_matrimoniale_acteur_id_fkey (
          situation_matrimoniale_id,
          ref:ref_situation_matrimoniale!transcription_acteur_situation_m_situation_matrimoniale_id_fkey ( id, code, label, label_m, label_f, invariable )
        ),

        statuts_juridiques:transcription_acteur_statut_juridique!transcription_acteur_statut_juridique_acteur_id_fkey (
          statut_juridique_id,
          ref:ref_statut_juridique!transcription_acteur_statut_juridique_statut_juridique_id_fkey ( id, code, label, label_m, label_f, invariable )
        ),

        statuts_proprietaires:transcription_acteur_statut_proprietaire!transcription_acteur_statut_proprietaire_acteur_id_fkey (
          statut_proprietaire_id,
          ref:ref_statut_proprietaire!transcription_acteur_statut_proprietaire_statut_proprietaire_id ( id, code, label, label_m, label_f, invariable )
        ),

        signatures:transcription_acteur_signature!transcription_acteur_signature_acteur_id_fkey (
          signature_id,
          ref:ref_signature!transcription_acteur_signature_signature_id_fkey ( id, code, label )
        ),

        liens:transcription_acteur_liens!transcription_acteur_liens_acteur_id_fkey (
          id,
          lien_id,
          position,
          cote,
          fratrie_qualif,
          cousin_degre,
          cousin_removal,
          cousin_double,
          ascend_n,
          descend_n,
          cible_type,
          cible_acteur_id,
          cible_role,
          cible_label,

          ref:ref_lien!transcription_acteur_liens_lien_id_fkey (
            id, code, label, label_m, label_f, invariable, nature, degre
          ),

          cible_acteur:transcription_entites_acteurs!transcription_acteur_liens_cible_acteur_id_fkey (
            id, nom, prenom, sexe, role,
            qualites:transcription_acteur_qualite!transcription_acteur_qualites_acteur_id_fkey (
              qualite_id,
              ref:ref_qualite!transcription_acteur_qualites_qualite_id_fkey ( id, code, label, genre )
            )
          )
        ),

        notes:transcription_acteur_notes!transcription_acteur_notes_acteur_id_fkey (
          id,
          type_code,
          texte,
          date_evenement,
          date_precision,
          bureau_id,
          registre_id,
          acte_id,
          inscription_nature,
          annee_registre,
          numero_acte,
          target_kind,
          target_acte_ac_id,
          target_acte_ec_id,
          target_label,
          position
        )
      )
    )
  `,
      )
      .eq('acte_id', acte_id)
      .eq('source_table', source_table);

    if (entitesError) {
      console.error('[fetchEntities] Erreur:', entitesError.message);
      set({ error: entitesError.message, loading: false });
      return;
    }

    // --- Mentions par entité ---
    const entiteIds = entitesData?.map((e) => e.id) ?? [];
    const { data: mentionsData, error: mentionsError } = entiteIds.length
      ? await supabase.from('transcription_entites_mentions').select('*').in('entite_id', entiteIds)
      : { data: [], error: null };

    if (mentionsError) {
      console.error('[fetchMentions] Erreur:', mentionsError.message);
      set({ error: mentionsError.message, loading: false });
      return;
    }

    const mentionsByEntity =
      mentionsData?.reduce<Record<string, Mention[]>>((acc, mention) => {
        (acc[mention.entite_id] ??= []).push({ ...mention, preview: mention.preview || '' });
        return acc;
      }, {}) ?? {};

    // --- Récupérer tous les acteur_id présents pour faire la jointure mapping individu ---
    const actorIds: string[] = [];
    for (const e of entitesData) {
      const m = Array.isArray(e.mapping) ? e.mapping[0] : e.mapping;
      const a = m?.acteur ? (Array.isArray(m.acteur) ? m.acteur[0] : m.acteur) : undefined;
      if (a?.id) actorIds.push(a.id);
    }

    // --- Requête mapping acteur → individu ---
    // On suppose un schéma: rebond_individus_mapping(id, acteur_id, individu_id, ...)
    const { data: mappingRows, error: mappingError } = actorIds.length
      ? await supabase
          .from('rebond_individus_mapping')
          .select('acteur_id, individu_id:id')
          .in('acteur_id', actorIds)
      : { data: [], error: null };

    if (mappingError) {
      console.error('[fetchIndividuMapping] Erreur:', mappingError.message);
      set({ error: mappingError.message, loading: false });
      return;
    }

    const individuByActeurId = new Map<string, string>();
    for (const row of mappingRows ?? []) {
      const { acteur_id, individu_id } = row as { acteur_id?: string; individu_id?: string };
      if (!acteur_id || !individu_id) continue;
      // si plusieurs mappings existent, on garde le 1er rencontré
      if (!individuByActeurId.has(acteur_id)) {
        individuByActeurId.set(acteur_id, individu_id);
      }
    }

    // --- Construction du tableau enrichi ---
    const enrichedEntities: Entity[] = entitesData.map((e) => {
      const mappingRaw = Array.isArray(e.mapping) ? e.mapping[0] : (e.mapping ?? undefined);
      const rawActor = mappingRaw?.acteur
        ? Array.isArray(mappingRaw.acteur)
          ? mappingRaw.acteur[0]
          : mappingRaw.acteur
        : undefined;

      // Enrichir l’acteur avec individu_id s’il existe
      const individu_id = rawActor?.id ? individuByActeurId.get(rawActor.id) : undefined;

      const enrichedActor = rawActor
        ? {
            ...enrichActorWithToponymesMentions(rawActor),
            ...enrichActorWithRefs(rawActor),
            individu_id, // <- ajouté ici
          }
        : undefined;

      return {
        id: e.id,
        acte_id: e.acte_id,
        label: e.label,
        categorie_id: e.categorie_id,
        categorie: e.categorie,
        mentions: mentionsByEntity[e.id] || [],
        mapping: mappingRaw
          ? {
              cible_type: mappingRaw.cible_type,
              cible_id: mappingRaw.cible_id,
              acteur: enrichedActor,
            }
          : undefined,
      };
    });

    set({ entities: enrichedEntities, loading: false });
  },

  fetchCategories: async () => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('transcription_entite_categories')
      .select('id, categorie, sous_categorie, ordre') // 🆕 ajout de ordre
      .order('categorie', { ascending: true })
      .order('ordre', { ascending: true });

    if (error) {
      console.error('[fetchCategories] Erreur:', error.message);
      set({ error: error.message, loading: false });
      return;
    }

    const grouped = data.reduce<Record<string, string[]>>((acc, curr) => {
      if (!acc[curr.categorie]) {
        acc[curr.categorie] = [];
      }
      acc[curr.categorie].push(curr.sous_categorie);
      return acc;
    }, {});

    set({
      categories: data,
      groupedCategories: grouped,
      loading: false,
    });
  },
  fetchCategoryById: async (id: string) => {
    const { data, error } = await supabase
      .from('transcription_entite_categories')
      .select('id, categorie, sous_categorie, ordre')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`[fetchCategoryById] Erreur pour id ${id}:`, error.message);
      return null;
    }

    return data;
  },

  addEntity: async (acte_id, data) => {
    const id = generateUUID();

    const { mapping, ...entiteData } = data;
    const payload = { ...entiteData, acte_id, id };

    const { error: entiteError } = await supabase.from('transcription_entites').insert(payload);

    if (entiteError) {
      console.error('[addEntity] Erreur entité:', entiteError.message);
      return null;
    }

    // Insertion de l'acteur si nécessaire
    let acteurId: string | null = null;
    if (mapping?.cible_type === 'acteur' && mapping.acteur) {
      acteurId = generateUUID();
      const acteurFields = sanitizeActeurFields(mapping.acteur);
      const { error: acteurError } = await supabase
        .from('transcription_entites_acteurs')
        .insert({ id: acteurId, ...acteurFields });

      if (acteurError) {
        console.error('[addEntity] Erreur acteur:', acteurError.message);
        return null;
      }
    }

    // Insertion du mapping
    if (mapping?.cible_type && (mapping.cible_id || acteurId)) {
      const { error: mappingError } = await supabase.from('transcription_entites_mapping').insert({
        entite_id: id,
        cible_type: mapping.cible_type,
        cible_id: mapping.cible_id || acteurId,
      });

      if (mappingError) {
        console.error('[addEntity] Erreur mapping:', mappingError.message);
        return null;
      }
    }

    await get().fetchEntities(acte_id, 'actes');
    return id;
  },

  updateEntity: async (id, patch) => {
    const { mapping, ...entitePatch } = patch;

    const { error: updateError } = await supabase
      .from('transcription_entites')
      .update({ ...entitePatch, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (updateError) {
      console.error('[updateEntity] Erreur mise à jour entité:', updateError.message);
      return;
    }

    const { data: currentMapping, error: mappingError } = await supabase
      .from('transcription_entites_mapping')
      .select('*')
      .eq('entite_id', id)
      .single();

    if (mappingError && mappingError.code !== 'PGRST116') {
      console.error('[updateEntity] Erreur récupération mapping:', mappingError.message);
      return;
    }

    const cibleId = currentMapping?.cible_id;

    if (mapping?.cible_type === 'acteur' && mapping.acteur) {
      const acteurFields = sanitizeActeurFields(mapping.acteur);

      if (cibleId) {
        const { error: updateActeurError } = await supabase
          .from('transcription_entites_acteurs')
          .update(acteurFields)
          .eq('id', cibleId);

        if (updateActeurError) {
          console.error('[updateEntity] Erreur mise à jour acteur:', updateActeurError.message);
          return;
        }

        // 🎯 Mise à jour ciblée de l'identité
        await updateIndividuIdentite(cibleId);
      } else {
        const newActeurId = generateUUID();
        const { error: insertActeurError } = await supabase
          .from('transcription_entites_acteurs')
          .insert({ id: newActeurId, ...acteurFields });

        if (insertActeurError) {
          console.error('[updateEntity] Erreur insertion acteur:', insertActeurError.message);
          return;
        }

        const { error: insertMappingError } = await supabase
          .from('transcription_entites_mapping')
          .insert({
            entite_id: id,
            cible_type: mapping.cible_type,
            cible_id: newActeurId,
          });

        if (insertMappingError) {
          console.error('[updateEntity] Erreur insertion mapping:', insertMappingError.message);
          return;
        }

        // 🎯 Mise à jour ciblée de l'identité
        await updateIndividuIdentite(newActeurId);
      }
    }

    const acteId = get().entities.find((e) => e.id === id)?.acte_id;
    if (acteId) await get().fetchEntities(acteId, 'actes');
  },

  deleteEntity: async (id) => {
    const acteId = get().entities.find((e) => e.id === id)?.acte_id;

    // 1. Récupérer les mappings liés à l'entité
    const { data: mappings, error: mappingError } = await supabase
      .from('transcription_entites_mapping')
      .select('entite_id, cible_id, cible_type')
      .eq('entite_id', id);

    if (mappingError) {
      console.error('[deleteEntity] Erreur récupération des mappings:', mappingError.message);
      toast.error('Erreur lors de la suppression.');
      return;
    }

    // 🧠 On collecte les ids des acteurs ET leurs individu_id associés
    const acteurIdsToDelete =
      mappings?.filter((m) => m.cible_type === 'acteur').map((m) => m.cible_id) ?? [];

    const { data: individuMappings, error: individuError } = acteurIdsToDelete.length
      ? await supabase
          .from('v_acteurs_enrichis')
          .select('id, individu_id')
          .in('id', acteurIdsToDelete)
      : { data: [], error: null };

    if (individuError) {
      console.error('[deleteEntity] Erreur récupération des individu_id:', individuError.message);
      toast.error('Erreur lors de la suppression.');
      return;
    }

    const individuIdsToUpdate = Array.from(
      new Set((individuMappings ?? []).map((a) => a.individu_id).filter(Boolean)),
    );

    // 2. Supprimer les mappings
    for (const m of mappings || []) {
      const { error: delMappingError } = await supabase
        .from('transcription_entites_mapping')
        .delete()
        .match({
          entite_id: m.entite_id,
          cible_type: m.cible_type,
          cible_id: m.cible_id,
        });

      if (delMappingError) {
        console.error('[deleteEntity] Erreur suppression mapping:', delMappingError.message);
        toast.error('Erreur lors de la suppression d’un mapping.');
        return;
      }
    }

    // 3. Supprimer les acteurs liés
    if (acteurIdsToDelete.length > 0) {
      const { error: acteurError } = await supabase
        .from('transcription_entites_acteurs')
        .delete()
        .in('id', acteurIdsToDelete);

      if (acteurError) {
        console.error('[deleteEntity] Erreur suppression acteurs:', acteurError.message);
        toast.error('Erreur lors de la suppression des acteurs.');
        return;
      }
    }

    // 4. Supprimer l'entité principale
    const { error } = await supabase.from('transcription_entites').delete().eq('id', id);

    if (error) {
      console.error('[deleteEntity] Erreur suppression entité:', error.message);
      toast.error("Erreur lors de la suppression de l'entité.");
      return;
    }

    // 5. Mettre à jour l'identité des individus liés
    for (const individuId of individuIdsToUpdate) {
      try {
        await updateIndividuIdentiteByIndividuId(individuId);
      } catch (e: any) {
        console.warn(`[deleteEntity] Erreur updateIdentite ${individuId}:`, e.message);
      }
    }

    // ✅ Recharger les entités
    if (acteId) await get().fetchEntities(acteId, 'actes');
    toast(`Entité supprimée`, { icon: '🗑️', duration: 4000 });
  },

  addMentionToEntity: async ({ entite_id, bloc_id, start, end, preview }) => {
    const id = generateUUID();
    const payload = { id, entite_id, bloc_id, start, end, preview };

    const { error } = await supabase.from('transcription_entites_mentions').insert(payload);

    if (error) {
      console.error('[addMentionToEntity] Erreur:', error.message);
      return;
    }

    const mentions = await get().fetchMentionsForEntity(entite_id);
    get().updateEntityMentions(entite_id, mentions);
    toast.success('Mention ajoutée');
  },

  updateEntityMentions: (entityId, mentions) => {
    set((state) => ({
      entities: state.entities.map((e) =>
        e.id === entityId
          ? {
              ...e,
              mentions: mentions.map((m) => ({
                ...m,
                preview: m.preview ?? '', // ← safer
              })),
            }
          : e,
      ),
    }));
  },

  fetchMentionsForEntity: async (entiteId) => {
    const { data, error } = await supabase
      .from('transcription_entites_mentions')
      .select('*')
      .eq('entite_id', entiteId)
      .order('start', { ascending: true });

    if (error) {
      console.error(`[fetchMentionsForEntity] Erreur pour entité ${entiteId}:`, error.message);
      return [];
    }

    return data;
  },
  deleteMention: async (mentionId) => {
    const entity = get().entities.find((e) => e.mentions?.some((m) => m.id === mentionId));
    const entiteId = entity?.id;
    if (!entiteId) return;

    const { error } = await supabase
      .from('transcription_entites_mentions')
      .delete()
      .eq('id', mentionId);

    if (error) {
      console.error(
        `[deleteMention] Erreur lors de la suppression de la mention ${mentionId}:`,
        error.message,
      );
      toast.error('Erreur lors de la suppression de la mention.');
      return;
    }

    toast('Mention supprimée', {
      icon: '🗑️',
      duration: 4000,
    });

    const updated = await get().fetchMentionsForEntity(entiteId);

    set((state) => ({
      entities: state.entities.map((e) => (e.id === entiteId ? { ...e, mentions: updated } : e)),
    }));
  },

  getMentions: () => {
    const entities = get().entities;
    return entities.flatMap((entity) =>
      (entity.mentions || []).map((m) => ({
        ...m,
        entite_id: entity.id, // forcé en string
      })),
    ) as Mention[];
  },
}));
function enrichActorWithToponymesMentions(actor: any) {
  const pick = (f: string) => actor?.mentions_toponymes?.find((m: any) => m.fonction === f);
  const n = pick('naissance');
  const d = pick('deces');
  const h = pick('domicile');
  const r = pick('residence');
  const o = pick('origine');

  return {
    ...actor,
    naissance_mention_toponyme_id: n?.toponyme_id ?? null,
    naissance_path_labels: n?.path_labels ?? [],
    naissance_path_toponyme_ids: n?.path_toponyme_ids ?? [],

    deces_mention_toponyme_id: d?.toponyme_id ?? null,
    deces_path_labels: d?.path_labels ?? [],
    deces_path_toponyme_ids: d?.path_toponyme_ids ?? [],

    domicile_mention_toponyme_id: h?.toponyme_id ?? null,
    domicile_path_labels: h?.path_labels ?? [],
    domicile_path_toponyme_ids: h?.path_toponyme_ids ?? [],

    residence_mention_toponyme_id: r?.toponyme_id ?? null,
    residence_path_labels: r?.path_labels ?? [],
    residence_path_toponyme_ids: r?.path_toponyme_ids ?? [],

    origine_mention_toponyme_id: o?.toponyme_id ?? null,
    origine_path_labels: o?.path_labels ?? [],
    origine_path_toponyme_ids: o?.path_toponyme_ids ?? [],
  };
}

function enrichActorWithRefs(actor: any) {
  console.log('enrichActorWithRefs.actor', actor);
  const arr = (v: any) => (Array.isArray(v) ? v : v ? [v] : []);
  const sex = actor?.sexe;

  // Catégories couleur
  const cats = arr(actor?.categories_couleur);
  const categorie_couleur_ids = cats.map((x: any) => x?.categorie_couleur_id).filter(Boolean);
  const categorie_couleur_labels = cats
    .map((x: any) => {
      const r = x?.ref || {};
      if (r.invariable) return r.label;
      if (sex === 'F' && r.label_f) return r.label_f;
      if (sex === 'M' && r.label_m) return r.label_m;
      return r.label; // fallback
    })
    .filter(Boolean);

  // Filiations
  const fils = arr(actor?.filiations);
  const filiation_ids = fils.map((x: any) => x?.filiation_id).filter(Boolean);
  const filiation_labels = fils.map((x: any) => x?.ref?.label).filter(Boolean);

  // Professions (tri par position croissante, ordre conservé)
  const profs = arr(actor?.professions)
    .slice()
    .sort((a: any, b: any) => (a?.position ?? 999) - (b?.position ?? 999));
  const profession_ids = profs.map((x: any) => x?.profession_id).filter(Boolean);
  const profession_labels = profs
    .map((x: any) => {
      const r = x?.ref || {};
      if (r.invariable) return r.label;
      if (sex === 'F' && r.label_f) return r.label_f;
      if (sex === 'M' && r.label_m) return r.label_m;
      return r.label; // fallback
    })
    .filter(Boolean);
  const profession_positions = profs
    .map((x: any) => x?.position)
    .filter((n: any) => typeof n === 'number');

  // Qualités
  const quals = arr(actor?.qualites);
  const qualite_ids = quals.map((x: any) => x?.qualite_id).filter(Boolean);
  const qualite_labels = quals.map((x: any) => x?.ref?.label).filter(Boolean);

  // Signature
  const signs = arr(actor?.signatures);
  const signature_ids = signs.map((x: any) => x?.signature_id).filter(Boolean);
  const signature_labels = signs.map((x: any) => x?.ref?.label).filter(Boolean);

  // Situations fiscales
  const sitf = arr(actor?.situations_fiscales);
  const situation_fiscale_ids = sitf.map((x: any) => x?.situation_fiscale_id).filter(Boolean);
  const situation_fiscale_labels = sitf
    .map((x: any) => {
      const r = x?.ref || {};
      if (r.invariable) return r.label;
      if (sex === 'F' && r.label_f) return r.label_f;
      if (sex === 'M' && r.label_m) return r.label_m;
      return r.label; // fallback
    })
    .filter(Boolean);

  // Situations matrimoniales
  const sitm = arr(actor?.situations_matrimoniales);
  const situation_matrimoniale_ids = sitm
    .map((x: any) => x?.situation_matrimoniale_id)
    .filter(Boolean);
  const situation_matrimoniale_labels = sitm
    .map((x: any) => {
      const r = x?.ref || {};
      if (r.invariable) return r.label;
      if (sex === 'F' && r.label_f) return r.label_f;
      if (sex === 'M' && r.label_m) return r.label_m;
      return r.label; // fallback
    })
    .filter(Boolean);

  // Statuts juridiques
  const stj = arr(actor?.statuts_juridiques);
  const statut_juridique_ids = stj.map((x: any) => x?.statut_juridique_id).filter(Boolean);
  const statut_juridique_labels = stj
    .map((x: any) => {
      const r = x?.ref || {};
      if (r.invariable) return r.label;
      if (sex === 'F' && r.label_f) return r.label_f;
      if (sex === 'M' && r.label_m) return r.label_m;
      return r.label; // fallback
    })
    .filter(Boolean);

  // Statuts propriétaires
  const stp = arr(actor?.statuts_proprietaires);
  const statut_proprietaire_ids = stp.map((x: any) => x?.statut_proprietaire_id).filter(Boolean);
  const statut_proprietaire_labels = stp
    .map((x: any) => {
      const r = x?.ref || {};
      if (r.invariable) return r.label;
      if (sex === 'F' && r.label_f) return r.label_f;
      if (sex === 'M' && r.label_m) return r.label_m;
      return r.label; // fallback
    })
    .filter(Boolean);

  // Liens
  const liensRaw = arr(actor?.liens);

  const notesRaw = arr(actor?.notes);

  const mapLien = (x: any) => {
    const r = x?.ref || {};
    return {
      // row + type
      id: x?.id,
      lien_id: x?.lien_id,
      code: r?.code ?? null,
      nature: r?.nature ?? null, // 'mariage', 'parente', 'affinite', 'spirituel', 'tutelle', 'autre'
      degre: r?.degre ?? null,

      // labels de ref_lien (on garde les trois + invariable pour l’UI ; choix M/F se fera en composant)
      label: r?.label ?? null,
      label_m: r?.label_m ?? null,
      label_f: r?.label_f ?? null,
      invariable: !!r?.invariable,

      // cible
      cible_type: x?.cible_type, // 'acteur' | 'role' | 'texte'
      cible_role: x?.cible_role ?? null,
      cible_label: x?.cible_label ?? null,
      cible_acteur: x?.cible_acteur
        ? {
            id: x.cible_acteur.id,
            nom: x.cible_acteur.nom,
            prenom: x.cible_acteur.prenom,
            sexe: x.cible_acteur.sexe,
            role: x.cible_acteur.role ?? null,
            qualite: x.cible_acteur.qualites?.[0]?.ref?.label ?? null,
          }
        : null,

      // qualifs
      cote: x?.cote ?? null,
      fratrie_qualif: x?.fratrie_qualif ?? null, // 'germain' | 'uterin' | 'consanguin'
      cousin_degre: x?.cousin_degre ?? null, // 1,2,3...
      cousin_removal: x?.cousin_removal ?? null, // ±1, ±2...
      cousin_double: !!x?.cousin_double,
      ascend_n: x?.ascend_n ?? null,
      descend_n: x?.descend_n ?? null,

      // ordre d’affichage
      position: typeof x?.position === 'number' ? x.position : 1,
    };
  };

  function mapNote(x: any) {
  return {
    id: x?.id ?? null,

    // classification simple
    type_code: x?.type_code ?? 'libre', // 'etat_civil_inscription' | 'administratif' | 'statut_familial' | 'transaction' | 'libre'
    texte: x?.texte ?? null,

    // datation
    date_evenement: x?.date_evenement ?? null,                     // 'YYYY-MM-DD' (ou null)
    date_precision: x?.date_precision ?? 'inconnue',               // 'jour' | 'mois' | 'annee' | 'inconnue'

    // ancrages état-civil (FK)
    bureau_id: x?.bureau_id ?? null,
    registre_id: x?.registre_id ?? null,
    acte_id: x?.acte_id ?? null,

    // détails du pattern “inscription”
    inscription_nature: x?.inscription_nature ?? null,             // 'naissance' | 'mariage' | 'deces' | 'affranchissement' | 'nouveaux libres' | 'autre'
    annee_registre: Number.isFinite(x?.annee_registre) ? x.annee_registre : null,
    numero_acte: Number.isFinite(x?.numero_acte) ? x.numero_acte : null,

    // cible éventuelle
    target_kind: x?.target_kind ?? null,                           // 'acte_not' | 'acte_etat_civil' | 'texte'
    target_acte_ac_id: x?.target_acte_ac_id ?? null,
    target_acte_ec_id: x?.target_acte_ec_id ?? null,
    target_label: x?.target_label ?? null,

    // ordre d’affichage
    position: typeof x?.position === 'number' ? x.position : 1,
  };
}


  const liensMapped = liensRaw.map(mapLien);
  liensMapped.sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0));

  const liens_matrimoniaux_ref = liensMapped.filter((l: any) => l.nature === 'mariage');
  const liens_non_matrimoniaux_ref = liensMapped.filter((l: any) => l.nature !== 'mariage');

  const notesMapped = notesRaw.map(mapNote);
  notesMapped.sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0));
  const notes_ref = notesMapped;

  return {
    ...actor,

    // Catégories couleur
    categorie_couleur_ids,
    categorie_couleur_labels,

    // Filiations
    filiation_ids,
    filiation_labels,

    // Professions (ordre conservé)
    profession_ids,
    profession_labels,
    profession_positions,

    // Qualités
    qualite_ids,
    qualite_labels,

    // Signatures
    signature_ids,
    signature_labels,

    // Situations fiscales / matrimoniales
    situation_fiscale_ids,
    situation_fiscale_labels,
    situation_matrimoniale_ids,
    situation_matrimoniale_labels,

    // Statuts
    statut_juridique_ids,
    statut_juridique_labels,
    statut_proprietaire_ids,
    statut_proprietaire_labels,

    // Statuts
    liens_matrimoniaux_ref,
    liens_non_matrimoniaux_ref,

    // Notes
    notes_ref
  };
}
