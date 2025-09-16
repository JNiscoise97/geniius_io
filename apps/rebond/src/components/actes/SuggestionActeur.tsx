//SuggestionActeur.tsx

import { useEffect, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { displayNom } from '@/lib/nom';
import type { FormulaireActeurHandle } from './FormulaireActeur';
import { Navigation } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { StatusPill } from '@/components/shared/StatusPill';
import { ComparaisonActeur } from './ComparaisonActeur';
import { supabase } from '@/lib/supabase';

type Props = {
  acteur: any;
  acteId: string;
  acteDate: string;
  formRef: React.RefObject<FormulaireActeurHandle | null>;
  onFusionnerChange: (val: boolean, suggestion: any) => void;
};


export function SuggestionActeur({
  acteur,
  acteId,
  acteDate,
  formRef,
  onFusionnerChange,
}: Props) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
const [modeComparaison, setModeComparaison] = useState<any | null>(null);
  const fetchSuggestions = async (nom: string, prenom: string, sexe: string, age: string) => {
    if (!nom && !prenom) return;

    setLoading(true);
    let query = supabase
      .from('v_acteurs_enrichis')
      .select(`
    id,
    nom,
    prenom,
    role,
    lien,
    qualite,
    profession_brut,
    statut_brut,
    fonction,
    domicile,
    sexe,
    naissance_date,
    naissance_lieux,
    deces_date,
    deces_lieux,
    origine,
    a_signe,
    signature,
    signature_libelle,
    age,
    domicile,
    individu_id,
    acte_date,
    acte_statut,
    est_present,
    est_vivant
  `)
      .ilike('nom', `%${nom}%`)
      .ilike('prenom', `%${prenom}%`)
      .ilike('sexe', `%${sexe}%`)
      .limit(10);

    if (acteur?.id) {
      query = query.neq('id', acteur.id);
    }

    const { data, error } = await query;


    if (!error && data) {
      const acteurContexte = {
        ...acteur,
        annee: acteur.annee || (acteur.acte_date ? Number(acteur.acte_date.slice(0, 4)) : null),
      };

      const sorted = data
        .map((s: any) => {
          const { total, details } = getPertinenceScore(s, acteurContexte, acteDate);
          const acteAnnee = s.acte_date ? Number(s.acte_date.slice(0, 4)) : null;
          const deltaAnnee =
            acteurContexte.annee && acteAnnee ? Math.abs(acteAnnee - acteurContexte.annee) : 999;
          return {
            ...s,
            pertinence: total,
            justification: details,
            deltaAnnee,
          };
        })
        .sort((a: any, b: any) => b.pertinence - a.pertinence || a.deltaAnnee - b.deltaAnnee);

      setSuggestions(sorted);
    }

    setLoading(false);
  };

  const debouncedFetch = useDebouncedCallback(
    (nom: string, prenom: string, sexe: string, age: string) => {
      fetchSuggestions(nom, prenom, sexe, age);
    },
    400, // délai en ms
  );

  useEffect(() => {
    debouncedFetch(acteur?.nom ?? '', acteur?.prenom ?? '', acteur?.sexe ?? '', acteur?.age ?? '');
  }, [acteur?.nom, acteur?.prenom, acteur?.sexe, acteur?.age]);

  const handleImporter = (suggestion: any) => {
    setModeComparaison(suggestion);
  };

  return (
    <div className='flex flex-col gap-4'>
      <h2 className='text-lg font-semibold'>Suggestions d’acteurs similaires</h2>
      {loading && <p className='text-gray-500 text-sm'>Chargement...</p>}
      {!loading && suggestions.length === 0 && (
        <p className='text-gray-500 text-sm'>Aucune suggestion pour ce nom.</p>
      )}

      {modeComparaison ? (
        <ComparaisonActeur
          suggestion={modeComparaison}
          key={modeComparaison?.id}
          destination={acteur}
          onClose={() => setModeComparaison(null)}
          onCopy={(field) => {
            const updated = { ...acteur, [field]: modeComparaison[field] };
            formRef.current?.setValues(updated);
          }}
          onFusionnerChange={(val) => onFusionnerChange(val, modeComparaison)}
        />
      ) : (
        suggestions.map((s) => {
          const pertinenceLabel =
            (s.pertinence ?? 0) >= 9 ? 'Haute' : (s.pertinence ?? 0) >= 5 ? 'Moyenne' : 'Faible';
          const pertinenceColor =
            pertinenceLabel === 'Haute'
              ? 'bg-green-100 text-green-700'
              : pertinenceLabel === 'Moyenne'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700';

          return (
            <Card key={s.id} className='border border-gray-200 shadow-sm'>
              <CardContent className='p-4 flex flex-col gap-3 text-sm text-gray-800'>
                {/* Ligne 1 – Nom + bouton + icône navigation */}
                <div className='flex justify-between items-center'>
                  <div className='flex items-center gap-2 text-lg font-semibold'>
                    {displayNom(s.prenom, s.nom)}
                    {s.individu_id && (
                      <a
                        href={`/individu/${s.individu_id}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-indigo-600 hover:text-indigo-800'
                      >
                        <Navigation className='w-4 h-4' />
                      </a>
                    )}
                  </div>
                  <Button variant='outline' size='sm' onClick={() => handleImporter(s)}>
                    Importer
                  </Button>
                </div>

                {/* Ligne 2 – Contexte & statut */}
                <div className='flex justify-between items-center text-xs text-gray-600'>
                  <div className='italic'>
                    {s.role && <>Rôle : {s.role} – </>}
                    {s.acte_date && <>Acte : {s.acte_date}</>}
                  </div>
                  <StatusPill statut={s.acte_statut || 'à transcrire'} />
                </div>

                {/* Ligne 3 – Pertinence */}
                <div>
                  <span
                    className={`inline-block text-xs rounded px-2 py-0.5 ${pertinenceColor}`}
                    title={s.justification?.join('\n')}
                  >
                    Pertinence : {pertinenceLabel}
                  </span>
                </div>

                {/* Bloc infos principales */}
                <div className='grid grid-cols-2 gap-x-6 gap-y-1 mt-1'>
                  <div>
                    <strong>Profession :</strong> {s.profession_brut ?? '—'}
                  </div>
                  <div>
                    <strong>Statut :</strong> {s.statut_brut ?? '—'}
                  </div>
                  <div>
                    <strong>Âge :</strong> {s.age ?? '—'}
                  </div>
                  <div>
                    <strong>Domicile :</strong> {s.domicile ?? '—'}
                  </div>
                </div>

                {/* Accordéon détails */}
                <Accordion type='single' collapsible>
                  <AccordionItem value='infos'>
                    <AccordionTrigger className='text-sm text-gray-600 hover:text-gray-800 mt-2'>
                      Voir plus de détails
                    </AccordionTrigger>
                    <AccordionContent className='mt-2 grid grid-cols-2 gap-x-6 gap-y-1'>
                      <div>
                        <strong>Fonction :</strong> {s.fonction ?? '—'}
                      </div>
                      <div>
                        <strong>Qualité :</strong> {s.qualite ?? '—'}
                      </div>
                      <div>
                        <strong>Lien :</strong> {s.lien ?? '—'}
                      </div>
                      <div>
                        <strong>Filiation :</strong> {s.filiation ?? '—'}
                      </div>
                      <div>
                        <strong>Sexe :</strong> {s.sexe ?? '—'}
                      </div>
                      <div>
                        <strong>Naissance :</strong> {s.naissance_date ?? '—'} à{' '}
                        {s.naissance_lieux ?? '—'}
                      </div>
                      <div>
                        <strong>Décès :</strong> {s.deces_date ?? '—'} à {s.deces_lieux ?? '—'}
                      </div>
                      <div>
                        <strong>Origine :</strong> {s.origine ?? '—'}
                      </div>
                      <div>
                        <strong>Signature :</strong>{' '}
                        {s.signature_libelle ?? (s.a_signe ? 'Oui' : 'Non')}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
function getPertinenceScore(
  s: any,
  acteur: any,
  anneeRef: string | null,
): { total: number; details: string[] } {
  let score = 0;
  const details: string[] = [];

  const nomMatch = s.nom?.toLowerCase() === acteur.nom?.toLowerCase();
  const prenomMatch = s.prenom?.toLowerCase() === acteur.prenom?.toLowerCase();
  const anneeActe = s.acte_date ? Number(s.acte_date.slice(0, 4)) : null;

  // Identité
  if (nomMatch && prenomMatch) {
    score += 6;
    details.push('Nom + prénom exacts (+6)');
  } else if (nomMatch) {
    score += 4;
    details.push('Nom seul correspond (+4)');
  } else if (prenomMatch) {
    score += 2;
    details.push('Prénom seul correspond (+2)');
  }

  // Temporalité
  let anneeRefNum: number | null = null;
  if (anneeRef && /^\d{4}/.test(anneeRef)) {
    anneeRefNum = Number(anneeRef.slice(0, 4));
  }
  if (anneeActe && anneeRefNum !== null) {
    const delta = Math.abs(anneeActe - anneeRefNum);
    if (delta === 0) {
      score += 6;
      details.push('Même année (+6)');
    } else if (delta === 1) {
      score += 4;
      details.push('À 1 an près (+4)');
    } else if (delta === 2) {
      score += 3;
      details.push('À 2 ans près (+3)');
    } else if (delta === 3) {
      score += 2;
      details.push('À 3 ans près (+2)');
    } else if (delta <= 5) {
      score += 1;
      details.push('Dans les 5 ans (+1)');
    }
  }

  const roleA = normalizeRole(s.role);
  const roleB = normalizeRole(acteur.role);

  if (roleA && roleA === roleB) {
    score += 4;
    details.push(`Même rôle générique (${roleA}) (+4)`);
  }

  // Comparaison année de naissance estimée (acteur.annee - acteur.age) vs s.naissance_date
  const sAgeNum = s.age ? parseInt(s.age, 10) : null;
  const sAnneeEstimeeNaissance = anneeActe && sAgeNum ? anneeActe - sAgeNum : null;
  const ageNum = acteur.age ? parseInt(acteur.age, 10) : null;
  const anneeEstimeeNaissance = anneeRefNum && ageNum ? anneeRefNum - ageNum : null;

  if (anneeEstimeeNaissance && sAnneeEstimeeNaissance) {
    const delta = Math.abs(sAnneeEstimeeNaissance - anneeEstimeeNaissance);
    if (delta === 0) {
      score += 4;
      details.push("Naissance estimée : même année (+4)");
    } else if (delta === 1) {
      score += 3;
      details.push("Naissance estimée : à 1 an près (+3)");
    } else if (delta === 2) {
      score += 2;
      details.push("Naissance estimée : à 2 ans près (+2)");
    } else if (delta === 3) {
      score += 1;
      details.push("Naissance estimée : à 3 ans près (+1)");
    } else if (delta <= 5) {
      score += 0.5;
      details.push("Naissance estimée : dans les 5 ans (+0.5)");
    }
  }

  // Sexe
  if (s.sexe && s.sexe === acteur.sexe) {
    score += 2;
    details.push('Même sexe (+2)');
  }

  // Profession
  if (s.profession_brut && s.profession_brut === acteur.profession_brut) {
    score += 2;
    details.push('Même profession (+2)');
  }

  // Localité
  if (
    (s.domicile && acteur.domicile && s.domicile === acteur.domicile) ||
    (s.origine && acteur.origine && s.origine === acteur.origine)
  ) {
    score += 2;
    details.push('Même domicile ou origine (+2)');
  }

  // Bonus
  if (s.individu_id) {
    score += 3;
    details.push('Déjà lié à un individu (+1)');
  }

  if (s.nb_apparitions && s.nb_apparitions > 1) {
    const bonus = Math.min(s.nb_apparitions, 3);
    score += bonus;
    details.push(`Déjà vu dans ${s.nb_apparitions} actes (+${bonus})`);
  }

  return { total: score, details };
}

function normalizeRole(role: string): string {
  if (!role) return '';
  const base = role.toLowerCase();
  if (base.startsWith('témoin')) return 'témoin';
  return base;
}
