import {
  getMockFamilies,
  type MockTreeBranch,
  type MockTreeFamily,
} from "../config/configTreeMockData";

export type TreeId = string;

export type TreeBreadcrumbItem = {
  label: string;
  to?: string;
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
  childrenCount: number;
  descendantsCount: number;
  branchId: TreeId;
  branchName?: string;
};

export type GetFamiliesResult = {
  branch: TreeBranchSummary;
  breadcrumbs: TreeBreadcrumbItem[];
  families: TreeFamilySummary[];
};

function mapBranch(branch: MockTreeBranch): TreeBranchSummary {
  return {
    id: branch.id,
    name: branch.name,
    rootPersonId: branch.rootPersonId,
    rootPersonName: branch.rootPersonName,
    peopleCount: branch.peopleCount,
    familiesCount: branch.familiesCount,
  };
}

function mapFamily(family: MockTreeFamily): TreeFamilySummary {
  return {
    id: family.id,
    label: family.label,
    parentsLabel: family.parentsLabel,
    childrenCount: family.childrenCount,
    descendantsCount: family.descendantsCount,
    branchId: family.branchId,
    branchName: family.branchName,
  };
}

export async function getFamilies(branchId: string): Promise<GetFamiliesResult> {
  const data = getMockFamilies(branchId);

  return {
    branch: mapBranch(data.branch),
    breadcrumbs: data.breadcrumbs,
    families: data.families.map(mapFamily),
  };
}