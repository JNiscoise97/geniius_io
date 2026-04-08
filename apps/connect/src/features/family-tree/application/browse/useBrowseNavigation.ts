import { useEffect, useState } from "react";
import { ROOT_HONORED_PERSON_ID } from "../../../../config/eventInfos";
import type { FamilyTreeViaAction } from "../../../../lib/analytics/familyTreeViewTracker";
import { FAMILY_GRAPH } from "../../api/loadGraph";

export function useBrowseNavigation(requestedPersonId?: string | null) {
  const rootHonoredPersonId = ROOT_HONORED_PERSON_ID;

  const initialCenterId =
    requestedPersonId && FAMILY_GRAPH.people[requestedPersonId]
      ? requestedPersonId
      : rootHonoredPersonId;

  const [centerId, setCenterId] = useState(initialCenterId);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    parents: true,
    spouses: true,
    children: true,
    siblings: true,
    grandparents: true,
  });

  useEffect(() => {
    if (requestedPersonId && FAMILY_GRAPH.people[requestedPersonId]) {
      setCenterId(requestedPersonId);
    }
  }, [requestedPersonId]);

  function toggleSection(key: string) {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  function goToPerson(personId: string, _viaAction?: FamilyTreeViaAction) {
    setCenterId(personId);
  }

  function recenterOnRoot() {
    setCenterId(rootHonoredPersonId);
  }

  return {
    rootHonoredPersonId,
    centerId,
    setCenterId,
    openSections,
    setOpenSections,
    toggleSection,
    goToPerson,
    recenterOnRoot,
  };
}