import { useMemo } from "react";
import { Navigate, Outlet, useParams } from "react-router-dom";
import { getActiveParticipant } from "../../../lib/participant-session/getActiveParticipant";
import { addStoredParticipantProfile } from "../../../lib/participant-session/addStoredParticipantProfile";

type LegacyParticipantSession = {
  participantId?: string;
  firstName?: string;
  lastName?: string;
  birthYear?: string;
  recoveryToken?: string;
};

function getLegacyParticipantSession(slug: string): LegacyParticipantSession | null {
  const raw = localStorage.getItem(`connect:${slug}:participant`);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as LegacyParticipantSession;
    if (!parsed?.participantId || typeof parsed.participantId !== "string") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function ParticipantGuard() {
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const hasAccess = useMemo(() => {
    const activeParticipant = getActiveParticipant(slug);
    if (activeParticipant?.participantId) {
      return true;
    }

    const legacy = getLegacyParticipantSession(slug);
    if (legacy?.participantId) {
      addStoredParticipantProfile(slug, {
        participantId: legacy.participantId,
        firstName: legacy.firstName,
        lastName: legacy.lastName,
        birthYear: legacy.birthYear,
        recoveryToken: legacy.recoveryToken,
        setAsActive: true,
      });

      return true;
    }

    return false;
  }, [slug]);

  if (!hasAccess) {
    return <Navigate to={`/e/${slug}/access`} replace />;
  }

  return <Outlet />;
}