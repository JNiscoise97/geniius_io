//AnalyseFamille.tsx

import { Search } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BlocParents } from './AnalyseFamileParents';
import BlocFratrie from './AnalyseFamilleFratrie';
import type { IndividuMinimal } from '@/features/mock-up/GenealogieTree2';
import GenealogyTree from '@/features/mock-up/GenealogieTree2';
import BlocUnionsEtEnfants from './AnalyseFamileUnionsEnfants';

interface AnalyseFamilleProps {
  activeIndividu: any;
  parents?: any[];
  pere?: any | null;
  mere?: any | null;
}

export default function AnalyseFamille({
  activeIndividu,
  parents,
  pere,
  mere,
}: AnalyseFamilleProps) {
  async function construireIndividusTreeAvecAscendants(
    individuId: string,
    profondeurMax: number = 4,
  ): Promise<{ tree: Record<string, IndividuMinimal>; profondeur: number }> {
    const tree: Record<string, IndividuMinimal> = {};
    let profondeurMaxAtteinte = 1;

    async function ajouterIndividuEtAscendants(id: string, profondeur: number) {
      if (profondeur > profondeurMax || tree[id]) return;

      profondeurMaxAtteinte = Math.max(profondeurMaxAtteinte, profondeur);

      const { data: ind } = await supabase
        .from('rebond_individus')
        .select('*')
        .eq('id', id)
        .single();

      if (!ind) return;

      tree[id] = {
        id: ind.id,
        prenom: ind.prenom,
        nom: ind.nom,
        sexe: ind.sexe,
        pereId: null,
        mereId: null,
      };

      const { data: parents } = await supabase.rpc('get_parents_for_individu', {
        p_individu_id: id,
      });

      if (profondeur < profondeurMax) {
        for (const parent of parents ?? []) {
          const parentId = parent.parent_individu_id;
          const role = parent.parent_role;

          if (!parentId) continue;

          await ajouterIndividuEtAscendants(parentId, profondeur + 1);

          if (role === 'père') tree[id].pereId = parentId;
          if (role === 'mère') tree[id].mereId = parentId;
        }
      }
    }

    await ajouterIndividuEtAscendants(individuId, 1);
    return { tree, profondeur: profondeurMaxAtteinte };
  }

  const [individusTree, setIndividusTree] = useState<Record<string, IndividuMinimal>>({});
  const [profondeurEffective, setProfondeurEffective] = useState<number>(3);

  useEffect(() => {
    if (!activeIndividu?.id) return;

    construireIndividusTreeAvecAscendants(activeIndividu.id).then(({ tree, profondeur }) => {
      setIndividusTree(tree);
      setProfondeurEffective(profondeur);
    });
  }, [activeIndividu?.id]);

  const [fratrie, setFratrie] = useState<any[]>([]);
  const [demiFratriePere, setDemiFratriePere] = useState<any[]>([]);
  const [demiFratrieMere, setDemiFratrieMere] = useState<any[]>([]);

  const [unionParents, setUnionParents] = useState<{
    type?: string;
    date?: string;
    lieu?: string;
    nbEnfantsConnus?: number | null;
  } | null>(null);

  useEffect(() => {
    if (!pere?.id || !mere?.id) return;

    const fetchUnion = async () => {
      const [unionsPere, unionsMere] = await Promise.all([
        supabase.rpc('get_unions_for_individu', { p_individu_id: pere.id }),
        supabase.rpc('get_unions_for_individu', { p_individu_id: mere.id }),
      ]);

      const pereUnions = unionsPere.data ?? [];
      const mereUnions = unionsMere.data ?? [];

      const unionCommune = pereUnions.find((up: any) =>
        mereUnions.some(
          (um: any) =>
            (up.union_acte_id && up.union_acte_id === um.union_acte_id) ||
            (up.conjoint_individu_id && up.conjoint_individu_id === mere.id) ||
            (um.conjoint_individu_id && um.conjoint_individu_id === pere.id),
        ),
      );

      let nbEnfantsCommuns: number | null = null;

      if (unionCommune) {
        const enfantsRes = await supabase.rpc('get_enfants_for_individu', {
          p_individu_id: pere.id,
        });

        if (!enfantsRes.error && enfantsRes.data) {
          nbEnfantsCommuns = enfantsRes.data.filter(
            (e: any) => e.autre_parent_individu_id === mere.id,
          ).length;
        }

        setUnionParents({
          type: unionCommune.type_union,
          date: unionCommune.date_mariage,
          lieu: unionCommune.lieu_mariage,
          nbEnfantsConnus: nbEnfantsCommuns,
        });
      }
    };

    fetchUnion();
  }, [pere?.id, mere?.id]);

  useEffect(() => {
    const idActif = activeIndividu?.id;
    const idMere = mere?.id;
    const idPere = pere?.id;

    if (!idActif) return;

    const fetchFratries = async () => {
      const enfantsMere = idMere
        ? ((
            await supabase.rpc('get_enfants_for_individu', {
              p_individu_id: idMere,
            })
          ).data ?? [])
        : [];

      const enfantsPere = idPere
        ? ((
            await supabase.rpc('get_enfants_for_individu', {
              p_individu_id: idPere,
            })
          ).data ?? [])
        : [];

      const enfantsCommuns =
        idMere && idPere
          ? enfantsPere.filter((eP: any) =>
              enfantsMere.some(
                (eM: any) =>
                  eM.enfant_individu_id === eP.enfant_individu_id &&
                  eM.enfant_individu_id !== idActif,
              ),
            )
          : [];

      setFratrie(enfantsCommuns);

      const demiP = enfantsPere.filter(
        (e: any) =>
          e.enfant_individu_id !== idActif &&
          !enfantsCommuns.some((ec: any) => ec.enfant_individu_id === e.enfant_individu_id),
      );
      const demiM = enfantsMere.filter(
        (e: any) =>
          e.enfant_individu_id !== idActif &&
          !enfantsCommuns.some((ec: any) => ec.enfant_individu_id === e.enfant_individu_id),
      );

      setDemiFratriePere(idPere ? demiP : []);
      setDemiFratrieMere(idMere ? demiM : []);
    };

    fetchFratries();
  }, [activeIndividu?.id, pere?.id, mere?.id]);

  const [unions, setUnions] = useState<any[]>([]);
const [enfantsParUnion, setEnfantsParUnion] = useState<Record<string, any[]>>({});
const [enfantsSansUnion, setEnfantsSansUnion] = useState<any[]>([]);

// Fetch dans un useEffect
useEffect(() => {
  if (!activeIndividu?.id) return;

  const fetchUnionsEtEnfants = async () => {
    const [unionsRes, enfantsRes] = await Promise.all([
      supabase.rpc('get_unions_for_individu', {
        p_individu_id: activeIndividu.id,
      }),
      supabase.rpc('get_enfants_for_individu', {
        p_individu_id: activeIndividu.id,
      }),
    ]);

    const unions = unionsRes.data ?? [];
    const enfants = enfantsRes.data ?? [];

    const enfantsAssoc: Record<string, any[]> = {};
    const enfantsSans: any[] = [];

    for (const enfant of enfants) {
      const union = unions.find((u:any) =>
        u.union_acte_id && enfant.union_acte_id
          ? u.union_acte_id === enfant.union_acte_id
          : u.conjoint_individu_id === enfant.autre_parent_individu_id
      );

      if (union) {
        const key = union.union_acte_id || union.conjoint_individu_id;
        enfantsAssoc[key] = enfantsAssoc[key] || [];
        enfantsAssoc[key].push(enfant);
      } else {
        enfantsSans.push(enfant);
      }
    }

    setUnions(unions);
    setEnfantsParUnion(enfantsAssoc);
    setEnfantsSansUnion(enfantsSans);
  };

  fetchUnionsEtEnfants();
}, [activeIndividu?.id]);

  return (
    <div className='space-y-6 px-4 w-full'>
      <div className='flex items-center gap-2 text-2xl font-bold'>
        <Search className='w-5 h-5 text-muted-foreground' />
        Analyse de la famille
      </div>

      <Accordion type='multiple' defaultValue={['proche', 'ascendants']}>
        <AccordionItem value='proche'>
          <AccordionTrigger>👥 Famille proche</AccordionTrigger>
          <AccordionContent>
            {/* à compléter : niveau 1 (liste parents, conjoints, enfants, frères/soeurs), niveau 2 (grands-parents, neveu nièce, oncles tantes) */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-800'>
              {/* Bloc Parents */}
              <BlocParents
                enfant={activeIndividu}
                parents={parents}
                pere={pere}
                mere={mere}
                union={unionParents}
              />

              {/* Bloc Frères & Sœurs */}
              <BlocFratrie
                fratrie={fratrie}
                demiFratriePere={demiFratriePere}
                demiFratrieMere={demiFratrieMere}
                individuId={activeIndividu?.id}
              />

              {/* Bloc Conjoints & Enfants */}
              <BlocUnionsEtEnfants
                unions={unions}
                enfantsParUnion={enfantsParUnion}
                enfantsSansUnion={enfantsSansUnion}
              />
              <div className='bg-white border border-gray-300 rounded shadow-sm p-4'>
                <h4 className='text-base font-semibold mb-4'>💍 Conjoints & Enfants</h4>

                {/* Union avec Claire */}
                <div className='mb-6'>
                  <p className='text-sm font-medium text-gray-600 mb-2'>
                    Union avec <span className='text-indigo-700'>Claire RENAUD</span> (mariage civil
                    – 5 mars 1852, Basse-Terre)
                  </p>
                  <ul className='list-disc list-inside text-gray-800 space-y-1'>
                    <li>
                      Marie-Claire LEMOINE (née en 1853 à Basse-Terre – décédée en 1912)
                      <span className='block text-xs text-gray-500 italic'>
                        Source : acte de naissance
                      </span>
                    </li>
                    <li>
                      Joseph LEMOINE (né en 1856 à Basse-Terre, affranchi de naissance)
                      <span className='block text-xs text-gray-500 italic'>
                        Source : registre des nouveaux libres
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Union avec Louise */}
                <div className='mb-6'>
                  <p className='text-sm font-medium text-gray-600 mb-2'>
                    Union avec <span className='text-indigo-700'>Louise BELFORT</span> (union libre
                    – résidaient à Pointe-Noire)
                  </p>
                  <ul className='list-disc list-inside text-gray-800 space-y-1'>
                    <li>
                      Rosalie LEMOINE (née en 1860 à Pointe-Noire, cultivatrice)
                      <span className='block text-xs text-gray-500 italic'>
                        Source : recensement 1878
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Enfants sans union */}
                <div className='mb-6'>
                  <p className='text-sm font-medium text-gray-600 mb-2'>
                    Enfants sans union identifiée
                  </p>
                  <ul className='list-disc list-inside text-gray-800 space-y-1'>
                    <li>
                      Inconnu LEMOINE (né vers 1865 — lien filial probable, mère non identifiée)
                      <span className='block text-xs text-gray-500 italic'>
                        Hypothèse fondée sur le recensement 1881
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Résumé en bas de bloc */}
                <div className='mt-4 border-t pt-3 text-sm text-gray-600'>
                  Cette famille se compose de 2 unions connues et de 4 enfants recensés, dont 1 sans
                  union identifiée. Les enfants sont nés entre 1853 et 1865 à Basse-Terre et
                  Pointe-Noire.
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value='ascendants'>
          <AccordionTrigger>🌳 Arbre généalogique ascendant</AccordionTrigger>
          <AccordionContent>
            {profondeurEffective > 1 && (
              <div className='w-full overflow-x-auto px-0'>
                <div className='min-w-fit'>
                  <GenealogyTree
                    individu={individusTree[activeIndividu?.id]}
                    individus={individusTree}
                    generations={profondeurEffective}
                  />
                </div>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value='descendants'>
          <AccordionTrigger>🌱 Arbre généalogique descendant</AccordionTrigger>
          <AccordionContent>{/* à implémenter : arbre descendant */}</AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
