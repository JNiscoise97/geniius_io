// SectionIdentification.tsx
import { toIds } from '@/utils/dictionnaireValue';
import { RefSinglePickerSmart } from '@/components/shared/RefSinglePickerSmart';
import { supabase } from '@/lib/supabase';
import type { Mode } from './types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

type LieuSituation = 'bureau_courant' | 'autre_bureau' | 'transporte';

export type ActeReferenceIdentificationFormState = {
  type_acte: string;
  type_acte_ref: { ids: string[]; labels: string[]; colors?: (string | null)[] } | null;

  // champs déplacés (encore présents dans le FormState global)
  numero_acte: string;
  date: string;
  heure: string;
  bureau_id: string | null;
  bureau_enregistrement_label: string;
  lieu_situation: LieuSituation;
  redaction_bureau_id: string | null;
  redaction_bureau_label: string;
  lieu_transport_raison: string;
  comparution_observations: string;
  auteur_fonction: string;
  auteur_institutionnel_ref: { ids: string[]; labels: string[] } | null;
};

export type RegistreReferenceIdentificationFormState = {
  type_acte: string;
  type_acte_ref: { ids: string[]; labels: string[]; colors?: (string | null)[] } | null;

  // champs déplacés si besoin
  bureau_id: string | null;
  bureau_enregistrement_label: string;
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

  const currentTypeActeIds = toIds(form.type_acte_ref);
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

  const setTypeActeRef = (
    v:
      | ActeReferenceIdentificationFormState['type_acte_ref']
      | RegistreReferenceIdentificationFormState['type_acte_ref'],
  ) => {
    if (type === 'acte') props.setField('type_acte_ref', v as any);
    else props.setField('type_acte_ref', v as any);
  };

  return (
    <section className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
      <h3 className='text-sm font-semibold text-slate-900'>Identification</h3>

      <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-12'>
        {/* Identifiant administratif pur (UUID) */}
        <div className='md:col-span-12'>
          <label className='block text-xs font-medium text-slate-700'>Identifiant administratif</label>
          <div className='flex w-fit gap-2'>
            <Input value={id} disabled className='font-mono' />
            {isEdit && (
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
            )}
          </div>
        </div>
        <div className='md:col-span-4'>
          <label className='block text-xs font-medium text-slate-700'>Type d’acte</label>
          <RefSinglePickerSmart
            table='ref_ec_type_acte'
            mode={isEdit ? 'edit' : 'view'}
            actionsInvisible={false}
            value={currentTypeActeId}
            onChange={async (next) => {
              const id = next ? String(next) : null;
              if (!id) {
                setTypeActeRef(null);
                return;
              }

              const { data } = await supabase
                .from('ref_ec_type_acte')
                .select('id,label')
                .eq('id', id)
                .maybeSingle();

              setTypeActeRef({ ids: [id], labels: [data?.label ?? ''] });
            }}
            titleOverride='Types d’actes'
          />
        </div>
      </div>
    </section>
  );
}
