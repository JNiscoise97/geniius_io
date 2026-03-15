import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getPersonSheet } from "../api/getPersonSheet";
import type { PersonSheetData } from "../config/personSheets";
import { PersonSheetHero } from "../components/PersonSheetHero";
import { PersonSheetFacts } from "../components/PersonSheetFacts";
import { PersonSheetAliases } from "../components/PersonSheetAliases";
import { PersonSheetStory } from "../components/PersonSheetStory";
import { PersonSheetTimeline } from "../components/PersonSheetTimeline";
import { PersonSheetFamily } from "../components/PersonSheetFamily";
import { PersonSheetStats } from "../components/PersonSheetStats";
import { PersonSheetPhoto } from "../components/PersonSheetPhoto";
import { createPageTimeTracker } from "../../../lib/analytics/pageTimeTracker";
import { getParticipantSession } from "../../../lib/participant-session/getActiveParticipant";

export function PersonSheetPage() {
  const [searchParams] = useSearchParams();

  const [person, setPerson] = useState<PersonSheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const personId = searchParams.get("id")?.trim() ?? "";

  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const participantSession = getParticipantSession(slug);
    const participantId = participantSession?.participantId ?? null;

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!personId) {
        setError("Aucun identifiant d’individu n’a été fourni.");
        setLoading(false);
        return;
      }

      try {
        const result = await getPersonSheet(personId);

        if (!mounted) return;

        if (!result) {
          setError("Aucune fiche n’est disponible pour cet individu.");
          setLoading(false);
          return;
        }

        setPerson(result);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? "Impossible de charger cette fiche.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [personId]);

  useEffect(() => {
      if (!participantId) return;
  
      const tracker = createPageTimeTracker({
        participantId,
        eventSlug: slug,
        pageKey: `/e/${slug}/fiche?id=@7398@`,
      });
  
      tracker.start();
  
      return () => {
        void tracker.stop();
      };
    }, [participantId, slug]);

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pt-4 pb-24">
        {loading ? (
          <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-bold text-slate-700">
              Chargement de la fiche…
            </div>
          </section>
        ) : null}

        {error ? (
          <section className="rounded-[24px] border border-[rgba(220,38,38,0.18)] bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-[color:var(--bad)]">
                <AlertTriangle size={18} />
              </div>
              <div>
                <div className="text-sm font-black text-slate-900">
                  Impossible d’afficher la fiche
                </div>
                <div className="mt-1 text-sm font-bold leading-6 text-slate-700">
                  {error}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {!loading && !error && person ? (
          <div className="space-y-4">
            <PersonSheetHero person={person} />
            <PersonSheetPhoto person={person} />
            <PersonSheetFacts person={person} />
            <PersonSheetAliases person={person} />
            <PersonSheetStory person={person} />
            <PersonSheetTimeline person={person} />
            <PersonSheetFamily person={person} />
            <PersonSheetStats person={person} />
          </div>
        ) : null}
      </main>
    </div>
  );
}