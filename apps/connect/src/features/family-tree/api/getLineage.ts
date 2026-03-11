import { getMockLineage } from "../config/configTreeMockData";

export type TreeId = string;

export type TreeBreadcrumbItem = {
  label: string;
  to?: string;
};

export type TreeLineageNode = {
  id: TreeId;
  name: string;
  generation: string;
  relationLabel?: string;
};

export type TreeLineage = {
  personId: TreeId;
  personName: string;
  nodes: TreeLineageNode[];
};

export type GetLineageResult = {
  lineage: TreeLineage;
  breadcrumbs: TreeBreadcrumbItem[];
};

export async function getLineage(personId: string): Promise<GetLineageResult> {
  const data = getMockLineage(personId);

  return {
    lineage: data.lineage,
    breadcrumbs: data.breadcrumbs,
  };
}