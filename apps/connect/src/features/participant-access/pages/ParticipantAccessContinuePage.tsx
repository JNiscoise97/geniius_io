import { useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { resolveParticipantAccess } from "../api/resolveParticipantAccess";
import { AccessGateScreen } from "../components/AccessGateScreen";
import {
  getParticipantAccessConfirmDevicePath,
  getParticipantAccessConfirmTokenPath,
  getParticipantAccessOptionsPath,
  getParticipantAccessRecoverPath,
} from "../config/participantAccessRoutes";

export function ParticipantAccessContinuePage() {
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

        if (cancelled) return;

        if (result.kind === "go-to-confirm-token") {
          nav(
            `${getParticipantAccessConfirmTokenPath(result.eventSlug)}?t=${encodeURIComponent(
              result.recoveryToken,
            )}`,
            { replace: true },
          );
          return;
        }

        if (result.kind === "go-to-confirm-device") {
          nav(
            `${getParticipantAccessConfirmDevicePath(
              result.eventSlug,
            )}?participantId=${encodeURIComponent(result.participantId)}`,
            { replace: true },
          );
          return;
        }

        if (result.kind === "go-to-access-options") {
          nav(getParticipantAccessOptionsPath(result.eventSlug), {
            replace: true,
            state: { reason: result.reason },
          });
          return;
        }

        nav(getParticipantAccessRecoverPath(result.eventSlug), {
          replace: true,
          state: {
            reason: result.reason,
            emailPrefill: result.emailPrefill ?? "",
          },
        });
      } catch (error) {
        console.error("ParticipantAccessContinuePage", error);

        if (cancelled) return;

        nav(getParticipantAccessRecoverPath(slug), {
          replace: true,
          state: { reason: "technical-error" },
        });
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [nav, recoveryToken, slug]);

  return <AccessGateScreen />;
}