import {
  getMockBranches,
  type MockTreeBranch,
} from "../config/configTreeMockData";

export type TreeId = string;

export type TreeBranchSummary = {
  id: TreeId;
  name: string;
  rootPersonId?: TreeId;
  rootPersonName?: string;
  peopleCount: number;
  familiesCount: number;
};

export type GetBranchesResult = {
  rootAncestor: {
    id: TreeId;
    name: string;
  };
  branches: TreeBranchSummary[];
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

export async function getBranches(): Promise<GetBranchesResult> {
  const data = getMockBranches();

  return {
    rootAncestor: data.rootAncestor,
    branches: data.branches.map(mapBranch),
  };
}