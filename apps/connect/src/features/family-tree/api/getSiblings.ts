import {
  getMockSiblings,
} from "../config/configTreeMockData";

export type TreeId = string;

export type TreeBreadcrumbItem = {
  label: string;
  to?: string;
};

export type TreePersonListItem = {
  id: TreeId;
  name: string;
  generation?: string;
  branchId?: TreeId;
  branchName?: string;
  siblingCount?: number;
  childrenCount?: number;
  spouseName?: string | null;
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

export async function getSiblings(familyId: string): Promise<GetSiblingsResult> {
  const data = getMockSiblings(familyId);

  return {
    family: data.family,
    branch: data.branch,
    breadcrumbs: data.breadcrumbs,
    siblings: data.siblings,
  };
}