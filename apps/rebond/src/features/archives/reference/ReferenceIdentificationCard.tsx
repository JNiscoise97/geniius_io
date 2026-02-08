// SectionIdentification.tsx
import { toIds } from '@/utils/dictionnaireValue';
import { RefSinglePickerSmart } from '@/components/shared/RefSinglePickerSmart';
import { supabase } from '@/lib/supabase';
import type { Mode } from './types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Field } from '@/components/shared/fields';

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
  mode_registre: 'par_type' | 'chronologique_mixte' | '';
  ordre_numerotation: 'par_type' | 'globale' | '';
  nombre_actes_estime: string; // string pour Input
  numero_acte_min: string; // string pour Input
  numero_acte_max: string; // string pour Input
  statut_juridique: 'esclave' | 'nouveau_libre' | '';
};

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
  const { id, type, form } = props;
  const isEdit = props.mode === 'edit';

  const currentTypeActeIds = toIds(props.form.type_acte_ref);
  const currentTypeActeId = currentTypeActeIds?.[0] ?? null;

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

    const { data, error } = await supabase
      .from('ref_ec_type_acte')
      .select('id,label')
      .in('id', clean);

    const byId = new Map((data ?? []).map((r: any) => [r.id, String(r.label ?? '')]));
    const labels = clean.map((id) => byId.get(id) ?? '');

    if (props.type === 'registre') {
      // si error, labels seront possiblement vides => OK
      props.setField('type_acte_ref', { ids: clean, labels });
      props.setField('type_acte', labels.filter(Boolean).join(' · '));
    }
  };

  return (
    <section className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
      <div className='rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mt-3'>
        <div className='flex items-start gap-3'>
          <AlertTriangle className='h-4 w-4 mt-0.5 text-amber-700' />
          <div className='min-w-0'>
            <div className='text-sm font-semibold text-amber-900'>Chantiers en cours</div>
            <div className='mt-0.5 text-xs text-amber-800'>
              <ol>
                <li>[UX] Modifier le titre du registre à la volée</li>
                
                <li>[MODEL] transformer les champs mode_registre, ordre numérotation et statut juridique en ref</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
      <h3 className='text-sm font-semibold text-slate-900'>Identification</h3>

      <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-12'>
        {/* UUID */}
        <div className='md:col-span-12'>
          <label className='block text-xs font-medium text-slate-700'>
            Identifiant administratif
          </label>
          <div className='flex w-fit gap-2'>
            <Input value={props.id} disabled className='font-mono' />
            {isEdit && (
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
            )}
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
              titleOverride='Types d’actes'
            />
          ) : (
            <RefSinglePickerSmart
              table='ref_ec_type_acte'
              mode={isEdit ? 'edit' : 'view'}
              actionsInvisible={false}
              multi={true}
              value={(toIds(props.form.type_acte_ref) ?? []) as any}
              onChange={async (next) => {
                // narrow ici aussi (callback)
                if (props.type !== 'registre') return;
                await setTypeActeRefs(Array.isArray(next) ? (next as any[]).map(String) : []);
              }}
              titleOverride='Types d’actes'
            />
          )}
        </div>

        {/* === Registre spécifique === */}
        {type === 'registre' ? (
          <>
            {/* ───────────── */}
            <div className='md:col-span-12 mt-2'>
              <h4 className='text-sm font-semibold text-slate-900'>Périmètre temporel</h4>
            </div>

            <div className='md:col-span-2'>
              <Field label='Année' readonly={!isEdit} value={form.annee}>
                <Input
                  value={form.annee}
                  inputMode='numeric'
                  onChange={(e) => props.setField('annee', e.target.value as any)}
                  placeholder='Ex. 1898'
                />
              </Field>
            </div>

            {/* ───────────── */}
            <div className='md:col-span-12 mt-4'>
              <h4 className='text-sm font-semibold text-slate-900'>Organisation du registre</h4>
            </div>

            <div className='md:col-span-3'>
              <Field label='Mode registre' readonly={!isEdit} value={form.mode_registre || '—'}>
                <select
                  className='h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm disabled:bg-slate-50'
                  disabled={!isEdit}
                  value={form.mode_registre}
                  onChange={(e) => props.setField('mode_registre', e.target.value as any)}
                >
                  <option value=''>—</option>
                  <option value='par_type'>par_type</option>
                  <option value='chronologique_mixte'>chronologique_mixte</option>
                </select>
              </Field>
            </div>

            <div className='md:col-span-3'>
              <Field
                label='Ordre de numérotation'
                readonly={!isEdit}
                value={form.ordre_numerotation || '—'}
              >
                <select
                  className='h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm disabled:bg-slate-50'
                  disabled={!isEdit}
                  value={form.ordre_numerotation}
                  onChange={(e) => props.setField('ordre_numerotation', e.target.value as any)}
                >
                  <option value=''>—</option>
                  <option value='par_type'>par_type</option>
                  <option value='globale'>globale</option>
                </select>
              </Field>
            </div>

            {/* ───────────── */}
            <div className='md:col-span-12 mt-4'>
              <h4 className='text-sm font-semibold text-slate-900'>Volumétrie et numérotation</h4>
            </div>

            <div className='md:col-span-3'>
              <Field
                label='Nombre d’actes estimé'
                readonly={!isEdit}
                value={form.nombre_actes_estime}
              >
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

            {/* ───────────── */}
            <div className='md:col-span-12 mt-4'>
              <h4 className='text-sm font-semibold text-slate-900'>Contexte juridique</h4>
            </div>

            <div className='md:col-span-3'>
              <Field
                label='Statut juridique'
                readonly={!isEdit}
                value={form.statut_juridique || '—'}
              >
                <select
                  className='h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm disabled:bg-slate-50'
                  disabled={!isEdit}
                  value={form.statut_juridique}
                  onChange={(e) => props.setField('statut_juridique', e.target.value as any)}
                >
                  <option value=''>—</option>
                  <option value='esclave'>esclave</option>
                  <option value='nouveau_libre'>nouveau_libre</option>
                </select>
              </Field>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
