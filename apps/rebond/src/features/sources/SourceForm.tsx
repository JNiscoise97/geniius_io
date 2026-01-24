// SourceForm.tsx
import { useEffect, useState } from 'react';
import { useSourceStore } from './source.store';
import { TYPE_UNITE_OPTIONS, type TypeUnite } from './source.constants';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Save } from 'lucide-react';

type Props = {
  sourceId: string | null;
  onDone: () => void;
};

function toIntOrEmpty(v: string): number | '' {
  const s = v.trim();
  if (!s) return '';
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) ? n : '';
}

export function SourceForm({ sourceId, onDone }: Props) {
  const { createSource, updateSource, sources } = useSourceStore();
  const existing = sourceId ? sources.find((s) => s.id === sourceId) : null;

  const [titre, setTitre] = useState('');
  const [typeUnite, setTypeUnite] = useState<TypeUnite>('registre');

  const [identifiantInterne, setIdentifiantInterne] = useState('');
  const [description, setDescription] = useState('');

  const [langueId, setLangueId] = useState<string | null>(null);
  const [ecritureId, setEcritureId] = useState<string | null>(null);

  const [couvertureLabel, setCouvertureLabel] = useState('');
  const [couvertureStart, setCouvertureStart] = useState<number | ''>('');
  const [couvertureEnd, setCouvertureEnd] = useState<number | ''>('');
  const [serieRef, setSerieRef] = useState<string | null>(null);

  useEffect(() => {
    if (!existing) return;

    setTitre(existing.titre ?? '');
    setTypeUnite(existing.type_unite as TypeUnite);

    setIdentifiantInterne(existing.identifiant_interne ?? '');
    setDescription(existing.description ?? '');

    setLangueId(existing.langue_id ?? null);
    setEcritureId(existing.ecriture_id ?? null);

    setCouvertureLabel(existing.couverture_label ?? '');
    setCouvertureStart(existing.couverture_sort_start ?? '');
    setCouvertureEnd(existing.couverture_sort_end ?? '');
    setSerieRef(existing.serie_ref ?? null);
  }, [existing]);

  const submit = async () => {
    if (!titre.trim()) return;

    const payload = {
      titre: titre.trim(),
      type_unite: typeUnite,

      identifiant_interne: identifiantInterne.trim() || null,
      description: description.trim() || null,

      langue_id: langueId || null,
      ecriture_id: ecritureId || null,

      serie_ref: serieRef || null,
      couverture_label: couvertureLabel.trim() || null,
      couverture_sort_start: couvertureStart === '' ? null : Number(couvertureStart),
      couverture_sort_end: couvertureEnd === '' ? null : Number(couvertureEnd),
    };

    if (sourceId) await updateSource(sourceId, payload);
    else await createSource(payload);

    onDone();
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Titre (ex: Registre des naissances — La Saline)"
        value={titre}
        onChange={(e) => setTitre(e.target.value)}
      />

      <select
        className="w-full rounded-md border px-3 py-2 text-sm"
        value={typeUnite}
        onChange={(e) => setTypeUnite(e.target.value as TypeUnite)}
      >
        {TYPE_UNITE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <Input
        placeholder="Identifiant interne (optionnel)"
        value={identifiantInterne}
        onChange={(e) => setIdentifiantInterne(e.target.value)}
      />

      <Textarea
        placeholder="Description (optionnelle)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="min-h-[90px]"
      />

      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="langue_id (uuid, optionnel)"
          value={langueId ?? ''}
          onChange={(e) => setLangueId(e.target.value.trim() || null)}
        />
        <Input
          placeholder="ecriture_id (uuid, optionnel)"
          value={ecritureId ?? ''}
          onChange={(e) => setEcritureId(e.target.value.trim() || null)}
        />
      </div>

      <Input
        placeholder="Couverture (libellé) ex: 1889 — Naissances"
        value={couvertureLabel}
        onChange={(e) => setCouvertureLabel(e.target.value)}
      />

      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="Tri début (ex: 1889)"
          value={couvertureStart === '' ? '' : String(couvertureStart)}
          onChange={(e) => setCouvertureStart(toIntOrEmpty(e.target.value))}
          inputMode="numeric"
        />
        <Input
          placeholder="Tri fin (ex: 1890)"
          value={couvertureEnd === '' ? '' : String(couvertureEnd)}
          onChange={(e) => setCouvertureEnd(toIntOrEmpty(e.target.value))}
          inputMode="numeric"
        />
      </div>

      <Input
        placeholder="serie_ref (uuid, optionnel)"
        value={serieRef ?? ''}
        onChange={(e) => setSerieRef(e.target.value.trim() || null)}
      />

      <div className="flex justify-end">
        <Button onClick={submit} disabled={!titre.trim()} className="gap-2">
          <Save className="h-4 w-4" />
          {sourceId ? 'Mettre à jour' : 'Créer la source'}
        </Button>
      </div>
    </div>
  );
}
