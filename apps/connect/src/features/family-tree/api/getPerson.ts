import { getMockPerson } from "../config/configTreeMockData";

export type TreeId = string;

export type TreeBreadcrumbItem = {
  label: string;
  to?: string;
};

export type TreePersonSummary = {
  id: TreeId;
  name: string;
  generation?: string;
  branchId?: TreeId;
  branchName?: string;
};

export type TreePersonDetails = {
  id: TreeId;
  name: string;
  generation: string;
  branchId: TreeId;
  branchName: string;
  parents: TreePersonSummary[];
  siblings: TreePersonSummary[];
  spouse: TreePersonSummary | null;
  children: TreePersonSummary[];
  familyId?: TreeId | null;
};

export type GetPersonResult = {
  person: TreePersonDetails;
  breadcrumbs: TreeBreadcrumbItem[];
};

export async function getPerson(personId: string): Promise<GetPersonResult> {
  const data = getMockPerson(personId);

  return {
    person: data.person,
    breadcrumbs: data.breadcrumbs,
  };
}