// SourcesPage.tsx
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSourceStore } from './source.store';
import { SourcesTable } from './SourcesTable';
import { SourceEditSheet } from './SourceEditSheet';
import { CreateSourceDialog } from './CreateSourceDialog';
import { Plus } from 'lucide-react';

export function SourcesPage() {
  const { fetchSources } = useSourceStore();

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between">
        <h1 className="text-xl font-semibold">Sources</h1>

        <Button
          onClick={() => {
            setEditingId(null);
            setOpenCreate(true);
          }}
        >
          <Plus size={14}/> Ajouter une source
        </Button>
      </div>

      <SourcesTable
        onEdit={(id) => {
          setEditingId(id);
          setOpenEdit(true);
        }}
      />

      {/* ✅ Création = Dialog stepper */}
      <CreateSourceDialog
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onCreated={async () => {
          setOpenCreate(false);
          await fetchSources();
        }}
      />

      {/* ✅ Edition = Sheet */}
      <SourceEditSheet
        open={openEdit}
        sourceId={editingId}
        onClose={() => setOpenEdit(false)}
      />
    </div>
  );
}
