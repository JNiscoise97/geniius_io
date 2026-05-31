import type { FamilyGraphFamily, FamilyGraphPerson, GedcomMedia } from "../../../components/tree-navigate/data";

export type FamilyGraphData = {
  people: Record<string, FamilyGraphPerson>;
  families: Record<string, FamilyGraphFamily>;
  media: Record<string, GedcomMedia>
};