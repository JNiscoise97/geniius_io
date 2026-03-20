import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Camera,
  CheckCircle2,
  Eye,
  Heart,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getParticipantSession } from "../../../lib/participant-session/getActiveParticipant";
import { createPageTimeTracker } from "../../../lib/analytics/pageTimeTracker";
import { getMyPersonIdentityClaim } from "../api/getMyPersonIdentityClaim";
import { saveTreeProfileConsents } from "../../participant-preferences/api/saveTreeProfileConsents";
import { getTreeProfileConsents } from "../../participant-preferences/api/getTreeProfileConsents";

type HandleProfileValues = {
  allowNameInFamilyTree: boolean | null;
  allowPhotoInFamilyTree: boolean | null;
  allowInfoInFamilyTree: boolean | null;
};

type ProfileStats = {
  reactionCount: number | null;
  profileViewCount: number | null;
};

type ProfileFieldConfig = {
  key: keyof HandleProfileValues;
  label: string;
  helpText: string;
  icon: LucideIcon;
};

const INITIAL_VALUES: HandleProfileValues = {
  allowNameInFamilyTree: null,
  allowPhotoInFamilyTree: null,
  allowInfoInFamilyTree: null,
};

const PROFILE_FIELDS: ProfileFieldConfig[] = [
  {
    key: "allowNameInFamilyTree",
    label: "Afficher mon nom",
    helpText:
      "Autoriser l’affichage de ton nom et de ton prénom dans l’arbre familial.",
    icon: BadgeCheck,
  },
  {
    key: "allowPhotoInFamilyTree",
    label: "Afficher ma photo",
    helpText:
      "Autoriser l’affichage de ta photo sur ta fiche dans l’arbre familial.",
    icon: Camera,
  },
  {
    key: "allowInfoInFamilyTree",
    label: "Afficher mes informations",
    helpText:
      "Autoriser l’affichage des informations visibles sur ta fiche, comme certains lieux, dates ou éléments descriptifs associés à ton profil.",
    icon: Eye,
  },
];

export function FamilyTreeHandleProfilePage() {
  const nav = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const [values, setValues] = useState<HandleProfileValues>(INITIAL_VALUES);
  const [loading, setLoading] = useState(false);
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [identityStatus, setIdentityStatus] = useState<
    "pending" | "approved" | "rejected" | "auto_verified" | null
  >(null);

  const [stats, setStats] = useState<ProfileStats>({
    reactionCount: null,
    profileViewCount: null,
  });

  const participantSession = getParticipantSession(slug);
  const participantId = participantSession?.participantId ?? null;

  const isVerified =
    identityStatus === "approved" || identityStatus === "auto_verified";

  const verifiedLabel = useMemo(() => {
    if (identityStatus === "auto_verified" || identityStatus === "approved") {
      return "Profil vérifié";
    }
    if (identityStatus === "pending") {
      return "Vérification en attente";
    }
    if (identityStatus === "rejected") {
      return "Vérification refusée";
    }
    return "Profil non vérifié";
  }, [identityStatus]);

  useEffect(() => {
    if (!participantId) return;

    const tracker = createPageTimeTracker({
      participantId,
      eventSlug: slug,
      pageKey: `/e/${slug}/family-tree/handle-profile`,
    });

    tracker.start();

    return () => {
      void tracker.stop();
    };
  }, [participantId, slug]);

  useEffect(() => {
    let isMounted = true;

    async function loadPageData() {
      const session = getParticipantSession(slug);

      if (!session?.participantId) {
        if (isMounted) {
          setLoadingInitialData(false);
        }
        return;
      }

      try {
        const [existingConsents, identityClaim] = await Promise.all([
          getTreeProfileConsents({
            participantId: session.participantId,
            eventSlug: slug,
          }),
          getMyPersonIdentityClaim({
            eventSlug: slug,
            participantId: session.participantId,
          }),
        ]);

        if (!isMounted) return;

        if (existingConsents) {
          setValues({
            allowNameInFamilyTree: existingConsents.allowNameInFamilyTree,
            allowPhotoInFamilyTree: existingConsents.allowPhotoInFamilyTree,
            allowInfoInFamilyTree: existingConsents.allowInfoInFamilyTree,
          });
        }
        setIdentityStatus(identityClaim?.claim_status ?? null);

        const verifiedPersonId =
          identityClaim?.claim_status === "approved" ||
            identityClaim?.claim_status === "auto_verified"
            ? identityClaim.person_id
            : null;

        if (verifiedPersonId) {
          const [reactionCount, profileViewCount] = await Promise.all([
            getProfileReactionCount({
              eventSlug: slug,
              personId: verifiedPersonId,
            }),
            getProfileViewCount({
              eventSlug: slug,
              personId: verifiedPersonId,
            }),
          ]);

          if (!isMounted) return;

          setStats({
            reactionCount,
            profileViewCount,
          });
        }
      } catch (e: any) {
        if (!isMounted) return;
        setError(e?.message ?? "Impossible de charger les informations du profil.");
      } finally {
        if (isMounted) {
          setLoadingInitialData(false);
        }
      }
    }

    void loadPageData();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const session = getParticipantSession(slug);
    if (!session?.participantId) {
      setError(
        "Nous n’avons pas retrouvé ton identification. Merci de commencer par te présenter.",
      );
      return;
    }

    setLoading(true);

    try {
      await saveTreeProfileConsents({
        participantId: session.participantId,
        eventSlug: slug,
        values: {

          allowNameInFamilyTree: values.allowNameInFamilyTree,
          allowPhotoInFamilyTree: values.allowPhotoInFamilyTree,
          allowInfoInFamilyTree: values.allowInfoInFamilyTree,

        },
      });

      nav(`/e/${slug}/family-tree`, { replace: true });
    } catch (e: any) {
      setError(e?.message ?? "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pt-3 pb-32">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-extrabold text-indigo-700">
              <ShieldCheck size={14} />
              Profil arbre
            </div>

            <button
              type="button"
              onClick={() => nav(`/e/${slug}/family-tree`)}
              className="shrink-0 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm"
            >
              <span className="inline-flex items-center gap-2">
                <ArrowLeft size={14} />
                Retour
              </span>
            </button>
          </div>

          <h1 className="mt-4 text-[28px] leading-[1.05] font-black tracking-tight text-slate-900">
            Gérer mon profil dans l’arbre
          </h1>

          <p className="mt-2 text-sm font-bold text-slate-700">
            Choisis ce que les autres peuvent voir sur ta fiche dans l’arbre
            familial.
          </p>

          <div
            className={`mt-4 inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-black ${isVerified
                ? "bg-emerald-50 text-emerald-700"
                : identityStatus === "pending"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-slate-100 text-slate-700"
              }`}
          >
            <BadgeCheck size={14} />
            {verifiedLabel}
          </div>
        </section>

        {error ? (
          <div className="mt-3 rounded-2xl border border-[rgba(220,38,38,0.22)] bg-white p-3 shadow-sm">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 text-[color:var(--bad)]">
                <AlertTriangle size={18} />
              </div>
              <div>
                <div className="font-black text-slate-900">Oups</div>
                <div className="text-sm font-bold text-slate-700">{error}</div>
              </div>
            </div>
          </div>
        ) : null}

        {loadingInitialData ? (
          <section className="mt-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-bold text-slate-700">
              Chargement de ton profil…
            </div>
          </section>
        ) : (
          <form id="handle-profile-form" onSubmit={onSubmit} className="mt-3">
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-700" />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-amber-900">
                Chantiers en cours
              </div>
              <div className="mt-0.5 text-xs text-amber-800">
                <ol>
                  <li>Brancher les deux fonctions de calcul</li>
                  <li>Mes j'aime</li>
                  <li>Les j'aime que j'ai donné</li>
                  <li>Nombre de personnes individuelles qui se sont arrêtés sur ma fiche</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
        <section className="grid grid-cols-2 gap-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                  <Heart size={18} />
                </div>
                <div className="mt-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                  Réactions
                </div>
                <div className="mt-1 text-[28px] font-black tracking-tight text-slate-900">
                  {stats.reactionCount ?? "—"}
                </div>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  Nombre total de réactions reçues
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <Eye size={18} />
                </div>
                <div className="mt-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                  Vues
                </div>
                <div className="mt-1 text-[28px] font-black tracking-tight text-slate-900">
                  {stats.profileViewCount ?? "—"}
                </div>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  Nombre de consultations de ta fiche
                </p>
              </div>
            </section>

            <section className="mt-3 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_14px_32px_rgba(15,23,42,0.06)]">
              <div className="p-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 text-[color:var(--ok)]">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-900">
                        Visibilité de ma fiche
                      </div>
                      <div className="text-xs font-bold leading-5 text-slate-700">
                        Ces réglages concernent uniquement l’affichage de ta
                        fiche dans l’arbre. Tu peux décider séparément pour ton
                        nom, ta photo et les informations affichées.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  {PROFILE_FIELDS.map((field) => (
                    <ProfileConsentField
                      key={field.key}
                      icon={field.icon}
                      label={field.label}
                      helpText={field.helpText}
                      value={values[field.key]}
                      loading={loading}
                      onChange={(next) =>
                        setValues((prev) => ({
                          ...prev,
                          [field.key]: next,
                        }))
                      }
                    />
                  ))}
                </div>
              </div>
            </section>

            <footer className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-white via-white/95 to-white/0 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3">
              <div className="c-container">
                <div className="rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-[0_16px_38px_rgba(15,23,42,0.10)] backdrop-blur">
                  <button
                    type="submit"
                    form="handle-profile-form"
                    className={[
                      "inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl font-black transition",
                      loading
                        ? "cursor-wait bg-[color:var(--blue)] text-white opacity-70"
                        : "bg-[color:var(--blue)] text-white",
                    ].join(" ")}
                    disabled={loading}
                  >
                    <ArrowRight size={18} />
                    {loading ? "Enregistrement..." : "Enregistrer mes choix"}
                  </button>
                </div>
              </div>
            </footer>
          </form>
        )}
      </main>
    </div>
  );
}

type ProfileConsentFieldProps = {
  icon: LucideIcon;
  label: string;
  helpText: string;
  value: boolean | null;
  loading?: boolean;
  onChange: (next: boolean | null) => void;
};

function ProfileConsentField({
  icon: Icon,
  label,
  helpText,
  value,
  loading = false,
  onChange,
}: ProfileConsentFieldProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-700">
          <Icon size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-black text-slate-900">{label}</div>

          <div className="mt-1 text-xs font-bold leading-5 text-slate-600">
            {helpText}
          </div>

          <div className="mt-3 grid gap-2">
            <label
              className={[
                "flex items-start gap-3 rounded-2xl border p-3 transition",
                value === true
                  ? "border-indigo-200 bg-indigo-50"
                  : "border-slate-200 bg-white",
              ].join(" ")}
            >
              <input
                type="radio"
                name={label}
                checked={value === true}
                onChange={() => onChange(true)}
                disabled={loading}
                className="mt-1 h-4 w-4 border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="min-w-0">
                <div className="text-sm font-black text-slate-900">
                  Oui, j’accepte
                </div>
              </div>
            </label>

            <label
              className={[
                "flex items-start gap-3 rounded-2xl border p-3 transition",
                value === false
                  ? "border-indigo-200 bg-indigo-50"
                  : "border-slate-200 bg-white",
              ].join(" ")}
            >
              <input
                type="radio"
                name={`${label}-refuse`}
                checked={value === false}
                onChange={() => onChange(false)}
                disabled={loading}
                className="mt-1 h-4 w-4 border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="min-w-0">
                <div className="text-sm font-black text-slate-900">
                  Non, je refuse
                </div>
              </div>
            </label>
          </div>

          {value === null ? (
            <div className="mt-3 text-xs font-bold text-amber-700">
              Aucun choix enregistré pour le moment.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * TODO à brancher sur la vraie source des réactions
 */
async function getProfileReactionCount(_: {
  eventSlug: string;
  personId: string;
}): Promise<number> {
  return 0;
}

/**
 * TODO à brancher sur la vraie source des vues
 */
async function getProfileViewCount(_: {
  eventSlug: string;
  personId: string;
}): Promise<number> {
  return 0;
}