//RelationsAccordion.tsx

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { DataTable, type ColumnDef } from '@/components/shared/DataTable';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { displayNom } from '@/lib/nom';

export default function RelationsAccordion({
  individuId,
  acteurId,
  acteId,
}: {
  individuId?: string;
  acteurId?: string;
  acteId?: string;
}) {
  const [relations, setRelations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {

    const fetchRelations = async () => {
      setLoading(true);

      let rawRelations = [];

      if (individuId) {
        const { data, error } = await supabase
          .from('v_acteurs_relations')
          .select('*')
          .or(`individu_source_id.eq.${individuId},individu_cible_id.eq.${individuId}`);
        if (error) {
          console.error('Erreur relations (individu)', error);
          setLoading(false);
          return;
        }
        rawRelations = data ?? [];
      } else if (acteurId && acteId) {
        const { data, error } = await supabase
          .from('v_acteurs_relations')
          .select('*')
          .eq('acte_id', acteId)
          .or(`acteur_source_id.eq.${acteurId},acteur_cible_id.eq.${acteurId}`);
        if (error) {
          console.error('Erreur relations (acteur)', error);
          setLoading(false);
          return;
        }
        rawRelations = data ?? [];
      } else {
        return; // ni individuId ni acteurId → pas de requête
      }

      const individuIds = Array.from(
        new Set([
          ...rawRelations.map((r) => r.individu_source_id).filter(Boolean),
          ...rawRelations.map((r) => r.individu_cible_id).filter(Boolean),
        ])
      );

      const acteurIds = Array.from(
        new Set([
          ...rawRelations.map((r) => r.acteur_source_id).filter(Boolean),
          ...rawRelations.map((r) => r.acteur_cible_id).filter(Boolean),
        ])
      );

      const { data: acteurs, error: actError } = await supabase
        .from('v_acteurs_enrichis')
        .select('id, prenom, nom, acte_date, acte_label')
        .in('id', acteurIds);

      const { data: individus, error: indError } = await supabase
        .from('v_individus_enrichis')
        .select('id, prenom, nom')
        .in('id', individuIds);

      const individusById = Object.fromEntries(
        (individus ?? []).map((i) => [i.id, { prenom: i.prenom, nom: i.nom }]),
      );

      const acteursById = Object.fromEntries(
        (acteurs ?? []).map((a) => [
          a.id,
          {
            prenom: a.prenom,
            nom: a.nom,
            acte_label: a.acte_label,
            acte_date: a.acte_date,
          },
        ]),
      );

      const enriched = (rawRelations ?? []).map((rel) => {
        const sourceIndividu = rel.individu_source_id
          ? individusById[rel.individu_source_id]
          : null;
        const cibleIndividu = rel.individu_cible_id ? individusById[rel.individu_cible_id] : null;

        const sourceActeur = acteursById[rel.acteur_source_id] ?? {};
        const cibleActeur = acteursById[rel.acteur_cible_id] ?? {};

        const sourcePrenom = sourceIndividu?.prenom ?? sourceActeur.prenom ?? '';
        const sourceNom = sourceIndividu?.nom ?? sourceActeur.nom ?? '';

        const ciblePrenom = cibleIndividu?.prenom ?? cibleActeur.prenom ?? '';
        const cibleNom = cibleIndividu?.nom ?? cibleActeur.nom ?? '';

        const acteLabel = sourceActeur.acte_label ?? cibleActeur.acte_label ?? '';
        const acteDate = sourceActeur.acte_date ?? cibleActeur.acte_date ?? '';

        return {
          ...rel,
          individu_source_prenom: sourcePrenom,
          individu_source_nom: sourceNom,
          individu_cible_prenom: ciblePrenom,
          individu_cible_nom: cibleNom,
          acte_label: acteLabel,
          acte_date: acteDate,
        };
      });

      setRelations(enriched);
      setLoading(false);
    };

    if (individuId) fetchRelations();
    if (acteurId && acteId) fetchRelations();
  }, [individuId, acteurId, acteId]);

  const pivotIndividuId = individuId ?? null;
  const pivotActeurId = acteurId ?? null;

  const grouped: Record<string, { sourceToCible: any[]; cibleToSource: any[]; label: string }> =
    relations.reduce((acc, rel) => {
      const sourceKey = rel.individu_source_id ?? `acteur-${rel.acteur_source_id}`;
      const cibleKey = rel.individu_cible_id ?? `acteur-${rel.acteur_cible_id}`;
      const pairKey = [sourceKey, cibleKey].sort().join('-');

      acc[pairKey] ||= { sourceToCible: [], cibleToSource: [], label: '' };

      const nomSource = displayNom(rel.individu_source_prenom, rel.individu_source_nom);
      const nomCible = displayNom(rel.individu_cible_prenom, rel.individu_cible_nom);

      const isPivotSource =
        rel.individu_source_id === pivotIndividuId || rel.acteur_source_id === pivotActeurId;

      if (isPivotSource) {
        acc[pairKey].sourceToCible.push(rel);
        acc[pairKey].label = `${nomSource} → ${nomCible}`;
      } else {
        acc[pairKey].cibleToSource.push(rel);
        acc[pairKey].label = `${nomCible} → ${nomSource}`;
      }

      return acc;
    }, {});


  const columns: ColumnDef<any>[] = [
    { key: 'acte_label', label: 'Acte', columnWidth: '50%' },
    { key: 'acte_date', label: "Date de l'acte", columnWidth: '10%' },
    { key: 'relation_type', label: 'Type de relation', columnWidth: '10%' },
    { key: 'source_mention', label: 'Mention dans l’acte', columnWidth: '10%' },
    { key: 'source_relation', label: 'Origine de la relation', columnWidth: '10%' },
    { key: 'statut', label: 'Statut', columnWidth: '10%' },
  ];

  if (loading) return <p className='text-sm text-gray-500 italic'>Chargement des relations...</p>;
  if (!relations.length)
    return <p className='text-sm text-muted-foreground'>Aucune relation trouvée.</p>;

  return (
    <Accordion type='multiple'>
      {Object.entries(grouped).map(([key, value]) => {
        const { sourceToCible, cibleToSource, label } = value;
        return (
          <AccordionItem value={key} key={key}>
            <AccordionTrigger>{label}</AccordionTrigger>
            <AccordionContent>
              {sourceToCible.length > 0 && (
                <div className='mb-4'>
                  <p className='font-semibold text-sm mb-1'>Dans le sens {label} :</p>
                  <DataTable
                    data={sourceToCible}
                    columns={columns}
                    pageSize={-1}
                    showMenu={false}
                  />
                </div>
              )}
              {cibleToSource.length > 0 && (
                <div>
                  <p className='font-semibold text-sm mb-1'>Dans le sens inverse :</p>
                  <DataTable
                    data={cibleToSource}
                    columns={columns}
                    pageSize={-1}
                    showMenu={false}
                  />
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
