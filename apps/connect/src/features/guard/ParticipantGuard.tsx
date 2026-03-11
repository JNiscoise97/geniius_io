import { Navigate, Outlet, useParams } from "react-router-dom";

type LocalParticipantSession = {
  participantId: string;
};

function getParticipantSession(slug: string): LocalParticipantSession | null {
  const raw = localStorage.getItem(`connect:${slug}:participant`);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as LocalParticipantSession;
  } catch {
    return null;
  }
}

export function ParticipantGuard() {
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const session = getParticipantSession(slug);

  if (!session?.participantId) {
    return <Navigate to={`/e/${slug}/welcome/identity`} replace />;
  }

  return <Outlet />;
}