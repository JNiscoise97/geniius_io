import {
    Activity,
    ArrowLeft,
    Heart,
    Loader2,
    MapPinned,
    MessageSquare,
    UserCircle2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAdminParticipantDetails } from "../api/getAdminParticipantDetails";
import type { AdminParticipantDetails } from "../types/adminParticipantTypes";

type LoadState =
    | { kind: "loading" }
    | { kind: "ready"; item: AdminParticipantDetails | null }
    | { kind: "error"; message: string };

function InfoCard({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-black uppercase tracking-wide text-slate-500">
                {label}
            </div>
            <div className="mt-2 text-sm font-black text-slate-900">{value}</div>
        </div>
    );
}

function formatBooleanValue(value: boolean | null | undefined): string {
    if (value === true) return "Oui";
    if (value === false) return "Non";
    return "—";
}

function formatDateTime(value: string | null | undefined): string {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function ConsentSectionCard({
    title,
    description,
    items,
}: {
    title: string;
    description?: string;
    items: Array<{ label: string; value: string }>;
}) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-black text-slate-900">{title}</div>

            {description ? (
                <div className="mt-1 text-sm font-medium leading-6 text-slate-700">
                    {description}
                </div>
            ) : null}

            <div className="mt-4 space-y-3">
                {items.map((item) => (
                    <div
                        key={item.label}
                        className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3"
                    >
                        <div className="text-sm font-medium leading-5 text-slate-700">
                            {item.label}
                        </div>
                        <div className="shrink-0 text-sm font-black text-slate-900">
                            {item.value}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

export function AdminParticipantDetailsPage() {
    const nav = useNavigate();
    const { eventSlug, participantId } = useParams();

    const resolvedEventSlug = eventSlug ?? "";
    const resolvedParticipantId = participantId ?? "";

    const [state, setState] = useState<LoadState>({ kind: "loading" });

    useEffect(() => {
        let cancelled = false;

        async function run() {
            try {
                setState({ kind: "loading" });

                const item = await getAdminParticipantDetails({
                    eventSlug: resolvedEventSlug,
                    participantId: resolvedParticipantId,
                });

                if (!cancelled) {
                    setState({ kind: "ready", item });
                }
            } catch (error) {
                if (!cancelled) {
                    setState({
                        kind: "error",
                        message:
                            error instanceof Error
                                ? error.message
                                : "Impossible de charger le participant.",
                    });
                }
            }
        }

        void run();

        return () => {
            cancelled = true;
        };
    }, [resolvedEventSlug, resolvedParticipantId]);

    if (state.kind === "loading") {
        return (
            <div className="space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3 text-slate-900">
                        <Loader2 className="animate-spin" size={20} />
                        <div className="text-lg font-black">Chargement du participant...</div>
                    </div>
                </div>
            </div>
        );
    }

    if (state.kind === "error") {
        return (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4">
                <div className="font-black text-rose-900">{state.message}</div>
            </div>
        );
    }

    if (!state.item) {
        return (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
                <div className="font-black text-amber-900">Participant introuvable.</div>
            </div>
        );
    }

    const item = state.item;

    return (
        <div className="space-y-4">
            <header className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">
                        {item.firstName} {item.lastName}
                    </h1>
                    <div className="mt-1 text-sm font-medium text-slate-700">
                        Tableau de bord participant
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => nav(`/admin/events/${resolvedEventSlug}/participants`)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm"
                >
                    <ArrowLeft size={14} />
                    Retour
                </button>
            </header>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-slate-100 p-3 text-slate-900">
                        <UserCircle2 size={20} />
                    </div>
                    <div>
                        <div className="text-lg font-black text-slate-900">
                            Identité et contact
                        </div>
                        <div className="mt-1 text-sm font-medium text-slate-700">
                            Données actuellement branchées depuis participants et participant_consents
                        </div>
                    </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <InfoCard label="Prénom" value={item.firstName || "—"} />
                    <InfoCard label="Nom" value={item.lastName || "—"} />
                    <InfoCard label="Surnom" value={item.nickname || "—"} />
                    <InfoCard
                        label="Année de naissance"
                        value={item.birthYear ? String(item.birthYear) : "—"}
                    />
                    <InfoCard label="Email" value={item.email || "—"} />
                    <InfoCard label="Téléphone" value={item.phone || "—"} />
                    <InfoCard label="Messenger" value={item.messenger || "—"} />
                    <InfoCard label="WhatsApp" value={item.hasWhatsapp ? "Oui" : "Non"} />
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <InfoCard
                        label="Afficher dans l’arbre généalogique"
                        value={item.allowNameInFamilyTree ? "Oui" : "Non"}
                    />
                    <InfoCard
                        label="Canaux de contact privilégiés"
                        value={
                            item.preferredContactChannels.length > 0
                                ? item.preferredContactChannels.join(", ")
                                : "—"
                        }
                    />
                </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-slate-100 p-3 text-slate-900">
                        <UserCircle2 size={20} />
                    </div>
                    <div>
                        <div className="text-lg font-black text-slate-900">
                            Consentements et partage
                        </div>
                        <div className="mt-1 text-sm font-medium text-slate-700">
                            Vue structurée comme le formulaire rempli par le participant.
                        </div>
                    </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <InfoCard
                        label="Consentements complétés"
                        value={formatBooleanValue(item.consents?.completed)}
                    />
                    <InfoCard
                        label="Version"
                        value={
                            item.consents?.consentVersion !== null &&
                                item.consents?.consentVersion !== undefined
                                ? String(item.consents.consentVersion)
                                : "—"
                        }
                    />
                    <InfoCard
                        label="Page vue le"
                        value={formatDateTime(item.consents?.pageSeenAt)}
                    />
                    <InfoCard
                        label="Soumis le"
                        value={formatDateTime(item.consents?.submittedAt)}
                    />
                </div>

                {!item.consents ? (
                    <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-medium text-slate-700">
                        Aucun consentement enregistré pour cet événement.
                    </div>
                ) : (
                    <div className="mt-6 space-y-6">
                        <ConsentSectionCard
                            title="Arbre généalogique"
                            description="Ce que les membres connectés de la famille peuvent voir dans l’arbre."
                            items={[
                                {
                                    label: "Afficher mon nom dans l’arbre familial",
                                    value: formatBooleanValue(item.consents.allowNameInFamilyTree),
                                },
                                {
                                    label: "Afficher ma photo dans l’arbre familial",
                                    value: formatBooleanValue(item.consents.allowPhotoInFamilyTree),
                                },
                                {
                                    label: "Afficher mes informations dans l’arbre familial",
                                    value: formatBooleanValue(item.consents.allowInfoInFamilyTree),
                                },
                            ]}
                        />

                        <ConsentSectionCard
                            title="Photos et médias"
                            description="Partage et affichage des photos dans l’application et les souvenirs."
                            items={[
                                {
                                    label: "Partager avec la famille les photos où j’apparais",
                                    value: formatBooleanValue(item.consents.allowFamilyPhotoSharing),
                                },
                                {
                                    label: "Afficher dans l’application les photos où j’apparais",
                                    value: formatBooleanValue(item.consents.allowPhotoDisplayInApp),
                                },
                                {
                                    label: "Utiliser les photos de l’événement dans les souvenirs familiaux",
                                    value: formatBooleanValue(item.consents.allowEventPhotoMemory),
                                },
                            ]}
                        />

                        <ConsentSectionCard
                            title="Contact et communication"
                            description="Ce que la famille ou les organisateurs peuvent utiliser pour le contact."
                            items={[
                                {
                                    label: "Afficher mes coordonnées aux membres de la famille",
                                    value: formatBooleanValue(
                                        item.consents.allowContactDetailsWithFamily
                                    ),
                                },
                                {
                                    label: "Être contacté pour de futurs événements familiaux",
                                    value: formatBooleanValue(item.consents.allowFutureFamilyContact),
                                },
                            ]}
                        />

                        <ConsentSectionCard
                            title="Contribution au projet familial"
                            description="Utilisation des informations et contributions dans le travail généalogique."
                            items={[
                                {
                                    label: "Utiliser mes informations pour enrichir l’arbre généalogique",
                                    value: formatBooleanValue(item.consents.allowGenealogyEnrichment),
                                },
                                {
                                    label: "Conserver mes contributions généalogiques",
                                    value: formatBooleanValue(
                                        item.consents.allowGenealogyContributionStorage
                                    ),
                                },
                            ]}
                        />

                        <ConsentSectionCard
                            title="Utilisation dans l’application"
                            description="Visibilité dans les écrans d’activité et de jeu."
                            items={[
                                {
                                    label: "Afficher mon nom dans les activités de la cousinade",
                                    value: formatBooleanValue(item.consents.allowNameInEventActivities),
                                },
                                {
                                    label: "Afficher ma participation dans les jeux ou animations",
                                    value: formatBooleanValue(item.consents.allowParticipationInGames),
                                },
                            ]}
                        />

                        {item.consents.otherPreferences ? (
                            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="text-sm font-black text-slate-900">
                                    Autre préférence ou remarque
                                </div>
                                <div className="mt-2 text-sm font-medium leading-6 text-slate-800">
                                    {item.consents.otherPreferences}
                                </div>
                            </section>
                        ) : null}

                        <div className="grid gap-3 md:grid-cols-2">
                            <InfoCard
                                label="Créé le"
                                value={formatDateTime(item.consents.createdAt)}
                            />
                            <InfoCard
                                label="Mis à jour le"
                                value={formatDateTime(item.consents.updatedAt)}
                            />
                        </div>
                    </div>
                )}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-slate-100 p-3 text-slate-900">
                        <MapPinned size={20} />
                    </div>
                    <div>
                        <div className="text-lg font-black text-slate-900">
                            Questionnaire family knowledge
                        </div>
                        <div className="mt-1 text-sm font-medium text-slate-700">
                            Bloc prévu dans la fiche. À brancher ensuite selon les tables métier.
                        </div>
                    </div>
                </div>

                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-medium leading-6 text-slate-700">
                    Ici on affichera le détail des points abordés dans le questionnaire family
                    knowledge : proches, grands-parents, parrains/marraines, liens actuels,
                    souvenirs, etc.
                </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-slate-100 p-3 text-slate-900">
                        <Heart size={20} />
                    </div>
                    <div>
                        <div className="text-lg font-black text-slate-900">Réactions</div>
                        <div className="mt-1 text-sm font-medium text-slate-700">
                            Bloc prévu pour lister les réactions et le nombre de personnes
                            différentes concernées.
                        </div>
                    </div>
                </div>

                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-medium leading-6 text-slate-700">
                    À brancher : liste des personnes sur lesquelles ce participant a réagi,
                    nombre total de réactions, nombre de fiches différentes.
                </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-slate-100 p-3 text-slate-900">
                        <Activity size={20} />
                    </div>
                    <div>
                        <div className="text-lg font-black text-slate-900">Tracking</div>
                        <div className="mt-1 text-sm font-medium text-slate-700">
                            Bloc prêt pour agréger ensuite les traces d’usage.
                        </div>
                    </div>
                </div>

                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-medium leading-6 text-slate-700">
                    À brancher : pages vues, documents consultés, activités lancées, temps
                    passé, dernières actions.
                </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-slate-100 p-3 text-slate-900">
                        <MessageSquare size={20} />
                    </div>
                    <div>
                        <div className="text-lg font-black text-slate-900">Notes admin</div>
                        <div className="mt-1 text-sm font-medium text-slate-700">
                            Zone placeholder pour enrichissements futurs.
                        </div>
                    </div>
                </div>

                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-medium leading-6 text-slate-700">
                    Placeholder : observations, suivi manuel, besoins de relance, statut
                    qualité des données.
                </div>
            </section>
        </div>
    );
}