// SectionIdentification.tsx
import { toIds } from '@/utils/dictionnaireValue';
import { RefSinglePickerSmart } from '@/components/shared/RefSinglePickerSmart';
import { supabase } from '@/lib/supabase';
import type { Mode } from './types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Check, Copy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Field } from '@/components/shared/Fields';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { StatusIcon, type CompletenessResult } from './ReferenceSourcesCard';

type LieuSituation = 'bureau_courant' | 'autre_bureau' | 'transporte';

export type ActeReferenceIdentificationFormState = {
  type_acte: string;
  type_acte_ref: { ids: string[]; labels: string[]; colors?: (string | null)[] } | null;

  numero_acte: string;
  date: string;
  heure: string;

  bureau_id: string | null;
  bureau_enregistrement_label: string;

  lieu_situation: LieuSituation;
  redaction_bureau_id: string | null;
  redaction_bureau_label: string;

  auteur_fonction: string;
  auteur_institutionnel_ref: { ids: string[]; labels: string[] } | null;
};

export type RegistreReferenceIdentificationFormState = {
  // commun
  type_acte: string;
  type_acte_ref: { ids: string[]; labels: string[]; colors?: (string | null)[] } | null;

  // registre spécifique
  bureau_id: string | null;
  bureau_enregistrement_label: string;

  annee: string; // string pour Input
  registre_ordre_numerotation_ref: string | null;
  registre_mode_ref: string | null;
  nombre_actes_estime: string; // string pour Input
  numero_acte_min: string; // string pour Input
  numero_acte_max: string; // string pour Input
  registre_statut_juridique_ref: string | null;
  registre_regime_fiscal_support_ref: string | null;
  registre_support_ref: string | null;
  registre_pagination_ref: string | null;
  registre_langue_ref: string | null;
  registre_fonction_ref: string | null;
  registre_norme_ref: string | null;
};

export function getRegistreShortCompleteness(
  f: RegistreReferenceIdentificationFormState,
): CompletenessResult {
  const missing: string[] = [];

  // ---- TYPE(S) D’ACTE ----
  const typeIds = toIds(f.type_acte_ref) ?? [];
  if (typeIds.length === 0) {
    missing.push('type_acte_ref (au moins un type)');
  }

  // ---- ANNÉE ----
  const year = String(f.annee ?? '').trim();
  if (!year) {
    missing.push('annee');
  }

  // ---- MODE DE CONSTITUTION ----
  if (!f.registre_mode_ref) {
    missing.push('registre_mode_ref');
  }

  // ---- ORDRE DE NUMÉROTATION ----
  if (!f.registre_ordre_numerotation_ref) {
    missing.push('registre_ordre_numerotation_ref');
  }

  // ---- STATUS LOGIC ----
  // (si un jour tu ajoutes un champ type "is_missing" pour registre,
  // tu pourras ici renvoyer status: 'missing')

  return {
    status: missing.length ? 'todo' : 'ok',
    missing,
  };
}

type Props =
  | {
    id: string;
    type: 'acte';
    mode?: Mode;
    form: ActeReferenceIdentificationFormState;
    setField: <K extends keyof ActeReferenceIdentificationFormState>(
      key: K,
      value: ActeReferenceIdentificationFormState[K],
    ) => void;
  }
  | {
    id: string;
    type: 'registre';
    mode?: Mode;
    form: RegistreReferenceIdentificationFormState;
    setField: <K extends keyof RegistreReferenceIdentificationFormState>(
      key: K,
      value: RegistreReferenceIdentificationFormState[K],
    ) => void;
  };

export function SectionIdentification(props: Props) {
  const { type, form } = props;
  const isEdit = props.mode === 'edit';

  const [registreFormVariant, setRegistreFormVariant] = useState<'short' | 'full'>(() =>
    isEdit ? 'short' : 'full',
  );

  // auto-open full (une fois) quand le short est complet
  const autoOpenedFullByIdRef = useRef(new Set<string>());

  useEffect(() => {
    // reset quand on change d'objet
    if (props.type !== 'registre') return;
    setRegistreFormVariant(isEdit ? 'short' : 'full');
    autoOpenedFullByIdRef.current.delete(props.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.type, props.id, isEdit]);

  const currentTypeActeIds = toIds(props.form.type_acte_ref);
  const currentTypeActeId = currentTypeActeIds?.[0] ?? null;

  const normalizeIdSet = (ids: (string | null | undefined)[]) =>
    Array.from(new Set((ids ?? []).map(String).filter(Boolean))).sort();

  const isSameIdSet = (a: string[], b: string[]) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  };

  const [typeActeChanged, setTypeActeChanged] = useState(false);
  const initialTypeActeIdsRef = useRef<string[] | null>(null);



  const shortCompleteness: CompletenessResult | null =
    props.type === 'registre' ? getRegistreShortCompleteness(props.form) : null;


  useEffect(() => {
  if (props.type !== 'registre') return;
  if (!isEdit) return;
  if (autoOpenedFullByIdRef.current.has(props.id)) return;
  if (!shortCompleteness) return;

  if (shortCompleteness.status === 'ok') {
    setRegistreFormVariant('full');
    autoOpenedFullByIdRef.current.add(props.id);
  }
}, [props.type, isEdit, props.id, shortCompleteness]);



  // reset snapshot quand on change d’objet (registreId / props.id)
  useEffect(() => {
    if (props.type !== 'registre') return;
    initialTypeActeIdsRef.current = normalizeIdSet(toIds(props.form.type_acte_ref) ?? []);
    setTypeActeChanged(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.type, props.id]);

  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    toast.success('ID copié dans le presse-papier');
    window.setTimeout(() => setCopied(false), 1200);
  };

  const setTypeActeRef = async (nextId: string | null) => {
    if (!nextId) {
      if (props.type === 'acte') {
        props.setField('type_acte_ref', null);
        props.setField('type_acte', '');
      } else {
        props.setField('type_acte_ref', null);
        props.setField('type_acte', '');
      }
      return;
    }

    const { data } = await supabase
      .from('ref_ec_type_acte')
      .select('id,label')
      .eq('id', nextId)
      .maybeSingle();

    const label = String(data?.label ?? '');

    if (props.type === 'acte') {
      props.setField('type_acte_ref', { ids: [nextId], labels: [label] });
      props.setField('type_acte', label);
    } else {
      // (normalement pas appelé en registre si tu utilises multi)
      props.setField('type_acte_ref', { ids: [nextId], labels: [label] });
      props.setField('type_acte', label);
    }
  };

  const setTypeActeRefs = async (nextIds: string[]) => {
    const clean = Array.from(new Set((nextIds ?? []).map(String).filter(Boolean)));

    if (!clean.length) {
      if (props.type === 'registre') {
        props.setField('type_acte_ref', null);
        props.setField('type_acte', '');
      }
      return;
    }

    const { data } = await supabase
      .from('ref_ec_type_acte').select('id,label').in('id', clean);

    const byId = new Map((data ?? []).map((r: any) => [r.id, String(r.label ?? '')]));
    const labels = clean.map((id) => byId.get(id) ?? '');

    if (props.type === 'registre') {
      // si error, labels seront possiblement vides => OK
      props.setField('type_acte_ref', { ids: clean, labels });
      props.setField('type_acte', labels.filter(Boolean).join(' · '));
    }
  };

  const setRegistreOrdreNumerotationRef = async (nextId: string | null) => {
    if (props.type !== 'registre') return;
    props.setField('registre_ordre_numerotation_ref', nextId);
  };

  const setRegistreRegimeFiscalSupportRef = async (nextId: string | null) => {
    if (props.type !== 'registre') return;
    props.setField('registre_regime_fiscal_support_ref', nextId);
  };

  const setRegistreModeRef = async (nextId: string | null) => {
    if (props.type !== 'registre') return;
    props.setField('registre_mode_ref', nextId);
  };

  const setRegistreStatutJuridiqueRef = async (nextId: string | null) => {
    if (props.type !== 'registre') return;
    props.setField('registre_statut_juridique_ref', nextId);
  };

  const setRegistreSupportRef = async (nextId: string | null) => {
    if (props.type !== 'registre') return;
    props.setField('registre_support_ref', nextId);
  };

  const setRegistrePaginationRef = async (nextId: string | null) => {
    if (props.type !== 'registre') return;
    props.setField('registre_pagination_ref', nextId);
  };

  const setRegistreLangueRef = async (nextId: string | null) => {
    if (props.type !== 'registre') return;
    props.setField('registre_langue_ref', nextId);
  };

  const setRegistreFonctionRef = async (nextId: string | null) => {
    if (props.type !== 'registre') return;
    props.setField('registre_fonction_ref', nextId);
  };

  const setRegistreNormeRef = async (nextId: string | null) => {
    if (props.type !== 'registre') return;
    props.setField('registre_norme_ref', nextId);
  };

  return (
    <section>

      <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-12'>
        {/* UUID */}
        <div className='md:col-span-12'>
          <label className='block text-xs font-medium text-slate-700'>Identifiant administratif</label>
          <div className='flex w-fit gap-2'>
            <Input value={props.id} disabled className='font-mono' />

            <Button
              type='button'
              size='icon'
              variant='secondary'
              onClick={() => copyToClipboard(props.id)}
              title='Copier l’id'
              aria-label='Copier l’id'
            >
              {copied ? <Check className='h-4 w-4' /> : <Copy className='h-4 w-4' />}
            </Button>

          </div>
        </div>

        {/* Type d’acte */}
        <div className='md:col-span-4'>
          <label className='block text-xs font-medium text-slate-700'>Type d’acte</label>

          {props.type === 'acte' ? (
            <RefSinglePickerSmart
              table='ref_ec_type_acte'
              mode={isEdit ? 'edit' : 'view'}
              actionsInvisible={false}
              value={currentTypeActeId}
              onChange={async (next) => setTypeActeRef(next ? String(next) : null)}
              titleOverride='Type d’acte *'
            />
          ) : (
            <RefSinglePickerSmart
              table='ref_ec_type_acte'
              mode={isEdit ? 'edit' : 'view'}
              actionsInvisible={false}
              multi={true}
              value={(toIds(props.form.type_acte_ref) ?? []) as any}
              onChange={async (next) => {
                if (props.type !== 'registre') return;

                const nextIds = Array.isArray(next) ? (next as any[]).map(String).filter(Boolean) : [];
                await setTypeActeRefs(nextIds);

                const a = initialTypeActeIdsRef.current ?? [];
                const b = normalizeIdSet(nextIds);

                const changed = !isSameIdSet(a, b);
                setTypeActeChanged(changed);

                if (changed) {
                  toast.message("Type(s) d’acte modifié(s)", {
                    description:
                      'À l’enregistrement, le label du registre sera recalculé (valeur par défaut).',
                  });
                }
              }}
              titleOverride='Types d’actes *'
            />
          )}
        </div>

        {/* === Registre spécifique === */}
        {type === 'registre' ? (
          <div className='md:col-span-12'>
            {isEdit ? (
              <div className='flex items-center justify-end mb-2'>
                <Tabs value={registreFormVariant} onValueChange={(v) => setRegistreFormVariant(v as any)}>
                  <TabsList>
                    <TabsTrigger value='short' className='text-xs flex items-center gap-2'>
                      {shortCompleteness ? (
                        <div
                          title={
                            shortCompleteness.status !== 'ok'
                              ? shortCompleteness.missing.join('\n')
                              : undefined
                          }
                        >
                          <StatusIcon status={shortCompleteness.status} />
                        </div>
                      ) : null}
                      Formulaire court
                    </TabsTrigger>
                    <TabsTrigger value='full' className='text-xs'>
                      Formulaire complet
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            ) : null}

            <Tabs value={registreFormVariant} onValueChange={(v) => setRegistreFormVariant(v as any)}>
              <TabsContent value='short'>
                {/* ✅ Ton registre “short” ici */}
                <div className='grid grid-cols-1 gap-4 md:grid-cols-12'>
                  {/* Périmètre temporel */}
                  <div className='md:col-span-12 mt-2'>
                    <h4 className='text-sm font-semibold text-slate-900'>Périmètre temporel</h4>
                  </div>

                  <div className='md:col-span-2'>
                    <Field label='Année *' readonly={!isEdit} value={form.annee}>
                      <Input
                        value={form.annee}
                        inputMode='numeric'
                        onChange={(e) => props.setField('annee', e.target.value as any)}
                        placeholder='Ex. 1898'
                      />
                    </Field>
                  </div>

                  <div className='md:col-span-12 mt-4'>
                    <h4 className='text-sm font-semibold text-slate-900'>
                      Logique administrative (minimum)
                    </h4>
                  </div>

                  <div className='md:col-span-4'>
                    <div className='text-xs font-medium text-slate-700'>Mode de constitution *</div>
                    <RefSinglePickerSmart
                      table='ref_registre_mode'
                      mode={isEdit ? 'edit' : 'view'}
                      actionsInvisible={false}
                      value={form.registre_mode_ref}
                      onChange={(next) => setRegistreModeRef(next ? String(next) : null)}
                    />
                  </div>

                  <div className='md:col-span-4'>
                    <div className='text-xs font-medium text-slate-700'>Ordre de numérotation *</div>
                    <RefSinglePickerSmart
                      table='ref_registre_ordre_numerotation'
                      mode={isEdit ? 'edit' : 'view'}
                      actionsInvisible={false}
                      value={form.registre_ordre_numerotation_ref}
                      onChange={(next) => setRegistreOrdreNumerotationRef(next ? String(next) : null)}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value='full'>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-12'>
                  <div className='md:col-span-12 mt-2'>
                    <h4 className='text-sm font-semibold text-slate-900'>Périmètre temporel</h4>
                  </div>

                  <div className='md:col-span-2'>
                    <Field label='Année *' readonly={!isEdit} value={form.annee}>
                      <Input
                        value={form.annee}
                        inputMode='numeric'
                        onChange={(e) => props.setField('annee', e.target.value as any)}
                        placeholder='Ex. 1898'
                      />
                    </Field>
                  </div>

                  <div className='md:col-span-12 mt-4'>
                    <h4 className='text-sm font-semibold text-slate-900'>
                      Logique administrative et juridique du registre
                    </h4>
                  </div>

                  <div className='md:col-span-3'>
                    <div className='text-xs font-medium text-slate-700'>Mode de constitution du registre *</div>
                    <RefSinglePickerSmart
                      table='ref_registre_mode'
                      mode={isEdit ? 'edit' : 'view'}
                      actionsInvisible={false}
                      value={form.registre_mode_ref}
                      onChange={(next) => setRegistreModeRef(next ? String(next) : null)}
                    />
                  </div>

                  <div className='md:col-span-3'>
                    <div className='text-xs font-medium text-slate-700'>
                      Règle d’attribution des numéros d’actes *
                    </div>
                    <RefSinglePickerSmart
                      table='ref_registre_ordre_numerotation'
                      mode={isEdit ? 'edit' : 'view'}
                      actionsInvisible={false}
                      value={form.registre_ordre_numerotation_ref}
                      onChange={(next) => setRegistreOrdreNumerotationRef(next ? String(next) : null)}
                    />
                  </div>

                  <div className='md:col-span-3'>
                    <div className='text-xs font-medium text-slate-700'>
                      Cadre juridique et population concernée
                    </div>
                    <RefSinglePickerSmart
                      table='ref_registre_statut_juridique'
                      mode={isEdit ? 'edit' : 'view'}
                      actionsInvisible={false}
                      value={form.registre_statut_juridique_ref}
                      onChange={(next) => setRegistreStatutJuridiqueRef(next ? String(next) : null)}
                    />
                  </div>

                  <div className='md:col-span-3'>
                    <div className='text-xs font-medium text-slate-700'>
                      Régime fiscal et probatoire du support
                    </div>
                    <RefSinglePickerSmart
                      table='ref_registre_regime_fiscal_support'
                      mode={isEdit ? 'edit' : 'view'}
                      actionsInvisible={false}
                      value={form.registre_regime_fiscal_support_ref}
                      onChange={(next) => setRegistreRegimeFiscalSupportRef(next ? String(next) : null)}
                    />
                  </div>

                  <div className='md:col-span-12 mt-4'>
                    <h4 className='text-sm font-semibold text-slate-900'>Volumétrie et numérotation</h4>
                  </div>

                  <div className='md:col-span-3'>
                    <Field label='Nombre d’actes estimé' readonly={!isEdit} value={form.nombre_actes_estime}>
                      <Input
                        value={form.nombre_actes_estime}
                        inputMode='numeric'
                        onChange={(e) => props.setField('nombre_actes_estime', e.target.value as any)}
                        placeholder='Ex. 120'
                      />
                    </Field>
                  </div>

                  <div className='md:col-span-3'>
                    <Field label='N° acte minimum' readonly={!isEdit} value={form.numero_acte_min}>
                      <Input
                        value={form.numero_acte_min}
                        inputMode='numeric'
                        onChange={(e) => props.setField('numero_acte_min', e.target.value as any)}
                        placeholder='Ex. 1'
                      />
                    </Field>
                  </div>

                  <div className='md:col-span-3'>
                    <Field label='N° acte maximum' readonly={!isEdit} value={form.numero_acte_max}>
                      <Input
                        value={form.numero_acte_max}
                        inputMode='numeric'
                        onChange={(e) => props.setField('numero_acte_max', e.target.value as any)}
                        placeholder='Ex. 240'
                      />
                    </Field>
                  </div>

                  <div className='md:col-span-12 mt-4'>
                    <h4 className='text-sm font-semibold text-slate-900'>Matérialité et tenue du registre</h4>
                  </div>

                  <div className='md:col-span-3'>
                    <div className='text-xs font-medium text-slate-700'>Forme matérielle du registre</div>
                    <RefSinglePickerSmart
                      table='ref_registre_support'
                      mode={isEdit ? 'edit' : 'view'}
                      actionsInvisible={false}
                      value={form.registre_support_ref}
                      onChange={(next) => setRegistreSupportRef(next ? String(next) : null)}
                    />
                  </div>

                  <div className='md:col-span-3'>
                    <div className='text-xs font-medium text-slate-700'>Système de repérage interne</div>
                    <RefSinglePickerSmart
                      table='ref_registre_pagination'
                      mode={isEdit ? 'edit' : 'view'}
                      actionsInvisible={false}
                      value={form.registre_pagination_ref}
                      onChange={(next) => setRegistrePaginationRef(next ? String(next) : null)}
                    />
                  </div>

                  <div className='md:col-span-3'>
                    <div className='text-xs font-medium text-slate-700'>
                      Langue administrative principale du registre
                    </div>
                    <RefSinglePickerSmart
                      table='ref_langues'
                      mode={isEdit ? 'edit' : 'view'}
                      actionsInvisible={false}
                      value={form.registre_langue_ref}
                      onChange={(next) => setRegistreLangueRef(next ? String(next) : null)}
                    />
                  </div>

                  <div className='md:col-span-12 mt-4'>
                    <h4 className='text-sm font-semibold text-slate-900'>
                      Cadre administratif et archivistique
                    </h4>
                  </div>

                  <div className='md:col-span-3'>
                    <div className='text-xs font-medium text-slate-700'>Rôle administratif du registre</div>
                    <RefSinglePickerSmart
                      table='ref_registre_fonction'
                      mode={isEdit ? 'edit' : 'view'}
                      actionsInvisible={false}
                      value={form.registre_fonction_ref}
                      onChange={(next) => setRegistreFonctionRef(next ? String(next) : null)}
                    />
                  </div>

                  <div className='md:col-span-3'>
                    <div className='text-xs font-medium text-slate-700'>Degré de conformité aux normes légales</div>
                    <RefSinglePickerSmart
                      table='ref_registre_norme'
                      mode={isEdit ? 'edit' : 'view'}
                      actionsInvisible={false}
                      value={form.registre_norme_ref}
                      onChange={(next) => setRegistreNormeRef(next ? String(next) : null)}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </div>
    </section>
  );
}