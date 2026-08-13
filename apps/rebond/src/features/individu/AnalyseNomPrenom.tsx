// AnalyseNomPrenom.tsx

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ListChecks, ListOrdered, Search } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import IndividuLigneDeVieTable from './IndividuLigneDeVieTable';
import { getAnalysePatronyme, getNarration } from '@/lib/enrichirNarration';

interface AnalyseNomPrenomProps {
  activeIndividu: any;
  mentions: any[];
}

export default function AnalyseNomPrenom({ activeIndividu, mentions }: AnalyseNomPrenomProps) {
  const formes = useMemo(() => {
    const uniq = new Map<string, any>();
    mentions.forEach((m) => {
      const key = `${m.nom} ${m.prenom}`.trim();
      if (!uniq.has(key)) uniq.set(key, m);
    });
    return Array.from(uniq.values());
  }, [mentions]);

  const frequencesPrenoms = useMemo(() => {
    const freq: Record<string, number> = {};
    mentions.forEach((m) => {
      m.prenom.split(/\s+/).forEach((p: any) => {
        const key = p.trim();
        if (!key) return;
        freq[key] = (freq[key] || 0) + 1;
      });
    });
    return Object.entries(freq).sort((a, b) => b[1] - a[1]);
  }, [mentions]);

  return (
    <div className='space-y-6 px-4 w-full'>
      <div className='flex items-center gap-2 text-2xl font-bold'>
        <Search className='w-5 h-5 text-muted-foreground' />
        Analyse des noms & prénoms
      </div>

      <Accordion type='multiple' defaultValue={['narration']}>
        <AccordionItem value='narration'>
          <AccordionTrigger>🧠 Interprétation narrative</AccordionTrigger>
          <AccordionContent>
            {getNarration(activeIndividu, mentions)
              .split('\n\n')
              .map((para, idx) => (
                <p key={idx} className='leading-relaxed mb-4'>
                  {para}
                </p>
              ))}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value='patronyme'>
          <AccordionTrigger>🔍 Analyse du patronyme</AccordionTrigger>
          <AccordionContent>
            {getAnalysePatronyme(mentions, activeIndividu)
              .split('\n\n')
              .map((para, idx) => (
                <p key={idx} className='leading-relaxed mb-4'>
                  {para}
                </p>
              ))}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value='formes'>
          <AccordionTrigger>📋 Formes utilisées dans les actes</AccordionTrigger>
          <AccordionContent>
            <ul className='list-disc pl-5 space-y-1 leading-relaxed'>
              {formes.map((f, idx) => (
                <li key={idx}>
                  <span className='font-medium'>
                    {f.nom || '—'} {f.prenom}
                  </span>{' '}
                  — {f.acte_label} ({format(new Date(f.acte_date), 'yyyy')})
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value='frequences'>
          <AccordionTrigger>📊 Fréquence des prénoms</AccordionTrigger>
          <AccordionContent>
            <div className='flex flex-wrap gap-2 pt-2'>
              {frequencesPrenoms.map(([prenom, count]) => (
                <Badge key={prenom} variant='outline'>
                  {prenom} ({count})
                </Badge>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value='liste'>
          <AccordionTrigger>
            <div className='flex items-center gap-2'>
              <ListOrdered className='w-4 h-4' />
              Liste des prénoms
              <Badge variant='secondary' className='ml-2'>
                {mentions.length}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className='w-fit min-w-[50%] overflow-auto'>
              <IndividuLigneDeVieTable
                title='Liste des prénoms'
                enrichis={mentions}
                visibleColumns={['date', 'qualite', 'nom', 'prenom', 'acteRaccourci']}
                pageSize={10}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value='criteres'>
          <AccordionTrigger>
            <div className='flex items-center gap-2'>
              <ListChecks className='w-4 h-4' />
              Critères d’analyse du nom et du prénom dans les actes
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <ul className='list-decimal pl-5 space-y-3 text-sm leading-relaxed'>
              <li>
                <strong>Variabilité du couple nom/prénom ✅</strong>
                <br />
                Combien de formes différentes observe-t-on pour cet individu ? → Ex : "LUCE
                Lodoïska", "MARIE JOSEPH Luce", "SANS NOM Lucie..."
              </li>
              <li>
                <strong>Stabilité des prénoms individuels ✅</strong>
                <br />
                Quels prénoms apparaissent le plus souvent ? → Ex : "Lodoïska" est présent dans
                toutes les formes ; "Marie" et "Joseph" sont fréquents, "Lucie" est marginal.
              </li>
              <li>
                <strong>Présence ou absence du nom de famille ✅</strong>
                <br />
                Le nom est-il systématiquement indiqué ? Disparaît-il dans certains contextes ? → Ex
                : le patronyme "LUCE" disparaît dans plusieurs actes.
              </li>
              <li>
                <strong>Position et ordre des prénoms</strong>
                <br />Y a-t-il un prénom principal identifiable ? L’ordre est-il constant ? → Ex :
                "Lodoïska" est parfois au début, parfois au milieu.
              </li>
              <li>
                <strong>Graphie et homogénéité orthographique</strong>
                <br />Y a-t-il des variations ? → Ex : "Luce" vs "Lucie", ou inversion "Marie
                Joseph" vs "Joseph Marie".
              </li>
              <li>
                <strong>Genre implicite dans le prénom</strong>
                <br />
                Les prénoms correspondent-ils au sexe mentionné ? → Pour repérer anomalies ou
                conventions genrées.
              </li>
              <li>
                <strong>Lien avec le contexte de l’acte</strong>
                <br />
                Le rôle joué influence-t-il la forme utilisée ? → Ex : actes des enfants moins
                précis.
              </li>
              <li>
                <strong>Évolution chronologique des formes</strong>
                <br />
                Observe-t-on des changements au fil du temps ? → Ex : simplification progressive du
                nom.
              </li>
              <li>
                <strong>Fréquence des mentions sans nom</strong>
                <br />
                Mentions comme "? SANS NOM" fréquentes ? → Peut révéler des usages locaux ou un
                effacement social.
              </li>
              <li>
                <strong>Appartenance culturelle ou religieuse</strong>
                <br />
                Les prénoms ont-ils une connotation particulière ? → Ex : "Marie Joseph", prénoms
                chrétiens courants.
              </li>
              <li>
                <strong>Origine administrative du nom</strong>
                <br />
                Le nom de famille a-t-il été attribué lors d’un affranchissement ou d’un
                enregistrement officiel post-abolition ? → Ex : patronyme attribué en 1848 ou dans
                un registre des "nouveaux libres".
              </li>
              <li>
                <strong>Résonance communautaire du prénom</strong>
                <br />
                Le prénom est-il partagé par d’autres individus dans la même commune ou famille ? →
                Ex : usage répété de "Lodoïska" ou "Marie Joseph" dans une fratrie ou une communauté
                afro-descendante locale.
              </li>
              <li>
                <strong>Fonction symbolique ou affective du prénom</strong>
                <br />
                Le prénom peut-il traduire une relation affective, une mémoire familiale ou une
                stratégie sociale ? → Ex : transmission d’un prénom du père ou d’un frère décédé.
              </li>
              <li>
                <strong>Français standard vs créolisation du prénom</strong>
                <br />
                Le prénom a-t-il une forme francisée, ou au contraire créolisée ou transformée
                oralement ? → Ex : "Lucie" au lieu de "Luce" ; "Félie" pour "Félicité".
              </li>
              <li>
                <strong>Influence des notaires / officiers d'état civil</strong>
                <br />
                Peut-on repérer des habitudes d’écriture liées à un scribe ou une mairie en
                particulier ? → Ex : le même officier omet toujours le nom des mères.
              </li>
              <li>
                <strong>Apparition du prénom dans d’autres actes</strong>
                <br />
                Le prénom est-il mentionné ailleurs (testaments, recensements, contrats
                d’engagement, etc.) ? → Cela permet de mesurer la cohérence entre les sources.
              </li>
              <li>
                <strong>Liens avec des noms d’habitations ou de propriétaires</strong>
                <br />
                Le nom ou le prénom évoque-t-il une plantation, un maître, une famille de
                propriétaires ? → Ex : "Bellevue", "Dorval", ou "Joseph" en référence au maître ou à
                l’habitation.
              </li>
              <li>
                <strong>
                  Mention explicite ou implicite de l’absence d’état civil avant l’abolition
                </strong>
                <br />
                Le fait de ne pas avoir de nom de famille ou d’avoir un nom incomplet renvoie-t-il à
                une période pré-affranchissement ? → Ex : acte avec "? SANS NOM", surtout pour les
                femmes nées avant 1848.
              </li>
              <li>
                <strong>Association entre nom/prénom et statut social</strong>
                <br />
                Certains prénoms sont-ils plus fréquents chez les libres, affranchis, esclaves, ou
                engagés ? → Ex : "Lodoïska" chez les libres de couleur, "Marie" dans tous les
                statuts.
              </li>
              <li>
                <strong>Tension entre nom officiel et nom usuel</strong>
                <br />
                Existe-t-il un écart entre le nom/prénom utilisé à l’état civil et celui transmis
                oralement ou dans d’autres documents ? → Ex : "Luce" est peut-être un surnom ou un
                prénom usuel simplifié.
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
