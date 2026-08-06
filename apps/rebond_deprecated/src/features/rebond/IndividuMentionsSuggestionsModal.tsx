// IndividuMentionsSuggestionsModal.tsx

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useIndividuStore } from '@/store/useIndividuStore';
import { Filter } from 'lucide-react';

export function IndividuMentionsSuggestionsModal({
  open,
  onClose,
  onSuggestionClick
}: {
  open: boolean;
  onClose: () => void;
  onSuggestionClick: (nom: string, prenom: string) => void;
}) {
  const acteurs = useIndividuStore((s) => s.acteurs);

  const topCombinaisons = Object.entries(
    acteurs
      .filter((a) => !a.individu_id)
      .filter((a) => a.nom && a.prenom)
      .reduce((acc: Record<string, number>, a) => {
        const key = `${a.nom?.trim() ?? ''} ${a.prenom?.trim() ?? ''}`.trim();
        if (!key) return acc;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

    const handleFiltrerClick = (nom: string, prenom: string) => {
        onSuggestionClick(nom, prenom);
        onClose();
      };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suggestions de regroupement</DialogTitle>
        </DialogHeader>

        <div className="text-sm text-muted-foreground mb-4">
          Voici les combinaisons de nom et prénom les plus fréquentes parmi les acteurs non liés à un
          individu :
        </div>

        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left border-b">
              <th className="py-1 pr-4">Nom Prénom</th>
              <th className="py-1 pr-4">Occurrences</th>
              <th className="py-1 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {topCombinaisons.map(([key, count]) => {
              const [nom, ...prenomParts] = key.split(' ');
              const prenom = prenomParts.join(' ');
              return (
                <tr key={key} className="border-b">
                  <td className="py-1 pr-4">{key || <em>(incomplet)</em>}</td>
                  <td className="py-1 pr-4">{count}</td>
                  <td className="py-1 text-center">
                    <button
                      className="text-blue-600 hover:text-blue-800"
                      title="Filtrer"
                      onClick={() => handleFiltrerClick(nom, prenom)}
                    >
                      <Filter className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </DialogContent>
    </Dialog>
  );
}

