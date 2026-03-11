import {
  ArrowRight,
  CalendarCheck,
  ClipboardList,
  Contact,
  Gamepad2,
  Gift,
  Image as ImageIcon,
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
} from "lucide-react";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

type HubActionStatus = "enabled" | "dev" | "disabled";

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
};

type HubSection = {
  key: string;
  title: string;
  subtitle: string;
  accentClass: string;
  ringClass: string;
  items: HubAction[];
};

export function LandingPage() {
  const nav = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  /**
   * Tout est piloté ici.
   * Tu peux brancher ça plus tard sur des flags venant de Supabase, d’un YAML,
   * d’une config d’événement ou d’un back-office.
   */
  const features = {
    before: {
      presentYourself: true,
      familyQuestionnaire: true,
      rsvp: true,
      enrichTree: true,
      warmupQuiz: true,
      familyChallenges: true,
      dayProgram: true,
      contactOrganizer: true,
      testimonyBefore: true,
    },
    during: {
      teamGame: false,
      leaderboard: false,
      familyTree: true,
      swapContacts: false,
      testimonyDuring: true,
    },
    after: {
      testimonyAfter: true,
      eventFeedback: false,
      photosVideos: false,
      familyLibrary: false,
    },
  };

  const sections = useMemo<HubSection[]>(
    () => [
      {
        key: "before",
        title: "Avant la cousinade",
        subtitle:
          "Prépare ta venue et aide à faire vivre l’histoire familiale.",
        accentClass:
          "bg-gradient-to-br from-indigo-600 to-violet-600 text-white",
        ringClass: "ring-indigo-200",
        items: [
          {
            key: "present",
            label: "Fais connaissance avec la famille",
            description:
              "Présente-toi en quelques secondes pour que tout le monde sache qui tu es et d’où tu viens dans la famille.",
            icon: UserCircle2,
            to: `/e/${slug}/welcome`,
            enabled: features.before.presentYourself,
            status: "enabled",
            badge: "Essentiel",
          },
          {
            key: "questionnaire",
            label: "Ce que tu sais sur la famille",
            description:
              "Tes parents, tes grands-parents, ta branche… quelques réponses pour enrichir l’histoire familiale.",
            icon: ClipboardList,
            to: `/e/${slug}/questionnaire`,
            enabled: features.before.familyQuestionnaire,
            status: "dev",
          },
          {
            key: "rsvp",
            label: "Je viens à la cousinade",
            description:
              "Confirme ta présence pour nous aider à préparer au mieux la journée.",
            icon: CalendarCheck,
            to: `/e/${slug}/rsvp`,
            enabled: features.before.rsvp,
            status: "dev",
            badge: "RSVP",
          },
          {
            key: "tree-contrib",
            label: "Aide à compléter l’arbre familial",
            description:
              "Ajoute une info, un nom ou un souvenir pour enrichir l’arbre de la famille.",
            icon: TreePine,
            to: `/e/${slug}/tree/contribute`,
            enabled: features.before.enrichTree,
            status: "disabled",
          },
          {
            key: "quiz",
            label: "Teste ta mémoire familiale",
            description:
              "Un petit quiz rapide pour réveiller tes souvenirs et redécouvrir la famille.",
            icon: Sparkles,
            to: `/e/${slug}/quiz/warmup`,
            enabled: features.before.warmupQuiz,
            status: "disabled",
          },
          {
            key: "challenges",
            label: "Relève les défis de la famille",
            description:
              "5 défis, 3 niveaux, des points à gagner… et peut-être un cadeau le jour J.",
            icon: Gift,
            to: `/e/${slug}/defis`,
            enabled: features.before.familyChallenges,
            status: "disabled",
            badge: "Points",
          },
          {
            key: "program",
            label: "Découvre le programme",
            description:
              "Toutes les infos utiles pour profiter au maximum de la cousinade.",
            icon: Info,
            to: `/e/${slug}/programme`,
            enabled: features.before.dayProgram,
            status: "disabled",
          },
          {
            key: "contact",
            label: "Une question ? Contacte-moi",
            description:
              "Besoin d’une info pratique ou d’un renseignement ? Écris directement à l’organisateur.",
            icon: Mail,
            to: `/e/${slug}/contact`,
            enabled: features.before.contactOrganizer,
            status: "disabled",
          },
          {
            key: "testimony-before",
            label: "Partage un souvenir de famille",
            description:
              "Une anecdote, une histoire ou un souvenir que tu aimerais transmettre.",
            icon: MessageCircle,
            to: `/e/${slug}/temoignage`,
            enabled: features.before.testimonyBefore,
            status: "disabled",
          },
        ],
      },
      {
        key: "during",
        title: "Pendant la cousinade",
        subtitle: "Participe, joue et découvre la famille autrement.",
        accentClass:
          "bg-gradient-to-br from-emerald-600 to-teal-600 text-white",
        ringClass: "ring-emerald-200",
        items: [
          {
            key: "team-game",
            label: "Jouer au grand jeu de la cousinade",
            description:
              "Forme une équipe, relève les missions et affronte les autres branches de la famille.",
            icon: Gamepad2,
            to: `/e/${slug}/team`,
            enabled: features.during.teamGame,
            status: "disabled",
            badge: "Jour J",
          },
          {
            key: "leaderboard",
            label: "Voir le classement",
            description:
              "Qui mène la course ? Suis les scores des équipes en direct.",
            icon: Trophy,
            to: `/e/${slug}/classement`,
            enabled: features.during.leaderboard,
            status: "disabled",
          },
          {
            key: "family-tree",
            label: "Explorer l’arbre familial",
            description:
              "Découvre les liens entre les branches et retrouve les membres de la famille.",
            icon: Map,
            to: `/e/${slug}/arbre`,
            enabled: features.during.familyTree,
            status: "disabled",
          },
          {
            key: "swap-contacts",
            label: "Échanger ses contacts",
            description:
              "Garde le contact avec les cousins que tu rencontres aujourd’hui.",
            icon: Contact,
            to: `/e/${slug}/contacts/exchange`,
            enabled: features.during.swapContacts,
            status: "disabled",
          },
          {
            key: "testimony-during",
            label: "Raconte ta cousinade",
            description:
              "Un moment marquant, une rencontre, une émotion… partage ton souvenir.",
            icon: MessageCircle,
            to: `/e/${slug}/temoignage`,
            enabled: features.during.testimonyDuring,
            status: "disabled",
          },
        ],
      },
      {
        key: "after",
        title: "Après la cousinade",
        subtitle: "Prolonge la rencontre et garde une trace de cette journée.",
        accentClass:
          "bg-gradient-to-br from-amber-500 to-orange-500 text-white",
        ringClass: "ring-amber-200",
        items: [
          {
            key: "testimony-after",
            label: "Partager ton souvenir",
            description:
              "Qu’est-ce qui t’a marqué pendant cette journée familiale ?",
            icon: MessageCircle,
            to: `/e/${slug}/temoignage`,
            enabled: features.after.testimonyAfter,
            status: "disabled",
          },
          {
            key: "feedback",
            label: "Donner ton avis",
            description:
              "Ton retour nous aidera à organiser les prochaines cousinades.",
            icon: Star,
            to: `/e/${slug}/avis`,
            enabled: features.after.eventFeedback,
            status: "disabled",
          },
          {
            key: "photos",
            label: "Voir les photos de la cousinade",
            description:
              "Retrouve les meilleurs moments de la journée en images.",
            icon: Camera,
            to: `/e/${slug}/medias`,
            enabled: features.after.photosVideos,
            status: "disabled",
          },
          {
            key: "library",
            label: "Explorer les archives familiales",
            description:
              "Photos anciennes, documents et histoires de famille à découvrir.",
            icon: Library,
            to: `/e/${slug}/bibliotheque`,
            enabled: features.after.familyLibrary,
            status: "disabled",
          },
        ],
      },
    ],
    [slug],
  );
  let slugName = slug.toUpperCase();

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pb-24 pt-4">
        {/* HERO */}
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
              Avant, pendant et après l’événement, cette application te permet
              de participer facilement, retrouver les informations utiles et
              contribuer à la mémoire familiale.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <HeroMiniCard
                icon={CalendarCheck}
                title="Avant"
                text="Se présenter, répondre, confirmer sa venue."
              />
              <HeroMiniCard
                icon={Gamepad2}
                title="Pendant"
                text="Jouer, consulter le classement, explorer l’arbre."
              />
              <HeroMiniCard
                icon={ImageIcon}
                title="Après"
                text="Témoignages, souvenirs, photos et documents."
              />
            </div>
          </div>
        </section>

        {/* MESSAGE D’ORIENTATION */}
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
                Commence simplement par :<br />
                <span className="text-slate-900">Te présenter</span> →{" "}
                <span className="text-slate-900">Questionnaire famille</span> →{" "}
                <span className="text-slate-900">Confirmer ta présence</span>
              </p>
            </div>
          </div>
        </section>

        {/* SECTIONS */}
        <div className="mt-5 space-y-5">
          {sections.map((section) => (
            <section key={section.key} className="space-y-3">
              <div className={`rounded-[26px] p-4 ${section.accentClass}`}>
                <div className="text-[20px] font-black">{section.title}</div>
                <p className="mt-1 text-sm font-bold leading-6 text-white/90">
                  {section.subtitle}
                </p>
              </div>

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
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}

function HeroMiniCard({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/10 p-3 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <div className="rounded-xl bg-white/15 p-2">
          <Icon size={16} />
        </div>
        <div className="text-sm font-black">{title}</div>
      </div>
      <div className="mt-2 text-xs font-bold leading-5 text-white/85">
        {text}
      </div>
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
            <span className="text-slate-500">Bientôt disponible</span>
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