// components/actes/ComparaisonActeur.tsx

import { Button } from '@/components/ui/button';
import { ArrowRightCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

type Props = {
  suggestion: any;
  destination: any;
  onClose: () => void;
  onCopy: (field: string) => void;
  onFusionnerChange: (val: boolean) => void;
};

const labels: Record<string, string> = {
  qualite: 'Qualité',
  nom: 'Nom',
  prenom: 'Prénom',
  sexe: 'Sexe',
  profession_brut: 'Profession',
  statut_brut: 'Statut',
  fonction: 'Fonction',
  filiation: 'Filiation',
  
  domicile: 'Domicile',
  origine: 'Origine',
  
  lien: 'Lien',

  naissance_date: 'Date de naissance',
  naissance_lieux: 'Lieu de naissance',
  naissance_lieu_commune: 'Commune (Lieu de naissance)',
  naissance_lieu_section: 'Section (Lieu de naissance)',
  naissance_lieu_hameau: 'Hameau (Lieu de naissance)',
  naissance_lieu_précisions: 'Précisions (Lieu de naissance)',
  deces_date: 'Date de décès',
  deces_lieux: 'Lieu de décès',
  deces_lieu_commune: 'Commune (Lieu de décès)',
  deces_lieu_section: 'Section (Lieu de décès)',
  deces_lieu_hameau: 'Hameau (Lieu de décès)',
  deces_lieu_précisions: 'Précisions (Lieu de décès)',
  
  est_vivant: 'Est vivant',
  est_present: 'Est présent',
  
  a_signe: 'A signé',
  signature: 'Signature (détail)',
  signature_libelle: 'Signature (libellé)',
};

const fields = Object.keys(labels);

export function ComparaisonActeur({
  suggestion,
  destination,
  onClose,
  onCopy,
  onFusionnerChange,
}: Props) {
  const [fusionner, setFusionner] = useState(false);

  useEffect(() => {
    setFusionner(false);
    onFusionnerChange(false);
  }, [suggestion, destination]);

  const showFusionnerButton = Boolean(suggestion?.individu_id);

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex justify-between items-center'>
        <h2 className='text-lg font-semibold'>Comparer avec la suggestion</h2>
        <Button variant='ghost' onClick={onClose} size='sm'>
          Fermer
        </Button>
      </div>

      <div className='grid grid-cols-4 gap-3 text-sm border-t pt-2'>
        <div className='font-bold text-gray-600'>Champ</div>
        <div className='font-bold text-gray-600'>Suggestion</div>
        <div></div>
        <div className='font-bold text-gray-600'>Actuel</div>

        {fields.map((field) => (
          <div key={field} className='contents'>
            <div className='text-gray-500'>{labels[field] ?? field}</div>
            <div className='text-gray-700'>{formatValue(suggestion?.[field] ?? '—')}</div>
            <div>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => onCopy(field)}
                disabled={suggestion?.[field] === destination?.[field]}
                title='Copier vers destination'
              >
                <ArrowRightCircle className='w-4 h-4 text-gray-500' />
              </Button>
            </div>
            <div className='text-gray-900 font-semibold'>{formatValue(destination?.[field] ?? '—')}</div>
          </div>
        ))}
      </div>
      <div className="text-sm">
  {(() => {
    const id1 = suggestion?.individu_id;
    const id2 = destination?.individu_id;

    if (id1 && id2 && id1 === id2) {
      return (
        <div className="bg-green-100 text-green-800 border border-green-300 px-3 py-2 rounded-md">
          Ces acteurs sont déjà rattachés à un individu.
        </div>
      );
    }

    if (id1 && id2 && id1 !== id2) {
      return (
        <div className="bg-red-100 text-red-800 border border-red-300 px-3 py-2 rounded-md">
          Ces acteurs sont chacun  déjà rattachés à des individus.
        </div>
      );
    }

    if (!id1 && !id2) {
      return (
        <div className="bg-yellow-100 text-yellow-800 border border-yellow-300 px-3 py-2 rounded-md">
          Impossible : les deux acteurs ne sont liés à aucun individu.
        </div>
      );
    }

    if (!id1 && id2) {
      return (
        <div className="bg-red-100 text-red-800 border border-red-300 px-3 py-2 rounded-md">
          Impossible : déjà lié à un individu.
        </div>
      );
    }

    if (id1 && !id2) {
      return (
        <label className="bg-blue-50 text-blue-900 border border-blue-200 px-3 py-2 rounded-md flex items-center gap-2">
          <input
            type="checkbox"
            className="accent-indigo-600"
            checked={fusionner}
            onChange={(e) => {
              const val = e.target.checked;
              setFusionner(val);
              onFusionnerChange(val);
            }}
          />
          Associer à cette personne
        </label>
      );
    }

    return null;
  })()}
</div>

    </div>
  );
}

function formatValue(val: any) {
  if (val === true) return 'Oui';
  if (val === false) return 'Non';
  if (val === null || val === undefined || val === '') return '—';
  return val;
}