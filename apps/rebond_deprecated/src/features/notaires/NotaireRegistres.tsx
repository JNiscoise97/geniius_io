// NotaireRegistres.tsx
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DataTable, type ColumnDef } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { RegistreAcCreateModal } from './RegistreAcCreateModal';
import { Link } from 'react-router-dom';
import { ProgressVerboseBar } from '@/components/shared/ProgressVerboseBar';
import type { NotaireRegistre } from '@/types/acte';

export function NotaireRegistres({
  registres,
  notaireId,
}: {
  registres: any[];
  notaireId: string;
}) {
  const [createRegistreModalOpen, setCreateRegistreModalOpen] = useState(false);

  const columnsRegistres = useMemo<ColumnDef<any>[]>(
    () => [
      { key: 'annee', label: 'Année' },
      {
        key: 'label',
        label: "Label",
        render: (row) => (
            <Link to={`/ac-registre/${notaireId}/${row.id}`} className='font-medium hover:text-indigo-600'>
                      Minutes pour l'année {row.annee}
                    </Link>
        ),
      },
      { key: 'actes_estimes', label: 'Actes estimés' },
      { key: 'actes_releves', label: 'Actes relevés' },
      { key: 'actes_a_relever', label: 'Actes à relever' },
      { key: 'actes_transcrits', label: 'Actes transcrits' },
      { key: 'actes_a_transcrire', label: 'Actes à transcrire' },
      {
        key: 'progress_releve',
        label: 'Relevé',
        render: (r) =>
          r.actes_estimes > 0 ? (
            <ProgressVerboseBar
              value={r.actes_releves}
              max={r.actes_estimes}
              label={`Relevés : ${r.actes_releves ?? 0} / ${r.actes_estimes}`}
            />
          ) : (
            '—'
          ),
      },
      {
        key: 'progress_transcription',
        label: 'Transcription',
        render: (r) =>
          r.actes_estimes > 0 ? (
            <ProgressVerboseBar
              value={r.actes_transcrits}
              max={r.actes_estimes}
              label={`Transcrits : ${r.actes_transcrits ?? 0} / ${r.actes_estimes}`}
            />
          ) : (
            '—'
          ),
      },
      {
        key: 'complet',
        label: 'Complet',
        render: (r) =>
          r.complet ? (
            <Badge variant='default'>Oui</Badge>
          ) : (
            <Badge variant='destructive'>Non</Badge>
          ),
      },
    ],
    [],
  );

  const defaultVisibleColumns = [
    'label',
    'progress_releve',
    'progress_transcription',
    'complet',
  ];
  const [registresLocal, setRegistresLocal] = useState(registres);

  const handleNewRegistre = (newRegistre: NotaireRegistre) => {
    setRegistresLocal((prev) => [...prev, newRegistre]);
  };
  

  return (
    <>
      <h2 className='text-lg font-semibold mb-4'>Registres disponibles</h2>
      <p className='text-sm text-gray-700'>
        Liste des registres disponibles pour ce bureau, avec infos sur les années, types d’actes,
        complétude, etc.
      </p>
      <div className='flex items-center justify-end gap-4'>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => setCreateRegistreModalOpen(true)}
          className='text-sm text-indigo-500 hover:text-indigo-700 flex items-center gap-1'
        >
          <Plus className='w-4 h-4' />
          Ajouter un registre
        </Button>
      </div>
      <div className='overflow-auto'>
        <DataTable
          title='Registres disponibles'
          data={registresLocal}
          defaultVisibleColumns={defaultVisibleColumns}
          columns={columnsRegistres}
          defaultSort={['annee']}
          pageSize={-1}
        />
      </div>

      <RegistreAcCreateModal
        notaireId={notaireId}
        open={createRegistreModalOpen}
        onClose={() => setCreateRegistreModalOpen(false)}
        registresExistants={registres}
        onRegistreCreated={handleNewRegistre}
      />
    </>
  );
}