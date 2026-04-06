import { useCallback, useEffect, useState } from "react";
import { loadBrowseIdentityContext } from "./loadBrowseIdentityContext";
import { loadBrowsePersonData } from "./loadBrowsePersonData";

export function useBrowsePageData(params: {
  eventSlug: string;
  participantId: string | null;
  centerId: string;
}) {
  const { eventSlug, participantId, centerId } = params;

  const [loading, setLoading] = useState(true);
  const [identityLoading, setIdentityLoading] = useState(true);
  const [personLoading, setPersonLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [identityContext, setIdentityContext] = useState<Awaited<
    ReturnType<typeof loadBrowseIdentityContext>
  > | null>(null);

  const [personData, setPersonData] = useState<Awaited<
    ReturnType<typeof loadBrowsePersonData>
  > | null>(null);

  const reloadIdentity = useCallback(async () => {
    setIdentityLoading(true);

    try {
      const nextIdentityContext = await loadBrowseIdentityContext({
        eventSlug,
        participantId,
      });
      setIdentityContext(nextIdentityContext);
      return nextIdentityContext;
    } finally {
      setIdentityLoading(false);
    }
  }, [eventSlug, participantId]);

  const reloadPerson = useCallback(
    async (
      inputIdentityContext?: Awaited<
        ReturnType<typeof loadBrowseIdentityContext>
      > | null,
    ) => {
      const currentIdentityContext = inputIdentityContext ?? identityContext;
      if (!currentIdentityContext) return null;

      setPersonLoading(true);

      try {
        const nextPersonData = await loadBrowsePersonData({
          eventSlug,
          participantId,
          personId: centerId,
          visibilityPreferencesByPersonId:
            currentIdentityContext.visibilityPreferencesByPersonId,
          sosaReferencePersonId: currentIdentityContext.sosaReferencePersonId,
          overridesByPersonId: currentIdentityContext.overridesByPersonId,
        });

        setPersonData(nextPersonData);
        return nextPersonData;
      } finally {
        setPersonLoading(false);
      }
    },
    [centerId, eventSlug, identityContext, participantId],
  );

  const reload = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const nextIdentityContext = await reloadIdentity();
      await reloadPerson(nextIdentityContext);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Impossible de charger l’exploration de l’arbre.");
    } finally {
      setLoading(false);
    }
  }, [reloadIdentity, reloadPerson]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    loading,
    identityLoading,
    personLoading,
    error,
    identityContext,
    personData,
    reload,
    reloadIdentity,
    reloadPerson,
  };
}