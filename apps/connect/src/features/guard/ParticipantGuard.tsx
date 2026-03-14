import { Navigate, Outlet, useParams } from "react-router-dom";
import { getParticipantSession } from "../../lib/participant-session/getActiveParticipant";


export function ParticipantGuard() {
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const session = getParticipantSession(slug);

  if (!session?.participantId) {
    return <Navigate to={`/e/${slug}`} replace />;
  }

  return <Outlet />;
}