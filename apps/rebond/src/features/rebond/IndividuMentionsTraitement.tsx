// IndividuMentionsTraitement.tsx

import { useEffect, useState } from 'react';
import { BackToHomeButton } from '@/components/shared/BackToRebondHomeButton';

import { useIndividuStore } from '@/store/useIndividuStore';
import {
  DataTable,
  highlightMatch,
  type ColumnDef,
  type Filtre,
} from '@/components/shared/DataTable';
import type { ActeurEnrichiFields } from '@/types/analyse';
import { Button } from '@/components/ui/button';
import { Lightbulb, Merge, Navigation, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { FusionActeursModal } from './FusionActeursModal';
import { IndividuMentionsSuggestionsModal } from './IndividuMentionsSuggestionsModal';

export default function IndividuMentionsTraitement() {
  const acteurs = useIndividuStore((s) => s.acteurs);
  const fetchActeurs = useIndividuStore((s) => s.fetchActeurs);
  const loading = useIndividuStore((s) => s.loading);
  const enrichissementEnCoursLienEnrichi = useIndividuStore(
    (s) => s.enrichissementEnCoursLienEnrichi,
  );

  const [selectedActeurs, setSelectedActeurs] = useState<string[]>([]);
  const [selectedIndividus, setSelectedIndividus] = useState<string[]>([]);

  const [fusionModalOpen, setFusionModalOpen] = useState(false);

  const [suggestionsModalOpen, setSuggestionsModalOpen] = useState(false);

  const [appliedFiltres, setAppliedFiltres] = useState<Filtre[]>([]);
  const [activateFiltreOnMount, setActivateFiltreOnMount] = useState(false);

  useEffect(() => {
    fetchActeurs();
  }, []);

  const [search, setSearch] = useState('');

  const allColumns: ColumnDef<ActeurEnrichiFields>[] = [
    {
      key: 'checkbox',
      label: '',
      render: (row) => (
        <Checkbox
          checked={selectedActeurs.includes(row.id!)}
          onCheckedChange={() => toggleSelection(row.id!, row.individu_id)}
        />
      ),
    },
    {
      key: 'individu_id',
      label: 'Individu',
      render: (row) =>
        row.individu_id ? (
          <Link to={`/individu/${row.individu_id}`}>
            <Button variant='ghost' className='flex items-center gap-2 text-sm'>
              <Navigation className='w-4 h-4 opacity-70 text-indigo-600' />
            </Button>
          </Link>
        ) : null,
    },
    { key: 'qualite', label: 'Qualité' },
    { key: 'nom', label: 'Nom' },
    { key: 'prenom', label: 'Prénom' },
    { key: 'sexe', label: 'Sexe' },
    { key: 'age', label: 'Âge' },
    { key: 'role', label: 'Role' },
    { key: 'lien', label: 'Lien' },
    { key: 'profesion', label: 'Profesion' },
    { key: 'statut', label: 'Statut' },
    { key: 'fonction', label: 'Fonction' },
    { key: 'domicile', label: 'Domicile' },
    { key: 'note', label: 'Note' },
    { key: 'signature_libelle', label: 'Signature' },
    {
      key: 'acte_label',
      label: 'Acte',
      render: (row) => {
        if (!row.acte_id) return null;
        const base = row.source_table === 'etat_civil_actes' ? 'ec-acte' : 'ac-actes';
        return (
          <Link
            to={`/${base}/${row.acte_id}`}
            className='inline-flex items-center gap-1 hover:text-indigo-600'
          >
            <Navigation className='w-4 h-4 opacity-70' />
            {highlightMatch(row.acte_label ?? '', search)}
          </Link>
        );
      },
    },
    { key: 'acte_date', label: 'Date acte' },
    { key: 'date_naissance_estimee', label: 'Date naissance (estimée)' },
    {
      key: 'lien_enrichi',
      label: 'Lien enrichi' + (enrichissementEnCoursLienEnrichi ? ' ⏳' : ''),
    },
  ];
  const defaultVisibleColumns = [
    'checkbox',
    'individu_id',
    'qualite',
    'nom',
    'prenom',
    'date_naissance_estimee',
    'acte_date',
    'acte_label',
    'age',
    'role',
    'lien_enrichi',
  ];
  const toggleSelection = (acteurId: string, individuId: string | undefined) => {
    setSelectedActeurs((prevActeurs) => {
      const isSelected = prevActeurs.includes(acteurId);
      const newActeurs = isSelected
        ? prevActeurs.filter((id) => id !== acteurId)
        : [...prevActeurs, acteurId];

      setSelectedIndividus((prevIndividus) => {
        if (!individuId) return prevIndividus;

        const stillSelectedForThisIndividu = isSelected
          ? newActeurs.some((id) => {
              const matchingActeur = acteurs.find((a) => a.id === id);
              return matchingActeur?.individu_id === individuId;
            })
          : true;

        if (!stillSelectedForThisIndividu) {
          // Si plus aucun acteur de cet individu sélectionné, on le retire
          return prevIndividus.filter((id) => id !== individuId);
        } else {
          // Sinon on l'ajoute s'il n'y est pas déjà
          return prevIndividus.includes(individuId)
            ? prevIndividus
            : [...prevIndividus, individuId];
        }
      });

      return newActeurs;
    });
  };

  const pageSize = 12;

  const handleSuggestionClick = (nom: string, prenom: string) => {
    setAppliedFiltres([
      { colonne: 'nom', operateur: 'est', valeur: nom },
      { colonne: 'prenom', operateur: 'est', valeur: prenom },
    ]);
    setActivateFiltreOnMount(true);
  };

  const handleRefresh = async () => {
    await fetchActeurs();
  };

  return (
    <div className='p-6 space-y-4'>
      <BackToHomeButton />

      <div className='overflow-x-auto'>
        {loading ? (
          <div className='text-center py-10 text-muted-foreground'>Chargement des acteurs...</div>
        ) : (
          <>
            <div className='flex items-center justify-start gap-x-10 text-sm text-muted-foreground w-full'>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setSuggestionsModalOpen(true)}
                className='text-sm text-yellow-500 hover:text-yellow-700 flex items-center gap-1'
              >
                <Lightbulb className='w-4 h-4' />
              </Button>
              <Button
                variant='ghost'
                size='sm'
                onClick={handleRefresh}
                className='text-sm text-muted-foreground flex items-center gap-1'
              >
                <RefreshCcw className='w-4 h-4' /> Rafraîchir
              </Button>
              <div className='flex items-center gap-x-4'>
                {selectedActeurs.length > 0 &&
                  (() => {
                    const selectedActeursData = acteurs.filter((a) =>
                      selectedActeurs.includes(a.id!),
                    );

                    const selectedIndividuIds = selectedActeursData
                      .map((a) => a.individu_id)
                      .filter((id) => id !== undefined);

                    const uniqueIndividuIds = new Set(selectedIndividuIds);
                    const hasMissingIndividuId = selectedActeursData.some((a) => !a.individu_id);
                    const showFusionButton =
                      selectedActeurs.length > 1 &&
                      (hasMissingIndividuId || uniqueIndividuIds.size > 1);

                    return showFusionButton ? (
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => setFusionModalOpen(true)}
                        className='text-sm text-indigo-500 hover:text-indigo-700 flex items-center gap-1'
                      >
                        <Merge className='w-4 h-4' />
                        Fusionner
                      </Button>
                    ) : null;
                  })()}

                {selectedActeurs.length > 0 && (
                  <>
                    <div className='text-sm text-muted-foreground'>
                      {selectedActeurs.length} acteur{selectedActeurs.length > 1 ? 's' : ''}{' '}
                      sélectionné
                      {selectedActeurs.length > 1 ? 's' : ''}
                      {' • '}
                      {selectedIndividus.length} individu{selectedIndividus.length > 1 ? 's' : ''}{' '}
                      sélectionné
                      {selectedIndividus.length > 1 ? 's' : ''}
                    </div>

                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => {
                        setSelectedActeurs([]);
                        setSelectedIndividus([]);
                      }}
                      className='text-xs text-red-500 hover:text-red-700'
                    >
                      Tout désélectionner
                    </Button>
                  </>
                )}
              </div>
            </div>
            <DataTable
              title='Liste des acteurs'
              data={acteurs}
              columns={allColumns}
              defaultVisibleColumns={defaultVisibleColumns}
              defaultSort={['acte_date']}
              pageSize={12}
              search={search}
              onSearchChange={setSearch}
              initialFiltres={appliedFiltres}
              initialFiltreActif={activateFiltreOnMount}
            />
          </>
        )}
      </div>
      <FusionActeursModal
        open={fusionModalOpen}
        onClose={() => setFusionModalOpen(false)}
        acteurs={acteurs}
        selectedActeurs={selectedActeurs}
        selectedIndividus={selectedIndividus}
        pageSize={pageSize}
      />
      <IndividuMentionsSuggestionsModal
        open={suggestionsModalOpen}
        onClose={() => setSuggestionsModalOpen(false)}
        onSuggestionClick={handleSuggestionClick}
      />
    </div>
  );
}
