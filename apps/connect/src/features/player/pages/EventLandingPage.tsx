import { Link, useParams } from "react-router-dom";
import { getLocalEvent } from "../../../lib/content/contentLoader";
import { AlertTriangle, ArrowRight } from "lucide-react";

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
            <div className='rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mt-3'>
                <div className='flex items-start gap-3'>
                    <AlertTriangle className='h-4 w-4 mt-0.5 text-amber-700' />
                    <div className='min-w-0'>
                        <div className='text-sm font-semibold text-amber-900'>Chantiers en cours</div>
                        <div className='mt-0.5 text-xs text-amber-800'>
                            <ul>
                                <li>Côté équipe (mobile)
                                    <ul>
                                        <li>Accueil / Landing
                                            <ul>
                                                <li>Bouton principal : “Rejoindre la partie”</li>
                                                <li>(Option) “Reprendre ma partie” si token détecté</li>
                                            </ul>
                                        </li>

                                        <li>Créer / Rejoindre équipe
                                            <ul>
                                                <li>[OK] Créer équipe</li>
                                                <li>[TODO] Rejoindre équipe si localStorage, sinon à partir de la liste des équipes + nav</li>
                                            </ul>
                                        </li>

                                        <li>[OK] Selfie équipe</li>

                                        <li>[OK] Accueil partie / Tableau de bord</li>

                                        <li>Liste des zones
                                            <ul>
                                                <li>3 cartes max : Zone 1 / Zone 2 / Zone 3</li>
                                                <li>Statut : À faire / En cours / Terminé</li>
                                                <li>CTA “Entrer dans la zone”</li>
                                            </ul>
                                        </li>

                                        <li>Zone — Liste des questions
                                            <ul>
                                                <li>Liste simple, 8–12 max</li>
                                                <li>Badges : Non répondu / Répondu / Validé</li>
                                                <li>CTA “Répondre”</li>
                                            </ul>
                                        </li>

                                        <li>Question (1 écran = 1 question)
                                            <ul>
                                                <li>En-tête : Zone + numéro question</li>
                                                <li>Corps : question + input (QCM / texte / code)</li>
                                                <li>Boutons : “Valider” + “Question suivante”</li>
                                                <li>Auto-save + état “enregistré”</li>
                                            </ul>
                                        </li>

                                        <li>Fin / Résultats
                                            <ul>
                                                <li>Score final</li>
                                                <li>Récap zones terminées</li>
                                                <li>CTA : “Voir le classement”</li>
                                            </ul>
                                        </li>
                                    </ul>
                                </li>

                                <li>Côté admin
                                    <ul>
                                        <li>Login Admin</li>
                                        <li>Admin Home
                                            <ul>
                                                <li>Toggle “Game live”</li>
                                                <li>Boutons : Équipes / Scoreboard / Contenu / Exports</li>
                                            </ul>
                                        </li>
                                        <li>Gestion contenu (Zones + questions CRUD)</li>
                                        <li>Scoreboard (Top 10 + auto refresh)</li>
                                        <li>Équipes / Submissions
                                            <ul>
                                                <li>Liste équipes</li>
                                                <li>Progression</li>
                                                <li>Détails</li>
                                            </ul>
                                        </li>
                                        <li>Validation photo (si activée)
                                            <ul>
                                                <li>File d’attente</li>
                                                <li>Valider / Refuser</li>
                                            </ul>
                                        </li>
                                    </ul>
                                </li>

                                <li>Micro-détails mobile
                                    <ul>
                                        <li>1 question = 1 écran</li>
                                        <li>CTA sticky en bas</li>
                                        <li>Gros champs + clavier adapté</li>
                                        <li>Auto-save à chaque action</li>
                                        <li>Reprise automatique via token</li>
                                    </ul>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
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
