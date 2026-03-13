import {
  ArrowRight,
  CalendarCheck,
  ClipboardList,
  Contact,
  Gamepad2,
  Gift,
  Info,
  Library,
  Mail,
  Map,
  MessageCircle,
  ShieldCheck,
  Star,
  TreePine,
  Trophy,
  UserCircle2,
  Users,
  Camera,
  Sparkles,
  CheckCircle2,
  Lock,
  Hammer,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

type HubActionStatus = "enabled" | "dev" | "disabled";
type HubAvailabilityMode = "available" | "launch";

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
  accentClass: string;
  ringClass: string;
  items: HubAction[];
};

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

  const prefix = mode === "launch" ? "Lancement" : "Disponible";

  if (diffDays <= 0) return `${prefix} aujourd’hui`;
  if (diffDays === 1) return `${prefix} demain`;
  return `${prefix} dans ${diffDays} jours`;
}

export function LandingPage() {
  const nav = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
  identity: true,
  prepare: true,
  discover: true,
  contribute: true,
  dayof: false,
  after: false,
});

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
      eventFeedback: false,
      photosVideos: false,
    },
    core: {
      familyTree: true,
      familyLibrary: false,
    },
  };

  const timeline = {
    warmupQuizAt: "2026-04-12",
    familyChallengesAt: "2026-03-24",
    programAt: "2026-04-01",
    teamGameAt: "2026-04-12",
    leaderboardAt: "2026-04-12",
    photosAt: "2026-04-12",
    feedbackAt: "2026-04-12",
  };

  const sections = useMemo<HubSection[]>(
  () => [
    {
      key: "identity",
      title: "Me présenter",
      subtitle: "Dire qui je suis et annoncer ma venue.",
      accentClass:
        "bg-gradient-to-br from-indigo-600 to-violet-600 text-white",
      ringClass: "ring-indigo-200",
      items: [
        {
          key: "present",
          label: "Se présenter à la famille",
          description: "Présente-toi pour aider les cousins à mieux te situer.",
          icon: UserCircle2,
          to: `/e/${slug}/welcome`,
          enabled: features.preEvent.presentYourself,
          status: "enabled",
          badge: "Essentiel",
        },
        {
          key: "questionnaire",
          label: "Partager ce que tu sais sur ta famille",
          description: "Ajoute ce que tu sais pour enrichir l’histoire familiale.",
          icon: ClipboardList,
          to: `/e/${slug}/family-knowledge`,
          enabled: features.preEvent.familyKnowledge,
          status: "enabled",
        },
        {
          key: "attendance",
          label: "Confirmer sa présence",
          description: "Annonce ta venue pour aider à préparer la journée.",
          icon: CalendarCheck,
          to: `/e/${slug}/attendance`,
          enabled: features.preEvent.attendance,
          status: "enabled",
        },
      ],
    },
    {
      key: "prepare",
      title: "Préparer la rencontre",
      subtitle: "S’informer et se projeter avant le jour J.",
      accentClass: "bg-gradient-to-br from-sky-600 to-cyan-600 text-white",
      ringClass: "ring-sky-200",
      items: [
        {
          key: "program",
          label: "Découvrir le programme",
          description: "Retrouve l’essentiel pour profiter pleinement de la journée.",
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
        },
        {
          key: "quiz",
          label: "Tester sa mémoire familiale",
          description: "Réveille tes souvenirs avec un quiz rapide.",
          icon: Sparkles,
          to: `/e/${slug}/quiz/warmup`,
          enabled: features.preEvent.warmupQuiz,
          status: "disabled",
          availableAt: timeline.warmupQuizAt,
          availabilityMode: "available",
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
      accentClass:
        "bg-gradient-to-br from-amber-500 to-orange-500 text-white",
      ringClass: "ring-amber-200",
      items: [
        {
          key: "family-tree",
          label: "Explorer l’arbre familial",
          description: "Retrouve les liens entre les branches de la famille.",
          icon: Map,
          to: `/e/${slug}/arbre`,
          enabled: features.core.familyTree,
          status: "enabled",
        },
        {
          key: "library",
          label: "Explorer les archives familiales",
          description: "Découvre photos, documents et histoires de famille.",
          icon: Library,
          to: `/e/${slug}/bibliotheque`,
          enabled: features.core.familyLibrary,
          status: "disabled",
        },
      ],
    },
    {
      key: "contribute",
      title: "Contribuer à la mémoire familiale",
      subtitle: "Partager, transmettre et laisser une trace.",
      accentClass:
        "bg-gradient-to-br from-green-600 to-emerald-600 text-white",
      ringClass: "ring-green-200",
      items: [
        {
          key: "tree-contrib",
          label: "Aider à compléter l’arbre familial",
          description: "Ajoute une information utile à l’arbre de la famille.",
          icon: TreePine,
          to: `/e/${slug}/tree/contribute`,
          enabled: features.preEvent.enrichTree,
          status: "disabled",
        },
        {
          key: "testimony-before",
          label: "Partager un souvenir de famille",
          description: "Transmets une anecdote ou un souvenir qui compte pour toi.",
          icon: MessageCircle,
          to: `/e/${slug}/temoignage`,
          enabled: features.preEvent.testimonyBefore,
          status: "disabled",
        },
      ],
    },
    {
      key: "dayof",
      title: "Le jour J",
      subtitle: "Participer, jouer et garder le lien sur place.",
      accentClass:
        "bg-gradient-to-br from-fuchsia-600 to-pink-600 text-white",
      ringClass: "ring-fuchsia-200",
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
        {
          key: "swap-contacts",
          label: "Échanger ses contacts",
          description: "Garde le lien avec les cousins rencontrés sur place.",
          icon: Contact,
          to: `/e/${slug}/contacts/exchange`,
          enabled: features.duringEvent.swapContacts,
          status: "disabled",
          availableAt: timeline.teamGameAt,
          availabilityMode: "available",
        },
      ],
    },
    {
      key: "after",
      title: "Après la rencontre",
      subtitle: "Retrouver les souvenirs et prolonger le lien.",
      accentClass:
        "bg-gradient-to-br from-emerald-600 to-teal-600 text-white",
      ringClass: "ring-emerald-200",
      items: [
        {
          key: "feedback",
          label: "Donner son avis",
          description: "Partage ton retour pour aider à préparer la suite.",
          icon: Star,
          to: `/e/${slug}/avis`,
          enabled: features.postEvent.eventFeedback,
          status: "disabled",
          availableAt: timeline.feedbackAt,
          availabilityMode: "available",
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
          label: "Partager son souvenir de la cousinade",
          description: "Raconte ce qui t’a marqué pendant la journée.",
          icon: MessageCircle,
          to: `/e/${slug}/temoignage`,
          enabled: features.postEvent.testimonyAfter,
          status: "disabled",
          availableAt: timeline.photosAt,
          availabilityMode: "available",
        },
      ],
    },
  ],
  [slug],
);

  const slugName = slug.toUpperCase();

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pb-24 pt-4">
        <section className="overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_45%,#312e81_100%)] text-white shadow-[0_24px_60px_rgba(15,23,42,0.28)]">
          <div className="p-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-extrabold">
              <Users size={14} />
              Cousinade {slugName}
            </div>

            <h1 className="mt-4 text-[30px] leading-[1.02] font-black tracking-tight">
              Un seul endroit
              <br />
              pour toute la cousinade
            </h1>

            <p className="mt-3 max-w-[38rem] text-sm font-bold leading-6 text-white/88">
              Prépare la rencontre, participe plus facilement et garde une trace
              de cette journée en famille.
            </p>
          </div>
        </section>

        <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-2xl bg-slate-100 p-2 text-slate-700">
              <ShieldCheck size={18} />
            </div>
            <div>
              <div className="text-[16px] font-black text-slate-900">
                Première visite ?
              </div>
              <p className="mt-1 text-sm font-bold leading-6 text-slate-700">
                Commence par te présenter, puis confirme ta présence.
              </p>
            </div>
          </div>
        </section>

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
                  className={`w-full rounded-[26px] p-4 text-left ${section.accentClass}`}
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
                      {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </div>
                  </div>
                </button>

                {isOpen ? (
                  <div className="grid gap-3">
                    {section.items.map((item) => (
                      <HubActionCard
                        key={item.key}
                        item={item}
                        onClick={() => {
                          if (!item.enabled || item.status !== "enabled") return;
                          if (item.externalHref) {
                            window.location.href = item.externalHref;
                            return;
                          }
                          if (item.to) nav(item.to);
                        }}
                      />
                    ))}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      </main>
    </div>
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
  const status = item.status ?? (item.enabled ? "enabled" : "disabled");
  const disabled = status !== "enabled";
  const availabilityLabel =
    status === "disabled"
      ? getAvailabilityLabel(item.availableAt, item.availabilityMode)
      : null;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "w-full rounded-[24px] border p-4 text-left transition-all",
        "shadow-sm",
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
              : "bg-slate-100 text-slate-900",
          ].join(" ")}
        >
          <Icon size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div
              className={[
                "text-[15px] font-black",
                disabled ? "text-slate-500" : "text-slate-900",
              ].join(" ")}
            >
              {item.label}
            </div>

            {item.badge && (
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
            )}
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
          {status === "disabled" ? (
            <span className="text-slate-500">{availabilityLabel}</span>
          ) : status === "dev" ? (
            <span className="inline-flex items-center gap-1 text-amber-700">
              <Hammer size={14} />
              En cours de dev
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-emerald-700">
              <CheckCircle2 size={14} />
              Disponible
            </span>
          )}
        </div>

        {status === "enabled" && (
          <div className="text-[11px] font-black text-slate-500">Ouvrir</div>
        )}
      </div>
    </button>
  );
}