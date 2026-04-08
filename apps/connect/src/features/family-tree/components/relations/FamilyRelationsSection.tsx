import type { FamilyTreeViaAction } from "../../../../lib/analytics/familyTreeViewTracker";
import type { PersonSummary } from "../../types/person";
import { TreeRelationSection } from "./TreeRelationSection";

type FamilyRelationsSectionProps = {
  headerClassName: string;
  openSections: Record<string, boolean>;
  onToggle: (key: string) => void;
  onSelect: (personId: string, viaAction: FamilyTreeViaAction) => void;
  labelSpouses: string;
  labelChildren: string;
  labelSiblings: string;
  parents: PersonSummary[];
  spouses: PersonSummary[];
  children: PersonSummary[];
  siblings: PersonSummary[];
  grandparents: PersonSummary[];
};

export function FamilyRelationsSection({
  headerClassName,
  openSections,
  onToggle,
  onSelect,
  labelSpouses,
  labelChildren,
  labelSiblings,
  parents,
  spouses,
  children,
  siblings,
  grandparents,
}: FamilyRelationsSectionProps) {
  console.log("children",children)
  return (
    <section className="space-y-4">
      <TreeRelationSection
        title="Parents"
        subtitle="Remonter d’une génération."
        headerClassName={headerClassName}
        persons={parents}
        isOpen={openSections.parents}
        onToggle={() => onToggle("parents")}
        emptyLabel="Aucun parent affiché pour le moment."
        onSelect={onSelect}
        viaAction="parents_section"
        showCount={false}
      />

      <TreeRelationSection
        title={labelSpouses}
        subtitle="Voir les unions liées à cette personne."
        headerClassName={headerClassName}
        persons={spouses}
        isOpen={openSections.spouses}
        onToggle={() => onToggle("spouses")}
        emptyLabel="Aucun conjoint affiché pour le moment."
        onSelect={onSelect}
        viaAction="spouses_section"
      />

      <TreeRelationSection
        title={labelChildren}
        subtitle="Descendre d’une génération."
        headerClassName={headerClassName}
        persons={children}
        isOpen={openSections.children}
        onToggle={() => onToggle("children")}
        emptyLabel="Aucun enfant affiché pour le moment."
        onSelect={onSelect}
        viaAction="children_section"
      />

      <TreeRelationSection
        title={labelSiblings}
        subtitle="Passer rapidement à un frère ou une sœur."
        headerClassName={headerClassName}
        persons={siblings}
        isOpen={openSections.siblings}
        onToggle={() => onToggle("siblings")}
        emptyLabel="Aucune fratrie affichée pour le moment."
        onSelect={onSelect}
        viaAction="siblings_section"
      />

      <TreeRelationSection
        title="Aïeux"
        subtitle="Accéder directement à la génération au-dessus des parents."
        headerClassName={headerClassName}
        persons={grandparents}
        isOpen={openSections.grandparents}
        onToggle={() => onToggle("grandparents")}
        emptyLabel="Aucun aïeul affiché pour le moment."
        onSelect={onSelect}
        viaAction="grandparents_section"
        showCount={false}
      />
    </section>
  );
}