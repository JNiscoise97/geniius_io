import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type DepotOption = {
  id: string;
  label: string;
};

export function useDepots() {
  const [depots, setDepots] = useState<DepotOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('ref_depots')
        .select(`
          id,
          nom,
          institution:ref_institutions (
            nom,
            sigle
          )
        `)
        .order('nom');

      if (!error && data) {
        setDepots(
          data.map((d: any) => ({
            id: d.id,
            label: d.institution?.sigle
              ? `${d.institution.sigle} — ${d.nom}`
              : `${d.institution?.nom ?? 'Institution'} — ${d.nom}`,
          }))
        );
      }

      setLoading(false);
    };

    load();
  }, []);

  return { depots, loading };
}
