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
        titre,
        type_unite,
        cote,
        depot_id,
        date_couverture_start,
        date_couverture_end,
        pagination_type,
        depot:ref_depots (
          nom,
          institution:ref_institutions ( nom )
        )
      `)
      .order('titre');

    if (error) {
      console.error('[fetchSources]', error);
      set({ loading: false, error: error.message });
      return;
    }

    const mapped: SourceRow[] = (data ?? []).map((d: any) => ({
      id: d.id,
      titre: d.titre,
      type_unite: d.type_unite,
      cote: d.cote,
      depot_id: d.depot_id,
      date_couverture_start: d.date_couverture_start,
      date_couverture_end: d.date_couverture_end,
      pagination_type: d.pagination_type,
      depot_nom: d.depot?.nom,
      institution_nom: d.depot?.institution?.nom,
    }));

    set({ sources: mapped, loading: false });
  },

  createSource: async (payload) => {
    const { error } = await supabase
      .from('ref_unites_documentaires')
      .insert(payload);

    if (error) throw error;
    await get().fetchSources();
  },

  updateSource: async (id, payload) => {
    const { error } = await supabase
      .from('ref_unites_documentaires')
      .update(payload)
      .eq('id', id);

    if (error) throw error;
    await get().fetchSources();
  },

  deleteSource: async (id) => {
    const { error } = await supabase
      .from('ref_unites_documentaires')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await get().fetchSources();
  },
}));
