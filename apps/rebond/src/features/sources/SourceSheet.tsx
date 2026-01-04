import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { SourceForm } from './SourceForm';
import { ManifestationsEditor } from './ManifestationsEditor';

export function SourceSheet({
  open,
  onClose,
  sourceId,
}: {
  open: boolean;
  onClose: () => void;
  sourceId: string | null;
}) {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        className="
          flex h-full flex-col
          w-[50vw] max-w-[1000px] min-w-[640px]
          p-0
        "
      >
        {/* Header fixe */}
        <SheetHeader className="shrink-0 border-b px-6 py-4">
          <SheetTitle>
            {sourceId ? 'Modifier la source' : 'Créer une source'}
          </SheetTitle>
        </SheetHeader>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          <SourceForm sourceId={sourceId} onDone={onClose} />

          {sourceId ? (
            <ManifestationsEditor uniteDocumentaireId={sourceId} />
          ) : (
            <div className="border-t pt-4 text-sm text-muted-foreground">
              Crée d’abord la source pour gérer ses manifestations et accès numériques.
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
