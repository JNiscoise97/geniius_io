//EnfantCard.tsx

import { Mars, Venus, Navigation } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function EnfantCard({ enfant }: { enfant: any }) {
  const genreIcon =
    enfant.sexe === 'M' ? <Mars className="w-4 h-4 text-blue-500" /> :
    enfant.sexe === 'F' ? <Venus className="w-4 h-4 text-pink-500" /> : null;

  return (
    <div className="relative bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-900 font-semibold">
          {genreIcon}
          <span>{enfant.prenom ?? ''} {enfant.nom ?? ''}</span>
        </div>

        {enfant.enfant_individu_id && (
          <Link to={`/individu/${enfant.enfant_individu_id}`}>
            <Button variant="ghost" className="text-sm">
              <Navigation className="w-4 h-4 opacity-70 text-indigo-600" />
            </Button>
          </Link>
        )}
      </div>

      {enfant.naissance?.date && (
        <p className="text-sm text-gray-700 mt-1">
          {enfant.sexe === 'F' ? 'Née' : 'Né'} le {enfant.naissance.date}
          {enfant.naissance.lieu && ` à ${enfant.naissance.lieu}`}
        </p>
      )}

      {enfant.deces?.date && (
        <p className="text-sm text-gray-700">
          {enfant.sexe === 'F' ? 'Décédée' : 'Décédé'} le {enfant.deces.date}
          {enfant.deces.lieu && ` à ${enfant.deces.lieu}`}
        </p>
      )}

      {enfant.professions && (
        <p className="text-sm text-gray-700">
          {enfant.professions.split(',').length > 1
            ? `Professions : ${enfant.professions}`
            : `Profession : ${enfant.professions}`}
        </p>
      )}
    </div>
  );
}
