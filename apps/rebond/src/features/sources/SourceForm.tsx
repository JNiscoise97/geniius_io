import { useEffect, useState } from 'react';
import { useSourceStore } from './source.store';
import { useDepots } from './useDepots';
import { TYPE_UNITE_OPTIONS, type TypeUnite } from './source.constants';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save } from 'lucide-react';

type Props = {
  sourceId: string | null;
  onDone: () => void;
};

export function SourceForm({ sourceId, onDone }: Props) {
  const { createSource, updateSource, sources } = useSourceStore();
  const { depots } = useDepots();

  const existing = sourceId
    ? sources.find((s) => s.id === sourceId)
    : null;

  const [titre, setTitre] = useState('');
  const [cote, setCote] = useState('');
  const [depotId, setDepotId] = useState<string>('');
  const [typeUnite, setTypeUnite] = useState<TypeUnite>('registre');

  useEffect(() => {
    if (existing) {
      setTitre(existing.titre ?? '');
      setCote(existing.cote ?? '');
      setDepotId(existing.depot_id);
      setTypeUnite(existing.type_unite as TypeUnite);
    }
  }, [existing]);

  const submit = async () => {
    if (!titre.trim() || !depotId) return;

    const payload = {
      titre: titre.trim(),
      cote: cote?.trim() || null,
      depot_id: depotId,
      type_unite: typeUnite,
    };

    if (sourceId) {
      await updateSource(sourceId, payload);
    } else {
      await createSource(payload);
    }

    onDone();
  };

  return (
    <div className="space-y-4">
      {/* Titre */}
      <Input
        placeholder="Titre de la source"
        value={titre}
        onChange={(e) => setTitre(e.target.value)}
      />

      {/* Type d’unité */}
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

      {/* Dépôt (obligatoire) */}
      <select
        className="w-full rounded-md border px-3 py-2 text-sm"
        value={depotId}
        onChange={(e) => setDepotId(e.target.value)}
      >
        <option value="">— Choisir un dépôt —</option>
        {depots.map((d) => (
          <option key={d.id} value={d.id}>
            {d.label}
          </option>
        ))}
      </select>

      {/* Cote */}
      <Input
        placeholder="Cote (optionnelle)"
        value={cote}
        onChange={(e) => setCote(e.target.value)}
      />

      <div className="flex justify-end">
        <Button onClick={submit} disabled={!titre || !depotId} className="gap-2">
          <Save className="h-4 w-4" />
          {sourceId ? 'Mettre à jour' : 'Créer la source'}
        </Button>
      </div>
    </div>
  );
}
