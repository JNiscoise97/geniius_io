//BlocUnionsEtEnfants

interface Individu {
  prenom?: string;
  nom?: string;
  sexe?: string;
  date_naissance?: string;
  lieu_naissance?: string;
  profession_brut?: string;
  source?: string;
  enfant_individu_id: string;
}

interface Union {
  union_acte_id?: string;
  conjoint_individu_id?: string;
  conjoint_prenom?: string;
  conjoint_nom?: string;
  type_union?: string;
  date_mariage?: string;
  lieu_mariage?: string;
}

interface BlocUnionsEtEnfantsProps {
  unions: Union[];
  enfantsParUnion: Record<string, Individu[]>;
  enfantsSansUnion: Individu[];
}

export default function BlocUnionsEtEnfants({
  unions,
  enfantsParUnion,
  enfantsSansUnion,
}: BlocUnionsEtEnfantsProps) {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('fr-FR');
  };

  const totalEnfants = Object.values(enfantsParUnion).flat().length + enfantsSansUnion.length;

  return (
    <div className='bg-white border border-gray-300 rounded shadow-sm p-4'>
      <h4 className='text-base font-semibold mb-4'>💍 Conjoints & Enfants</h4>

      {/* Unions connues */}
      {unions.map((union) => {
        const key = union.union_acte_id || union.conjoint_individu_id;
        const enfants = (key && enfantsParUnion[key]) || [];

        return (
          <div key={key} className='mb-6'>
            <p className='text-sm font-medium text-gray-600 mb-2'>
              Union avec{' '}
              <span className='text-indigo-700'>
                {[union.conjoint_prenom, union.conjoint_nom].filter(Boolean).join(' ')}
              </span>{' '}
              ({union.type_union}
              {union.date_mariage && ` – ${formatDate(union.date_mariage)}`}
              {union.lieu_mariage && `, ${union.lieu_mariage}`})
            </p>
            <ul className='list-disc list-inside text-gray-800 space-y-1'>
              {enfants.map((e:any) => (
                <li key={e.enfant_individu_id || e.enfant_acteur_id}>
                  {[e.prenom, e.nom].filter(Boolean).join(' ') || 'Inconnu'}{' '}
                  {e.date_naissance && `(né${e.sexe === 'F' ? 'e' : ''} en ${e.date_naissance})`}
                  {e.lieu_naissance && ` à ${e.lieu_naissance}`}
                  {e.profession_brut && `, ${e.profession_brut}`}
                  {e.source && (
                    <span className='block text-xs text-gray-500 italic'>
                      Source : {e.source}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      {/* Enfants sans union */}
      {enfantsSansUnion.length > 0 && (
        <div className='mb-6'>
          <p className='text-sm font-medium text-gray-600 mb-2'>
            Enfants sans union identifiée
          </p>
          <ul className='list-disc list-inside text-gray-800 space-y-1'>
            {enfantsSansUnion.map((e) => (
              <li key={e.enfant_individu_id}>
                {[e.prenom, e.nom].filter(Boolean).join(' ') || 'Inconnu'}{' '}
                {e.date_naissance && `(né${e.sexe === 'F' ? 'e' : ''} en ${e.date_naissance})`}
                {e.lieu_naissance && ` à ${e.lieu_naissance}`}
                {e.source && (
                  <span className='block text-xs text-gray-500 italic'>
                    Source : {e.source}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Résumé */}
      <div className='mt-4 border-t pt-3 text-sm text-gray-600'>
        Cette famille se compose de {unions.length} union{unions.length > 1 ? 's' : ''} connue
        {unions.length > 1 ? 's' : ''} et de {totalEnfants} enfant{totalEnfants > 1 ? 's' : ''}{' '}
        recensé{totalEnfants > 1 ? 's' : ''}.
      </div>
    </div>
  );
}
