// components/analyse-famille/BlocFratrie.tsx

import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { getChronoProfessions, getNaissance } from '@/lib/enrichirIndividu';

interface BlocFratrieProps {
  fratrie: any[];
  demiFratriePere: any[];
  demiFratrieMere: any[];
  individuId: string;
}

export default function BlocFratrie({
  fratrie,
  individuId,
  demiFratriePere,
  demiFratrieMere,
}: BlocFratrieProps) {
  const [acteursByIndividu, setActeursByIndividu] = useState<Record<string, any[]>>({});
  const tousLesMembres = [
    ...(fratrie ?? []),
    ...(demiFratriePere ?? []),
    ...(demiFratrieMere ?? []),
  ];
  useEffect(() => {
    const fetchActeurs = async () => {
      const results: Record<string, any[]> = {};
  
      
  
      for (const membre of tousLesMembres) {
        if (!membre?.enfant_individu_id) continue;
  
        const { data } = await supabase
          .from('v_acteurs_enrichis')
          .select('*')
          .eq('individu_id', membre.enfant_individu_id);
  
        results[membre.enfant_individu_id] = data ?? [];
      }
  
      setActeursByIndividu(results);
    };
  
    if (
      (fratrie.length > 0 || demiFratriePere.length > 0 || demiFratrieMere.length > 0)
    ) {
      fetchActeurs();
    }
  }, [fratrie, demiFratriePere, demiFratrieMere]);
  
  function renderListe(membres: any[]) {
    return (
      <ul className='list-disc list-inside space-y-3 text-sm'>
        {[...membres]
          .sort((a, b) => {
            const actesA = acteursByIndividu[a.enfant_individu_id] || [];
            const actesB = acteursByIndividu[b.enfant_individu_id] || [];

            const naissanceA = getNaissance(actesA).date;
            const naissanceB = getNaissance(actesB).date;

            const toYear = (d: string) =>
              /^\d{4}/.test(d)
                ? parseInt(d.slice(0, 4))
                : /\d{4}/.exec(d)?.[0]
                  ? parseInt(/\d{4}/.exec(d)![0])
                  : Number.MAX_SAFE_INTEGER;

            const anA = toYear(naissanceA);
            const anB = toYear(naissanceB);

            if (anA === anB) {
              return (a.nom + a.prenom).localeCompare(b.nom + b.prenom);
            }

            return anA - anB;
          })
          .map((personne) => {
            const actes = acteursByIndividu[personne.enfant_individu_id] || [];
            const naissance = getNaissance(actes);
            const profession = getChronoProfessions(actes);
            return (
              <li key={personne.enfant_individu_id || personne.enfant_acteur_id}>
                <span className='text-indigo-700'>
                  {[personne.prenom, personne.nom].filter(Boolean).join(' ')}
                </span>{' '}
                {naissance?.date && naissance?.lieu && (
                  <>
                    ({personne.sexe === 'F' ? 'née' : personne.sexe === 'M' ? 'né' : 'né·e'} en{' '}
                    {naissance.date.split('-')[0]} à {naissance.lieu})
                  </>
                )}
                {profession && (
                  <>
                    <br />
                    <span className='text-gray-700'>
                      {personne.sexe === 'F' ? 'Employée' : 'Employé'} comme {profession}.
                    </span>
                  </>
                )}
                {personne.source && (
                  <>
                    <br />
                    <span className='text-xs text-gray-500 italic'>Source : {personne.source}</span>
                  </>
                )}
              </li>
            );
          })}
      </ul>
    );
  }

  return (
    <div className='bg-white border border-gray-300 rounded shadow-sm p-4'>
      <h4 className='text-base font-semibold mb-2'>
        🧒 Frères & sœurs
        <Badge variant='secondary' className='ml-2'>
          {tousLesMembres.length}
        </Badge>
      </h4>
      {(fratrie.length > 1 || demiFratriePere?.length > 1 || demiFratrieMere?.length > 1) && (
        <p className='text-xs text-gray-500 italic mt-2'>
          Ordre estimé selon les dates de naissance disponibles.
        </p>
      )}

      {fratrie.length > 0 && (
        <>
          <h5 className='font-semibold mt-4 mb-1'>Frères & sœurs (parents communs)</h5>
          {renderListe(fratrie)}
        </>
      )}

      {demiFratriePere && demiFratriePere.length > 0 && (
        <>
          <h5 className='font-semibold mt-4 mb-1'>Demi-frères & sœurs (côté père)</h5>
          {renderListe(demiFratriePere)}
        </>
      )}

      {demiFratrieMere && demiFratrieMere.length > 0 && (
        <>
          <h5 className='font-semibold mt-4 mb-1'>Demi-frères & sœurs (côté mère)</h5>
          {renderListe(demiFratrieMere)}
        </>
      )}

      {fratrie.length === 0 &&
        (!demiFratriePere || demiFratriePere.length === 0) &&
        (!demiFratrieMere || demiFratrieMere.length === 0) && (
          <p className='text-sm'>Aucun frère ou sœur recensé·e.</p>
        )}
    </div>
  );
}
