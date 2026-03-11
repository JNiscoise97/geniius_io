export type TreeId = string;
export type GenerationLabel = string;

export type TreeBreadcrumbItem = {
  label: string;
  to?: string;
};

export type TreePersonSummary = {
  id: TreeId;
  name: string;
  generation?: GenerationLabel;
  branchId?: TreeId;
  branchName?: string;
};

export type TreePersonListItem = TreePersonSummary & {
  siblingCount?: number;
  childrenCount?: number;
  spouseName?: string | null;
};

export type TreePersonDetails = {
  id: TreeId;
  name: string;
  generation: GenerationLabel;
  branchId: TreeId;
  branchName: string;
  parents: TreePersonSummary[];
  siblings: TreePersonSummary[];
  spouse: TreePersonSummary | null;
  children: TreePersonSummary[];
  familyId?: TreeId | null;
};

export type TreeBranchSummary = {
  id: TreeId;
  name: string;
  rootPersonId?: TreeId;
  rootPersonName?: string;
  peopleCount: number;
  familiesCount: number;
};

export type TreeFamilySummary = {
  id: TreeId;
  label: string;
  parentsLabel: string;
  parents: TreePersonSummary[];
  childrenCount: number;
  descendantsCount: number;
  branchId: TreeId;
  branchName?: string;
};

export type TreeLineageNode = {
  id: TreeId;
  name: string;
  generation: GenerationLabel;
  relationLabel?: string;
};

export type TreeLineage = {
  personId: TreeId;
  personName: string;
  nodes: TreeLineageNode[];
};

export type GetBranchesResult = {
  rootAncestor: {
    id: TreeId;
    name: string;
  };
  branches: TreeBranchSummary[];
};

export type GetFamiliesResult = {
  branch: TreeBranchSummary;
  breadcrumbs: TreeBreadcrumbItem[];
  families: TreeFamilySummary[];
};

export type GetSiblingsResult = {
  family: {
    id: TreeId;
    label: string;
    parentsLabel: string;
    childrenCount: number;
    descendantsCount?: number;
  };
  branch: {
    id: TreeId;
    name: string;
  };
  breadcrumbs: TreeBreadcrumbItem[];
  siblings: TreePersonListItem[];
};

export type GetPersonResult = {
  person: TreePersonDetails;
  breadcrumbs: TreeBreadcrumbItem[];
};

export type GetLineageResult = {
  lineage: TreeLineage;
  breadcrumbs: TreeBreadcrumbItem[];
};