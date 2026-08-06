// FusionActeursModal.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import type { ActeurEnrichiFields } from '@/types/analyse';
import { DataTable, type ColumnDef } from '@/components/shared/DataTable';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { startFusionLogic } from '@/lib/fusionActeurs';

export function FusionActeursModal({
  open,
  onClose,
  acteurs,
  selectedActeurs,
  selectedIndividus,
  pageSize,
}: {
  open: boolean;
  onClose: () => void;
  acteurs: ActeurEnrichiFields[];
  selectedActeurs: string[];
  selectedIndividus: string[];
  pageSize: number;
}) {
  const [fusionLoading, setFusionLoading] = useState(false);
  const [acteursSelectionnes, setActeursSelectionnes] = useState<string[]>(selectedActeurs);
  const [individusSelectionnes, setIndividusSelectionnes] = useState<string[]>(selectedIndividus);
  const [pagesVues, setPagesVues] = useState<Set<number>>(new Set());

  // Synchronisation à l'ouverture
  useEffect(() => {
    if (open) {
      setActeursSelectionnes(selectedActeurs);
      setIndividusSelectionnes(selectedIndividus);
    }
  }, [open, selectedActeurs, selectedIndividus]);

  const toggleSelection = (acteurId: string, individuId?: string) => {
    setActeursSelectionnes((prevActeurs) => {
      const isSelected = prevActeurs.includes(acteurId);
      const newActeurs = isSelected
        ? prevActeurs.filter((id) => id !== acteurId)
        : [...prevActeurs, acteurId];

      setIndividusSelectionnes((prevIndividus) => {
        if (!individuId) return prevIndividus;

        const stillSelected = isSelected
          ? newActeurs.some((id) => {
              const acteur = acteurs.find((a) => a.id === id);
              return acteur?.individu_id === individuId;
            })
          : true;

        if (!stillSelected) {
          return prevIndividus.filter((id) => id !== individuId);
        } else {
          return prevIndividus.includes(individuId)
            ? prevIndividus
            : [...prevIndividus, individuId];
        }
      });

      return newActeurs;
    });
  };

  // Regroupement logique en fonction des règles
  const selectedActeursData = acteurs.filter((a) => acteursSelectionnes.includes(a.id!));
  let additionalActeurs: ActeurEnrichiFields[] = [];

  if (individusSelectionnes.length === 1) {
    additionalActeurs = acteurs.filter(
      (a) => a.individu_id === individusSelectionnes[0] && !acteursSelectionnes.includes(a.id!),
    );
  } else if (individusSelectionnes.length > 1) {
    additionalActeurs = acteurs.filter(
      (a) =>
        individusSelectionnes.includes(a.individu_id || '') && !acteursSelectionnes.includes(a.id!),
    );
  }

  const allDisplayedActeurs = [...selectedActeursData, ...additionalActeurs];
  const sortedActeurs = allDisplayedActeurs.sort((a, b) =>
    (a.acte_date ?? '').localeCompare(b.acte_date ?? ''),
  );

  const totalPages = Math.ceil(sortedActeurs.length / pageSize);
  const handlePageViewed = (page: number) => {
    setPagesVues((prev) => {
      if (prev.has(page)) return prev; // ✅ empêche l’update inutile
      const next = new Set(prev);
      next.add(page);
      return next;
    });
  };

  const toutesPagesVues = totalPages <= 1 || pagesVues.size >= totalPages;

  // Définition des couleurs d’arrière-plan
  const couleurParIndex = [
    'bg-blue-100',
    'bg-purple-100',
    'bg-pink-100',
    'bg-cyan-100',
    'bg-rose-100',
    'bg-orange-100',
    'bg-teal-100',
  ];

  const getRowStyle = (row: ActeurEnrichiFields) => {
    if (!row.individu_id) return 'bg-indigo-300';

    if (selectedIndividus.length === 1 && row.individu_id === selectedIndividus[0]) return ''; // pas de surlignage dans ce cas

    if (selectedIndividus.length > 1) {
      const index = selectedIndividus.findIndex((id) => id === row.individu_id);
      if (index >= 0) return couleurParIndex[index % couleurParIndex.length];
    }

    return '';
  };

  const columns: ColumnDef<ActeurEnrichiFields>[] = [
    {
      key: 'checkbox',
      label: '',
      render: (row) => (
        <Checkbox
          checked={acteursSelectionnes.includes(row.id!)}
          onCheckedChange={() => toggleSelection(row.id!, row.individu_id)}
        />
      ),
    },
    { key: 'nom', label: 'Nom' },
    { key: 'prenom', label: 'Prénom' },
    { key: 'role', label: 'Rôle' },
    { key: 'age', label: 'Âge' },
    { key: 'domicile', label: 'Domicile' },
    { key: 'profession_brut', label: 'Profession' },
    { key: 'statut_brut', label: 'Statut' },
    { key: 'fonction', label: 'Fonction' },
    { key: 'acte_label', label: 'Acte' },
    { key: 'acte_date', label: 'Date' },
    { key: 'date_naissance_estimee', label: 'Date naissance (estimée)' },
    { key: 'lien_enrichi', label: 'Lien enrichi' },
  ];

  const defaultVisibleColumns = [
    'checkbox',
    'nom',
    'prenom',
    'date_naissance_estimee',
    'acte_date',
    'acte_label',
    'age',
    'role',
    'lien_enrichi'
  ];
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className='flex flex-col p-0'
        style={{ width: '90vw', height: '95vh', maxWidth: 'none', maxHeight: 'none' }}
      >
        <DialogHeader className='px-6 py-4 border-b shrink-0 sticky top-0 z-10'>
          <DialogTitle>Fusionner des acteurs</DialogTitle>
        </DialogHeader>
        <div className='py-4 overflow-x-auto'>
            <DataTable
              columns={columns}
              data={sortedActeurs}
              defaultVisibleColumns={defaultVisibleColumns}
              pageSize={pageSize}
              rowClassName={(row) => getRowStyle(row)}
              onPageViewed={handlePageViewed}
            />
          </div>
        <DialogFooter className='px-6 py-4 border-t shrink-0 flex justify-end gap-2'>
          <Button variant='ghost' onClick={onClose} disabled={fusionLoading}>
            Annuler
          </Button>
          <Button
            onClick={async () => {
              setFusionLoading(true);
              try {
                await startFusionLogic(selectedActeurs, selectedIndividus);
                toast.success('Fusion effectuée avec succès 🎉');
                setFusionLoading(false);
                onClose();
              } catch (error) {
                console.error('[FusionActeursModal] Erreur de fusion :', error);
                toast.error('Une erreur est survenue pendant la fusion');
                setFusionLoading(false);
              }
            }}
            disabled={fusionLoading || !toutesPagesVues}
          >
            {fusionLoading ? 'Fusion en cours...' : 'Valider la fusion'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
