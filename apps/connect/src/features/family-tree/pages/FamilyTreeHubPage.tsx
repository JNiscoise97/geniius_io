import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Compass,
  GitBranch,
  Heart,
  Search,
  TreeDeciduous,
  UserCircle2,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { buildFamilyTreeMetrics } from "../api/buildFamilyTreeMetrics";
import { FAMILY_GRAPH } from "../api/loadGraph";
import { ROOT_HONORED_PERSON_ID } from "../../../config/eventInfos";
import { getParticipantSession } from "../../../lib/participant-session/getActiveParticipant";
import { getMyPersonIdentityClaim } from "../api/getMyPersonIdentityClaim";

type TreeHubAction = {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  to?: string;
  enabled: boolean;
  badge?: string;
  featured?: boolean;
};

type TreeHubSection = {
  key: string;
  title: string;
  subtitle: string;
  items: TreeHubAction[];
};

type TreeMetric = {
  key: string;
  label: string;
  value: string;
};

export function FamilyTreeHubPage() {
  const nav = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const participantSession = getParticipantSession(slug);
  const participantId = participantSession?.participantId ?? null;

  const [myIdentityClaimStatus, setMyIdentityClaimStatus] = useState<
    "pending" | "approved" | "rejected" | "auto_verified" | null
  >(null);
  const [loadingClaim, setLoadingClaim] = useState(true);

  const commonAncestor = {
    title: "Arbre généalogique",
    displayName: "Covindou TANDIEMAIN (1868-1955)",
    description:
      "Cet arbre rassemble les descendants identifiés de Gromèr Covindou TANDIEMAIN (1868-1955). Il permet à chacun de retrouver sa place dans la famille, de mieux comprendre ses liens avec les cousins et de transmettre ce qu’il sait.",
  };

  useEffect(() => {
    let isMounted = true;

    async function loadIdentityClaim() {
      if (!participantId) {
        if (isMounted) {
          setMyIdentityClaimStatus(null);
          setLoadingClaim(false);
        }
        return;
      }

      try {
        const identityClaim = await getMyPersonIdentityClaim({
          eventSlug: slug,
          participantId,
        });

        if (!isMounted) return;

        setMyIdentityClaimStatus(identityClaim?.claim_status ?? null);
      } catch {
        if (!isMounted) return;
        setMyIdentityClaimStatus(null);
      } finally {
        if (isMounted) {
          setLoadingClaim(false);
        }
      }
    }

    void loadIdentityClaim();

    return () => {
      isMounted = false;
    };
  }, [participantId, slug]);

  const hasVerifiedClaim =
    myIdentityClaimStatus === "approved" ||
    myIdentityClaimStatus === "auto_verified";

  const metrics = useMemo<TreeMetric[]>(() => {
    const rootPersonId = ROOT_HONORED_PERSON_ID;
    const computed = buildFamilyTreeMetrics(FAMILY_GRAPH, rootPersonId);

    return [
      {
        key: "descendants",
        label: "Descendants identifiés",
        value: String(computed.descendantsCount),
      },
      {
        key: "generations",
        label: "Générations connues",
        value: String(computed.generationsCount),
      },
      {
        key: "branches",
        label: "Branches familiales",
        value: String(computed.branchesCount),
      },
    ];
  }, []);

  const sections = useMemo<TreeHubSection[]>(
    () => [
      {
        key: "start",
        title: "Commencer",
        subtitle:
          "Les deux actions les plus utiles pour te repérer rapidement.",
        items: [
          ...(!hasVerifiedClaim && !loadingClaim
            ? [
                {
                  key: "find-me",
                  label: "Me trouver dans l’arbre",
                  description:
                    "Retrouve ta place dans la famille et accède à ta branche.",
                  icon: UserCircle2,
                  to: `/e/${slug}/family-tree/find-me`,
                  enabled: true,
                  featured: true,
                  badge: "Essentiel",
                } satisfies TreeHubAction,
              ]
            : []),
          {
            key: "my-link-to-ancestor",
            label: "Voir mon lien avec Gromèr Covindou",
            description: "Découvre comment tu descends de Gromèr.",
            icon: Heart,
            to: `/e/${slug}/family-tree/story`,
            enabled: true,
            featured: true,
          },
          ...(hasVerifiedClaim && !loadingClaim
            ? [
                {
                  key: "handle-profile",
                  label: "Ma place dans l’arbre",
                  description:
                    "Gère la visibilité de ta fiche et consulte les statistiques liées à ton profil.",
                  icon: Compass,
                  to: `/e/${slug}/family-tree/handle-profile`,
                  enabled: true,
                  featured: true,
                } satisfies TreeHubAction,
              ]
            : []),
        ],
      },
      {
        key: "explore",
        title: "Explorer la famille",
        subtitle: "Chercher des personnes et parcourir les branches.",
        items: [
          {
            key: "search-person",
            label: "Chercher quelqu’un",
            description:
              "Trouve rapidement une personne dans l’arbre familial.",
            icon: Search,
            to: `/e/${slug}/family-tree/find-person`,
            enabled: true,
          },
          {
            key: "browse-tree",
            label: "Parcourir l’arbre",
            description:
              "Explore librement les générations et les différentes branches.",
            icon: TreeDeciduous,
            to: `/e/${slug}/family-tree/browse`,
            enabled: true,
          },
        ],
      },
      {
        key: "links",
        title: "Comprendre les liens",
        subtitle: "Comparer des personnes et mieux situer les cousins.",
        items: [
          {
            key: "my-link-to-cousin",
            label: "Voir mon lien avec un cousin",
            description: "Choisis un cousin et découvre votre lien familial.",
            icon: Users,
            to: `/e/${slug}/arbre/lien-cousin`,
            enabled: false,
            badge: "Bientôt",
          },
          {
            key: "compare-two-people",
            label: "Retrouver la relation entre deux personnes",
            description:
              "Retrouve leur ancêtre commun et leur proximité familiale.",
            icon: GitBranch,
            to: `/e/${slug}/arbre/comparer`,
            enabled: false,
            badge: "Bientôt",
          },
        ],
      },
    ],
    [hasVerifiedClaim, loadingClaim, slug],
  );

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pb-24 pt-4">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
              Arbre familial
            </div>
            <h1 className="mt-1 text-[28px] font-black tracking-tight text-slate-900">
              Explorer la famille
            </h1>
          </div>

          <button
            type="button"
            onClick={() => nav(`/e/${slug}/home`)}
            className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm"
          >
            <ArrowLeft size={14} />
            Retour
          </button>
        </header>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-extrabold text-emerald-700">
            <TreeDeciduous size={14} />
            {commonAncestor.title}
          </div>

          <p className="mt-3 text-sm font-bold leading-6 text-slate-700">
            {commonAncestor.description}
          </p>

          <div className="mt-5 grid grid-cols-3 gap-3">
            {metrics.map((metric) => (
              <div
                key={metric.key}
                className="rounded-[22px] border border-slate-200 bg-slate-50 p-3"
              >
                <div className="text-[22px] leading-none font-black text-slate-900">
                  {metric.value}
                </div>
                <div className="mt-1 text-[11px] font-extrabold leading-4 text-slate-600">
                  {metric.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-700" />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-amber-900">
                Chantiers en cours
              </div>
              <div className="mt-0.5 text-xs text-amber-800">
                <ol>
                  <li>Revoir les labels et les recommandés pour commencer</li>
                  <li>
                    Family tree/story disponible que si default_gedcom_person_id
                    + claim approved
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          {sections.map((section) => (
            <section key={section.key}>
              <div className="mb-3">
                <h2 className="text-[18px] font-black text-slate-900">
                  {section.title}
                </h2>
                <p className="mt-1 text-sm font-bold leading-6 text-slate-600">
                  {section.subtitle}
                </p>
              </div>

              <div
                className={
                  section.key === "start"
                    ? "grid gap-3 md:grid-cols-1"
                    : "grid gap-3"
                }
              >
                {section.items.map((item) => (
                  <TreeActionCard
                    key={item.key}
                    item={item}
                    onClick={() => {
                      if (!item.enabled || !item.to) return;
                      nav(item.to);
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

function TreeActionCard({
  item,
  onClick,
}: {
  item: TreeHubAction;
  onClick: () => void;
}) {
  const Icon = item.icon;
  const disabled = !item.enabled;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "w-full rounded-[24px] border p-4 text-left shadow-sm transition-all",
        disabled
          ? "border-slate-200 bg-slate-50 opacity-80"
          : item.featured
            ? "border-slate-300 bg-white active:scale-[0.99] active:shadow-none"
            : "border-slate-200 bg-white active:scale-[0.99] active:shadow-none",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div
          className={[
            "mt-0.5 rounded-2xl p-3",
            disabled
              ? "bg-slate-200 text-slate-500"
              : item.featured
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-900",
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
                    : "bg-slate-100 text-slate-700",
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
          <ArrowRight size={18} />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-[11px] font-extrabold">
          {disabled ? (
            <span className="text-slate-500">Bientôt disponible</span>
          ) : item.featured ? (
            <span className="text-emerald-700">Recommandé pour commencer</span>
          ) : (
            <span className="text-slate-500">Ouvrir</span>
          )}
        </div>
      </div>
    </button>
  );
}