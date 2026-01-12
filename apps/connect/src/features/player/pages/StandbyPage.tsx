import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

export function StandbyPage() {
    const { eventSlug } = useParams();
    const slug = eventSlug ?? "demo";

    const [session, setSession] = useState<any>(null);

    useEffect(() => {
        const raw = localStorage.getItem(`connect:${slug}:session`);
        setSession(raw ? JSON.parse(raw) : null);
    }, [slug]);

    if (!session) {
        return (
            <div className="screen">
                <h1 className="h1">Aucune équipe active</h1>
                <p className="muted">Crée une équipe pour continuer.</p>
                <div className="stack">
                    <Link className="btn btn--primary" to={`/e/${slug}/team/create`}>
                        Créer une équipe
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="screen">
            <h1 className="h1">En attente…</h1>
            <p className="muted">
                Équipe : <strong>{session.teamName}</strong>
            </p>
            <p className="muted">Le jeu n’a pas encore commencé. Reste sur cet écran.</p>
            <Link className="btn btn--primary" to={`/e/${slug}/team/selfie`}>
                Prendre le selfie d’équipe
            </Link>


            <div className="stack" style={{ marginTop: 14 }}>
                <button
                    className="btn"
                    type="button"
                    onClick={() => {
                        localStorage.removeItem(`connect:${slug}:session`);
                        window.location.href = `/e/${slug}`;
                    }}
                >
                    Quitter l’équipe (local)
                </button>
            </div>
        </div>
    );
}
