import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Officier } from '@/features/etat-civil/suivi/FriseOfficiers';

export type Periode = {
  nom: string;
  individuId?:string;
  acteurId?: string;
  nbActes?:number;
  debut: number;
  fin: number;
};

type FonctionTimeline = {
  fonction: string;
  periodes: Periode[];
};

export function useOfficiersParBureau(bureauId: string | undefined) {
  const [officiers, setOfficiers] = useState<Officier[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!bureauId) return;

    const fetch = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_responsables_par_bureau', {
          bureau_id_input: bureauId,
            });
        if (error) {
          console.error('Erreur chargement officiers', error);
          setOfficiers([]);
        } else {
          setOfficiers(
            (data ?? []).map((r:any) => ({
              nom: `${r.prenom ?? ''} ${r.nom ?? ''}`.trim(),
              fonction: r.fonction,
              debut: r.debut_annee,
              fin: r.fin_annee,
            }))
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [bureauId]);

  return { officiers, loading };
}

export function useFonctionsTimeline(bureauId: string | undefined) {
  const [fonctionsTimeline, setFonctionsTimeline] = useState<FonctionTimeline[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!bureauId) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_responsables_par_bureau', {
          bureau_id_input: bureauId,
            });
        if (error) {
          console.error('Erreur chargement officiers', error);
          setFonctionsTimeline([]);
        } else {
          // Transformation vers le format groupé par fonction
        const regroupé: Record<string, Periode[]> = {};

        for (const r of data) {
          const nom = `${r.prenom ?? ''} ${r.nom ?? ''}`.trim();

          if (!regroupé[r.fonction]) {
            regroupé[r.fonction] = [];
          }

          regroupé[r.fonction].push({
            individuId: r.officier_individu_id,
            acteurId: r.officier_acteur_id,
            nom,
            debut: r.debut_annee,
              fin: r.fin_annee,
              nbActes: r.nb_actes,
          });
        }

        const timeline: FonctionTimeline[] = Object.entries(regroupé).map(([fonction, periodes]) => ({
          fonction,
          periodes,
        }));

        setFonctionsTimeline(timeline);
        }
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [bureauId]);

  return { fonctionsTimeline, loading };
}
