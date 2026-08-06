// IndividuList.tsx

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BackToHomeButton } from '@/components/shared/BackToRebondHomeButton';

import { useIndividuStore } from '@/store/useIndividuStore';
import type { Individu } from '@/types/individu';
import { DataTable, type ColumnDef } from '@/components/shared/DataTable';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

function extractNaissanceYear(value: string | null | undefined): number {
  if (!value) return -1;
  const match = value.match(/\d{4}/);
  return match ? parseInt(match[0]) : -1;
}

export default function IndividuList() {
  const individus = useIndividuStore((s) => s.individus);
  const fetchIndividus = useIndividuStore((s) => s.fetchIndividus);
  const loading = useIndividuStore((s) => s.loading);
  const [individusTries, setIndividusTries] = useState<Individu[]>([]);
  const [sortKey, setSortKey] = useState('initial');
  const [individusAvecMapping, setIndividusAvecMapping] = useState<Map<string, number>>(new Map());
  const [loadingCountActeurs, setLoadingCountActeurs] = useState<Boolean>(true);


  useEffect(() => {
    fetchIndividus();
  }, []);

  useEffect(() => {
    // Tri initial par nom + prénom
    const sorted = [...individus].sort((a, b) => {
      const nomCompare = a.nom?.localeCompare(b.nom ?? '') ?? 0;
      if (nomCompare !== 0) return nomCompare;
      return a.prenom?.localeCompare(b.prenom ?? '') ?? 0;
    });
    setIndividusTries(sorted);
  }, [individus]);
  const trierParNaissance = () => {
    console.log('tri en cours')
    const sorted = [...individus].sort((a, b) => {
      return extractNaissanceYear(a.naissance_date) - extractNaissanceYear(b.naissance_date);
    });
    console.log('triés', sorted)
    setIndividusTries(sorted);
    setSortKey(`naissance-${Date.now()}`)
  };

  useEffect(() => {
    setLoadingCountActeurs(true)
    const fetchActeursCounts = async () => {
      const map = new Map<string, number>();
      const pageSize = 1000;
      let from = 0;
      let to = pageSize - 1;
      let hasMore = true;

      while (hasMore) {
        const { data, error, count } = await supabase
          .from('v_acteurs_enrichis')
          .select('individu_id')
          .range(from, to);

        if (error) {
          console.error('Erreur de chargement page', from, '-', to, error);
          break;
        }

        for (const row of data ?? []) {
          if (row.individu_id) {
            map.set(row.individu_id, (map.get(row.individu_id) ?? 0) + 1);
          }
        }

        // Si on a reçu moins que `pageSize`, on est à la dernière page
        hasMore = (data?.length ?? 0) === pageSize;
        from += pageSize;
        to += pageSize;
      }

      setIndividusAvecMapping(map);
      setLoadingCountActeurs(false)
    };

    fetchActeursCounts();
  }, []);




  const deleteIndividu = async (individuId: string) => {
    const confirmDelete = confirm('Confirmer la suppression de cet individu ?');
    if (!confirmDelete) return;

    const { error: deleteError } = await supabase
      .from('rebond_individus')
      .delete()
      .eq('id', individuId);

    if (deleteError) {
      console.error('Erreur de suppression :', deleteError);
      toast.error("La suppression a échoué.");
      return;
    }

    toast.success("Individu supprimé.");
    fetchIndividus(); // recharge les individus
  };



  const allColumns: ColumnDef<Individu>[] = [
    { key: 'nom', label: 'Nom', columnWidth: '13%' },
    { key: 'prenom', label: 'Prénom', columnWidth: '21%' },
    { key: 'naissance_date', label: 'Date de naissance', columnWidth: '9%' },
    { key: 'naissance_lieu', label: 'Lieu de naissance', columnWidth: '14%' },
    { key: 'deces_date', label: 'Date de décès', columnWidth: '9%' },
    { key: 'deces_lieu', label: 'Lieu de décès', columnWidth: '14%' }, {
      key: 'nb_acteurs',
      label: 'Mentions liées',
      columnWidth: '10%',
      render: (row: Individu) => individusAvecMapping.get(row.id) ?? 0,
    },
    {
      key: 'actions',
      label: 'Actions',
      columnWidth: '10%',
      render: (row: Individu) => (
        <>
          <Link to={`/individu/${row.id}`}>
            <Button variant='outline' size='sm'>
              Voir
            </Button>
          </Link>
          {!loadingCountActeurs && (individusAvecMapping.get(row.id) ?? 0) === 0 && (
            <Button
              variant='destructive'
              size='sm'
              onClick={() => deleteIndividu(row.id)}
            >
              Supprimer
            </Button>
          )}
        </>
      ),
    },
  ];
  const defaultVisibleColumns = ['nom', 'prenom', 'naissance_date', 'naissance_lieu', 'deces_date', 'deces_lieu', 'nb_acteurs', 'actions'];

  return (
    <div className='p-6 space-y-4'>
      <BackToHomeButton />

      <div className='flex justify-end'>
        <Button variant='secondary' onClick={trierParNaissance}>
          Trier par date de naissance
        </Button>
      </div>

      <div className='overflow-x-auto'>
        {loading ? (
          <div className='text-center py-10 text-muted-foreground'>Chargement des individus...</div>
        ) : (
          <>
            <DataTable
              key={sortKey}
              title='Liste des individus'
              data={individusTries}
              columns={allColumns}
              defaultVisibleColumns={defaultVisibleColumns}
              pageSize={12}
            />
          </>
        )}
      </div>
    </div>
  );
}
