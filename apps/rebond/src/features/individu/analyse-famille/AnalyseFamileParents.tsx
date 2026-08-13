//BlocParents

import React, { useEffect, useState, type JSX } from 'react';
import { supabase } from '@/lib/supabase';
import { getFiliationPhrases } from '@/lib/enrichirNarration';
import { getChronoProfessions, getDeces, getNaissance } from '@/lib/enrichirIndividu';
import { formatDateToFrench } from '@/utils/date';
import type { IndividuMinimal } from '@/features/mock-up/GenealogieTree2';

type Parent = {
  id: string;
  nomComplet: string;
  sexe: 'M' | 'F';
  naissance: { date?: string; lieu?: string };
  deces?: { date?: string; lieu?: string; age?: number };
  professions?: string[];
  remarriage?: { annee?: number; conjoint: string; circonstances?: string };
};

type BlocParentsProps = {
  enfant: IndividuMinimal;
  parents?: any[];
  pere?: any;
  mere?: any;
  union?: any;
};

export type ActeursParActe = {
  acteId: string;
  acteurs: any[];
};

export const BlocParents: React.FC<BlocParentsProps> = ({ enfant, pere, mere, union }) => {

  const fetchFiliation = async (individuId: string) => {
    const { data, error } = await supabase.rpc('get_filiation', { p_individu_id: individuId });

    if (error) {
      console.error('Erreur filiation:', error);
      return [];
    }

    return data;
  };

  const [filiation, setFiliation] = useState<string>('');
  const [filiationObj, setFiliationObj] = useState<any>();

  const fetchActeursByActeId = async (acteId: string): Promise<ActeursParActe | null> => {
    const { data, error } = await supabase
      .from('v_acteurs_enrichis')
      .select('*')
      .eq('acte_id', acteId);

    if (error) {
      console.error(`Erreur pour acte_id ${acteId} :`, error);
      return null;
    }

    return {
      acteId,
      acteurs: data ?? [],
    };
  };

  useEffect(() => {
    if (!enfant?.id) return;

    const chargerFiliationEtActeurs = async () => {
      const filiation = await fetchFiliation(enfant.id);
      const sexe = enfant.sexe as 'M' | 'F';

      const acteIdsUniques = Array.from(
        new Set(filiation.map((f: any) => f.acte_id).filter(Boolean)),
      );

      const promises = (acteIdsUniques as string[]).map(fetchActeursByActeId);

      const results = await Promise.all(promises);
      const actesAssocies = results.filter((r): r is ActeursParActe => r !== null);

      const phrase = getFiliationPhrases(filiation, sexe, actesAssocies);
      setFiliationObj(filiation);
      setFiliation(phrase);

      if (pere?.id) {
        await fetchPereActeursByIndividu(pere.id);
      }

      if (mere?.id) {
        await fetchMereActeursByIndividu(mere.id);
      }
    };

    chargerFiliationEtActeurs();
  }, [enfant.id]);

  const getDescriptionParent = (parent: Parent, role: 'Père' | 'Mère') => {
    const lignes = [];

    lignes.push(
      <span className='font-medium text-gray-600'>{role} :</span>,
      ' ',
      <span className='text-indigo-700'>{parent.nomComplet}</span>,
    );

    const desc = [];
    desc.push(
      '🚧 gestion de la ponctuaction, notamment quand pas de métier; plus de précisions sur les lieux quand existe une note.',
    );

    if (parent.naissance?.date || parent.naissance?.lieu) {
      desc.push(
        `Né${parent.sexe === 'F' ? 'e' : ''} ${parent.naissance.date ?? 'date inconnue'}${
          parent.naissance.lieu ? ` - ${parent.naissance.lieu}` : ''
        }`,
      );
    }

    if (parent.professions?.length) {
      desc.push(
        `, ${parent.sexe === 'F' ? 'elle' : 'il'} a exercé l${parent.professions?.length === 1 ? 'a' : 'es'} profession${parent.professions?.length === 1 ? '' : 's'} de${parent.professions?.length === 1 ? '' : ':'} ${parent.professions.join(', ')}. `,
      );
    }

    if (parent.deces) {
      const age = parent.deces.age ? ` à l’âge de ${parent.deces.age} ans` : '';
      desc.push(
        `${parent.sexe === 'F' ? 'Elle' : 'Il'} est décédé${parent.sexe === 'F' ? 'e' : ''} ${parent.deces.date}${
          parent.deces.lieu ? ` - ${parent.deces.lieu}` : ''
        }${age}.`,
      );
    }

    if (parent.remarriage) {
      desc.push(
        ` Remarié${parent.sexe === 'F' ? 'e' : ''} en ${parent.remarriage.annee} avec ${
          parent.remarriage.conjoint
        }${parent.remarriage.circonstances ? `, ${parent.remarriage.circonstances}` : ''}.`,
      );
    }

    return (
      <li className='space-y-1'>
        {lignes}
        <br />
        <span className='text-gray-700'>{desc.join('')}</span>
      </li>
    );
  };

  const intro = `${enfant.prenom} est ${enfant.sexe == 'F' ? 'née' : 'né'} de l’union ${pere ? 'de ' + [pere.prenom, pere.nom].filter(Boolean).join(' ') : "d'un père inconnu"} et ${mere ? 'de ' + [mere.prenom, mere.nom].filter(Boolean).join(' ') : "d'une mère inconnue"}.`;
  
  const unionB = union
    ? union.type == 'mariage civil'
      ? `Ses parents se sont unis par ${union.type}${
          union.date || union.lieu
            ? ` ${union.date ? 'le ' + formatDateToFrench(union.date) : 'à une date inconnue'}. ${union.lieu ? ` La célébration du mariage ${union.lieu.startsWith('Mairie') ? " s'est tenue en la " + union.lieu : union.lieu.startsWith('transport') ? ' a été ' + union.lieu.replace('transporté', 'transportée') : " s'est tenue à " + union.lieu}` : " s'est tenu à un lieu inconnu"}`
            : ''
        }.`
      : filiationObj && filiationObj.some((a: any) => a.filiation === 'légitime')
        ? `Ses parents étaient probablement mariés, ${enfant.prenom} ayant été ${enfant.sexe == 'F' ? 'reconnue' : 'reconnu'} comme légitime. Toutefois, les données disponibles ne permettent pas d’identifier la date ni le lieu de leur union.`
        : `Ses parents n'étaient pas mariés.`
    : '';

  const enfantsConnus =
    union && union.nbEnfantsConnus
      ? ` Les données disponibles ont permis d'identifier ${union.nbEnfantsConnus} enfants pour ce couple.`
      : '';

  const [pereActeursByIndividu, setPereActeursByIndividu] = useState<any[] | null>(null);
  const [mereActeursByIndividu, setMereActeursByIndividu] = useState<any[] | null>(null);

  const fetchPereActeursByIndividu = async (id: string) => {
    const { data } = await supabase.from('v_acteurs_enrichis').select('*').eq('individu_id', id);

    setPereActeursByIndividu(data ?? []);
  };
  const fetchMereActeursByIndividu = async (id: string) => {
    const { data } = await supabase.from('v_acteurs_enrichis').select('*').eq('individu_id', id);

    setMereActeursByIndividu(data ?? []);
  };

  const pereProfessionsChrono = getChronoProfessions(pereActeursByIndividu || []);

  const pereNaissance = getNaissance(pereActeursByIndividu || []);
  const pereDeces = getDeces(pereActeursByIndividu || []);

  const mereProfessionsChrono = getChronoProfessions(mereActeursByIndividu || []);

  const mereNaissance = getNaissance(mereActeursByIndividu || []);
  const mereDeces = getDeces(mereActeursByIndividu || []);

  const pereParent: Parent | null = pere
    ? {
        id: pere.id,
        nomComplet: [pere.prenom, pere.nom].filter(Boolean).join(' '),
        sexe: 'M',
        naissance: {
          date: pereNaissance.date,
          lieu: pereNaissance.lieu,
        },
        deces: {
          date: pereDeces.date,
          lieu: pereDeces.lieu,
        },
        professions: pereProfessionsChrono ? pereProfessionsChrono.split(', ') : [],
      }
    : null;

  const mereParent: Parent | null = mere
    ? {
        id: mere.id,
        nomComplet: [mere.prenom, mere.nom].filter(Boolean).join(' '),
        sexe: 'F',
        naissance: {
          date: mereNaissance.date,
          lieu: mereNaissance.lieu,
        },
        deces: {
          date: mereDeces.date,
          lieu: mereDeces.lieu,
        },
        professions: mereProfessionsChrono ? mereProfessionsChrono.split(', ') : [],
      }
    : null;

  const lignes: (string | JSX.Element)[] = [];

  if (intro) lignes.push(intro);
  if (filiation) lignes.push(filiation);
  if (unionB) lignes.push(unionB);
  if (enfantsConnus) lignes.push(enfantsConnus);

  return (
    <div className='bg-white border border-gray-300 rounded shadow-sm p-4'>
      <h4 className='text-base font-semibold mb-2'>👨‍👩‍👧 Parents</h4>
      <p className='text-sm mb-4'>
        {lignes.map((ligne, i) => (
          <React.Fragment key={i}>
            {ligne}
            {i < lignes.length - 1 && (
              <>
                <br />
                <br />
              </>
            )}
          </React.Fragment>
        ))}
      </p>
      {(pereParent || mereParent) && (
        <div className='mt-4 border-t pt-3 text-sm text-gray-600'>
          <ul className='space-y-3 text-sm'>
            {pereParent && getDescriptionParent(pereParent, 'Père')}
            {mereParent && getDescriptionParent(mereParent, 'Mère')}
          </ul>
        </div>
      )}
    </div>
  );
};
