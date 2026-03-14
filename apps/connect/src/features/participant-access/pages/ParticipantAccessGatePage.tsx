import { useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { resolveParticipantAccess } from "../api/resolveParticipantAccess";
import { AccessGateScreen } from "../components/AccessGateScreen";
import {
  getParticipantAccessIntroPath,
  getParticipantAccessOptionsPath,
  getParticipantWelcomePath,
} from "../config/participantAccessRoutes";

export function ParticipantAccessGatePage() {
  const nav = useNavigate();
  const { eventSlug } = useParams();
  const [searchParams] = useSearchParams();

  const slug = eventSlug ?? "demo";
  const recoveryToken =
    searchParams.get("token")?.trim() ??
    searchParams.get("t")?.trim() ??
    "";

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const result = await resolveParticipantAccess({
          eventSlug: slug,
          recoveryToken,
        });

        console.log("result", result);

        if (cancelled) return;

        if (result.kind === "go-to-welcome") {
          nav(getParticipantWelcomePath(result.eventSlug), { replace: true });
          return;
        }

        if (result.kind === "go-to-intro") {
          nav(getParticipantAccessIntroPath(result.eventSlug), { replace: true });
          return;
        }

        nav(getParticipantAccessOptionsPath(result.eventSlug), {
          replace: true,
          state: {
            reason: result.reason,
            participantId: result.participantId ?? null,
          },
        });
      } catch (error) {
        console.error("ParticipantAccessGatePage", error);

        if (cancelled) return;

        nav(getParticipantAccessIntroPath(slug), { replace: true });
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [nav, recoveryToken, slug]);

  return <AccessGateScreen />;
}