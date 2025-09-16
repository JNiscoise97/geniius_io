//AnalyseProfessionStatutFonction.tsx

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Briefcase } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import IndividuLigneDeVieTable from './IndividuLigneDeVieTable';
import type { Filtre } from '@/components/shared/DataTable';

interface AnalyseProfessionStatutFonctionProps {
  activeIndividu: any;
  mentions?: any[] | null;
}

export default function AnalyseProfessionStatutFonction({
  activeIndividu,
  mentions,
}: AnalyseProfessionStatutFonctionProps) {
  const professions = useMemo(() => {
    const freq: Record<string, number> = {};
    mentions?.forEach((m) => {
      const p = m.profession_brut?.trim();
      if (p) freq[p] = (freq[p] || 0) + 1;
    });
    return Object.entries(freq).sort((a, b) => b[1] - a[1]);
  }, [mentions]);

  const statuts = useMemo(() => {
    const freq: Record<string, number> = {};
    mentions?.forEach((m) => {
      const s = m.statut_brut?.trim();
      if (s) freq[s] = (freq[s] || 0) + 1;
    });
    return Object.entries(freq).sort((a, b) => b[1] - a[1]);
  }, [mentions]);

  const fonctions = useMemo(() => {
    const freq: Record<string, number> = {};
    mentions?.forEach((m) => {
      const f = m.fonction?.trim();
      if (f) freq[f] = (freq[f] || 0) + 1;
    });
    return Object.entries(freq).sort((a, b) => b[1] - a[1]);
  }, [mentions]);

  const mentionsUtiles = mentions?.filter(
    (m) => m.est_vivant !== false && m.role !== 'enfant' && m.role !== 'enfant légitimé' && m.role !== 'sujet' && m.role !== 'mention',
  );

  const mentionsAvecProfession = mentionsUtiles?.filter((m) => m.profession_brut?.trim());
  const tauxProfessionMentionnee =
    mentionsUtiles && mentionsAvecProfession && mentionsUtiles.length > 0
      ? Math.round((mentionsAvecProfession.length / mentionsUtiles.length) * 100)
      : 0;

  const [appliedFiltresProfession, setAppliedFiltresProfession] = useState<Filtre[]>([]);
  useEffect(() => {
    setAppliedFiltresProfession([
      { colonne: 'profession_brut', operateur: 'n’est pas vide', valeur: '' },
    ]);
  }, []);


  const mentionsAvecStatut = mentionsUtiles?.filter((m) => m.statut_brut?.trim());
  const tauxStatutMentionne =
    mentionsUtiles && mentionsAvecStatut && mentionsUtiles.length > 0
      ? Math.round((mentionsAvecStatut.length / mentionsUtiles.length) * 100)
      : 0;

  const [appliedFiltresStatut, setAppliedFiltresStatut] = useState<Filtre[]>([]);
  useEffect(() => {
    setAppliedFiltresStatut([
      { colonne: 'statut_brut', operateur: 'n’est pas vide', valeur: '' },
    ]);
  }, []);


  const mentionsAvecFonction = mentionsUtiles?.filter((m) => m.fonction?.trim());
  const tauxFonctionMentionne =
    mentionsUtiles && mentionsAvecFonction && mentionsUtiles.length > 0
      ? Math.round((mentionsAvecFonction.length / mentionsUtiles.length) * 100)
      : 0;

  const [appliedFiltresFonction, setAppliedFiltresFonction] = useState<Filtre[]>([]);
  useEffect(() => {
    setAppliedFiltresFonction([
      { colonne: 'fonction', operateur: 'n’est pas vide', valeur: '' },
    ]);
  }, []);
  return (
    <div className='space-y-6 px-4 w-full'>
      <div className='flex items-center gap-2 text-2xl font-bold'>
        <Briefcase className='w-5 h-5 text-muted-foreground' />
        Analyse des professions, statuts & fonctions
      </div>

      <Accordion type='multiple' defaultValue={['professions']}>
        <AccordionItem value='professions'>
          <AccordionTrigger>🔨 Professions mentionnées</AccordionTrigger>
          <AccordionContent>
            <AccordionContent>
              {professions.length === 0 ? (
                <p>Aucune profession n’a été mentionnée dans les documents disponibles.</p>
              ) : (
                <>
                  <p className='pb-2'>
                    {professions.length === 1 ? (
                      `Une seule profession est mentionnée : « ${professions[0][0]} », présente ${professions[0][1]} fois. Elle apparaît dans environ ${tauxProfessionMentionnee} % des mentions pertinentes.`
                    ) : (
                      <>
                        Au total, {professions.length} professions différentes sont mentionnées. Les
                        plus fréquentes sont :{' '}
                        {professions
                          .slice(0, 3)
                          .map(([label, count]) => `« ${label} » (${count} fois)`)
                          .join(', ')}
                        . Les professions apparaissent dans environ {tauxProfessionMentionnee} % des
                        mentions pertinentes.
                      </>
                    )}
                  </p>
                  <div className='flex flex-wrap gap-2 pt-2'>
                    {professions.map(([label, count]) => (
                      <Badge key={label} variant='outline'>
                        {label} ({count})
                      </Badge>
                    ))}
                  </div>
                  <div className='w-fit min-w-[50%] overflow-auto'>
                    <IndividuLigneDeVieTable
                      enrichis={mentionsUtiles}
                      appliedFiltres={appliedFiltresProfession}
                      visibleColumns={['date', 'profession_brut', 'age']}
                      pageSize={-1}
                    />
                  </div>
                </>
              )}
            </AccordionContent>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value='statuts'>
          <AccordionTrigger>🛡️ Statuts particuliers</AccordionTrigger>
          <AccordionContent>
          {statuts.length === 0 ? (
                <p>Aucun statut n’a été mentionné dans les documents disponibles.</p>
              ) : (
                <>
                  <p className='pb-2'>
                    {statuts.length === 1 ? (
                      `Un seul statut est mentionné : « ${statuts[0][0]} », présent ${statuts[0][1]} fois. Il apparaît dans environ ${tauxStatutMentionne} % des mentions pertinentes.`
                    ) : (
                      <>
                        Au total, {statuts.length} statuts différents sont mentionnés. Les
                        plus fréquents sont :{' '}
                        {statuts
                          .slice(0, 3)
                          .map(([label, count]) => `« ${label} » (${count} fois)`)
                          .join(', ')}
                        . Les statuts apparaissent dans environ {tauxStatutMentionne} % des
                        mentions pertinentes.
                      </>
                    )}
                  </p>
                  <div className='flex flex-wrap gap-2 pt-2'>
                    {statuts.map(([label, count]) => (
                      <Badge key={label} variant='outline'>
                        {label} ({count})
                      </Badge>
                    ))}
                  </div>
                  <div className='w-fit min-w-[50%] overflow-auto'>
                    <IndividuLigneDeVieTable
                      enrichis={mentionsUtiles}
                      appliedFiltres={appliedFiltresStatut}
                      visibleColumns={['date', 'statut_brut', 'age']}
                      pageSize={-1}
                    />
                  </div>
                </>
              )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value='fonctions'>
          <AccordionTrigger>🏛️ Fonctions exercées</AccordionTrigger>
          <AccordionContent>
          {fonctions.length === 0 ? (
                <p>Aucune fonction n’a été mentionnée dans les documents disponibles.</p>
              ) : (
                <>
                  <p className='pb-2'>
                    {fonctions.length === 1 ? (
                      `Une seule fonction est mentionnée : « ${fonctions[0][0]} », présente ${fonctions[0][1]} fois. Elle apparaît dans environ ${tauxFonctionMentionne} % des mentions pertinentes.`
                    ) : (
                      <>
                        Au total, {fonctions.length} fonctions différentes sont mentionnées. Les
                        plus fréquentes sont :{' '}
                        {fonctions
                          .slice(0, 3)
                          .map(([label, count]) => `« ${label} » (${count} fois)`)
                          .join(', ')}
                        . Les fonctions apparaissent dans environ {tauxFonctionMentionne} % des
                        mentions pertinentes.
                      </>
                    )}
                  </p>
                  <div className='flex flex-wrap gap-2 pt-2'>
                    {fonctions.map(([label, count]) => (
                      <Badge key={label} variant='outline'>
                        {label} ({count})
                      </Badge>
                    ))}
                  </div>
                  <div className='w-fit min-w-[50%] overflow-auto'>
                    <IndividuLigneDeVieTable
                      enrichis={mentionsUtiles}
                      appliedFiltres={appliedFiltresFonction}
                      visibleColumns={['date', 'fonction', 'age']}
                      pageSize={-1}
                    />
                  </div>
                </>
              )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value='liste'>
          <AccordionTrigger>📋 Liste des mentions</AccordionTrigger>
          <AccordionContent>
            <div className='w-fit min-w-[50%] overflow-auto'>
              <IndividuLigneDeVieTable
                title='Mentions de professions, statuts et fonctions'
                enrichis={mentionsUtiles}
                visibleColumns={['date', 'acteRaccourci', 'profession_brut', 'statut_brut', 'fonction']}
                pageSize={10}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
