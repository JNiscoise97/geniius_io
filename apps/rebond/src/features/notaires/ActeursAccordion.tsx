// components/actes/ActeursAccordion.tsx
import { forwardRef, useEffect, useImperativeHandle, useMemo, type JSX } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Landmark, Users, Handshake, Baby, FileText, Navigation, User } from 'lucide-react';
import { useEntityStore } from '@/store/useEntityStore';
import type { ColumnDef } from '@/components/shared/DataTable';
import type { Entity } from '@/types/analyse';
import { ActeursSectionToggle } from '../etat-civil/suivi/ActeursSectionToggle';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { displayNom } from '@/lib/nom';
import { Badge } from '@/components/ui/badge';

type ActeursAccordionProps = {
  acteId: string;
  sourceTable: string;
  type?: 'role' | 'sous_categorie';
  mode?: 'view' | 'edit';
  relations?: any[];
  onEdit?: (acteur: any) => void;
  onDelete?: (id: string) => void;
  onAdd?: () => void;
};

export type ActeursAccordionHandle = {
  refreshEntities: () => void;
};

export const ActeursAccordion = forwardRef<ActeursAccordionHandle, ActeursAccordionProps>(
  function ActeursAccordion(
    { acteId, sourceTable, type = 'role', mode = 'view', relations = [], onEdit, onDelete, onAdd },
    ref,
  ) {
    const { fetchEntities, entities } = useEntityStore();

    // Permet à un parent d'appeler .refreshEntities()
    useImperativeHandle(ref, () => ({
      refreshEntities: () => fetchEntities(acteId, sourceTable),
    }));

    useEffect(() => {
      fetchEntities(acteId, sourceTable);
    }, [acteId]);

    const columns: ColumnDef<any>[] = [
      {
        key: 'individuId',
        label: 'Individu',
        columnWidth: '5%',
        render: (row) => {
          let result =  row.individu_id ? (
            <Link to={`/individu/${row.individu_id}`}>
              <Button variant='ghost' className='flex items-center gap-2 text-sm'>
                <Navigation className='w-4 h-4 opacity-70 text-indigo-600' />
              </Button>
            </Link>
          ) : null
          return result
        },
      },
      { key: 'qualite', label: 'Qualité', columnWidth: '7%' },
      {
        key: 'nom',
        label: 'Nom',
        render: (row) => displayNom(row.prenom, row.nom),
      },
      { key: 'sexe', label: 'Sexe', columnWidth: '4%' },
      { key: 'age', label: 'Âge', columnWidth: '6%' },
      { key: 'role', label: 'Rôle', columnWidth: '13%' },
      { key: 'lien', label: 'Lien', columnWidth: '15%' },
      { key: 'note', label: 'Note', columnWidth: '30%' },
    ];

    const grouped = useMemo(() => {
      if (type === 'sous_categorie') {
        const scGroup: Record<string, Entity[]> = {
          acteur_notaire: [],
          acteur_partie: [],
          acteur_representant: [],
          acteur_temoin: [],
          acteur_individu_cite: [],
          acteur_personne_morale: [],
          autres: [],
        };

        for (const e of entities) {
          const sc = e.categorie?.code;
          if (sc && scGroup[sc]) {
            scGroup[sc].push(e);
          } else {
            scGroup['autres'].push(e);
          }
        }

        return scGroup;
      }

      const group: Record<string, Entity[]> = {
        enfant: [],
        defunt: [],
        parties: [],
        parents: [],
        enfant_legitime: [],
        officier: [],
        temoins: [],
        autres: [],
      };

      for (const e of entities) {
        const role = e.mapping?.acteur?.role;
        if (!role) continue;

        if (role === 'officier') group.officier.push(e);
        else if (role === 'enfant') group.enfant.push(e);
        else if (role === 'défunt') group.defunt.push(e);
        else if (role === 'enfant légitimé') group.enfant_legitime.push(e);
        else if (['époux', 'épouse', 'sujet'].includes(role)) group.parties.push(e);
        else if (
          ['père', 'mère', 'époux-père', 'époux-mère', 'épouse-père', 'épouse-mère'].includes(role)
        )
          group.parents.push(e);
        else if (role.startsWith('témoin')) group.temoins.push(e);
        else group.autres.push(e);
      }

      return group;
    }, [entities, type]);

    const defaultOpenKeys = useMemo(() => {
      return Object.entries(grouped)
        .filter(([_, list]) => list.length > 0)
        .map(([key]) => key);
    }, [grouped]);

    return (
      <div>
        {entities.length > 0 ? (
          <Accordion key={defaultOpenKeys.join(',')} type='multiple' defaultValue={defaultOpenKeys}>
            {Object.entries(grouped).map(([key, list]) => {
              if (list.length === 0) return null;

              const sortedList =
                key === 'temoins'
                  ? [...list].sort((a, b) => {
                    const ra = a.mapping?.acteur?.role ?? '';
                    const rb = b.mapping?.acteur?.role ?? '';
                    const numA = parseInt(ra.replace(/\D/g, '')) || 0;
                    const numB = parseInt(rb.replace(/\D/g, '')) || 0;
                    return numA - numB;
                  })
                  : list;

              return (
                <AccordionItem value={key} key={key}>
                  <AccordionTrigger className='text-sm font-medium text-gray-700 hover:text-primary'>
                    <div className='flex items-center gap-2'>
                      {getIcon(key)}
                      <span>{getLabel(key, sortedList.length)}</span>
                      {sortedList.length > 1 && (
                        <Badge variant='secondary' className='ml-2'>
                          {sortedList.length}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className='ml-2 border-l pl-4'>
                    <ActeursSectionToggle
                      data={sortedList}
                      columns={columns}
                      relations={relations}
                      mode={mode}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </AccordionContent>
                </AccordionItem>
              );
            })}

          </Accordion>
        ) : mode == 'edit' ? (
          <div className='text-center space-y-4'>
            <p className='text-muted-foreground'>Aucun acteur n’a encore été ajouté à cet acte.</p>
            <Button variant='ghost' onClick={onAdd}>
              + Ajouter un acteur
            </Button>
          </div>
        ) : null}
      </div>
    );
  },
);

function getLabel(key: string, length: number) {
  const map: Record<string, [string, string]> = {
    officier: ["Officier de l'état civil", "Officiers de l'état civil"],
    enfant: ['Enfant', 'Enfants'],
    enfant_legitime: ['Enfant légitimé', 'Enfants légitimés'],
    defunt: ['Défunt', 'Défunts'],
    parties: ['Partie principale', 'Parties principales'],
    parents: ['Parent', 'Parents'],
    temoins: ['Témoin', 'Témoins'],
    autres: ['Autre rôle', 'Autres rôles'],

    acteur_notaire: ['Notaire', 'Notaires'],
    acteur_partie: ['Partie', 'Parties'],
    acteur_representant: ['Représentant', 'Représentants'],
    acteur_temoin: ['Témoin', 'Témoins'],
    acteur_individu_cite: ['Individu cité', 'Individus cités'],
    acteur_personne_morale: ['Personne morale', 'Personnes morales'],
  };

  const [singulier, pluriel] = map[key] ?? [key, key + 's'];
  return length > 1 ? pluriel : singulier;
}

function getIcon(key: string) {
  const map: Record<string, JSX.Element> = {
    officier: <Landmark className='w-4 h-4 text-gray-500' />,
    enfant: <Baby className='w-4 h-4 text-gray-500' />,
    enfant_legitime: <Baby className='w-4 h-4 text-gray-500' />,
    defunt: <FileText className='w-4 h-4 text-gray-500' />,
    parties: <Users className='w-4 h-4 text-gray-500' />,
    parents: <Users className='w-4 h-4 text-gray-500' />,
    temoins: <Handshake className='w-4 h-4 text-gray-500' />,
    autres: <Users className='w-4 h-4 text-gray-500' />,

    // Sous-catégories
    acteur_notaire: <Landmark className='w-4 h-4 text-gray-500' />,
    acteur_partie: <User className='w-4 h-4 text-gray-500' />,
    acteur_representant: <Handshake className='w-4 h-4 text-gray-500' />,
    acteur_temoin: <Handshake className='w-4 h-4 text-gray-500' />,
    acteur_individu_cite: <FileText className='w-4 h-4 text-gray-500' />,
    acteur_personne_morale: <Users className='w-4 h-4 text-gray-500' />,
  };
  return map[key] ?? <Users className='w-4 h-4 text-gray-500' />;
}
