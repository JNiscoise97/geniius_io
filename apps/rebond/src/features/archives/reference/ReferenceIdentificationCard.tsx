// SectionIdentification.tsx
import { ListeChipsViewSmart } from '@/components/shared/ListeChipsViewSmart';
import { toIds, toLabels } from '@/utils/dictionnaireValue';
import type { DictionnaireKind } from '@/components/shared/DictionnaireEditorPanel';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';


type LieuSituation = 'bureau_courant' | 'autre_bureau' | 'transporte';

export type ActeReferenceIdentificationFormState = {
  type_acte: string;
  type_acte_ref: { ids: string[]; labels: string[]; colors?: (string | null)[] } | null;


  numero_acte: string;
  date: string; // ISO yyyy-mm-dd ou ''
  heure: string;

  bureau_id: string | null;
  bureau_enregistrement_label: string;

  lieu_situation: LieuSituation;
  redaction_bureau_id: string | null;
  redaction_bureau_label: string;
  lieu_transport_raison: string;

  // legacy (à supprimer plus tard)
  comparution_observations: string;

  auteur_fonction: string;
  auteur_institutionnel_ref: { ids: string[]; labels: string[] } | null;
};

export type RegistreReferenceIdentificationFormState = {
  type_acte: string;
  type_acte_ref: { ids: string[]; labels: string[]; colors?: (string | null)[] } | null;

  bureau_id: string | null;
  bureau_enregistrement_label: string;
};

type Props =
  | {
    id: string;
    mode: 'acte';
    form: ActeReferenceIdentificationFormState;
    setField: <K extends keyof ActeReferenceIdentificationFormState>(
      key: K,
      value: ActeReferenceIdentificationFormState[K],
    ) => void;

    onEditBureauEnregistrement: () => void;
    onClearBureauEnregistrement: () => void;

    onEditTypeActe: (args: {
      kind: DictionnaireKind;
      title: string;
      multi: boolean;
      defaultSelectedIds: string[];
    }) => void;
    onClearTypeActe: () => void;
  }
  | {
    id: string;
    mode: 'registre';
    form: RegistreReferenceIdentificationFormState;
    setField: <K extends keyof RegistreReferenceIdentificationFormState>(
      key: K,
      value: RegistreReferenceIdentificationFormState[K],
    ) => void;

    onEditBureauEnregistrement: () => void;
    onClearBureauEnregistrement: () => void;

    onEditTypeActe: (args: {
      kind: DictionnaireKind;
      title: string;
      multi: boolean;
      defaultSelectedIds: string[];
    }) => void;
    onClearTypeActe: () => void;
  };

function isoToFr(iso?: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return '';
  return `${d} / ${m} / ${y}`;
}

function frToIso(fr?: string) {
  if (!fr) return '';
  const cleaned = fr.replace(/\s+/g, '');
  const m = cleaned.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return '';
  const [, d, mo, y] = m;
  return `${y}-${mo}-${d}`;
}

function autoFormatFrDate(v: string) {
  const digits = v.replace(/\D/g, '').slice(0, 8);
  const parts: string[] = [];
  if (digits.length >= 2) parts.push(digits.slice(0, 2));
  if (digits.length >= 4) parts.push(digits.slice(2, 4));
  if (digits.length > 4) parts.push(digits.slice(4));
  return parts.join(' / ');
}

export function SectionIdentification(props: Props) {
  const { id, mode, form, onEditBureauEnregistrement, onClearBureauEnregistrement, onEditTypeActe, onClearTypeActe } =
    props;

  const currentTypeActeLabels = toLabels(form.type_acte_ref);
  const currentTypeActeColors = form.type_acte_ref?.colors ?? [];
  const currentTypeActeIds = toIds(form.type_acte_ref);

  console.log('currentTypeActeLabels', currentTypeActeLabels)
  console.log('currentTypeActeIds', currentTypeActeIds)
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
  return (
    <section className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
      <h3 className='text-sm font-semibold text-slate-900'>Identification</h3>

      <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-12'>
        <div className='md:col-span-12'>
          <label className='block text-xs font-medium text-slate-700'>Identifiant unique</label>
          <div className='flex w-fit gap-2'>
            <Input value={id} disabled className='font-mono' />
            <Button
              type='button'
              size='icon'
              variant='secondary'
              onClick={() => copyToClipboard(id)}
              title='Copier l’id'
              aria-label='Copier l’id'
            >
              {copied ? <Check className='h-4 w-4' /> : <Copy className='h-4 w-4' />}
            </Button>
          </div>
        </div>

        <div className='md:col-span-4'>
          <label className='block text-xs font-medium text-slate-700'>Bureau d’enregistrement</label>
          <ListeChipsViewSmart
            titre='Bureau d’enregistrement'
            values={form.bureau_id ? [form.bureau_enregistrement_label || '—'] : []}
            dense
            onEdit={onEditBureauEnregistrement}
            onDelete={onClearBureauEnregistrement}
            actionsInvisible={false}
          />
        </div>

        {/* Type d'acte: commun, mais multi dépend du mode */}
        <div className='md:col-span-4'>
          <label className='block text-xs font-medium text-slate-700'>Type d’acte</label>
          <ListeChipsViewSmart
            titre="Type d'acte"
            values={currentTypeActeLabels}
            colors={currentTypeActeColors}
            actionsInvisible={false}
            dense
            onEdit={() =>
              onEditTypeActe({
                kind: 'type_acte_ref',
                title: "Modifier le type d'acte",
                multi: mode === 'registre',
                defaultSelectedIds: currentTypeActeIds,
              })
            }
            onDelete={onClearTypeActe}
          />
        </div>

        {/* Champs acte-only */}
        {mode === 'acte' && (
          <>
            <div className='md:col-span-4'>
              <label className='block text-xs font-medium text-slate-700'>Numéro d’acte</label>
              <input
                type='text'
                name='numero_acte'
                value={props.form.numero_acte}
                onChange={(e) => props.setField('numero_acte', e.target.value)}
                className='mt-1 w-fit rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400'
              />
            </div>

            <div className='md:col-span-4'>
              <label className='block text-xs font-medium text-slate-700'>Date d’enregistrement</label>
              <input
                type='text'
                inputMode='numeric'
                placeholder='jj / mm / aaaa'
                value={isoToFr(props.form.date)}
                onChange={(e) => {
                  const formatted = autoFormatFrDate(e.target.value);
                  const iso = frToIso(formatted);
                  props.setField('date', iso);
                }}
                onBlur={(e) => {
                  const v = e.target.value;
                  const iso = frToIso(v);
                  if (!iso && v) props.setField('date', '');
                }}
                className='mt-1 w-fit rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400'
              />
            </div>

            <div className='md:col-span-4'>
              <label className='block text-xs font-medium text-slate-700'>Heure d’enregistrement</label>
              <input
                type='time'
                name='heure'
                value={props.form.heure}
                onChange={(e) => props.setField('heure', e.target.value)}
                className='mt-1 w-fit rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400'
              />
            </div>
          </>
        )}
      </div>
    </section>
  );
}
