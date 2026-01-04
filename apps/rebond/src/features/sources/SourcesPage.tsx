import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSourceStore } from './source.store';
import { SourcesTable } from './SourcesTable';
import { SourceSheet } from './SourceSheet';

export function SourcesPage() {
  const { fetchSources } = useSourceStore();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSources();
  }, []);

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between">
        <h1 className="text-xl font-semibold">Sources</h1>
        <Button onClick={() => { setEditingId(null); setOpen(true); }}>
          ➕ Créer une source
        </Button>
      </div>

      <SourcesTable
        onEdit={(id) => {
          setEditingId(id);
          setOpen(true);
        }}
      />

      <SourceSheet
        open={open}
        sourceId={editingId}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
