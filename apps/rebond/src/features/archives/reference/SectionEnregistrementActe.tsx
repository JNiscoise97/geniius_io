// SectionEnregistrementActe.tsx
import { ListeChipsViewSmart } from '@/components/shared/ListeChipsViewSmart';
import { RefSinglePickerSmart } from '@/components/shared/RefSinglePickerSmart';
import type { Mode } from './types';
import { Separator } from '@/components/ui/separator';

type LieuSituation = 'bureau_courant' | 'autre_bureau' | 'transporte';

export type ActeEnregistrementFormState = {
  // identifiant
  numero_acte: string;
  date: string; // ISO yyyy-mm-dd ou ''
  heure: string;

  // bureau
  bureau_id: string | null;
  bureau_enregistrement_label: string;

  // auteur / autorité
  auteur_institutionnel_ref: { ids: string[]; labels: string[] } | null;

  // lieu de rédaction
  lieu_situation: LieuSituation;
  redaction_bureau_id: string | null;
  redaction_bureau_label: string;

  // legacy (à supprimer plus tard)
  comparution_observations: string;
};

type Props = {
  mode?: Mode;
  form: ActeEnregistrementFormState;
  setField: <K extends keyof ActeEnregistrementFormState>(
    key: K,
    value: ActeEnregistrementFormState[K],
  ) => void;

  onEditBureauEnregistrement: () => void;
  onClearBureauEnregistrement: () => void;

  onEditBureauRedaction: () => void;
  onClearBureauRedaction: () => void;
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

export function SectionEnregistrementActe({
  mode = 'edit',
  form,
  setField,
  onEditBureauEnregistrement,
  onClearBureauEnregistrement,
  onEditBureauRedaction,
  onClearBureauRedaction,
}: Props) {
  const isEdit = mode === 'edit';

  const currentAuteurId = form.auteur_institutionnel_ref?.ids?.[0] ?? null;

  return (
    <section className='bg-white'>
      <div className='space-y-6'>
        <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-12'>
          <div className='md:col-span-4'>
            <label className='block text-xs font-medium text-slate-700'>
              Date d’enregistrement
            </label>
            <input
              type='text'
              inputMode='numeric'
              placeholder='jj / mm / aaaa'
              value={isoToFr(form.date)}
              disabled={!isEdit}
              onChange={(e) => {
                const formatted = autoFormatFrDate(e.target.value);
                const iso = frToIso(formatted);
                setField('date', iso);
              }}
              onBlur={(e) => {
                const v = e.target.value;
                const iso = frToIso(v);
                if (!iso && v) setField('date', '');
              }}
              className='mt-1 w-fit rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400 disabled:bg-slate-50'
            />
          </div>

          <div className='md:col-span-4'>
            <label className='block text-xs font-medium text-slate-700'>
              Heure d’enregistrement
            </label>
            <input
              type='time'
              name='heure'
              value={form.heure}
              disabled={!isEdit}
              onChange={(e) => setField('heure', e.target.value)}
              className='mt-1 w-fit rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400 disabled:bg-slate-50'
            />
          </div>
        </div>
        <Separator />
        <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-12'>
          {/* Auteur / Autorité */}
          <div className='md:col-span-12'>
            <label className='block text-xs font-medium text-slate-700'>Auteur de l’acte</label>
            <RefSinglePickerSmart
              table='ref_auteur_institutionnel'
              mode={isEdit ? 'edit' : 'view'}
              actionsInvisible={false}
              value={currentAuteurId}
              onChange={(nextId) => {
                if (!nextId) {
                  setField('auteur_institutionnel_ref', null);
                  return;
                }
                // on stocke {ids,labels} ; ici on garde label vide (hydrate optionnel côté parent si tu veux)
                setField('auteur_institutionnel_ref', { ids: [String(nextId)], labels: [''] });
              }}
            />
            <p className='mt-2 text-xs text-slate-500'>
              Le nom de l’officiant est rattaché aux acteurs (niveau “entités/acteurs”), pas à
              l’acte.
            </p>
          </div>
        </div>

        <Separator />
        <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-12'>
          {/* Numéro / Date / Heure */}
          <div className='md:col-span-4'>
            <label className='block text-xs font-medium text-slate-700'>Numéro d’acte</label>
            <input
              type='text'
              name='numero_acte'
              value={form.numero_acte}
              disabled={!isEdit}
              onChange={(e) => setField('numero_acte', e.target.value)}
              className='mt-1 w-fit rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400 disabled:bg-slate-50'
            />
          </div>
        </div>
        <Separator />
        <div>
          {/* Bureau d’enregistrement */}
          <div className='md:col-span-4'>
            <label className='block text-xs font-medium text-slate-700'>
              Bureau d’enregistrement
            </label>
            <ListeChipsViewSmart
              titre='Bureau d’enregistrement'
              values={form.bureau_id ? [form.bureau_enregistrement_label || '—'] : []}
              dense
              readonly={true}
              onEdit={onEditBureauEnregistrement}
              onDelete={onClearBureauEnregistrement}
              actionsInvisible={false}
            />
          </div>

          {/* LIEU DE REDACTION */}
          <div className='mt-6'>
            <label className='block text-xs font-medium text-slate-700'>Lieu de rédaction</label>
            <div className='mt-3 space-y-4'>
              <fieldset className='rounded-xl border border-slate-200 bg-slate-50 p-4'>
                <div className='mt-2 grid grid-cols-1 gap-3 md:grid-cols-12'>
                  <label className='flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 md:col-span-4'>
                    <input
                      type='radio'
                      name='lieu_situation'
                      value='bureau_courant'
                      disabled={!isEdit}
                      checked={form.lieu_situation === 'bureau_courant'}
                      onChange={() => {
                        setField('lieu_situation', 'bureau_courant');
                        setField('redaction_bureau_id', null);
                        setField('redaction_bureau_label', '');
                      }}
                      className='mt-0.5 h-4 w-4 border-slate-300 text-slate-900 focus:ring-0'
                    />
                    <div>
                      <div className='text-sm font-medium text-slate-900'>Bureau courant</div>
                      <div className='text-xs text-slate-600'>
                        Rédigé au bureau d’état-civil indiqué.
                      </div>
                    </div>
                  </label>

                  <label className='flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 md:col-span-4'>
                    <input
                      type='radio'
                      name='lieu_situation'
                      value='autre_bureau'
                      disabled={!isEdit}
                      checked={form.lieu_situation === 'autre_bureau'}
                      onChange={() => {
                        setField('lieu_situation', 'autre_bureau');
                        setField('redaction_bureau_id', null);
                        setField('redaction_bureau_label', '');
                      }}
                      className='mt-0.5 h-4 w-4 border-slate-300 text-slate-900 focus:ring-0'
                    />
                    <div>
                      <div className='text-sm font-medium text-slate-900'>Autre bureau</div>
                      <div className='text-xs text-slate-600'>Rédigé dans un autre bureau.</div>
                    </div>
                  </label>

                  <label className='flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 md:col-span-4'>
                    <input
                      type='radio'
                      name='lieu_situation'
                      value='transporte'
                      disabled={!isEdit}
                      checked={form.lieu_situation === 'transporte'}
                      onChange={() => {
                        setField('lieu_situation', 'transporte');
                        setField('redaction_bureau_id', null);
                        setField('redaction_bureau_label', '');
                      }}
                      className='mt-0.5 h-4 w-4 border-slate-300 text-slate-900 focus:ring-0'
                    />
                    <div>
                      <div className='text-sm font-medium text-slate-900'>Acte transporté</div>
                      <div className='text-xs text-slate-600'>Rédigé hors du bureau.</div>
                    </div>
                  </label>
                </div>
              </fieldset>

              {form.lieu_situation === 'autre_bureau' && (
                <div className='rounded-xl border border-slate-200 bg-white p-4'>
                  <label className='block text-xs font-medium text-slate-700'>
                    Bureau de rédaction
                  </label>
                  <ListeChipsViewSmart
                    titre='Bureau de rédaction'
                    values={form.redaction_bureau_id ? [form.redaction_bureau_label || '—'] : []}
                    dense
                    actionsInvisible = {false}
                    readonly={!isEdit}
                    onEdit={onEditBureauRedaction}
                    onDelete={onClearBureauRedaction}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
