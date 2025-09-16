// DialogActeur.tsx

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { FormulaireActeur, type FormulaireActeurHandle } from '@/components/actes/FormulaireActeur';
import { emptyActeur } from '@/types/analyse';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';
import { SuggestionActeur } from './SuggestionActeur';
import { startFusionLogic } from '@/lib/fusionActeurs';
import { toast } from 'sonner';
import type { ToponymeNode } from '@/features/toponymes-associer/utils/tree';
import { LieuEditorPanel } from '../shared/LieuEditorPanel';
import { DictionnaireEditorPanel } from '../shared/DictionnaireEditorPanel';
import type { LienDraft } from '@/types/liens';
import { LienEditorPanel } from '../shared/LienEditorPanel';

type RightMode =
  | { type: 'suggestions' }
  | {
      type: 'lieu';
      title: string;
      onSaveSelection: (nodes: ToponymeNode[]) => Promise<void> | void;
    }
  | {
      type: 'dictionnaire';
      title: string;
      kind:
        | 'statut'
        | 'filiation'
        | 'qualite_ref'
        | 'situation_matrimoniale_ref'
        | 'profession_ref'
        | 'statut_proprietaire_ref'
        | 'categorie_couleur_ref'
        | 'statut_juridique_ref'
        | 'situation_fiscale_ref'
        | 'signature_ref';
      multi?: boolean;
      defaultSelectedIds?: string[];
      onValidate: (items: { id: string; code: string; label: string }[]) => Promise<void> | void;
    }
  | {
      type: 'lien';
      title: string;
      initial: LienDraft | null;
      filterNature?: 'mariage' | 'autre';
      onSave: (item: LienDraft) => void;
    };

export function DialogActeur({
  open,
  onClose,
  mode,
  acteur,
  acteId,
  acteDate,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  acteur: any;
  acteId: string;
  acteDate: string;
  onSave: (a: any) => void;
}) {
  const formRef = useRef<FormulaireActeurHandle | null>(null);
  const [acteurCourant, setActeurCourant] = useState(acteur ?? emptyActeur);
  const [fusionnerChecked, setFusionnerChecked] = useState(false);
  const [selectedActeurs, setSelectedActeurs] = useState<string[]>([]);
  const [selectedIndividus, setSelectedIndividus] = useState<string[]>([]);
  const [rightMode, setRightMode] = useState<RightMode>({ type: 'suggestions' });

  const isSuggestionPanelOpen = rightMode.type !== 'suggestions';

  useEffect(() => {
    if (open) {
      setSelectedActeurs([]);
      setSelectedIndividus([]);
      setFusionnerChecked(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className='flex flex-col p-0 rounded-md bg-gray-50'
        style={{ width: '90vw', height: '95vh', maxWidth: 'none', maxHeight: 'none' }}
      >
        {/* Header fixé */}
        <DialogHeader className='px-6 py-4 border-b shrink-0 sticky top-0 z-10 bg-white'>
          <DialogTitle>{mode === 'edit' ? 'Modifier l’acteur' : 'Créer un acteur'}</DialogTitle>
        </DialogHeader>

        {/* Contenu scrollable divisé en deux colonnes */}
        <div className='flex-1 flex overflow-hidden'>
          {/* FormulaireActeur : colonne gauche */}
          <div className='w-2/3 overflow-y-auto p-4 border-r bg-white'>
            <FormulaireActeur
              ref={formRef}
              mode={mode}
              initialValues={acteur ?? emptyActeur}
              acteId={acteId}
              acteDate={acteDate}
              sourceTable='etat_civil_actes'
              onCancel={onClose}
              onSuccess={onSave}
              hideFooter={true}
              onValuesChange={setActeurCourant}
              onOpenLieuEditor={({ title, onSaveSelection }) => {
                setRightMode({ type: 'lieu', title, onSaveSelection });
              }}
              onOpenDictionnaireEditor={({
                kind,
                title,
                multi,
                defaultSelectedIds,
                onValidate,
              }) => {
                setRightMode({
                  type: 'dictionnaire',
                  title,
                  kind,
                  multi,
                  defaultSelectedIds,
                  onValidate,
                });
              }}
              onOpenLienEditor={({ title, initial, filterNature, onSave }) => {
                setRightMode({
                  type: 'lien',
                  title,
                  initial: initial ?? null,
                  filterNature,
                  onSave,
                });
              }}
            />
          </div>

          {/* Colonne droite : Suggestions OU Éditeur de lieux */}
          <div className='w-1/3 overflow-y-auto p-4 bg-white'>
            {rightMode.type === 'suggestions' && (
              <SuggestionActeur
                acteur={acteurCourant}
                acteId={acteId}
                acteDate={acteDate}
                formRef={formRef}
                onFusionnerChange={(val, suggestion) => {
                  setFusionnerChecked(val);
                  if (val && suggestion) {
                    if (suggestion.id) {
                      setSelectedActeurs((prev) => [...new Set([...prev, suggestion.id])]);
                    }
                    if (suggestion.individu_id) {
                      setSelectedIndividus((prev) => [
                        ...new Set([...prev, suggestion.individu_id]),
                      ]);
                    }
                  }
                }}
              />
            )}
            {rightMode.type === 'lieu' && (
              <LieuEditorPanel
                title={rightMode.title}
                onCancel={() => setRightMode({ type: 'suggestions' })}
                onSaveSelection={async (nodes) => {
                  await rightMode.onSaveSelection(nodes);
                  setRightMode({ type: 'suggestions' }); // Retour aux suggestions après sauvegarde
                }}
              />
            )}
            {rightMode.type === 'dictionnaire' && (
              <DictionnaireEditorPanel
                title={rightMode.title}
                kind={rightMode.kind}
                multi={rightMode.multi}
                defaultSelectedIds={rightMode.defaultSelectedIds}
                onCancel={() => setRightMode({ type: 'suggestions' })}
                onValidate={async (items) => {
                  await rightMode.onValidate(items);
                  setRightMode({ type: 'suggestions' });
                }}
              />
            )}
            {rightMode.type === 'lien' && (
              <LienEditorPanel
                title={rightMode.title}
                initial={rightMode.initial}
                filterNature={rightMode.filterNature}
                acteurSexe={acteurCourant?.sexe ?? null}
                excludeActeurId={acteurCourant?.id ?? null}
                onCancel={() => setRightMode({ type: 'suggestions' })}
                onSave={(item) => {
                  rightMode.onSave(item);
                  setRightMode({ type: 'suggestions' });
                }}
              />
            )}
          </div>
        </div>

        {/* Footer fixé */}
        <DialogFooter className='px-6 py-4 border-t shrink-0 flex justify-end gap-2 bg-gray-100'>
          <Button
            variant='outline'
            onClick={onClose}
            className='border bg-white hover:bg-gray-50 rounded-sm'
          >
            Annuler
          </Button>
          <Button
            disabled={isSuggestionPanelOpen}
            className='bg-indigo-700 hover:bg-indigo-800 text-white rounded-sm'
            onClick={async () => {
              if (fusionnerChecked) {
                const nouvelActeur: any = await formRef.current?.save();
                if (!nouvelActeur?.id) return;

                const updatedSelectedActeurs = [...new Set([...selectedActeurs, nouvelActeur.id])];
                setSelectedActeurs(updatedSelectedActeurs);

                if (!(selectedIndividus.length === 1 && updatedSelectedActeurs.length === 2)) {
                  toast.error('Une erreur est survenue pendant la fusion');
                  return;
                }

                try {
                  await startFusionLogic(updatedSelectedActeurs, selectedIndividus);
                  toast.success('Fusion effectuée avec succès 🎉');
                  onClose();
                } catch (error) {
                  console.error('[FusionActeursModal] Erreur de fusion :', error);
                  toast.error('Une erreur est survenue pendant la fusion');
                }
              } else {
                formRef.current?.save();
              }
            }}
          >
            {mode === 'edit' ? 'Mettre à jour' : 'Créer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
