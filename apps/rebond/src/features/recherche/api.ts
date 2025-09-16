// src/features/search/api.ts
import { supabase } from '@/lib/supabase';

export const PAGE_SIZE:number = 30 as const;

export type SortMentions = 'date_desc' | 'date_asc';
export type SortLieux = 'alpha' | 'mentions';

export async function searchIndividus(
  query: string,
  { from = 0, to = PAGE_SIZE - 1, count = 'exact' as 'exact' | null } = {},
) {
  const sel = supabase
    .from('rebond_individus')
    .select('id, prenom, nom, sexe, naissance_date, naissance_lieu, deces_date, deces_lieu', count ? { count } : {})
    .or(`prenom.ilike.%${query}%,nom.ilike.%${query}%`)
    .order('nom', { ascending: true, nullsFirst: false });

  const { data, error, count: total } = from != null && to != null ? await sel.range(from, to) : await sel.limit(10);
  if (error) return { rows: [], total: 0, error };

  return { rows: data ?? [], total: total ?? 0 };
}

export async function searchActeurs(
  query: string,
  { from = 0, to = PAGE_SIZE - 1, sort = 'date_desc' as SortMentions, count = 'exact' as 'exact' | null } = {},
) {
  const ascending = sort === 'date_asc';
  let sel = supabase
    .from('v_acteurs_enrichis')
    .select('id, prenom, nom, sexe, role, age, acte_id, acte_label, source_table, acte_date, nom_complet', count ? { count } : {})
    .ilike('nom_complet', `%${query}%`)
    .order('acte_date', { ascending, nullsFirst: false });

  const { data, error, count: total } = from != null && to != null ? await sel.range(from, to) : await sel.limit(10);
  if (error) return { rows: [], total: 0, error };

  return { rows: data ?? [], total: total ?? 0 };
}

export async function searchNotaires(
  query: string,
  { from = 0, to = PAGE_SIZE - 1, count = 'exact' as 'exact' | null } = {},
) {
  const sel = supabase
    .from('notaires')
    .select('id, titre, prenom, nom, lieu_exercice', count ? { count } : {})
    .ilike('nom', `%${query}%`)
    .order('nom', { ascending: true, nullsFirst: false });

  const { data, error, count: total } = from != null && to != null ? await sel.range(from, to) : await sel.limit(10);
  if (error) return { rows: [], total: 0, error };

  return { rows: data ?? [], total: total ?? 0 };
}

// RPC non paginée — on laisse au consommateur la pagination client
export async function searchDocuments(query: string) {
  const { data, error } = await supabase.rpc('search_documents', { query });
  if (error) return { rows: [], error };
  return { rows: data ?? [] };
}

export async function searchLieux(
  query: string,
  { from = 0, to = PAGE_SIZE - 1, sort = 'alpha' as SortLieux, count = 'exact' as 'exact' | null } = {},
) {
  let sel = supabase
    .from('v_toponymes_enrichis')
    .select('id, lieu_id, toponyme_libelle, is_principal, lieu_type, parent_id, path_labels, mentions_count, distinct_acte_source_count', count ? { count } : {})
    .ilike('toponyme_libelle', `%${query}%`);

  sel = sort === 'mentions'
    ? sel.order('mentions_count', { ascending: false, nullsFirst: false })
    : sel.order('toponyme_libelle', { ascending: true, nullsFirst: false });

  const { data, error, count: total } = from != null && to != null ? await sel.range(from, to) : await sel.limit(10);
  if (error) return { rows: [], total: 0, error };

  return { rows: data ?? [], total: total ?? 0 };
}
