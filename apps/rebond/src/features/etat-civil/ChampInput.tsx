// ChampInput.tsx

import { PathTreeView } from '@/components/shared/PathTreeView';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { supabase } from '@/lib/supabase';
import { booleanChamps, readonlyChamps } from '@/types/analyse';
import { normalizeDateString, isValidDateString, formatDateToFrench } from '@/utils/date';
import { useEffect, useState } from 'react';
import type { ToponymeNode } from '@/features/toponymes-associer/utils/tree';
import { ListeChipsView } from '@/components/shared/ListeChipsView';
import type { DictionnaireKind } from '@/components/shared/DictionnaireEditorPanel';
import type { LienDraft } from '@/types/liens';
import { LiensTableInput } from '@/components/shared/LiensTableInput';
import { X } from 'lucide-react';
import { ListeChipsViewSmart } from '@/components/shared/ListeChipsViewSmart';
import type { NoteDraft } from '@/types/notes';
import { NotesTableInput } from '@/components/shared/NotesTableInput';
import { toIds, toLabels } from '@/utils/dictionnaireValue';

export function ChampInput({
  field,
  layout,
  value,
  acteDate,
  acteur,
  onChange,
  onOpenLieuEditor,
  onOpenDictionnaireEditor,
  onOpenLienEditor,
}: {
  field: string;
  layout: string;
  value: any;
  acteDate?: string;
  acteur?: any;
  onChange: (val: any) => void;
  onOpenLieuEditor?: (args: {
    title: string;
    onSaveSelection: (nodes: ToponymeNode[]) => Promise<void> | void;
    defaultLabelForCreate?: string;
  }) => void;
  onOpenDictionnaireEditor?: (args: {
    kind: DictionnaireKind;
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
}) {
  const isTextarea = layout.includes('textarea');
  const isBoolean = booleanChamps.includes(field);
  const isReadOnly = readonlyChamps.includes(field);
  const isSexe = field === 'sexe';

  const fonctionForField =
    field === 'naissance_mention_toponyme'
      ? 'naissance'
      : field === 'deces_mention_toponyme'
        ? 'deces'
        : field === 'domicile_mention_toponyme'
          ? 'domicile'
          : field === 'residence_mention_toponyme'
            ? 'residence'
            : field === 'origine_mention_toponyme'
              ? 'origine'
              : null;

  const isNaissanceLieu = field === 'naissance_mention_toponyme';
  const isDecesLieu = field === 'deces_mention_toponyme';
  const isDomicile = field === 'domicile_mention_toponyme';
  const isResidence = field === 'residence_mention_toponyme';
  const isOrigine = field === 'origine_mention_toponyme';

  const isStatutListe = field === 'statut_liste';
  const isFiliationRef = field === 'filiation_ref';
  const isSituationMatrimonialeRef = field === 'situation_matrimoniale_ref';

  const isQualiteRef = field === 'qualite_ref';

  const isProfessionRef = field === 'profession_ref';

  const isStatutProprietaireRef = field === 'statut_proprietaire_ref';
  const isCategorieCouleurRef = field === 'categorie_couleur_ref';
  const isStatutJuridiqueRef = field === 'statut_juridique_ref';
  const isSituationFiscaleRef = field === 'situation_fiscale_ref';

  const isSignatureRef = field === 'signature_ref';

  const isLiensMatrimoniaux = field === 'liens_matrimoniaux_ref';
  const isNotesStructurees = field === 'notes_ref';
  const isLiensAutres = field === 'liens_non_matrimoniaux_ref';

  const isRole = field === 'role';
  const isDateField = field === 'naissance_date' || field === 'deces_date';
  const isTimeField = field === 'naissance_heure' || field === 'deces_heure';
  const colSpan = layout.includes('full') ? 'col-span-2' : '';

  const [roles, setRoles] = useState<string[]>([]);

  const labelCls = 'block text-[13px] font-medium text-gray-900 mb-1';
  const readOnlyLabelCls = 'block text-[13px] font-medium text-red-900 mb-1';

  const controlCls =
    'w-full rounded-sm border border-gray-300 bg-white px-3 py-2.5 text-[15px] ' +
    'shadow-sm placeholder:text-gray-500 ' +
    'focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500';

    const readOnlyCls =
    'w-full rounded-sm border border-red-300 bg-gray-100 px-3 py-2.5 text-[15px] ' +
    'shadow-sm placeholder:text-gray-500 ' +
    'focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-500';

  const controlErrorCls = 'border-red-600 focus:ring-red-300 focus:border-red-600 bg-red-50';

  const hintErrorCls = 'text-red-700 text-sm mt-1';

  const subtleBtnCls =
    'h-9 px-3 text-[14px] rounded-sm border border-gray-300 bg-white ' +
    'hover:bg-gray-50 active:scale-[0.99] transition';

  const toggleItemBase =
    'flex-1 py-2.5 text-center text-[14px] font-medium ' +
    'data-[state=on]:bg-gray-900 data-[state=on]:text-white ' +
    'hover:bg-gray-300 transition-colors';

  // Helper: récupère depuis `acteur` (pivot) avec fallback legacy `value.mentions_toponymes`
  function getMentionFromActeurOrValue(
    fct: 'naissance' | 'deces' | 'domicile' | 'residence' | 'origine' | null,
  ) {
    if (!fct) return { path_labels: [], path_toponyme_ids: [], leaf_toponyme_id: null };

    // 1) Source préférée : acteur “pivoté”
    const path_labels = acteur?.[`${fct}_path_labels`] ?? [];
    const path_toponyme_ids = acteur?.[`${fct}_path_toponyme_ids`] ?? [];
    const leaf_toponyme_id = acteur?.[`${fct}_mention_toponyme_id`] ?? null;

    if (path_labels.length || path_toponyme_ids.length || leaf_toponyme_id) {
      return { path_labels, path_toponyme_ids, leaf_toponyme_id };
    }

    // 2) Fallback legacy : tableau des mentions embarqué dans `value`
    const mention = value?.mentions_toponymes?.find?.((m: any) => m.fonction === fct);
    return {
      path_labels: mention?.path_labels ?? [],
      path_toponyme_ids: mention?.path_toponyme_ids ?? [],
      leaf_toponyme_id: mention?.toponyme_id ?? null,
    };
  }

  // --- plus bas, juste avant le rendu des 4 champs lieux ---
  const { path_labels: pathLabels } = getMentionFromActeurOrValue(fonctionForField);

  // Ouverture de l’éditeur : inchangé, on renvoie un payload standardisé
  const openEditor = (title: string) => {
    onOpenLieuEditor?.({
      title,
      onSaveSelection: async (nodes: ToponymeNode[]) => {
        const ids = nodes.map((n) => n.toponyme_id);
        const labels = nodes.map((n) => n.label);
        const leaf = nodes[nodes.length - 1];

        onChange({
          fonction: fonctionForField,
          selected_toponyme_ids: ids,
          leaf_toponyme_id: leaf?.toponyme_id ?? null,
          path_labels: labels,
        });
      },
    });
  };

  // Reset : idem
  const clearValue = () =>
    onChange(
      fonctionForField
        ? {
            fonction: fonctionForField,
            selected_toponyme_ids: [],
            leaf_toponyme_id: null,
            path_labels: [],
          }
        : null,
    );

  const currentProfessionLabels = toLabels(value, { field: 'profession_ref', sexe: acteur?.sexe });
  const currentProfessionIds = toIds(value);
  const currentStatutLabels = toLabels(value);
  const currentStatutIds = toIds(value);
  const currentFiliationLabels = toLabels(value);
  const currentFiliationIds = toIds(value);
  const currentQualiteLabels = toLabels(value, {
    field: 'qualite_ref',
    sexe: acteur?.sexe,
  });
  const currentQualiteIds = toIds(value);
  const currentSituationMatrimonialeLabels = toLabels(value, {
    field: 'situation_matrimoniale_ref',
    sexe: acteur?.sexe,
  });
  const currentSituationMatrimonialeIds = toIds(value);
  const currentStatutProprietaireLabels = toLabels(value, {
    field: 'statut_proprietaire_ref',
    sexe: acteur?.sexe,
  });
  const currentStatutProprietaireIds = toIds(value);
  const currentCategorieCouleurLabels = toLabels(value, {
    field: 'categorie_couleur_ref',
    sexe: acteur?.sexe,
  });
  const currentCategorieCouleurIds = toIds(value);
  const currentStatutJuridiqueLabels = toLabels(value, {
    field: 'statut_juridique_ref',
    sexe: acteur?.sexe,
  });
  const currentStatutJuridiqueIds = toIds(value);
  const currentSituationFiscaleLabels = toLabels(value, {
    field: 'situation_fiscale_ref',
    sexe: acteur?.sexe,
  });
  const currentSituationFiscaleIds = toIds(value);

  const currentSignatureLabels = toLabels(value, {
    field: 'signature_ref',
    sexe: acteur?.sexe,
  });
  const currentSignatureIds = toIds(value);

  const openDictionnaire = (
    kind: DictionnaireKind,
    title: string,
    multi = true,
    defaultIds: string[] = [],
    afterValidate?: (
      items: {
        id: string;
        code: string;
        label: string;
        label_m?: string;
        label_f?: string;
        invariable?: boolean;
      }[],
    ) => void,
  ) => {
    onOpenDictionnaireEditor?.({
      kind,
      title,
      multi,
      defaultSelectedIds: defaultIds,
      onValidate: async (items) => {
        const ids = items.map((i) => i.id);

        // Par défaut
        let labels = items.map((i) => i.label);

        // Profession : choisir la bonne forme selon le sexe
        if (
          kind === 'situation_matrimoniale_ref' ||
          kind === 'profession_ref' ||
          kind === 'statut_proprietaire_ref' ||
          kind === 'categorie_couleur_ref' ||
          kind === 'statut_juridique_ref' ||
          kind === 'situation_fiscale_ref'
        ) {
          console.log('test.acteur', acteur);
          console.log('test.items', items);
          const sex = acteur?.sexe ?? null;
          labels = items.map((i: any) =>
            i?.invariable
              ? (i.label ?? i.label_m ?? i.label_f)
              : sex === 'F'
                ? (i.label_f ?? i.label ?? i.label_m)
                : sex === 'M'
                  ? (i.label_m ?? i.label ?? i.label_f)
                  : (i.label ?? i.label_m ?? i.label_f),
          );
        }

        onChange({ ids, labels });
        afterValidate?.(items);
      },
    });
  };

  const clearDictValue = () => onChange(null);

  useEffect(() => {
    if (isRole) {
      supabase.rpc('get_distinct_roles').then(({ data, error }) => {
        if (!error && data) setRoles(data.map((d: any) => d.role));
      });
    }
  }, [isRole]);

  if (isDateField) {
    const [inputValue, setInputValue] = useState(() =>
      typeof value === 'string' && isValidDateString(value)
        ? formatDateToFrench(value)
        : (value ?? ''),
    );
    const [error, setError] = useState(false);

    useEffect(() => {
      if (typeof value === 'string' && isValidDateString(value)) {
        setInputValue(formatDateToFrench(value));
        setError(false);
      }
    }, [value]);

    return (
      <div className={colSpan}>
        <Label htmlFor={field} className={labelCls}>
          {field.replace(/_/g, ' ')}
        </Label>
        <Input
          id={field}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
          }}
          onBlur={() => {
            const normalized = normalizeDateString(inputValue);
            if (normalized && isValidDateString(normalized)) {
              onChange(normalized); // Valeur propre ISO à remonter
              setInputValue(formatDateToFrench(normalized));
              setError(false);
            } else if (!inputValue.trim()) {
              setError(false);
              onChange(null);
            } else {
              setError(true);
            }
          }}
          placeholder='Ex: 10 décembre 1818 ou 29/06/1846'
          className={`${controlCls} ${error ? controlErrorCls : ''}`}
        />

        <div className='mt-2 flex flex-wrap gap-2'>
          <Button
            type='button'
            variant='outline'
            className={subtleBtnCls}
            onClick={() => {
              if (!acteDate) return;
              const d = new Date(acteDate);
              const iso = d.toISOString().slice(0, 10);
              onChange(iso);
              setInputValue(formatDateToFrench(iso));
            }}
          >
            Utiliser la date de l’acte
          </Button>

          <Button
            type='button'
            variant='outline'
            className={subtleBtnCls}
            onClick={() => {
              if (!acteDate) return;
              const d = new Date(acteDate);
              d.setDate(d.getDate() - 1);
              const iso = d.toISOString().slice(0, 10);
              onChange(iso);
              setInputValue(formatDateToFrench(iso));
            }}
          >
            Utiliser la veille
          </Button>
        </div>

        {error && (
          <p className={hintErrorCls}>
            Format incorrect. Essayez "29/06/1846" ou "10 décembre 1818".
          </p>
        )}
      </div>
    );
  } else if (isSexe) {
    return (
      <div className={colSpan}>
        <Label className={labelCls}>Sexe</Label>
        <ToggleGroup
          type='single'
          value={value ?? 'inconnu'}
          onValueChange={(val) => onChange(val === 'null' ? null : val)}
          className='flex w-full overflow-hidden rounded-lg bg-neutral-200'
        >
          <ToggleGroupItem value='M' className={`${toggleItemBase} w-full`}>
            Masculin
          </ToggleGroupItem>
          <ToggleGroupItem value='F' className={`${toggleItemBase} w-full`}>
            Féminin
          </ToggleGroupItem>
          <ToggleGroupItem value='null' className={`${toggleItemBase} w-full`}>
            Inconnu
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    );
  } else if (isNaissanceLieu) {
    return (
      <div className={colSpan}>
        <Label className={labelCls}>Lieu de naissance</Label>
        <PathTreeView
          path_labels={pathLabels}
          dense={true}
          onEdit={() => openEditor('Modifier le lieu de naissance')}
          onDelete={clearValue}
        />
      </div>
    );
  } else if (isDecesLieu) {
    return (
      <div className={colSpan}>
        <Label className={labelCls}>Lieu de décès</Label>
        <PathTreeView
          path_labels={pathLabels}
          dense={true}
          onEdit={() => openEditor('Modifier le lieu de décès')}
          onDelete={clearValue}
        />
      </div>
    );
  } else if (isDomicile) {
    return (
      <div className={colSpan}>
        <Label className={labelCls}>Domicile</Label>
        <PathTreeView
          path_labels={pathLabels}
          dense={true}
          onEdit={() => openEditor('Modifier le domicile')}
          onDelete={clearValue}
        />
      </div>
    );
  } else if (isResidence) {
    return (
      <div className={colSpan}>
        <Label className={labelCls}>Résidence</Label>
        <PathTreeView
          path_labels={pathLabels}
          dense={true}
          onEdit={() => openEditor('Modifier la résidence')}
          onDelete={clearValue}
        />
      </div>
    );
  } else if (isOrigine) {
    return (
      <div className={colSpan}>
        <Label className={labelCls}>Origine</Label>
        <PathTreeView
          path_labels={pathLabels}
          dense={true}
          onEdit={() => openEditor('Modifier l’origine')}
          onDelete={clearValue}
        />
      </div>
    );
  } else if (isStatutListe) {
    return (
      <div className={colSpan}>
        <Label className={labelCls}>Statut(s)</Label>
        <ListeChipsView
          titre='Statut(s)'
          values={currentStatutLabels}
          onEdit={() =>
            openDictionnaire(
              'statut',
              'Modifier les statuts',
              true, // passe à false si tu veux une sélection simple
              currentStatutIds,
            )
          }
          onDelete={clearDictValue}
        />
      </div>
    );
  } else if (isQualiteRef) {
    return (
      <div className={colSpan}>
        <Label className={labelCls}>Qualité</Label>
        <ListeChipsViewSmart
          titre='Qualité'
          values={currentQualiteLabels}
          dense={true}
          onEdit={() =>
            openDictionnaire(
              'qualite_ref',
              'Modifier la qualite',
              false, // passe à false si tu veux une sélection simple
              currentQualiteIds,
            )
          }
          onDelete={clearDictValue}
        />
      </div>
    );
  } else if (isFiliationRef) {
    return (
      <div className={colSpan}>
        <Label className={labelCls}>Filiation</Label>
        <ListeChipsViewSmart
          titre='Filiation'
          values={currentFiliationLabels}
          dense={true}
          onEdit={() =>
            openDictionnaire(
              'filiation',
              'Modifier la filiation',
              false, // passe à false si tu veux une sélection simple
              currentFiliationIds,
            )
          }
          onDelete={clearDictValue}
        />
      </div>
    );
  } else if (isProfessionRef) {
    return (
      <div className={colSpan}>
        <Label className={labelCls}>Profession</Label>
        <ListeChipsViewSmart
          titre='Profession'
          values={currentProfessionLabels}
          dense={true}
          onEdit={() =>
            openDictionnaire(
              'profession_ref',
              'Modifier la profession',
              true, // passe à false si tu veux une sélection simple
              currentProfessionIds,
            )
          }
          onDelete={clearDictValue}
        />
      </div>
    );
  } else if (isSituationMatrimonialeRef) {
    return (
      <div className={colSpan}>
        <Label className={labelCls}>Situation matrimoniale</Label>
        <ListeChipsViewSmart
          titre='Situation matrimoniale'
          values={currentSituationMatrimonialeLabels}
          dense={true}
          onEdit={() =>
            openDictionnaire(
              'situation_matrimoniale_ref',
              'Modifier la situation matrimoniale',
              true, // passe à false si tu veux une sélection simple
              currentSituationMatrimonialeIds,
            )
          }
          onDelete={clearDictValue}
        />
      </div>
    );
  } else if (isSignatureRef) {
    return (
      <div className={colSpan}>
        <Label className={labelCls}>Signature</Label>
        <ListeChipsViewSmart
          titre='Signature'
          values={currentSignatureLabels}
          dense={true}
          onEdit={() =>
            openDictionnaire(
              'signature_ref',
              'Modifier la signature',
              false, // passe à false si tu veux une sélection simple
              currentSignatureIds,
            )
          }
          onDelete={clearDictValue}
        />
      </div>
    );
  } else if (isStatutProprietaireRef) {
    return (
      <div className={colSpan}>
        <Label className={labelCls}>Statut propriétaire</Label>
        <ListeChipsViewSmart
          titre='Statut propriétaire'
          values={currentStatutProprietaireLabels}
          dense={true}
          onEdit={() =>
            openDictionnaire(
              'statut_proprietaire_ref',
              'Modifier le statut propriétaire',
              true, // passe à false si tu veux une sélection simple
              currentStatutProprietaireIds,
            )
          }
          onDelete={clearDictValue}
        />
      </div>
    );
  } else if (isCategorieCouleurRef) {
    return (
      <div className={colSpan}>
        <Label className={labelCls}>Couleur de catégorie</Label>
        <ListeChipsViewSmart
          titre='Catégorie de couleur'
          values={currentCategorieCouleurLabels}
          dense={true}
          onEdit={() =>
            openDictionnaire(
              'categorie_couleur_ref',
              'Modifier la catégorie de couleur',
              true, // passe à false si tu veux une sélection simple
              currentCategorieCouleurIds,
            )
          }
          onDelete={clearDictValue}
        />
      </div>
    );
  } else if (isStatutJuridiqueRef) {
    return (
      <div className={colSpan}>
        <Label className={labelCls}>Statut juridique</Label>
        <ListeChipsViewSmart
          titre='Statut juridique'
          values={currentStatutJuridiqueLabels}
          dense={true}
          onEdit={() =>
            openDictionnaire(
              'statut_juridique_ref',
              'Modifier le statut juridique',
              true, // passe à false si tu veux une sélection simple
              currentStatutJuridiqueIds,
            )
          }
          onDelete={clearDictValue}
        />
      </div>
    );
  } else if (isSituationFiscaleRef) {
    return (
      <div className={colSpan}>
        <Label className={labelCls}>Situation fiscale</Label>
        <ListeChipsViewSmart
          titre='Situation fiscale'
          values={currentSituationFiscaleLabels}
          dense={true}
          onEdit={() =>
            openDictionnaire(
              'situation_fiscale_ref',
              'Modifier la situation fiscale',
              true, // passe à false si tu veux une sélection simple
              currentSituationFiscaleIds,
            )
          }
          onDelete={clearDictValue}
        />
      </div>
    );
  } else if (isLiensMatrimoniaux || isLiensAutres) {
    const liens: LienDraft[] | null = value ?? null;
    return (
      <div className={colSpan}>
        <Label className={labelCls}>
          {isLiensMatrimoniaux ? 'Liens matrimoniaux' : 'Autres liens'}
        </Label>
        <LiensTableInput
          title={isLiensMatrimoniaux ? 'Liens matrimoniaux' : 'Autres liens'}
          value={liens}
          acteurId={acteur?.id ?? null}
          filterNature={isLiensMatrimoniaux ? 'mariage' : 'autre'}
          onChange={(next) => onChange(next)}
          onOpenLienEditor={({ title, initial, filterNature, onSave }) => {
            onOpenLienEditor?.({ title, initial: initial ?? null, filterNature, onSave });
          }}
        />
      </div>
    );
  } else if (isNotesStructurees) {
    const notes: NoteDraft[] | null = value ?? null;
    return (
      <div className={colSpan}>
        <Label className={labelCls}>
          Notes structurées
        </Label>
        <NotesTableInput
          title={'Notes structurées'}
          value={notes}
          acteurId={acteur?.id ?? null}
          onChange={(next) => onChange(next)}
        />
      </div>
    );
  } else if (isBoolean) {
    const toggleValue = value === true ? 'true' : value === false ? 'false' : 'null';
    return (
      <div className={colSpan}>
        <Label className={labelCls}>{field.replace(/_/g, ' ')}</Label>
        <ToggleGroup
          type='single'
          value={toggleValue}
          onValueChange={(val) => {
            const parsed = val === 'true' ? true : val === 'false' ? false : null;
            onChange(parsed);
          }}
          className='flex w-full overflow-hidden rounded-lg bg-neutral-200'
        >
          <ToggleGroupItem value='true' variant='outline' className={`${toggleItemBase} w-full`}>
            Oui
          </ToggleGroupItem>
          <ToggleGroupItem value='false' variant='outline' className={`${toggleItemBase} w-full`}>
            Non
          </ToggleGroupItem>
          <ToggleGroupItem value='null' variant='outline' className={`${toggleItemBase} w-full`}>
            N/R
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    );
  } else if (isRole) {
    const tousRoles = ['défunt', 'sujet', 'enfant', ...roles];
    const valeurConnue = tousRoles.includes(value);
    const selectValue = valeurConnue ? value : value ? 'autre' : '';

    return (
      <div className={colSpan}>
        <Label htmlFor={field} className={labelCls}>
          Rôle
        </Label>

        <div className='relative'>
          <select
            id={field}
            value={selectValue}
            onChange={(e) => {
              const val = e.target.value;
              onChange(val); // Ne jamais vider ici — juste transmettre "autre"
            }}
            className={`${controlCls} pr-10`}
          >
            <option value=''>-- Choisir un rôle --</option>

            <optgroup label='Rôle principal'>
              {['défunt', 'sujet', 'enfant'].map((r) =>
                roles.includes(r) ? (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ) : null,
              )}
            </optgroup>

            <optgroup label='Autres rôles connus'>
              {[...roles]
                .filter((r) => !['défunt', 'sujet', 'enfant'].includes(r))
                .sort()
                .map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
            </optgroup>

            <optgroup label='Autre rôle'>
              <option value='autre'>autre</option>
            </optgroup>
          </select>
        </div>

        {selectValue === 'autre' && (
          <div className='mt-2'>
            <Label htmlFor='autre-role' className={labelCls}>
              Préciser le rôle
            </Label>
            <Input
              id='autre-role'
              value={value ?? ''}
              placeholder="Ex. : parrain, témoin d'acte, propriétaire..."
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
        )}
      </div>
    );
  }

  if (isTimeField) {
    const [inputValue, setInputValue] = useState(value ?? '');
    const [error, setError] = useState(false);

    useEffect(() => {
      setInputValue(value ?? '');
    }, [value]);

    return (
      <div className={colSpan}>
        <Label htmlFor={field} className={labelCls}>
          {field.replace(/_/g, ' ')}
        </Label>
        <div className='relative'>
          <Input
            id={field}
            type='time'
            step='60'
            value={inputValue}
            onChange={(e) => {
              const val = e.target.value;
              setInputValue(val);
              if (/^([01]\d|2[0-3]):[0-5]\d$/.test(val)) {
                setError(false);
                onChange(val);
              } else {
                setError(true);
              }
            }}
            onBlur={() => {
              if (!inputValue.trim()) {
                setError(false);
                onChange(null);
              } else if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(inputValue)) {
                setError(true);
              }
            }}
            className={`${controlCls} ${error ? controlErrorCls : ''}`}
          />
          {value !== null && value !== '' && (
            <button
              type='button'
              onClick={() => onChange(null)}
              className='absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
            >
              <X className='w-4 h-4' />
            </button>
          )}
          {error && (
            <p className={hintErrorCls} id={`${field}-error`}>
              Format invalide. Veuillez saisir une heure au format HH:MM.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={colSpan}>
        <Label htmlFor={field} className={isReadOnly ? readOnlyLabelCls : labelCls}>
          {field.replace(/_/g, ' ')}{isReadOnly ?  ' (à supprimer)' : ''}
        </Label>
        {isTextarea ? (
          <Textarea
            id={field}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={`${isReadOnly ? readOnlyCls : controlCls} min-h-[120px] leading-6`}
            readOnly={isReadOnly}
          />
        ) : (
          <div className='relative'>
            <Input
              id={field}
              value={value ?? ''}
              onChange={(e) => onChange(e.target.value)}
              className={isReadOnly ? readOnlyCls : controlCls}
              readOnly={isReadOnly}
            />
            {!isReadOnly && value !== null && value !== '' && (
              <button
                type='button'
                onClick={() => onChange(null)}
                className='absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
              >
                <X className='w-4 h-4' />
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}