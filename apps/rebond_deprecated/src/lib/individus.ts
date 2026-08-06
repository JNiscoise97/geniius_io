import { supabase } from '@/lib/supabase';

const PAGE_SIZE = 500;

function plusFrequent<T>(arr: (T | null | undefined)[]): T | null {
  const freqs = new Map<T, number>();
  for (const val of arr) {
    if (val != null) {
      freqs.set(val, (freqs.get(val) || 0) + 1);
    }
  }
  const sorted = Array.from(freqs.entries()).sort((a, b) => {
    if (b[1] === a[1]) return String(a[0]).localeCompare(String(a[0]));
    return b[1] - a[1];
  });
  return sorted.length > 0 ? sorted[0][0] : null;
}

function calculerIdentiteIndividu(acteurs: { nom?: string | null; prenom?: string | null; sexe?: string | null }[]) {
  const prenom = plusFrequent(acteurs.map((a) => a.prenom));
  const sexe = plusFrequent(acteurs.map((a) => a.sexe));

  let nom = plusFrequent(acteurs.map((a) => a.nom));
  if (nom === '? SANS NOM') {
    const alt = plusFrequent(
      acteurs.map((a) => a.nom).filter((n) => n != null && n !== '? SANS NOM')
    );
    nom = alt ? `(${alt})` : '? SANS NOM';
  }

  return { nom, prenom, sexe };
}

export async function updateIndividuIdentite(acteurId: string) {
  const { data: acteur, error: error1 } = await supabase
    .from('v_acteurs_enrichis')
    .select('individu_id')
    .eq('id', acteurId)
    .maybeSingle();

  if (error1) throw error1;
  const individuId = acteur?.individu_id;
  if (!individuId) return;

  return await updateIndividuIdentiteByIndividuId(individuId);
}

export async function updateIndividuIdentiteByIndividuId(individuId: string) {
  const { data: acteurs, error } = await supabase
    .from('v_acteurs_enrichis')
    .select('nom, prenom, sexe')
    .eq('individu_id', individuId);

  if (error) throw error;
  if (!acteurs || acteurs.length === 0) return;

  const { nom, prenom, sexe } = calculerIdentiteIndividu(acteurs);

  const { error: updateError } = await supabase
    .from('rebond_individus')
    .update({
      nom,
      prenom,
      sexe
    })
    .eq('id', individuId);

  if (updateError) throw updateError;

  return { individuId, nom, prenom, sexe };
}

export async function fetchActeursEnrichisByIndividuId(individuId: string) {
  let allData: any[] = [];
  let from = 0;
  let to = PAGE_SIZE - 1;

  while (true) {
    const { data, error } = await supabase
      .from('v_acteurs_enrichis')
      .select('*')
      .eq('individu_id', individuId)
      .range(from, to);

    if (error) {
      console.error('[fetchActeursEnrichisByIndividuId] Erreur:', error.message);
      break;
    }

    if (data && data.length > 0) {
      allData = allData.concat(data);
    }

    if (!data || data.length < PAGE_SIZE) {
      break;
    }

    from += PAGE_SIZE;
    to += PAGE_SIZE;
  }

  return allData;
}
