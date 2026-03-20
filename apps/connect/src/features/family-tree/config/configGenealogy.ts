import { buildPersonContext } from "../api/buildPersonContext";
import { FAMILY_GRAPH } from "../api/loadGraph";
import type { PersonVisibilityPreferenceMap } from "../types";

type HeroTheme = {
  heroClassName: string;
  headerClassName: string;
  chipClassName: string;
};

type BranchMeta = {
  id: string;
  label: string;
  heroClassName: string;
  headerClassName: string;
  chipClassName: string;
};

const DEFAULT_THEME: HeroTheme = {
  heroClassName:
    "bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_45%,#312e81_100%)]",
  headerClassName:
    "bg-[#3b4274] text-white shadow-[0_10px_24px_rgba(59,66,116,0.18)]",
  chipClassName: "bg-white/10 text-white/90",
};

const BRANCH_META_BY_ID: Record<string, BranchMeta> = {
  "731452": {
    id: "731452",
    label: "branche Candassamy",
    heroClassName:
      "bg-[linear-gradient(135deg,#4a3614_0%,#8a6a1f_60%,#d4af37_100%)]",
    headerClassName:
      "bg-[#7a5a1a] text-white shadow-[0_10px_24px_rgba(122,90,26,0.30)]",
    chipClassName: "bg-yellow-200/90 text-yellow-900",
  },

  "732469": {
    id: "732469",
    label: "branche Manicon",
    heroClassName:
      "bg-[linear-gradient(135deg,#5a1e1e_0%,#8a2f2f_55%,#c44747_100%)]",
    headerClassName:
      "bg-[#8a2f2f] text-white shadow-[0_10px_24px_rgba(138,47,47,0.25)]",
    chipClassName: "bg-red-100/90 text-red-900",
  },

  "7391": {
    id: "7391",
    label: "branche Coundéaman",
    heroClassName:
      "bg-[linear-gradient(135deg,#1e2a5a_0%,#2f3f8a_55%,#4c63c4_100%)]",
    headerClassName:
      "bg-[#2f3f8a] text-white shadow-[0_10px_24px_rgba(47,63,138,0.25)]",
    chipClassName: "bg-blue-200 text-blue-900",
  },

  "732470": {
    id: "732470",
    label: "branche Canou",
    heroClassName:
      "bg-[linear-gradient(135deg,#4a3422_0%,#7a5636_60%,#c9a27a_100%)]",
    headerClassName:
      "bg-[#7a5636] text-white shadow-[0_10px_24px_rgba(122,86,54,0.25)]",
    chipClassName: "bg-amber-100/90 text-amber-900",
  },

  "732467": {
    id: "732467",
    label: "branche Savoupaquiom",
    heroClassName:
      "bg-[linear-gradient(135deg,#1f4d3a_0%,#2f7a5a_55%,#4fc49a_100%)]",
    headerClassName:
      "bg-[#2f7a5a] text-white shadow-[0_10px_24px_rgba(47,122,90,0.25)]",
    chipClassName: "bg-green-100/90 text-green-900",
  },
};

export function getPersonContext(
  personId: string,
  visibilityPreferencesByPersonId?: PersonVisibilityPreferenceMap,
) {
  return buildPersonContext(
    personId,
    FAMILY_GRAPH,
    visibilityPreferencesByPersonId,
  );
}

export function getPersonHeroConfig(
  personId: string,
  visibilityPreferencesByPersonId?: PersonVisibilityPreferenceMap,
) {
  const context = getPersonContext(personId, visibilityPreferencesByPersonId);
  const branches = context.person.branch ?? [];

  if (branches.length === 0) {
    return {
      ...DEFAULT_THEME,
      mainBranch: undefined,
      otherBranches: [],
    };
  }

  const [mainBranchId, ...otherBranchIds] = branches;
  const mainBranch = BRANCH_META_BY_ID[mainBranchId];
  const otherBranches = otherBranchIds
    .map((branchId) => BRANCH_META_BY_ID[branchId])
    .filter(Boolean);

  return {
    heroClassName:
      mainBranch?.heroClassName ?? DEFAULT_THEME.heroClassName,
    headerClassName:
      mainBranch?.headerClassName ?? DEFAULT_THEME.headerClassName,
    chipClassName:
      mainBranch?.chipClassName ?? DEFAULT_THEME.chipClassName,
    mainBranch,
    otherBranches,
  };
}