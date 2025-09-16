// BureauRegistresSection.tsx
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DataTable, type ColumnDef } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
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
                      {getRegistreLabel(row.type_acte, row.statut_juridique)}
                    </Link>
        ),
      },
      { key: 'mode_registre', label: 'Mode' },
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
    'annee',
    'type',
    'progress_releve',
    'progress_transcription',
    'complet',
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
          defaultSort={['annee']}
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
  
  export function getRegistreLabel(typeActe: string, statut_juridique?: string): string {
  const types = typeActe.split('|');
  const baseTypes = ['naissance', 'reconnaissance', 'affranchissement', 'jugement'];

  const joinAvecEt = (items: string[]) => {
    if (items.length === 0) return '';
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} et ${items[1]}`;
    return `${items.slice(0, -1).join(', ')} et ${items[items.length - 1]}`;
  };

  const suffixeStatut =
    statut_juridique === 'esclave'
      ? ' des esclaves'
      : statut_juridique === 'nouveau_libre'
      ? ' des nouveaux libres'
      : '';

  if (types.length > 1) {
    const uniquementBase = types.every((t) => baseTypes.includes(t));

    if (uniquementBase) {
      const autres = types.filter((t) => t !== 'naissance');
      const labelAutres =
        autres.length > 0
          ? ` incluant ${joinAvecEt(
              autres.map((t) => `les ${t}${t.endsWith('s') || t.endsWith('x') ? '' : 's'}`)
            )}`
          : '';
      return `Registre des naissances${labelAutres}${suffixeStatut}`;
    } else {
      const labels = types.map((t) => `les ${t}${t.endsWith('s') || t.endsWith('x') ? '' : 's'}`);
      return `Registre incluant ${joinAvecEt(labels)}${suffixeStatut}`;
    }
  } else {
    const t = types[0];
    return `Registre des ${t}${t.endsWith('s') || t.endsWith('x') ? '' : 's'}${suffixeStatut}`;
  }
}

  