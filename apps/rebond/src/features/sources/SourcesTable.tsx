import { useSourceStore } from './source.store';
import { Button } from '@/components/ui/button';

export function SourcesTable({ onEdit }: { onEdit: (id: string) => void }) {
  const { sources, deleteSource } = useSourceStore();

  return (
    <table className="w-full border rounded">
      <thead>
        <tr className="bg-slate-100 text-left text-sm">
          <th className="p-2">Titre</th>
          <th className="p-2">Dépôt</th>
          <th className="p-2">Cote</th>
          <th className="p-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {sources.map((s) => (
          <tr key={s.id} className="border-t">
            <td className="p-2">{s.titre}</td>
            <td className="p-2">{s.depot_nom}</td>
            <td className="p-2">{s.cote ?? '—'}</td>
            <td className="p-2 flex gap-2">
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
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
