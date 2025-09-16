import type { ActeurMinimal, GrapheActe, RelationGraphe, RelationPreview } from "@/types/relations-acteurs";

export function construireGraphePourActe(
  acteId: string,
  sourceTable: string,
  acteurs: ActeurMinimal[],
  relations: RelationPreview[],
): GrapheActe {
  const acteursIndex: Record<string, ActeurMinimal> = Object.fromEntries(
    acteurs.map((a) => [a.id, a])
  );

  const graphRelations: RelationGraphe[] = relations.map((r) => ({
    source: r.acteur_source_id,
    cible: r.acteur_cible_id ?? '',
    type: r.relation_type ?? '',
    mode: r.relation_mode,
  }));

  return { acteurs: acteursIndex, relations: graphRelations };
}
