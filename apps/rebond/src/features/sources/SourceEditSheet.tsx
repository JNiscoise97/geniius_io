// SourceEditSheet.tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SourceForm } from './SourceForm';
import { ExemplairesEditor } from './ExemplairesEditor';

export function SourceEditSheet({
  open,
  onClose,
  sourceId,
}: {
  open: boolean;
  onClose: () => void;
  sourceId: string | null;
}) {
  if (!sourceId) {
    // sécurité : la création est gérée par SourceDialog
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        className="
          flex h-full flex-col
          w-[50vw] max-w-[1000px] min-w-[640px]
          p-0
        "
      >
        <SheetHeader className="shrink-0 border-b px-6 py-4">
          <SheetTitle>Modifier la source</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          <SourceForm sourceId={sourceId} onDone={onClose} />
          <ExemplairesEditor uniteDocumentaireId={sourceId} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
