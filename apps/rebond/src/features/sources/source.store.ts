// source.store.ts
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { SourceDB, SourceRow } from './source.types';

type SourceState = {
  sources: SourceRow[];
  loading: boolean;
  error: string | null;

  fetchSources: () => Promise<void>;
  createSource: (payload: Partial<SourceDB>) => Promise<void>;
  updateSource: (id: string, payload: Partial<SourceDB>) => Promise<void>;
  deleteSource: (id: string) => Promise<void>;
};

export const useSourceStore = create<SourceState>((set, get) => ({
  sources: [],
  loading: false,
  error: null,

  fetchSources: async () => {
    set({ loading: true, error: null });

    const { data, error } = await supabase
      .from('ref_unites_documentaires')
      .select(`
        id,
        type_unite_ref,
        titre,
        identifiant_interne,
        description,
        serie_ref,
        couverture_label,
        couverture_sort_start,
        couverture_sort_end,
        created_at,
        updated_at
      `)
      // tri “humain” pour l’état civil (1880, 1881…)
      .order('couverture_sort_start', { ascending: true })
      .order('titre', { ascending: true });

    if (error) {
      console.error('[fetchSources]', error);
      set({ loading: false, error: error.message });
      return;
    }

    set({ sources: (data ?? []) as any, loading: false });
  },

  createSource: async (payload) => {
    // garde-fou : au minimum titre + type_unite_ref
    if (!payload.titre?.trim()) throw new Error('titre requis');
    if (!payload.type_unite_ref) throw new Error('type_unite_ref requis');

    const { error } = await supabase.from('ref_unites_documentaires').insert({
      type_unite_ref: payload.type_unite_ref,
      titre: payload.titre.trim(),
      identifiant_interne: payload.identifiant_interne?.trim() || null,
      description: payload.description?.trim() || null,
      serie_ref: payload.serie_ref ?? null,
      couverture_label: payload.couverture_label?.trim() || null,
      couverture_sort_start: payload.couverture_sort_start ?? null,
      couverture_sort_end: payload.couverture_sort_end ?? null,
    });

    if (error) throw error;
    await get().fetchSources();
  },

  updateSource: async (id, payload) => {
    const patch: Partial<SourceDB> = {
      ...(payload.type_unite_ref ? { type_unite_ref: payload.type_unite_ref } : {}),
      ...(payload.titre !== undefined ? { titre: payload.titre?.trim() || '' } : {}),
      ...(payload.identifiant_interne !== undefined
        ? { identifiant_interne: payload.identifiant_interne?.trim() || null }
        : {}),
      ...(payload.description !== undefined
        ? { description: payload.description?.trim() || null }
        : {}),
      ...(payload.serie_ref !== undefined ? { serie_ref: payload.serie_ref } : {}),
      ...(payload.couverture_label !== undefined
        ? { couverture_label: payload.couverture_label?.trim() || null }
        : {}),
      ...(payload.couverture_sort_start !== undefined
        ? { couverture_sort_start: payload.couverture_sort_start }
        : {}),
      ...(payload.couverture_sort_end !== undefined
        ? { couverture_sort_end: payload.couverture_sort_end }
        : {}),
    };

    // garde-fou : si titre est modifié, il doit rester non vide
    if (patch.titre !== undefined && !patch.titre.trim()) {
      throw new Error('titre requis');
    }

    const { error } = await supabase
      .from('ref_unites_documentaires')
      .update(patch)
      .eq('id', id);

    if (error) throw error;
    await get().fetchSources();
  },

  deleteSource: async (id) => {
    // NB: si tu as des exemplaires liés, la FK côté ref_exemplaires (on delete cascade)
    // supprimera automatiquement; sinon ça plantera et c’est ok.
    const { error } = await supabase.from('ref_unites_documentaires').delete().eq('id', id);

    if (error) throw error;
    await get().fetchSources();
  },
}));
