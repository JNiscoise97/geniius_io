// SourcesPage.tsx
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSourceStore } from './source.store';
import { SourcesTable } from './SourcesTable';
import { SourceEditSheet } from './SourceEditSheet';
import { SourceDialog, type SourceDialogMode } from './SourceDialog';
import { Plus } from 'lucide-react';

export function SourcesPage() {
  const { fetchSources } = useSourceStore();

  const [open, setOpen] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mode, setMode] = useState<SourceDialogMode | null>(null);

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
            setOpen(true);
            setMode('create');
          }}
        >
          <Plus size={14}/> Ajouter une source
        </Button>
      </div>

      <SourcesTable
        onEditUnite={(id) => {
          setEditingId(id);
          setOpen(true);
          setMode('edit-unite');
        }}
        onEditExemplaires={(id) => {
          setEditingId(id);
          setOpen(true);
          setMode('edit-exemplaire');
        }}
      />

      {/* ✅ Création = Dialog stepper */}
      <SourceDialog
        open={open}
        sourceId={editingId}
        mode={mode}
        onClose={() => {
          setOpen(false);
          setMode(null);
        }}
        onCreated={async () => {
          setOpen(false);
          setMode(null);
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
