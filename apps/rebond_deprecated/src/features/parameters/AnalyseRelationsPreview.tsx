import { useState } from 'react';
import { detectRelationsPreview, saveRelationsPreviewToSupabase } from '@/lib/detectRelationsPreview';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import type { RelationPreview } from '@/types/relations-acteurs';

export function AnalyseRelationsPreview() {
  const [relations, setRelations] = useState<RelationPreview[]>([]);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    const result = await detectRelationsPreview();
    await saveRelationsPreviewToSupabase(result);
    setRelations(result);
    setLoading(false);
  };

  const columns = [
    { key: 'acte_id', label: 'Acte ID' },
    { key: 'source_table', label: 'Source' },
    { key: 'acteur_source_id', label: 'Source ID' },
    { key: 'acteur_source_role', label: 'Source role' },
    { key: 'acteur_cible_id', label: 'Cible ID' },
    { key: 'acteur_cible_role', label: 'Cible role' },
    { key: 'relation_type', label: 'Type de relation' },
    { key: 'relation_precision', label: 'Précision' },
    { key: 'relation_mode', label: 'Mode' },
    { key: 'source_mention', label: 'Mention' },
    { key: 'statut', label: 'Statut' },
  ];

  return (
    <div>
      <Button onClick={handleClick} disabled={loading}>
        {loading ? 'Analyse en cours...' : 'Prévisualiser les relations'}
      </Button>

      {relations.length > 0 && (
        <div className="mt-4">
          <DataTable data={relations} columns={columns} />
        </div>
      )}
    </div>
  );
}
