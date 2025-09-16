import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react';
import { apiFetchBureaux, apiUpdateActe } from '@/services/acte.api';
import { MentionsMarginales } from '../MentionsMarginales';

export type ActeFormHandle = {
  save: () => Promise<void>;
  isDirty: () => boolean;
};

const initialState = {
  label: '',
  type_acte: '',
  date: '',
  heure: '',
  numero_acte: '',
  transcription: null as string | null,
  bureau_id: '',
  annee: new Date().getFullYear(),
  source: '',
  mentions_marginales: '',
  comparution_mairie: null as boolean | null,
  comparution_observations: '',
  contrat_mariage: '',
  enfants_legitimes: '',
  enfants_nombre: '',
};

type Props = { acte: any; onUpdated: () => void };

function normalize(formData: any) {
  const now = new Date().toISOString();

  const enfants_nombre =
    formData.enfants_nombre !== '' &&
    formData.enfants_nombre !== null &&
    formData.enfants_nombre !== undefined
      ? Number.parseInt(String(formData.enfants_nombre), 10)
      : null;

  const annee = Number.parseInt(String(formData.annee), 10);

  return {
    ...formData,
    annee: Number.isFinite(annee) ? annee : null,
    enfants_nombre,
    updated_at: now,
  };
}

function areEqual(a: any, b: any) {
  // comparaison simple et robuste pour notre besoin
  return JSON.stringify(a) === JSON.stringify(b);
}

export const ActeForm = forwardRef<ActeFormHandle, Props>(function ActeForm(
  { acte, onUpdated },
  ref,
) {
  const [formData, setFormData] = useState({ ...initialState, ...acte });
  const [bureaux, setBureaux] = useState<{ id: string; nom: string }[]>([]);

  // Snapshot initial (ref pour éviter les re-renders)
  const initialSnapshotRef = useRef<any>({ ...initialState, ...acte });

  // Sync quand l’acte change
  useEffect(() => {
    const next = { ...initialState, ...acte };
    setFormData(next);
    initialSnapshotRef.current = next; // nouvel acte => pas dirty
  }, [acte]);

  // Charger la liste des bureaux (via service)
  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetchBureaux();
        setBureaux(data);
      } catch (e) {
        // silencieux; tu peux toaster si besoin
        console.error('apiFetchBureaux error', e);
      }
    })();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const isDirty = () => !areEqual(formData, initialSnapshotRef.current);

  const save = async () => {
    // ne rien faire si pas dirty (utile si on appelle quand même depuis un parent)
    if (!isDirty()) return;

    // validation heure HH:MM
    if (formData.heure && !/^([01]\d|2[0-3]):[0-5]\d$/.test(formData.heure)) {
      alert("Format d'heure invalide (HH:MM)");
      return;
    }

    const payload = normalize(formData);
    await apiUpdateActe(acte.id, payload);

    // Après succès: on recale le snapshot initial
    initialSnapshotRef.current = { ...formData };

    await onUpdated();
  };

  useImperativeHandle(ref, () => ({
    save,
    isDirty,
  }));

  return (
    <form className='space-y-6' onSubmit={(e) => e.preventDefault()}>
      {/* Label (readonly) */}
      <div>
        <Label htmlFor='label'>Label</Label>
        <Input
          id='label'
          name='label'
          value={formData.label}
          readOnly
          className='bg-muted cursor-not-allowed'
        />
      </div>

      {/* Type d'acte */}
      <div>
        <Label htmlFor='type_acte'>Type d’acte</Label>
        <select
          name='type_acte'
          value={formData.type_acte}
          onChange={handleChange}
          className='w-full border rounded p-2'
        >
          <option value=''>-- Sélectionner --</option>
          {[
            'naissance',
            'reconnaissance',
            'affranchissement',
            'jugement',
            'mariage',
            'divorce',
            'décès',
            'baptême',
            'mariage religieux',
            'inhumation',
          ].map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Date / Heure / Numéro */}
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        <div>
          <Label>Date</Label>
          <Input type='date' name='date' value={formData.date} onChange={handleChange} />
        </div>
        <div>
          <Label>Heure</Label>
          <Input
            type='time'
            name='heure'
            step='60'
            value={formData.heure}
            onChange={handleChange}
          />
        </div>
        <div>
          <Label>Numéro d’acte</Label>
          <Input name='numero_acte' value={formData.numero_acte} onChange={handleChange} />
        </div>
      </div>

      {/* Bureau & année */}
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        <div>
          <Label>Année</Label>
          <Input name='annee' type='number' value={formData.annee} onChange={handleChange} />
        </div>
        <div>
          <Label>Bureau</Label>
          <select
            name='bureau_id'
            value={formData.bureau_id}
            onChange={handleChange}
            className='w-full border rounded p-2'
          >
            <option value=''>-- Sélectionner --</option>
            {bureaux.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nom}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Source */}
      <div>
        <Label>Source</Label>
        <Input name='source' value={formData.source} onChange={handleChange} />
      </div>

      {/* Transcription */}
      <div>
        <Label>Transcription</Label>
        <ToggleGroup
          type='single'
          value={formData.transcription ?? 'null'}
          onValueChange={(val) =>
            setFormData((prev: any) => ({
              ...prev,
              transcription: val === 'null' ? null : val,
            }))
          }
          className='grid grid-cols-3 gap-2'
        >
          <ToggleGroupItem
            value='oui'
            variant='outline'
            className='rounded-sm border-none data-[state=on]:bg-green-100 data-[state=on]:text-green-800'
          >
            Oui
          </ToggleGroupItem>
          <ToggleGroupItem
            value='non'
            variant='outline'
            className='rounded-sm border-none data-[state=on]:bg-red-100 data-[state=on]:text-red-800'
          >
            Non
          </ToggleGroupItem>
          <ToggleGroupItem
            value='null'
            variant='outline'
            className='rounded-sm border-none data-[state=on]:bg-gray-100 data-[state=on]:text-gray-600'
          >
            N/R
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Mentions marginales (héritage en lecture seule) */}
      {formData.mentions_marginales && formData.mentions_marginales != 'non' && <div className='space-y-2'>
        <div className='flex items-center justify-between'>
          <Label>Mentions marginales (héritage)</Label>
          <span className='text-xs text-muted-foreground'>
            Champ historique en lecture seule — nouvelles mentions ci-dessous
          </span>
        </div>
        <Textarea
          name='mentions_marginales'
          rows={2}
          value={formData.mentions_marginales}
          readOnly
          aria-readonly
          className='bg-muted cursor-not-allowed'
        />
      </div>}

      {/* NOUVEAU : tableau/éditeur des mentions marginales structurées */}
      {acte?.id && (
        <div className='mt-4'>
          <MentionsMarginales acteId={acte.id} />
        </div>
      )}

      {/* Champs spécifiques mariage */}
      {formData.type_acte === 'mariage' && (
        <>
          <Label>Comparution</Label>
          <select
            name='comparution_mairie'
            value={
              formData.comparution_mairie === true
                ? 'true'
                : formData.comparution_mairie === false
                  ? 'false'
                  : ''
            }
            onChange={(e) =>
              setFormData((prev: any) => ({
                ...prev,
                comparution_mairie:
                  e.target.value === 'true' ? true : e.target.value === 'false' ? false : null,
              }))
            }
          >
            <option value=''>-- Inconnu --</option>
            <option value='true'>Oui</option>
            <option value='false'>Non</option>
          </select>

          <Label>Observations</Label>
          <Textarea
            name='comparution_observations'
            rows={2}
            value={formData.comparution_observations}
            onChange={handleChange}
          />

          <Label>Contrat de mariage</Label>
          <Input name='contrat_mariage' value={formData.contrat_mariage} onChange={handleChange} />

          <Label>Enfants légitimés</Label>
          <Input
            name='enfants_legitimes'
            value={formData.enfants_legitimes}
            onChange={handleChange}
          />

          <Label>Nombre d’enfants</Label>
          <Input
            type='number'
            name='enfants_nombre'
            value={formData.enfants_nombre}
            onChange={handleChange}
          />
        </>
      )}
    </form>
  );
});
