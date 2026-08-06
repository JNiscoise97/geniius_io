// BureauRegistresSection.tsx
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Plus } from 'lucide-react';
import { DataTable, type ColumnDef } from '@/components/shared/DataTable';
import { RegistreCreateModal } from './RegistreCreateModal';
import type { EtatCivilRegistre } from '@/types/etatcivil';
import { Link } from 'react-router-dom';
import { ProgressVerboseBar } from '@/components/shared/ProgressVerboseBar';

export function BureauRegistres({
  registres,
  bureauId,
}: {
  registres: any[];
  bureauId: string;
}) {
  const [createRegistreModalOpen, setCreateRegistreModalOpen] = useState(false);

  const columnsRegistres = useMemo<ColumnDef<any>[]>(
    () => [
      { key: 'annee', label: 'Année' },
      {
        key: 'type',
        label: "Type d'acte",
        render: (row) => (
            <Link to={`/ec-registre/${bureauId}/${row.id}`} className='font-medium hover:text-indigo-600'>
                      {row.label}
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
    ],
    [],
  );

  const defaultVisibleColumns = [
    'annee',
    'type',
    'progress_releve',
    'progress_transcription',
  ];
  const [registresLocal, setRegistresLocal] = useState(registres);

  const handleNewRegistre = (newRegistre: EtatCivilRegistre) => {
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
          defaultSort={['annee', 'type']}
          pageSize={-1}
        />
      </div>

      <RegistreCreateModal
        bureauId={bureauId}
        open={createRegistreModalOpen}
        onClose={() => setCreateRegistreModalOpen(false)}
        registresExistants={registres}
        onRegistreCreated={handleNewRegistre}
      />
    </>
  );
}
  