import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { detectLieuxBruts } from '@/lib/detectLieuxPreview';

type LieuBrut = {
  texte_brut: string;
};

type LieuType =
  | 'maison' | 'habitation' | 'section' | 'quartier' | 'hameau'
  | 'commune' | 'lieu-dit' | 'propriete' | 'entite_naturelle'
  | 'département' | 'région' | 'province' | 'état' | 'pays' | 'continent' | 'autre';

const TYPES: LieuType[] = [
  'maison', 'habitation', 'section', 'quartier', 'hameau',
  'commune', 'lieu-dit', 'propriete', 'entite_naturelle',
  'département', 'région', 'province', 'état', 'pays', 'continent', 'autre',
];

export function LieuBrutCreator() {
  const [lieux, setLieux] = useState<LieuBrut[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<Record<string, LieuType>>({});
  const [creating, setCreating] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await detectLieuxBruts();
      setLieux(data.sort((a, b) => a.texte_brut?.localeCompare(b.texte_brut ?? '') || 0));
      setLoading(false);
    };
    load();
  }, []);

  const createLieu = async (texte: string) => {
    const type = selectedTypes[texte];
    if (!type) return;

    setCreating((prev) => ({ ...prev, [texte]: true }));

    const { error } = await supabase
      .from('lieux')
      .insert([{ libelle: texte, type }]);

    if (!error) {
      setLieux((prev) => prev.filter((l) => l.texte_brut !== texte));
    }

    setCreating((prev) => ({ ...prev, [texte]: false }));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Création des lieux à partir des textes bruts</h2>

      {loading && <p>Chargement...</p>}
      {!loading && lieux.length === 0 && <p>Aucun lieu détecté.</p>}

      {!loading && lieux.length > 0 && (
        <div className="space-y-2">
          {lieux.map(({ texte_brut }) => (
            <div
              key={texte_brut}
              className="flex items-center gap-2 border rounded px-3 py-2"
            >
              <div className="flex-1">
                <strong>{texte_brut}</strong>
              </div>

              <Select
                onValueChange={(value) =>
                  setSelectedTypes((prev) => ({ ...prev, [texte_brut]: value as LieuType }))
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Choisir un type" />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                disabled={!selectedTypes[texte_brut] || creating[texte_brut]}
                onClick={() => createLieu(texte_brut)}
              >
                {creating[texte_brut] ? 'Création…' : 'Créer le lieu'}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
