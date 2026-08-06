// BlocActeurs.tsx

import type { ActeurFields, Entity } from '@/types/analyse';
import { defaultActeurFields } from '../AnalyseFormulaireActeur';
import { useEffect, useRef, useState } from 'react';
import { BlocMentions } from './BlocMentions';
import { useEntityStore } from '@/store/useEntityStore';
import { createFormulaireActeurSubmitHandlers } from '@/hooks/useFormulaireActeurSubmit';
import { FormulaireActeur } from '@/components/actes/FormulaireActeur';
import { supabase } from '@/lib/supabase';
import { FicheActeur } from '@/features/etat-civil/suivi/FicheActeur';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { MessageSquareText } from 'lucide-react';
import { useSelectionStore } from '@/store/useSelectionStore';
import RelationsAccordion from '@/features/rebond/RelationsAccordion';
import { Label } from '@/components/ui/label';
import type { ToponymeNode } from '@/features/toponymes-associer/utils/tree';
import { LieuEditorDialog } from '@/components/shared/LieuEditorDialog';

export function BlocActeurs({
  mode,
  entity,
  acteId,
  categorieId,
  onClose,
  onSubmit,
  onSubmitClick,
  onDeleteClick,
}: {
  mode: 'view' | 'edit' | 'create';
  entity?: Entity;
  acteId: string;
  categorieId: string;
  onClose: () => void;
  onSubmit: () => void;
  onSubmitClick?: (fn: () => void) => void;
  onDeleteClick?: (fn: () => void) => void;
}) {
  const formFieldsRef = useRef<ActeurFields>(defaultActeurFields);
  const modeRef = useRef(mode);
  const [relations, setRelations] = useState<any[]>([]);
  const [loadingRelations, setLoadingRelations] = useState(false);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const { addEntity, updateEntity, deleteEntity, addMentionToEntity } = useEntityStore();
  const stableSubmit = useRef<() => void>(() => { });
  const stableDelete = useRef<() => void>(() => { });
  const [lieuModal, setLieuModal] = useState<{
    title: string;
    onSaveSelection: (nodes: ToponymeNode[]) => Promise<void> | void;
  } | null>(null);

  useEffect(() => {
    if (!entity) return;

    const { submit, remove } = createFormulaireActeurSubmitHandlers({
      getFields: () => formFieldsRef.current,
      getMode: () => modeRef.current,
      entity,
      acteId,
      categorie_id: categorieId,
      onSuccess: onSubmit,
      addEntity,
      updateEntity,
      deleteEntity,
      addMentionToEntity,
    });

    stableSubmit.current = submit;
    stableDelete.current = remove;

    onSubmitClick?.(stableSubmit.current);
    onDeleteClick?.(stableDelete.current);
  }, [entity?.id, acteId, categorieId]);

  const selection = useSelectionStore.getState().selection

  const mentions = [
    ...(entity?.mentions || []),
    ...(selection && entity?.id && (entity.mentions?.length ?? 0) === 0
      ? [{
        id: "__temp__",
        entite_id: entity.id,
        bloc_id: selection.blocId,
        preview: selection.text,
        start: selection.start,
        end: selection.end,
      }]
      : [])
  ]
  const acteurId = entity?.mapping?.acteur?.id;


  useEffect(() => {
    const fetchRelations = async () => {
      if (!acteurId || !acteId || mode !== 'view') return;

      setLoadingRelations(true);

      const { data, error } = await supabase
        .from('v_acteurs_relations')
        .select('*')
        .eq('acte_id', acteId)
        .or(`acteur_source_id.eq.${acteurId},acteur_cible_id.eq.${acteurId}`);

      if (error) {
        console.error('Erreur relations (acteur)', error);
        setRelations([]);
      } else {
        setRelations(data ?? []);
      }

      setLoadingRelations(false);
    };

    fetchRelations();
  }, [acteurId, acteId, mode]);

  if (mode === 'create' || (mode === 'edit' && entity)) {
    return (
      <><div>
        <Label>Input label à ajouter</Label>
      </div>
        <FormulaireActeur
          mode={mode}
          acteId={acteId}
          sourceTable='actes'
          initialValues={entity?.mapping?.acteur ? { ...entity.mapping.acteur, label: entity.label } : {}}
          //role={entity?.mapping?.acteur?.role?.toLowerCase() ?? null}
          onCancel={onClose}
          onSuccess={() => { }}
          hideFooter
          onChange={(updated) => {
            formFieldsRef.current = {
              ...updated,
              label: entity?.label ?? '',
            };
          }}
          onOpenLieuEditor={({ title, onSaveSelection }) => {
            console.log('BlocActeurs - onOpenLieuEditor')
            setLieuModal({ title, onSaveSelection });
          }} />
        <LieuEditorDialog
          open={!!lieuModal}
          title={lieuModal?.title ?? ''}
          onClose={() => setLieuModal(null)}
          onSaveSelection={async (nodes) => {
            if (!lieuModal) return;
            await lieuModal.onSaveSelection(nodes);
          }}
        />
      </>
    );
  }

  /*if (mode === 'create') {
    return (
      <AnalyseFormulaireActeur
        mode='create'
        entity={entity}
        onChange={({ label, mapping }) => {
          formFieldsRef.current = {
            ...mapping.acteur,
            label,
          };
        }}
      />
    );
  }

  


  if (mode === 'edit' && entity) {
    return (
      <AnalyseFormulaireActeur
        mode='edit'
        entity={entity}
        onChange={({ label, mapping }) => {
          formFieldsRef.current = {
            ...mapping.acteur,
            label,
          };
        }}
      />
    );
  }*/

  if (mode === 'view' && entity) {
    return (
      <>
        <div className="p-4 mt-4">
          <FicheActeur
            key={entity?.mapping?.acteur?.id}
            acteur={entity?.mapping?.acteur}
            mode={mode}
          />
        </div>
        <div className="p-4 mt-4">
          <Accordion type='multiple' defaultValue={['relations']}>
            {/* Bloc mentions */}
            <AccordionItem value='mentions'>
              <AccordionTrigger>
                <div className='flex items-center gap-2'>
                  <MessageSquareText className='w-4 h-4' />
                  <h3>Mentions</h3>
                  <span className="text-xs bg-gray-800 text-white rounded-full px-2 py-0.5 min-w-[1.25rem] text-center">
                    {mentions.length}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <BlocMentions
                  entityId={entity.id}
                  mentions={mentions}
                  onScrollToBloc={(blocId) => {
                    const el = document.querySelector(`[data-bloc-id="${blocId}"]`);
                    if (el instanceof HTMLElement) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });

                      // Optionnel : ajout temporaire d'un surlignage
                      el.classList.add('ring-2', 'ring-indigo-400', 'transition');
                      setTimeout(() => el.classList.remove('ring-2', 'ring-indigo-400'), 2000);
                    }
                  }}
                />

              </AccordionContent>
            </AccordionItem>

            {/* Bloc relations */}
            <AccordionItem value='relations'>
              <AccordionTrigger>
                <div className='flex items-center gap-2'>
                  <MessageSquareText className='w-4 h-4' />
                  <h3>Relations</h3>
                  <span className="text-xs bg-gray-800 text-white rounded-full px-2 py-0.5 min-w-[1.25rem] text-center">
                    {relations.length}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <AccordionContent>
                  {loadingRelations ? (
                    <p className="text-sm italic text-muted-foreground">Chargement des relations…</p>
                  ) : (
                    acteurId && acteId && <RelationsAccordion acteurId={acteurId} acteId={acteId} />
                  )}
                </AccordionContent>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </>
    );
  }
  return <p className='text-muted-foreground'>Aucune entité sélectionnée.</p>;
}