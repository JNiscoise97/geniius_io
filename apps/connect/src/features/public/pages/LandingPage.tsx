import {
  ArrowRight,
  CalendarCheck,
  Camera,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Footprints,
  Gamepad2,
  Gamepad2Icon,
  Gift,
  Hammer,
  Heart,
  Info,
  Library,
  Lock,
  Mail,
  Map as MapIcon,
  MessageCircle,
  Sparkles,
  Star,
  Trophy,
  User,
  UserCircle2,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { createPageTimeTracker } from "../../../lib/analytics/pageTimeTracker";
import { getParticipantSession } from "../../../lib/participant-session/getActiveParticipant";
import {
  getCompletionRulesForParticipant,
  getFirstIncompleteCompletionRules,
  type CompletionRule,
} from "../../../lib/completion/sectionCompletion";
import { loadCompletionData } from "../../../lib/completion/loadCompletionData";

type HubActionStatus = "enabled" | "dev" | "disabled";
type HubAvailabilityMode = "available" | "launch";
type LandingMode = "guided" | "all";

type HubAction = {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  to?: string;
  externalHref?: string;
  enabled: boolean;
  status?: HubActionStatus;
  badge?: string;
  availableAt?: string;
  availabilityMode?: HubAvailabilityMode;
};

type HubSection = {
  key: string;
  title: string;
  subtitle: string;
  items: HubAction[];
};

const SECTION_HEADER_CLASS =
  "bg-[linear-gradient(135deg,#3b4274_0%,#4b53a6_100%)] text-white shadow-[0_10px_24px_rgba(59,66,116,0.18)]";

function getAvailabilityLabel(
  dateString?: string,
  mode: HubAvailabilityMode = "available",
) {
  if (!dateString) return "Bientôt disponible";

  const target = new Date(dateString);
  const now = new Date();

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfTarget = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
  );

  const diffMs = startOfTarget.getTime() - startOfToday.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0 && diffDays >= -4) {
    return "Nouveau";
  }

  const prefix = mode === "launch" ? "Lancement" : "Disponible";

  if (diffDays <= 0) return `${prefix} aujourd’hui`;
  if (diffDays === 1) return `${prefix} demain`;
  return `${prefix} dans ${diffDays} jours`;
}

function renderStatus(status: HubActionStatus, availabilityLabel?: string) {
  if (status === "disabled") {
    if (availabilityLabel === "Nouveau") {
      return (
        <span className="inline-flex items-center gap-1 text-emerald-700">
          <Sparkles size={14} />
          Nouveau
        </span>
      );
    }

    return <span className="text-slate-500">{availabilityLabel}</span>;
  }

  if (status === "dev") {
    return (
      <span className="inline-flex items-center gap-1 text-amber-700">
        <Hammer size={14} />
        En cours de dev
      </span>
    );
  }

  if (availabilityLabel === "Nouveau") {
    return (
      <span className="inline-flex items-center gap-1 text-emerald-700">
        <Sparkles size={14} />
        Nouveau
      </span>
    );
  }

  return null;
}

function getActionStatus(item: HubAction): HubActionStatus {
  return item.status ?? (item.enabled ? "enabled" : "disabled");
}

export function LandingPage() {
  const navigate = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const [mode, setMode] = useState<LandingMode>("guided");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    identity: true,
    prepare: true,
    discover: true,
    contribute: true,
    dayof: true,
    after: true,
  });
  const [guidedPrompts, setGuidedPrompts] = useState<CompletionRule[]>([]);
  const [loadingGuidedPrompts, setLoadingGuidedPrompts] = useState(true);

  const participantSession = getParticipantSession(slug);
  const participantId = participantSession?.participantId ?? null;
  const firstName = participantSession?.firstName?.trim();

  const features = {
    preEvent: {
      presentYourself: true,
      familyKnowledge: true,
      attendance: true,
      enrichTree: true,
      warmupQuiz: true,
      familyChallenges: true,
      dayProgram: true,
      contactOrganizer: true,
      testimonyBefore: true,
    },
    duringEvent: {
      teamGame: false,
      leaderboard: false,
      swapContacts: false,
      testimonyDuring: true,
    },
    postEvent: {
      testimonyAfter: true,
      eventFeedback: true,
      photosVideos: false,
    },
    core: {
      familyTree: false,
      familyLibrary: false,
      familyTreePerson: true,
    },
  };

  const timeline = {
    present: "2026-03-17",
    familyKnowledge: "2026-03-17",
    attendance: "2026-03-17",
    contact: "2026-03-17",
    familyTreePerson: "2026-03-17",

    familyTree: "2026-03-22",
    warmupQuizAt: "2026-03-25",
    testimonyBefore: "2026-03-25",
    contribute: "2026-03-25",

    familyLibrary: "2026-03-25",

    familyChallengesAt: "2026-03-29",

    programAt: "2026-04-05",

    teamGameAt: "2026-04-12",
    leaderboardAt: "2026-04-12",
    photosAt: "2026-04-26",
    feedbackAt: "2026-04-12",
  };

  const participantCompletionRules = useMemo(
    () => getCompletionRulesForParticipant(participantId),
    [participantId],
  );

  const sections = useMemo<HubSection[]>(
    () => [
      {
        key: "identity",
        title: "Me présenter",
        subtitle: "Dire qui je suis et annoncer ma venue.",
        items: [
          {
            key: "present",
            label: "Ton espace personnel",
            description:
              "Ajoute quelques informations pour te présenter et créer du lien avec les cousins.",
            icon: UserCircle2,
            to: `/e/${slug}/welcome`,
            enabled: features.preEvent.presentYourself,
            status: "enabled",
            badge: "Essentiel",
            availableAt: timeline.present,
          },
          {
            key: "questionnaire",
            label: "Partager ce que tu sais sur ta famille",
            description:
              "Ajoute ce que tu sais pour enrichir l’histoire familiale.",
            icon: ClipboardList,
            to: `/e/${slug}/family-knowledge`,
            enabled: features.preEvent.familyKnowledge,
            status: "enabled",
            availableAt: timeline.familyKnowledge,
          },
          {
            key: "attendance",
            label: "Confirme ta présence",
            description: "Annonce ta venue pour aider à préparer la journée.",
            icon: CalendarCheck,
            to: `/e/${slug}/attendance`,
            enabled: features.preEvent.attendance,
            status: "enabled",
            availableAt: timeline.attendance,
          },
        ],
      },
      {
        key: "prepare",
        title: "Préparer la rencontre",
        subtitle: "S’informer et se projeter avant le jour J.",
        items: [
          {
            key: "program",
            label: "Découvrir le programme",
            description:
              "Retrouve l’essentiel pour profiter pleinement de la journée.",
            icon: Info,
            to: `/e/${slug}/programme`,
            enabled: features.preEvent.dayProgram,
            status: "disabled",
            availableAt: timeline.programAt,
            availabilityMode: "available",
          },
          {
            key: "contact",
            label: "Contacter l’organisateur",
            description: "Pose une question pratique ou demande une précision.",
            icon: Mail,
            to: `/e/${slug}/contact`,
            enabled: features.preEvent.contactOrganizer,
            status: "enabled",
            availableAt: timeline.contact,
          },
          {
            key: "quiz",
            label: "Tester sa mémoire familiale",
            description: "Réveille tes souvenirs avec un quiz rapide.",
            icon: Gamepad2Icon,
            to: `/e/${slug}/activities`,
            enabled: features.preEvent.warmupQuiz,
            status: "enabled",
            availableAt: timeline.warmupQuizAt,
          },
          {
            key: "challenges",
            label: "Relever les défis de la famille",
            description: "Entre dans l’ambiance avec quelques défis à relever.",
            icon: Gift,
            to: `/e/${slug}/defis`,
            enabled: features.preEvent.familyChallenges,
            status: "disabled",
            badge: "Points",
            availableAt: timeline.familyChallengesAt,
            availabilityMode: "launch",
          },
        ],
      },
      {
        key: "discover",
        title: "Découvrir la famille",
        subtitle: "Explorer les liens, les histoires et les archives.",
        items: [
          {
            key: "family-tree-person",
            label: "Gromèr Covindou",
            description:
              "Découvre l'histoire et la généalogie de notre aïeule.",
            icon: User,
            to: `/e/${slug}/fiche?id=@7398@`,
            enabled: features.core.familyTreePerson,
            availableAt: timeline.familyTreePerson,
            status: "enabled",
          },
          {
            key: "family-tree",
            label: "Explorer l’arbre familial",
            description: "Retrouve les liens entre les branches de la famille.",
            icon: MapIcon,
            to: `/e/${slug}/arbre`,
            enabled: features.core.familyTree,
            availableAt: timeline.familyTree,
            status: "enabled",
          },
          {
            key: "library",
            label: "Explorer les archives familiales",
            description: "Découvre photos, documents et histoires de famille.",
            icon: Library,
            to: `/e/${slug}/documents`,
            enabled: features.core.familyLibrary,
            status: "enabled",
          },
        ],
      },
      {
        key: "contribute",
        title: "Contribuer à la mémoire familiale",
        subtitle: "Partager, transmettre et laisser une trace.",
        items: [
          {
            key: "family-reactions",
            label: "Voir les réactions de la famille",
            description:
              "Retrouve les souvenirs, photos et réactions partagés autour des fiches individuelles.",
            icon: Heart,
            to: `/e/${slug}/reactions`,
            enabled: true,
            status: "enabled",
          },
          {
            key: "testimony-before",
            label: "Partager un souvenir de famille",
            description:
              "Transmets une anecdote ou un souvenir qui compte pour toi.",
            icon: MessageCircle,
            to: `/e/${slug}/temoignage`,
            enabled: features.preEvent.testimonyBefore,
            status: "disabled",
            availableAt: timeline.testimonyBefore,
          },
        ],
      },
      {
        key: "dayof",
        title: "Le jour J",
        subtitle: "Participer, jouer et garder le lien sur place.",
        items: [
          {
            key: "team-game",
            label: "Jouer au grand jeu de la cousinade",
            description: "Forme une équipe et lance-toi dans l’aventure.",
            icon: Gamepad2,
            to: `/e/${slug}/team`,
            enabled: features.duringEvent.teamGame,
            status: "disabled",
            badge: "Jour J",
            availableAt: timeline.teamGameAt,
            availabilityMode: "launch",
          },
          {
            key: "leaderboard",
            label: "Voir le classement",
            description: "Suis les scores et vois qui mène la course.",
            icon: Trophy,
            to: `/e/${slug}/classement`,
            enabled: features.duringEvent.leaderboard,
            status: "disabled",
            availableAt: timeline.leaderboardAt,
            availabilityMode: "launch",
          },
        ],
      },
      {
        key: "after",
        title: "Après la rencontre",
        subtitle: "Retrouver les souvenirs et prolonger le lien.",
        items: [
          {
            key: "feedback",
            label: "Donner son avis",
            description: "Partage ton retour pour aider à préparer la suite.",
            icon: Star,
            to: `/e/${slug}/avis`,
            enabled: features.postEvent.eventFeedback,
            status: "enabled",
          },
          {
            key: "photos",
            label: "Voir les photos de la cousinade",
            description: "Retrouve les plus beaux moments en images.",
            icon: Camera,
            to: `/e/${slug}/medias`,
            enabled: features.postEvent.photosVideos,
            status: "disabled",
            availableAt: timeline.photosAt,
            availabilityMode: "available",
          },
          {
            key: "testimony-after",
            label: "Voir les souvenirs de la cousinade",
            description: "Revis la cousinade à travers les témoignages de ceux qui y étaient.",
            icon: MessageCircle,
            to: `/e/${slug}/temoignage`,
            enabled: features.postEvent.testimonyAfter,
            status: "enabled",
          },
        ],
      },
    ],
    [slug],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadGuidedPrompts() {
      if (!participantId) {
        if (!cancelled) {
          setGuidedPrompts(
            participantCompletionRules
              .filter((rule) => rule.type === "info")
              .slice(0, 5),
          );
          setLoadingGuidedPrompts(false);
        }
        return;
      }

      try {
        setLoadingGuidedPrompts(true);

        const rowsByTable = await loadCompletionData(
          participantId,
          participantCompletionRules,
        );
        const nextPrompts = getFirstIncompleteCompletionRules(
          participantCompletionRules,
          rowsByTable,
          3,
        );

        if (!cancelled) {
          setGuidedPrompts(nextPrompts);
        }
      } catch (error) {
        console.error("Impossible de charger les actions guidées", error);

        if (!cancelled) {
          setGuidedPrompts([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingGuidedPrompts(false);
        }
      }
    }

    void loadGuidedPrompts();

    return () => {
      cancelled = true;
    };
  }, [participantId, participantCompletionRules]);

  function openCompletionRule(rule: CompletionRule) {
    navigate(`/e/${slug}${rule.to}`);
  }

  function openAction(item: HubAction) {
    const status = getActionStatus(item);
    if (status !== "enabled") return;

    if (item.externalHref) {
      window.location.href = item.externalHref;
      return;
    }

    if (item.to) {
      navigate(item.to);
    }
  }

  useEffect(() => {
    if (!participantId) return;

    const tracker = createPageTimeTracker({
      participantId,
      eventSlug: slug,
      pageKey: `/e/${slug}/home`,
    });

    tracker.start();

    return () => {
      void tracker.stop();
    };
  }, [participantId, slug]);

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pb-24 pt-4">
        <section className="overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_45%,#312e81_100%)] text-white shadow-[0_24px_60px_rgba(15,23,42,0.28)]">
          <div className="p-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-extrabold">
              <Users size={14} />
              Cousinade {slug.toUpperCase()}
            </div>

            <h1 className="mt-4 text-[30px] leading-[1.02] font-black tracking-tight">
              {firstName
                ? `Bienvenue ${firstName}`
                : "Bienvenue dans l’espace famille"}
            </h1>

            <p className="mt-3 max-w-[38rem] text-sm font-bold leading-6 text-white/88">
              Commence simplement avec quelques actions utiles, puis explore
              tout l’espace famille à ton rythme.
            </p>
          </div>
        </section>


        <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("guided")}
              className={[
                "rounded-2xl px-4 py-3 text-sm font-black transition inline-flex items-center justify-center gap-2",
                mode === "guided"
                  ? "bg-[color:var(--blue)] text-white"
                  : "bg-slate-50 text-slate-700",
              ].join(" ")}
            >
              <Footprints size={16} />
              Actions guidées
            </button>

            <button
              type="button"
              onClick={() => setMode("all")}
              className={[
                "rounded-2xl px-4 py-3 text-sm font-black transition inline-flex items-center justify-center gap-2",
                mode === "all"
                  ? "bg-[color:var(--blue)] text-white"
                  : "bg-slate-50 text-slate-700",
              ].join(" ")}
            >
              <Library size={16} />
              Toutes les rubriques
            </button>
          </div>

          <p className="px-2 pb-2 pt-3 text-[13px] font-bold leading-5 text-slate-700">
            {mode === "guided"
              ? "Toutes les rubriques te permettent de retrouver l’ensemble de l’espace famille : ce que tu as déjà rempli, ce qu’il reste à compléter et ce qui arrive bientôt."
              : "Tu peux revenir aux actions guidées si tu préfères être accompagné pas à pas."}
          </p>
        </section>

        {mode === "guided" ? (
          <>
            <section className="mt-5 space-y-4">
              {loadingGuidedPrompts ? (
                <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="text-sm font-bold text-slate-700">
                    Chargement des actions guidées...
                  </div>
                </section>
              ) : null}

              {!loadingGuidedPrompts &&
                guidedPrompts.map(
                  (prompt) =>
                    prompt.enable && (
                      <GuidedPromptCard
                        key={prompt.key}
                        prompt={prompt}
                        onClick={() => openCompletionRule(prompt)}
                      />
                    ),
                )}

              {!loadingGuidedPrompts && guidedPrompts.length === 0 ? (
                <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="text-sm font-bold text-slate-900">
                    Tu es à jour pour le moment.
                  </div>
                  <p className="mt-1 text-xs font-bold leading-5 text-slate-600">
                    Retrouve toutes les rubriques dans “Tout explorer”.
                  </p>
                </section>
              ) : null}
            </section>
            <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm mt-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-2xl bg-slate-100 p-3 text-slate-900">
                  <Library size={20} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-[16px] font-black text-slate-900">
                    Voir toutes les rubriques
                  </div>
                  <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
                    Retrouve tout l’espace famille en un seul endroit, y compris
                    les rubriques déjà remplies et celles à venir.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      window.scrollTo({
                        top: 0,
                        left: 0,
                        behavior: "auto",
                      });
                      setMode("all");
                    }}
                    className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-900"
                  >
                    Ouvrir
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </section>
          </>
        ) : (
          <div className="mt-5 space-y-4">
            {sections.map((section) => {
              const isOpen = openSections[section.key];

              return (
                <section key={section.key} className="space-y-3">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenSections((prev) => ({
                        ...prev,
                        [section.key]: !prev[section.key],
                      }))
                    }
                    className={`w-full rounded-[26px] p-4 text-left ${SECTION_HEADER_CLASS}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[20px] font-black">
                          {section.title}
                        </div>
                        <p className="mt-1 text-sm font-bold leading-6 text-white/90">
                          {section.subtitle}
                        </p>
                      </div>

                      <div className="shrink-0 rounded-2xl bg-white/10 p-2 text-white">
                        {isOpen ? (
                          <ChevronDown size={18} />
                        ) : (
                          <ChevronRight size={18} />
                        )}
                      </div>
                    </div>
                  </button>

                  {isOpen ? (
                    <div className="grid gap-3">
                      {section.items.map((item) => (
                        <HubActionCard
                          key={item.key}
                          item={item}
                          onClick={() => openAction(item)}
                        />
                      ))}
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function GuidedPromptCard({
  prompt,
  onClick,
}: {
  prompt: CompletionRule;
  onClick: () => void;
}) {
  const Icon = prompt.icon;
  const isBeta = Boolean(prompt.betaBadge);

  return (
    <article
      className={[
        "rounded-[28px] border p-5 shadow-sm",
        isBeta
          ? "border-amber-200 bg-[linear-gradient(135deg,#fff7ed_0%,#fffbeb_100%)]"
          : "border-slate-200 bg-white",
      ].join(" ")}
    >
      <div className="flex items-center gap-2">
        <div
          className={[
            "text-[11px] font-extrabold uppercase tracking-wide",
            isBeta ? "text-amber-700" : "text-slate-500",
          ].join(" ")}
        >
          {prompt.eyebrow}
        </div>

        {prompt.betaBadge ? (
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-amber-800">
            {prompt.betaBadge}
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex items-start gap-4">
        <div
          className={[
            "mt-0.5 rounded-2xl p-3",
            isBeta
              ? "bg-amber-100 text-amber-700"
              : "bg-indigo-50 text-indigo-700",
          ].join(" ")}
        >
          <Icon size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-black leading-6 text-slate-900">
            {prompt.actionRapide}
          </h2>

          <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
            {prompt.text}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onClick}
              className={[
                "inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black text-white transition active:scale-[0.99]",
                isBeta
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-[color:var(--blue)]",
              ].join(" ")}
            >
              {prompt.cta}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function HubActionCard({
  item,
  onClick,
}: {
  item: HubAction;
  onClick: () => void;
}) {
  const Icon = item.icon;
  const status = getActionStatus(item);
  const disabled = status !== "enabled";
  const availabilityLabel = item.availableAt
    ? getAvailabilityLabel(item.availableAt, item.availabilityMode)
    : undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "w-full rounded-[24px] border p-4 text-left shadow-sm transition-all",
        disabled
          ? "border-slate-200 bg-slate-50 opacity-80"
          : "border-slate-200 bg-white active:scale-[0.99] active:shadow-none",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div
          className={[
            "mt-0.5 rounded-2xl p-3",
            disabled
              ? "bg-slate-200 text-slate-500"
              : "bg-indigo-50 text-indigo-700",
          ].join(" ")}
        >
          <Icon size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={[
                "text-[15px] font-black",
                disabled ? "text-slate-500" : "text-slate-900",
              ].join(" ")}
            >
              {item.label}
            </div>

            {item.badge ? (
              <span
                className={[
                  "rounded-full px-2 py-1 text-[10px] font-black",
                  disabled
                    ? "bg-slate-200 text-slate-500"
                    : "bg-indigo-50 text-indigo-700",
                ].join(" ")}
              >
                {item.badge}
              </span>
            ) : null}
          </div>

          <p
            className={[
              "mt-1 text-xs font-bold leading-5",
              disabled ? "text-slate-500" : "text-slate-700",
            ].join(" ")}
          >
            {item.description}
          </p>
        </div>

        <div
          className={[
            "shrink-0 rounded-2xl p-2",
            disabled
              ? "bg-slate-200 text-slate-500"
              : "bg-slate-100 text-slate-900",
          ].join(" ")}
        >
          {status === "enabled" ? (
            <ArrowRight size={18} />
          ) : status === "dev" ? (
            <Hammer size={18} />
          ) : (
            <Lock size={18} />
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-[11px] font-extrabold">
          {renderStatus(status, availabilityLabel)}
        </div>
      </div>
    </button>
  );
}
