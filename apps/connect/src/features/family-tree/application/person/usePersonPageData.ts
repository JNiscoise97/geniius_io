import { useCallback, useEffect, useState } from "react";
import { loadPersonPageData } from "./loadPersonPageData";

export function usePersonPageData(params: {
  eventSlug: string;
  personId: string;
}) {
  const { eventSlug, personId } = params;

  const [data, setData] = useState<Awaited<
    ReturnType<typeof loadPersonPageData>
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const nextData = await loadPersonPageData({
        eventSlug,
        personId,
      });
      setData(nextData);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Impossible de charger la fiche personne.");
    } finally {
      setLoading(false);
    }
  }, [eventSlug, personId]);

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