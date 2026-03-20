import { Navigate, Outlet, useParams } from "react-router-dom";
import { getActiveParticipant, getParticipantSession } from "../../../lib/participant-session/getActiveParticipant";
import { addStoredParticipantProfile } from "../../../lib/participant-session/addStoredParticipantProfile";

function ensureParticipantAccess(slug: string): boolean {
  const activeParticipant = getActiveParticipant(slug);
  if (activeParticipant?.participantId) return true;

  const legacy = getParticipantSession(slug);
  if (legacy?.participantId) {
    addStoredParticipantProfile(slug, {
      participantId: legacy.participantId,
      firstName: legacy.firstName,
      lastName: legacy.lastName,
      birthYear: legacy.birthYear,
      recoveryToken: legacy.recoveryToken,
      defaultGedcomPersonId: legacy.defaultGedcomPersonId,
      remembered: true,
      setAsActive: true,
    });
    return true;
  }

  return false;
}

export function ParticipantGuard() {
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const hasAccess = ensureParticipantAccess(slug);

  if (!hasAccess) {
    return <Navigate to={`/e/${slug}/access/intro`} replace />;
  }

  return <Outlet />;
}