// SourcesTable.tsx
import { useMemo } from 'react';
import { useSourceStore } from './source.store';
import { Button } from '@/components/ui/button';

function labelTypeUnite(typeUnite: string) {
  switch ((typeUnite || '').toLowerCase()) {
    case 'registre':
      return 'Registre';
    case 'volume':
      return 'Volume';
    case 'liasse':
      return 'Liasse';
    case 'bobine':
      return 'Bobine';
    case 'microfilm':
      return 'Microfilm';
    case 'autre':
      return 'Autre';
    default:
      return typeUnite || '—';
  }
}

export function SourcesTable({ onEdit }: { onEdit: (id: string) => void }) {
  const { sources, deleteSource } = useSourceStore();

  const rows = useMemo(() => sources ?? [], [sources]);

  return (
    <table className="w-full border rounded">
      <thead>
        <tr className="bg-slate-100 text-left text-sm">
          <th className="p-2">Titre</th>
          <th className="p-2">Type</th>
          <th className="p-2">Couverture</th>
          <th className="p-2">Série</th>
          <th className="p-2">Actions</th>
        </tr>
      </thead>

      <tbody>
        {rows.map((s) => (
          <tr key={s.id} className="border-t">
            <td className="p-2">{s.titre}</td>

            <td className="p-2">{labelTypeUnite(s.type_unite)}</td>

            <td className="p-2">
              {s.couverture_label
                ? s.couverture_label
                : s.couverture_sort_start || s.couverture_sort_end
                  ? `${s.couverture_sort_start ?? '…'} → ${s.couverture_sort_end ?? '…'}`
                  : '—'}
            </td>

            <td className="p-2">
              {s.serie_label
                ? s.serie_code
                  ? `${s.serie_label} (${s.serie_code})`
                  : s.serie_label
                : s.serie_ref ?? '—'}
            </td>

            <td className="p-2">
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => onEdit(s.id)}>
                  Éditer
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteSource(s.id)}
                >
                  Supprimer
                </Button>
              </div>
            </td>
          </tr>
        ))}

        {!rows.length && (
          <tr>
            <td className="p-4 text-sm text-muted-foreground" colSpan={5}>
              Aucune source.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
