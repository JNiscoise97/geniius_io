import { supabase } from "./supabase";

const PAGE_SIZE = 500;

export async function fetchActeursEnrichis(acteId: string) {
  let allData: any[] = [];
  let from = 0;
  let to = PAGE_SIZE - 1;

  while (true) {
    const { data, error, count } = await supabase
      .from('v_acteurs_enrichis')
      .select('*', { count: 'exact' }) // compte total pour savoir quand s'arrêter
      .eq('acte_id', acteId)
      .range(from, to);

    if (error) {
      console.error('[fetchActeursEnrichis] Erreur:', error.message);
      break;
    }

    if (data && data.length > 0) {
      allData = allData.concat(data);
    }

    if (!data || data.length < PAGE_SIZE) {
      break; // fin de la pagination
    }

    from += PAGE_SIZE;
    to += PAGE_SIZE;
  }

  return allData;
}
