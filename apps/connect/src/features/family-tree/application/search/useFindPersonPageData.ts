import { useCallback, useEffect, useState } from "react";
import { loadFindPersonPageData } from "./loadFindPersonPageData";

export function useFindPersonPageData(params: {
  eventSlug: string;
  participantId: string | null;
  centerId: string;
  query: string;
  limit?: number;
  enabled?: boolean;
}) {
  const {
    eventSlug,
    participantId,
    centerId,
    query,
    limit,
    enabled = true,
  } = params;

  const [data, setData] = useState<Awaited<
    ReturnType<typeof loadFindPersonPageData>
  > | null>(null);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const nextData = await loadFindPersonPageData({
        eventSlug,
        participantId,
        centerId,
        query,
        limit,
      });
      setData(nextData);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Impossible de charger la recherche.");
    } finally {
      setLoading(false);
    }
  }, [centerId, enabled, eventSlug, limit, participantId, query]);

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