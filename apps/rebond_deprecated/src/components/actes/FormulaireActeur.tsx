//FormulaireActeur.tsx

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ChampInput } from '@/features/etat-civil/ChampInput';
import type { ToponymeNode } from '@/features/toponymes-associer/utils/tree';
import { fetchActeursEnrichis } from '@/lib/acteurs';
import { recalculerRelationsPourActe } from '@/lib/detectRelationsPreview';
import { updateIndividuIdentite } from '@/lib/individus';
import { supabase } from '@/lib/supabase';
import {
  loadQualiteForActeur,
  saveQualiteForActeur,
} from '@/services/acteur/acteur-qualite';
import {
  loadCategorieCouleurForActeur,
  saveCategorieCouleurForActeur,
} from '@/services/acteur/acteur-categorie-couleur';
import {
  loadProfessionForActeur,
  saveProfessionForActeur,
} from '@/services/acteur/acteur-profession';
import {
  loadFiliationsForActeur,
  saveFiliationsForActeur,
} from '@/services/acteur/acteur-filiation';
import {
  loadSituationFiscaleForActeur,
  saveSituationFiscaleForActeur,
} from '@/services/acteur/acteur-situation-fiscale';
import {
  loadSituationMatrimonialeForActeur,
  saveSituationMatrimonialeForActeur,
} from '@/services/acteur/acteur-situation-matrimoniale';
import {
  loadStatutJuridiqueForActeur,
  saveStatutJuridiqueForActeur,
} from '@/services/acteur/acteur-statut-juridique';
import {
  loadStatutProprietaireForActeur,
  saveStatutProprietaireForActeur,
} from '@/services/acteur/acteur-statut-proprietaire';
import { acteurFieldGroups, champsParRole } from '@/types/analyse';
import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { LienDraft } from '@/types/liens';
import { loadLiensForActeur, saveAllLiensForActeur } from '@/services/acteur/acteur-liens';
import { loadSignatureForActeur, saveSignatureForActeur } from '@/services/acteur/acteur-signature';
import { loadNotesForActeur, saveAllNotesForActeur } from '@/services/acteur/acteur-notes';

export type FormulaireActeurHandle = {
  save: () => void;
  setValues: (values: any) => void;
};

interface FormulaireActeurProps {
  mode: 'create' | 'edit';
  initialValues: Record<string, any>;
  acteId: string;
  acteDate?: string;
  sourceTable: string;
  onCancel: () => void;
  onSuccess: (nouvelActeur: any) => void;
  onChange?: (updated: Record<string, any>) => void;
  hideFooter?: boolean;
  onValuesChange?: (values: Record<string, any>) => void;
  onOpenLieuEditor?: (args: {
    title: string;
    onSaveSelection: (nodes: ToponymeNode[]) => Promise<void> | void;
    defaultLabelForCreate?: string;
  }) => void;
  onOpenDictionnaireEditor?: (args: {
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
    title: string;
    multi?: boolean;
    defaultSelectedIds?: string[];
    onValidate: (items: { id: string; code: string; label: string }[]) => Promise<void> | void;
  }) => void;
  onOpenLienEditor?: (args: {
    title: string;
    initial?: LienDraft | null;
    filterNature?: 'mariage' | 'autre';
    onSave: (item: LienDraft) => void;
  }) => void;
}

export const FormulaireActeur = forwardRef<FormulaireActeurHandle, FormulaireActeurProps>(
  (
    {
      mode,
      initialValues,
      acteId,
      acteDate,
      sourceTable,
      onCancel,
      onSuccess,
      onChange,
      onValuesChange,
      onOpenLieuEditor,
      onOpenDictionnaireEditor,
      onOpenLienEditor,
    },
    ref,
  ) => {
    const [fields, setFields] = useState<Record<string, any>>({});
    const [values, setValues] = useState(initialValues);

    useEffect(() => {
      if (initialValues) {
        setFields(initialValues);
      }
    }, [initialValues]);

    useEffect(() => {
      const run = async () => {
        if (mode !== 'edit') return;
        const acteurId = (initialValues as any)?.id;
        if (!acteurId) return;

        try {
          const { ids, labels } = await loadFiliationsForActeur(acteurId);
          if (!ids.length && !labels.length) return;

          setFields((prev) => {
            const next = { ...prev, filiation_ref: { ids, labels } };
            setValues(next);
            return next;
          });
        } catch (e) {
          // Optionnel: console.warn('loadFiliationsForActeur error', e);
        }
      };
      run();
    }, [mode, initialValues?.id]);

    useEffect(() => {
      const run = async () => {
        if (mode !== 'edit') return;
        const acteurId = (initialValues as any)?.id;
        if (!acteurId) return;

        try {
          const { ids, labels } = await loadSituationMatrimonialeForActeur(acteurId);
          if (!ids.length && !labels.length) return;

          setFields((prev) => {
            const next = { ...prev, situation_matrimoniale_ref: { ids, labels } };
            setValues(next);
            return next;
          });
        } catch (e) {
          // Optionnel: console.warn('loadSituationMatrimonialeForActeur error', e);
        }
      };
      run();
    }, [mode, initialValues?.id]);

    useEffect(() => {
      const run = async () => {
        if (mode !== 'edit') return;
        const acteurId = (initialValues as any)?.id;
        if (!acteurId) return;

        try {
          const { ids, labels } = await loadSignatureForActeur(acteurId);
          if (!ids.length && !labels.length) return;

          setFields((prev) => {
            const next = { ...prev, signature_ref: { ids, labels } };
            setValues(next);
            return next;
          });
        } catch (e) {
          // Optionnel: console.warn('loadSignatureForActeur error', e);
        }
      };
      run();
    }, [mode, initialValues?.id]);

    useEffect(() => {
      const run = async () => {
        if (mode !== 'edit') return;
        const acteurId = (initialValues as any)?.id;
        if (!acteurId) return;

        try {
          const { ids, labels } = await loadQualiteForActeur(acteurId);
          if (!ids.length && !labels.length) return;

          setFields((prev) => {
            const next = { ...prev, qualite_ref: { ids, labels } };
            setValues(next);
            return next;
          });
        } catch (e) {
          // Optionnel: console.warn('loadQualiteForActeur error', e);
        }
      };
      run();
    }, [mode, initialValues?.id]);

    useEffect(() => {
      const run = async () => {
        if (mode !== 'edit') return;
        const acteurId = (initialValues as any)?.id;
        if (!acteurId) return;

        try {
          const { ids, labels } = await loadProfessionForActeur(acteurId);
          if (!ids.length && !labels.length) return;

          setFields((prev) => {
            const next = { ...prev, profession_ref: { ids, labels } };
            setValues(next);
            return next;
          });
        } catch (e) {
          // Optionnel: console.warn('loadProfessionForActeur error', e);
        }
      };
      run();
    }, [mode, initialValues?.id]);

    useEffect(() => {
      const run = async () => {
        if (mode !== 'edit') return;
        const acteurId = (initialValues as any)?.id;
        if (!acteurId) return;

        try {
          const { ids, labels } = await loadCategorieCouleurForActeur(acteurId);
          if (!ids.length && !labels.length) return;

          setFields((prev) => {
            const next = { ...prev, categorie_couleur_ref: { ids, labels } };
            setValues(next);
            return next;
          });
        } catch (e) {
          // Optionnel: console.warn('loadCategorieCouleurForActeur error', e);
        }
      };
      run();
    }, [mode, initialValues?.id]);

    useEffect(() => {
      const run = async () => {
        if (mode !== 'edit') return;
        const acteurId = (initialValues as any)?.id;
        if (!acteurId) return;

        try {
          const { ids, labels } = await loadSituationFiscaleForActeur(acteurId);
          if (!ids.length && !labels.length) return;

          setFields((prev) => {
            const next = { ...prev, situation_fiscale_ref: { ids, labels } };
            setValues(next);
            return next;
          });
        } catch (e) {
          // Optionnel: console.warn('loadSituationFiscaleForActeur error', e);
        }
      };
      run();
    }, [mode, initialValues?.id]);

    useEffect(() => {
      const run = async () => {
        if (mode !== 'edit') return;
        const acteurId = (initialValues as any)?.id;
        if (!acteurId) return;

        try {
          const { ids, labels } = await loadStatutJuridiqueForActeur(acteurId);
          if (!ids.length && !labels.length) return;

          setFields((prev) => {
            const next = { ...prev, statut_juridique_ref: { ids, labels } };
            setValues(next);
            return next;
          });
        } catch (e) {
          // Optionnel: console.warn('loadStatutJuridiqueForActeur error', e);
        }
      };
      run();
    }, [mode, initialValues?.id]);

    useEffect(() => {
      const run = async () => {
        if (mode !== 'edit') return;
        const acteurId = (initialValues as any)?.id;
        if (!acteurId) return;

        try {
          const { ids, labels } = await loadStatutProprietaireForActeur(acteurId);
          if (!ids.length && !labels.length) return;

          setFields((prev) => {
            const next = { ...prev, statut_proprietaire_ref: { ids, labels } };
            setValues(next);
            return next;
          });
        } catch (e) {
          // Optionnel: console.warn('loadStatutProprietaireForActeur error', e);
        }
      };
      run();
    }, [mode, initialValues?.id]);

    useEffect(() => {
      const run = async () => {
        if (mode !== 'edit') return;
        const acteurId = (initialValues as any)?.id;
        if (!acteurId) return;

        try {
          const { liens_matrimoniaux_ref, liens_non_matrimoniaux_ref } = await loadLiensForActeur(
            acteurId,
            (initialValues as any)?.sexe ?? null,
          );

          setFields((prev) => {
            const next = {
              ...prev,
              liens_matrimoniaux_ref,
              liens_non_matrimoniaux_ref,
            };
            setValues(next);
            return next;
          });
        } catch (e) {}
      };
      run();
    }, [mode, initialValues?.id]);

    useEffect(() => {
      const run = async () => {
        if (mode !== 'edit') return;
        const acteurId = (initialValues as any)?.id;
        if (!acteurId) return;

        try {
          const { notes_ref } = await loadNotesForActeur(
            acteurId
          );

          setFields((prev) => {
            const next = {
              ...prev,
              notes_ref,
            };
            setValues(next);
            return next;
          });
        } catch (e) {}
      };
      run();
    }, [mode, initialValues?.id]);

    useEffect(() => {
      onChange?.({ ...fields });
      onValuesChange?.(values);
    }, [fields]);

    const [pendingMentions, setPendingMentions] = useState<Record<string, MentionPayload>>({});

    const handleFieldChange = (field: string, value: any) => {
      setFields((prev) => {
        // cas "payload mention" venant de ChampInput.onChange
        if (isMentionPayload(value)) {
          const f = value.fonction;

          // 1) MAJ UI (champs pivotés) pour PathTreeView
          const updated = {
            ...prev,
            [`${f}_mention_toponyme_id`]: value.leaf_toponyme_id,
            [`${f}_path_labels`]: value.path_labels ?? [],
            [`${f}_path_toponyme_ids`]: value.selected_toponyme_ids ?? [],
          };

          // 2) Tampon local (remplace la précédente pour la même fonction)
          setPendingMentions((pm) => ({ ...pm, [f]: value }));

          setValues(updated); // pour onValuesChange
          return updated;
        }

        // cas normal
        const updated = { ...prev, [field]: value };
        setValues(updated);
        return updated;
      });
    };

    const handleSave = async () => {
      const acteurDataRaw = { ...fields };
      const acteurData = sanitizeActeurForDb(acteurDataRaw);

      // Récup des liens locaux (tableaux de LienDraft) saisis dans l'UI
      const liensM: any[] = Array.isArray(fields?.liens_matrimoniaux_ref)
        ? fields.liens_matrimoniaux_ref
        : [];
      const liensNM: any[] = Array.isArray(fields?.liens_non_matrimoniaux_ref)
        ? fields.liens_non_matrimoniaux_ref
        : [];
      const notes: any[] = Array.isArray(fields?.notes_ref)
        ? fields.notes_ref
        : [];
      const liensAll = [...liensM, ...liensNM];
      const notesAll = Array.isArray(fields?.notes_ref) ? fields.notes_ref : [];

      try {
        if (mode === 'edit') {
          // 1) UPDATE acteur
          const { error: updateError } = await supabase
            .from('transcription_entites_acteurs')
            .update(acteurData)
            .eq('id', acteurDataRaw.id);
          if (updateError) throw updateError;

          // 2) FLUSH des mentions en attente (lieux)
          for (const f of ['naissance', 'deces', 'domicile', 'residence', 'origine'] as const) {
            const m = pendingMentions[f];
            if (!m) continue;

            const isReset = !m.leaf_toponyme_id && !m.selected_toponyme_ids?.length;
            if (isReset) {
              const { error: delErr } = await supabase
                .from('mentions_toponymes')
                .delete()
                .eq('acteur_id', acteurDataRaw.id)
                .eq('fonction', f);
              if (delErr) throw delErr;
            } else {
              const { error: upErr } = await supabase.from('mentions_toponymes').upsert(
                {
                  acte_id: acteId,
                  source_table: sourceTable,
                  acteur_id: acteurDataRaw.id,
                  fonction: f,
                  toponyme_id: m.leaf_toponyme_id,
                  path_toponyme_ids: m.selected_toponyme_ids,
                  path_labels: m.path_labels,
                  note: m.note ?? null,
                },
                { onConflict: 'acteur_id,fonction' },
              );
              if (upErr) throw upErr;
            }
          }
          setPendingMentions({}); // reset tampon

          // 3) Sauvegardes "référentiels"
          await saveQualiteForActeur(
            acteurDataRaw.id,
            fields?.qualite_ref?.ids,
          );
          await saveFiliationsForActeur(acteurDataRaw.id, fields?.filiation_ref?.ids);
          await saveSituationMatrimonialeForActeur(
            acteurDataRaw.id,
            fields?.situation_matrimoniale_ref?.ids,
          );
          await saveProfessionForActeur(acteurDataRaw.id, fields?.profession_ref?.ids);
          await saveCategorieCouleurForActeur(acteurDataRaw.id, fields?.categorie_couleur_ref?.ids);
          await saveSituationFiscaleForActeur(acteurDataRaw.id, fields?.situation_fiscale_ref?.ids);
          await saveStatutJuridiqueForActeur(acteurDataRaw.id, fields?.statut_juridique_ref?.ids);
          await saveStatutProprietaireForActeur(
            acteurDataRaw.id,
            fields?.statut_proprietaire_ref?.ids,
          );
          await saveSignatureForActeur(
            acteurDataRaw.id,
            fields?.signature_ref?.ids,
          );

          // 4) Liens (delete + insert du snapshot courant)
          await saveAllLiensForActeur(acteurDataRaw.id, liensAll);

          await saveAllNotesForActeur(acteurDataRaw.id, notesAll);

          // 5) Mises à jour dérivées
          await updateIndividuIdentite(acteurDataRaw.id);
          const acteurs = await fetchActeursEnrichis(acteId);
          await recalculerRelationsPourActe(acteId, sourceTable, acteurs);

          onSuccess({ ...acteurDataRaw, ...acteurData });
          return { ...acteurDataRaw, ...acteurData };
        } else {
          // CREATE
          const acteurId = uuidv4();
          const entiteId = uuidv4();

          const { nom, prenom } = acteurData;
          const formatNomComplet = (p: string, n: string) => (p && n ? `${p} ${n}` : p || n);
          const label = nom || prenom ? formatNomComplet(prenom, nom) : null;
          if (!label) {
            alert("Impossible d'ajouter l'acteur : nom ou prénom requis.");
            return;
          }

          // 1) INSERT acteur
          const { error: insertActeurError } = await supabase
            .from('transcription_entites_acteurs')
            .insert({ id: acteurId, ...acteurData });
          if (insertActeurError) throw insertActeurError;

          // 2) Référentiels pour le nouvel acteur
          await saveQualiteForActeur(
            acteurId,
            fields?.qualite_ref?.ids,
          );
          await saveFiliationsForActeur(acteurId, fields?.filiation_ref?.ids);
          await saveSituationMatrimonialeForActeur(
            acteurId,
            fields?.situation_matrimoniale_ref?.ids,
          );
          await saveProfessionForActeur(acteurId, fields?.profession_ref?.ids);
          await saveCategorieCouleurForActeur(acteurId, fields?.categorie_couleur_ref?.ids);
          await saveSituationFiscaleForActeur(acteurId, fields?.situation_fiscale_ref?.ids);
          await saveStatutJuridiqueForActeur(acteurId, fields?.statut_juridique_ref?.ids);
          await saveStatutProprietaireForActeur(acteurId, fields?.statut_proprietaire_ref?.ids);
          await saveSignatureForActeur(
            acteurId,
            fields?.signature?.ids,
          );

          // 3) INSERT entité + mapping
          const { error: insertEntiteError } = await supabase.from('transcription_entites').insert({
            id: entiteId,
            acte_id: acteId,
            label,
            type: 'acteur',
            source_table: sourceTable,
          });
          if (insertEntiteError) throw insertEntiteError;

          const { error: insertMappingError } = await supabase
            .from('transcription_entites_mapping')
            .insert({ entite_id: entiteId, cible_type: sourceTable, cible_id: acteurId });
          if (insertMappingError) throw insertMappingError;

          // 4) FLUSH des mentions tamponnées (lieux)
          for (const f of ['naissance', 'deces', 'domicile', 'residence', 'origine'] as const) {
            const m = pendingMentions[f];
            if (!m) continue;

            const isReset = !m.leaf_toponyme_id && !m.selected_toponyme_ids?.length;
            if (isReset) continue;

            const { error: upErr } = await supabase.from('mentions_toponymes').upsert(
              {
                acte_id: acteId,
                source_table: sourceTable,
                acteur_id: acteurId,
                fonction: f,
                toponyme_id: m.leaf_toponyme_id,
                path_toponyme_ids: m.selected_toponyme_ids,
                path_labels: m.path_labels,
                note: m.note ?? null,
              },
              { onConflict: 'acteur_id,fonction' },
            );
            if (upErr) throw upErr;
          }
          setPendingMentions({});

          // 5) Liens pour le nouvel acteur
          await saveAllLiensForActeur(acteurId, liensAll);

          await saveAllNotesForActeur(acteurId, notesAll);

          // 6) Reload + recalcul
          await updateIndividuIdentite(acteurId);

          const { data: acteurComplet, error: fetchError } = await supabase
            .from('transcription_entites_acteurs')
            .select('*')
            .eq('id', acteurId)
            .single();
          if (fetchError) throw fetchError;

          const acteurs = await fetchActeursEnrichis(acteId);
          await recalculerRelationsPourActe(acteId, sourceTable, acteurs);

          onSuccess(acteurComplet);
          return acteurComplet;
        }
      } catch (err: any) {
        alert(err.message ?? 'Une erreur est survenue');
      }
    };

    useImperativeHandle(ref, () => ({
      save: handleSave,
      setValues: (v: any) => {
        setValues(v);
        setFields(v);
      },
    }));

    const champsToujoursVisibles = ['role', 'nom', 'prenom', 'sexe'];
    const roleActuel = fields.role ?? null;
    console.log('Formulaire.acteur', { ...fields });

    return (
      <div className='flex flex-col h-full'>
        <div className='overflow-y-auto px-6 py-4 flex-1'>
          {acteurFieldGroups.map(({ groupLabel, fields: groupFields }) => {
            const principaux = Object.entries(groupFields).filter(
              ([field]) =>
                champsParRole[roleActuel ?? '']?.includes(field) ||
                champsToujoursVisibles.includes(field),
            );
            if (principaux.length === 0) return null;
            return (
              <div key={groupLabel} className='space-y-2 mt-4'>
                <h3 className='px-3 py-1.5 text-sm font-medium bg-indigo-50 text-indigo-700 rounded-sm'>
                  {groupLabel}
                </h3>
                <div className='p-4 bg-white rounded-md border'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {principaux.map(([field, layout]) => (
                      <ChampInput
                        key={field}
                        field={field}
                        layout={layout}
                        value={fields[field]}
                        acteur={{ ...fields }}
                        acteDate={acteDate}
                        onChange={(val) => handleFieldChange(field, val)}
                        onOpenLieuEditor={onOpenLieuEditor}
                        onOpenDictionnaireEditor={onOpenDictionnaireEditor}
                        onOpenLienEditor={onOpenLienEditor}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          <Accordion type='single' collapsible className='mt-6'>
            <AccordionItem value='secondaires'>
              <AccordionTrigger className='text-left text-gray-600 font-medium'>
                Autres champs facultatifs
              </AccordionTrigger>
              <AccordionContent>
                {acteurFieldGroups.map(({ groupLabel, fields: groupFields }) => {
                  const secondaires = Object.entries(groupFields).filter(
                    ([field]) =>
                      !champsParRole[roleActuel ?? '']?.includes(field) &&
                      !champsToujoursVisibles.includes(field),
                  );
                  if (secondaires.length === 0) return null;
                  return (
                    <div key={groupLabel} className='space-y-2 mb-6'>
                      <h3 className='px-3 py-1.5 text-sm font-medium bg-indigo-50 text-indigo-700 rounded-sm'>
                        {groupLabel}
                      </h3>
                      <div className='p-4 bg-white rounded-md border'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                          {secondaires.map(([field, layout]) => (
                            <ChampInput
                              key={field}
                              field={field}
                              layout={layout}
                              value={fields[field]}
                              acteur={{ ...fields }}
                              acteDate={acteDate}
                              onChange={(val) => handleFieldChange(field, val)}
                              onOpenLieuEditor={onOpenLieuEditor}
                              onOpenDictionnaireEditor={onOpenDictionnaireEditor}
                              onOpenLienEditor={onOpenLienEditor}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    );
  },
);

type MentionPayload = {
  fonction: 'naissance' | 'deces' | 'domicile' | 'residence' | 'origine';
  selected_toponyme_ids: string[];
  leaf_toponyme_id: string | null;
  path_labels: string[];
  note?: string | null;
};

function isMentionPayload(v: any): v is MentionPayload {
  return v && typeof v === 'object' && 'fonction' in v && 'selected_toponyme_ids' in v;
}

function sanitizeActeurForDb(a: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(a)) {
    if (k.endsWith('_path_labels')) continue;
    if (k.endsWith('_path_toponyme_ids')) continue;
    if (k.endsWith('_mention_toponyme_id')) continue;
    if (k.endsWith('_mention_toponyme')) continue;
    if (k.endsWith('_ref')) continue;
    if (k.endsWith('_ids')) continue;
    if (k.endsWith('_labels')) continue;
    if (k.endsWith('_positions')) continue;
    if (k === 'notes') continue;
    if (k === 'signatures') continue;
    if (k === 'liens') continue;
    if (k === 'categories_couleur') continue;
    if (k === 'filiations') continue;
    if (k === 'professions') continue;
    if (k === 'qualites') continue;
    if (k === 'situations_fiscales') continue;
    if (k === 'situations_matrimoniales') continue;
    if (k === 'statuts_juridiques') continue;
    if (k === 'statuts_proprietaires') continue;
    if (k === 'mentions_toponymes') continue;
    if (k === 'individu_id') continue;
    out[k] = v;
  }
  return out;
}
