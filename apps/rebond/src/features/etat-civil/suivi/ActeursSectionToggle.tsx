//ActeursSectionToggle.tsx

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable, type ColumnDef } from '@/components/shared/DataTable';
import { FicheActeur } from './FicheActeur';
import type { ActeurEnrichiFields, Entity } from '@/types/analyse';

type Props = {
  data: Entity[];
  columns: ColumnDef<ActeurRow>[];
  mode?: 'view' | 'edit';
  relations?: any[];
  onEdit?: (acteur: any) => void;
  onDelete?: (id: string) => void;
  onAdd?: () => void;
};

type ActeurRow = ActeurEnrichiFields & {
  entityId?: string;
  categorieId?: any[];
};

export function ActeursSectionToggle({ data, columns, mode = 'view', relations =[], onEdit, onDelete, onAdd }: Props) {
  const [grid, setGrid] = useState(mode === 'edit');

  const acteurs = useMemo(() => {
    const list = [];

    for (const entity of data) {
      const acteur = entity.mapping?.acteur;
      if (!acteur || !entity.id) continue;

      list.push({
        ...acteur,
        entityId: entity.id,
        mentions: entity.mentions ?? [],
      });
    }

    return list;
  }, [data]);

  return (
    <div>
      {mode === 'view' && (<div className='flex justify-end mb-2'>
        <Button
          variant='outline'
          size='sm'
          className='text-xs'
          onClick={() => setGrid((prev) => !prev)}
        >
          {grid ? 'Voir sous forme de tableau' : 'Voir sous forme de fiches'}
        </Button>
      </div>)}

      {mode === 'view' && !grid ? (
        <DataTable data={acteurs} columns={columns} pageSize={-1} showMenu={false} />
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-4'>
          {acteurs.map((acteur: any) => (
            <FicheActeur key={acteur.id} acteur={acteur} mode={mode} relations={relations} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
