// LieuEditorDialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LieuEditorPanel } from '../shared/LieuEditorPanel';
import type { ToponymeNode } from '@/features/toponymes-associer/utils/tree';

export function LieuEditorDialog({
  open,
  title,
  onClose,
  onSaveSelection,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  onSaveSelection: (nodes: ToponymeNode[]) => Promise<void> | void;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="flex flex-col p-0"
        style={{ width: '90vw', height: '90vh', maxWidth: 'none', maxHeight: 'none' }}
      >
        <DialogHeader className="px-6 py-4 border-b shrink-0 sticky top-0 z-10">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <LieuEditorPanel
            title={title}
            onCancel={onClose}
            onSaveSelection={async (nodes) => {
              await onSaveSelection(nodes);
              onClose();
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
