import { useCallback, useEffect, useState } from "react";
import { loadHandleProfilePageData } from "./loadHandleProfilePageData";

export function useHandleProfilePageData(params: {
  eventSlug: string;
  participantId: string | null;
}) {
  const { eventSlug, participantId } = params;

  const [data, setData] = useState<Awaited<
    ReturnType<typeof loadHandleProfilePageData>
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const nextData = await loadHandleProfilePageData({
        eventSlug,
        participantId,
      });
      setData(nextData);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Impossible de charger le profil arbre.");
    } finally {
      setLoading(false);
    }
  }, [eventSlug, participantId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    data,
    loading,
    error,
    reload,
  };
}