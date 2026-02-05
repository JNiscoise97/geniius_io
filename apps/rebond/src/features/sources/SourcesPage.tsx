// SourcesPage.tsx
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSourceStore } from './source.store';
import { SourcesTable } from './SourcesTable';
import { SourceEditSheet } from './SourceEditSheet';
import { SourceDialog, type SourceDialogMode } from './SourceDialog';
import { AlertTriangle, Plus } from 'lucide-react';

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
    <div className='p-6 space-y-4'>
      <div className='flex justify-between'>
        <h1 className='text-xl font-semibold'>Sources</h1>

        <Button
          onClick={() => {
            setEditingId(null);
            setOpen(true);
            setMode('create');
          }}
        >
          <Plus size={14} /> Ajouter une source
        </Button>
      </div>

      <div className='rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mt-3'>
        <div className='flex items-start gap-3'>
          <AlertTriangle className='h-4 w-4 mt-0.5 text-amber-700' />
          <div className='min-w-0'>
            <div className='text-sm font-semibold text-amber-900'>Chantiers en cours</div>
            <div className='mt-0.5 text-xs text-amber-800'>
              <ol>
                <li>CRUD institutions et dépôts</li>
                <li>Picker + label pour source_exemplaire_id</li>
              </ol>
            </div>
          </div>
        </div>
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
      <SourceEditSheet open={openEdit} sourceId={editingId} onClose={() => setOpenEdit(false)} />
    </div>
  );
}
