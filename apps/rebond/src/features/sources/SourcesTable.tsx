// SourcesTable.tsx
import { useMemo } from 'react';
import { useSourceStore } from './source.store';
import { Button } from '@/components/ui/button';
import { DataTable, type ColumnDef } from '@/components/shared/DataTable';
import { Pencil, Trash } from 'lucide-react';

type SourceRow = {
  id: string;
  titre: string | null;
};

export function SourcesTable({
  onEditUnite,
  onEditExemplaires,
}: {
  onEditUnite: (id: string) => void;
  onEditExemplaires: (id: string) => void;
}) {
  const { sources, deleteSource } = useSourceStore();

  const rows = useMemo<SourceRow[]>(
    () =>
      (sources ?? []).map((s: any) => ({
        id: s.id,
        titre: s.titre ?? '—',
      })),
    [sources],
  );

  const columns: ColumnDef<SourceRow>[] = [
    {
      key: 'titre',
      label: 'Titre',
      columnWidth: '70%',
      render: (row) => row.titre ?? '—',
    },
    {
      key: 'actions',
      label: 'Actions',
      columnWidth: '30%',
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => onEditUnite(row.id)}>
            <Pencil size={14} className="mr-2" />
            Éditer l’unité
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onEditExemplaires(row.id)}
          >
            <Pencil size={14} className="mr-2" />
            Éditer les exemplaires
          </Button>

          <Button size="sm" variant="destructive" onClick={() => deleteSource(row.id)}>
            <Trash size={14} className="mr-2" />
            Supprimer
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      title="Sources"
      data={rows}
      columns={columns}
      defaultVisibleColumns={['titre', 'actions']}
      pageSize={12}
      showMenu={true}
      // optionnel: si tu veux un tri par défaut
      defaultSort={['titre']}
    />
  );
}
