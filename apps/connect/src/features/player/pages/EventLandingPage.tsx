import { Link, useParams } from "react-router-dom";
import { getLocalEvent } from "../../../lib/content/contentLoader";

export function EventLandingPage() {
    const { eventSlug } = useParams();
    const slug = eventSlug ?? "demo";

    const data = getLocalEvent(slug);

    if (!data) {
        return (
            <div className="screen">
                <h1 className="h1">Événement introuvable</h1>
                <p className="muted">Aucun contenu local trouvé pour “{slug}”.</p>
            </div>
        );
    }

    const { event, zones } = data;

    return (
        <div className="screen">
            <h1 className="h1">{event.title}</h1>
            <p className="muted">Choisis une action :</p>

            <div className="stack">
                <Link className="btn btn--primary" to={`/e/${event.slug}/team/create`}>
                    Créer une équipe
                </Link>
                <Link className="btn" to={`/e/${event.slug}/team/resume`}>
                    Reprendre une équipe
                </Link>
            </div>

            <hr style={{ borderColor: "rgba(255,255,255,0.08)", margin: "16px 0" }} />

            <p className="muted">Zones (démo) :</p>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
                {zones.map((z) => (
                    <li key={z.id || z.title}>
                        <strong>{z.title}</strong> {z.theme ? <span className="muted">— {z.theme}</span> : null}
                    </li>
                ))}
            </ul>
        </div>
    );
}
