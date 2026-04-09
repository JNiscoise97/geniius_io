import {
  ArrowLeft,
  ArrowRight,
  Camera,
  ChevronDown,
  ChevronRight,
  Heart,
  Library,
  Loader2,
  Megaphone,
  MessageCircle,
  Search,
  Sparkles,
  TreeDeciduous,
  UserCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createPageTimeTracker } from "../../../lib/analytics/pageTimeTracker";
import { getParticipantSession } from "../../../lib/participant-session/getActiveParticipant";
import { listFamilyReactionFeed } from "../api/listFamilyReactionFeed";
import { getFamilyReactionMeta } from "../utils/getFamilyReactionMeta";
import {
  getFamilyReactionSectionSubtitle,
  groupFamilyReactionFeedItems,
} from "../utils/groupFamilyReactionFeedItems";
import type {
  FamilyReactionAudience,
  FamilyReactionFeedItem,
  FamilyReactionTypeFilter,
} from "../types";
import { SmartImage } from "../../../lib/media/useSmartImage";

const SECTION_HEADER_CLASS =
  "bg-[linear-gradient(135deg,#3b4274_0%,#4b53a6_100%)] text-white shadow-[0_10px_24px_rgba(59,66,116,0.18)]";

function formatDateTime(dateString: string) {
  const date = new Date(dateString);

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getTypeFilterLabel(typeFilter: FamilyReactionTypeFilter) {
  switch (typeFilter) {
    case "all":
      return "Tous les types";
    case "photo":
      return "Photos";
    case "memory":
      return "Souvenirs";
    case "touched_by_person":
      return "J’aime";
    case "heard_of_person":
      return "Entendu parler";
    case "knew_person":
      return "Connu";
  }
}

function FeedEmptyState({
  audience,
  hasFilters,
}: {
  audience: FamilyReactionAudience;
  hasFilters: boolean;
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-700">
          <Sparkles size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[18px] font-black text-slate-900">
            {hasFilters
              ? "Aucun résultat pour ces filtres"
              : audience === "mine"
                ? "Tu n’as pas encore de réactions"
                : "Aucune réaction pour le moment"}
          </div>

          <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
            {hasFilters
              ? "Essaie d’élargir les filtres ou de retirer la recherche pour voir plus d’éléments."
              : audience === "mine"
                ? "Quand tu ajouteras une photo, un souvenir ou une réaction, tout apparaîtra ici."
                : "Quand les cousins partageront des souvenirs, des photos ou des réactions, le fil s’affichera ici."}
          </p>
        </div>
      </div>
    </section>
  );
}

function FeedSection({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: FamilyReactionFeedItem[];
}) {
  return (
    <section className="space-y-3">
      <div className={`rounded-[26px] p-4 ${SECTION_HEADER_CLASS}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[20px] font-black">{title}</div>
            <p className="mt-1 text-sm font-bold leading-6 text-white/90">
              {subtitle}
            </p>
          </div>

          <div className="shrink-0 rounded-2xl bg-white/10 px-3 py-2 text-[11px] font-extrabold text-white">
            {items.length} {items.length > 1 ? "éléments" : "élément"}
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        {items.map((item) => (
          <ReactionCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function ReactionCard({ item }: { item: FamilyReactionFeedItem }) {
  const navigate = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const meta = getFamilyReactionMeta(item.kind);
  const Icon = meta.icon;
  const hasPhoto = item.kind === "photo" && Boolean(item.publicUrl);

  return (
    <button
      type="button"
      onClick={() =>
        navigate(`/e/${slug}/fiche?id=${encodeURIComponent(item.personId)}`)
      }
      className="w-full rounded-[24px] border border-slate-200 bg-white p-4 text-left shadow-sm transition-all active:scale-[0.99] active:shadow-none"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-2xl bg-indigo-50 p-3 text-indigo-700">
          <Icon size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-6 text-slate-700">
            {item.text}
          </p>

          {hasPhoto && item.publicUrl ? (
            <div className="mt-3 overflow-hidden rounded-[20px] border border-slate-200 bg-slate-50">
              <SmartImage
                src={item.publicUrl}
                alt={item.subtext?.trim() || `Photo liée à ${item.personLabel}`}
              />
            </div>
          ) : null}

          {item.subtext ? (
            <div className="mt-3 rounded-[20px] bg-slate-50 px-3 py-3 text-sm font-bold leading-6 text-slate-700">
              {item.subtext}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600">
              {formatDateTime(item.createdAt)}
            </span>

            <span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-indigo-700">
              {item.personLabel}
            </span>

            {!item.isMine ? (
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600">
                {item.participantLabel}
              </span>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 rounded-2xl bg-slate-100 p-2 text-slate-900">
          <ArrowRight size={18} />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-3">
        <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
          {meta.label}
        </div>
      </div>
    </button>
  );
}

export function FamilyReactionFeedPage() {
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";
  const nav = useNavigate();

  const participantSession = getParticipantSession(slug);
  const participantId = participantSession?.participantId ?? null;

  const [audience, setAudience] = useState<FamilyReactionAudience>("all");
  const [items, setItems] = useState<FamilyReactionFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] =
    useState<FamilyReactionTypeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const filteredItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return items.filter((item) => {
      const matchesType = typeFilter === "all" ? true : item.kind === typeFilter;

      const haystack = [
        item.personLabel,
        item.text,
        item.subtext ?? "",
        item.participantLabel,
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery =
        normalizedQuery.length === 0 || haystack.includes(normalizedQuery);

      return matchesType && matchesQuery;
    });
  }, [items, searchQuery, typeFilter]);

  const groupedSections = useMemo(
    () => groupFamilyReactionFeedItems(filteredItems),
    [filteredItems],
  );

  const hasActiveFilters =
    typeFilter !== "all" ||
    searchQuery.trim().length > 0;

  const metrics = useMemo(
    () => [
      {
        key: "items",
        value: filteredItems.length,
        label: audience === "mine" ? "Mes interactions" : "Interactions visibles",
      },
    ],
    [audience, filteredItems.length, groupedSections.length],
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!participantId) {
        setItems([]);
        setLoading(false);
        return;
      }

      const currentParticipantId: string = participantId;

      try {
        setLoading(true);
        setError(null);

        const nextItems = await listFamilyReactionFeed({
          eventSlug: slug,
          currentParticipantId,
          audience,
        });

        if (!cancelled) {
          setItems(nextItems);
        }
      } catch (err) {
        console.error("Impossible de charger le fil des réactions", err);

        if (!cancelled) {
          setError("Impossible de charger les réactions pour le moment.");
          setItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [audience, participantId, slug]);

  useEffect(() => {
    if (!participantId) return;

    const tracker = createPageTimeTracker({
      participantId,
      eventSlug: slug,
      pageKey: `/e/${slug}/reactions`,
    });

    tracker.start();

    return () => {
      void tracker.stop();
    };
  }, [participantId, slug]);

  if (!participantId) {
    return (
      <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
        <main className="c-container pb-24 pt-4">
          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-bold text-slate-900">
              Session introuvable
            </div>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
              Connecte-toi de nouveau pour accéder au fil des réactions.
            </p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pb-24 pt-4">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
              Espace famille
            </div>
            <h1 className="mt-1 text-[28px] font-black tracking-tight text-slate-900">
              Les réactions de la famille
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
            {audience === "mine"
              ? "Mes contributions et réactions"
              : "Activité récente autour des fiches"}
          </div>

          <p className="mt-3 text-sm font-bold leading-6 text-slate-700">
            Retrouve ici les souvenirs, photos et réactions partagés autour des
            fiches familiales.
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

        <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAudience("all")}
              className={[
                "rounded-2xl px-4 py-3 text-sm font-black transition inline-flex items-center justify-center gap-2",
                audience === "all"
                  ? "bg-[color:var(--blue)] text-white"
                  : "bg-slate-50 text-slate-700",
              ].join(" ")}
            >
              <Library size={16} />
              Voir toutes les réactions
            </button>

            <button
              type="button"
              onClick={() => setAudience("mine")}
              className={[
                "rounded-2xl px-4 py-3 text-sm font-black transition inline-flex items-center justify-center gap-2",
                audience === "mine"
                  ? "bg-[color:var(--blue)] text-white"
                  : "bg-slate-50 text-slate-700",
              ].join(" ")}
            >
              <UserCheck size={16} />
              Voir mes réactions
            </button>
          </div>

          <p className="px-2 pb-2 pt-3 text-[13px] font-bold leading-5 text-slate-700">
            {audience === "mine"
              ? "Retrouve tout ce que tu as déjà partagé ou signalé dans l’espace famille."
              : "Explore l’activité récente de la famille autour des fiches, souvenirs et photos."}
          </p>
        </section>

        <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[16px] font-black text-slate-900">
              Filtres
            </div>

            <button
              type="button"
              onClick={() => setShowAdvancedFilters((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700"
            >
              {showAdvancedFilters ? (
                <>
                  <ChevronDown size={14} />
                  Masquer les filtres avancés
                </>
              ) : (
                <>
                  <ChevronRight size={14} />
                  Voir les filtres avancés
                </>
              )}
            </button>
          </div>

          <div className="mt-4">
            <label className="block text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
              Recherche
            </label>
            <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
              <Search size={16} className="text-slate-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Rechercher une personne, un souvenir, un cousin..."
                className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {showAdvancedFilters ? (
            <div className="mt-4 grid gap-4 md:grid-cols-1">
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                  Type
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {[
                    { key: "all", label: "Tous", icon: Sparkles },
                    { key: "photo", label: "Photos", icon: Camera },
                    { key: "memory", label: "Souvenirs", icon: MessageCircle },
                    { key: "touched_by_person", label: "J’aime", icon: Heart },
                    {
                      key: "heard_of_person",
                      label: "Entendu parler",
                      icon: Megaphone,
                    },
                    { key: "knew_person", label: "Connu", icon: UserCheck },
                  ].map((option) => {
                    const Icon = option.icon;
                    const isActive = typeFilter === option.key;

                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() =>
                          setTypeFilter(option.key as FamilyReactionTypeFilter)
                        }
                        className={[
                          "inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-black transition",
                          isActive
                            ? "bg-[color:var(--blue)] text-white"
                            : "bg-slate-50 text-slate-700",
                        ].join(" ")}
                      >
                        <Icon size={16} />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-extrabold text-slate-700">
              {getTypeFilterLabel(typeFilter)}
            </span>
            {searchQuery.trim() ? (
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-extrabold text-indigo-700">
                “{searchQuery.trim()}”
              </span>
            ) : null}

            {hasActiveFilters ? (
              <button
                type="button"
                onClick={() => {
                  setTypeFilter("all");
                  setSearchQuery("");
                }}
                className="rounded-full bg-rose-50 px-3 py-1 text-[11px] font-extrabold text-rose-700"
              >
                Réinitialiser
              </button>
            ) : null}
          </div>
        </section>

        <div className="mt-5 space-y-4">
          {loading ? (
            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="inline-flex items-center gap-2 text-sm font-bold text-slate-700">
                <Loader2 size={16} className="animate-spin" />
                Chargement des réactions...
              </div>
            </section>
          ) : null}

          {!loading && error ? (
            <section className="rounded-[28px] border border-rose-200 bg-rose-50 p-5 shadow-sm">
              <div className="text-sm font-bold text-rose-900">{error}</div>
            </section>
          ) : null}

          {!loading && !error && groupedSections.length === 0 ? (
            <FeedEmptyState
              audience={audience}
              hasFilters={hasActiveFilters}
            />
          ) : null}

          {!loading &&
            !error &&
            groupedSections.map((section) => (
              <FeedSection
                key={section.key}
                title={section.title}
                subtitle={getFamilyReactionSectionSubtitle(section.key)}
                items={section.items}
              />
            ))}
        </div>

        {!loading && !error && groupedSections.length > 0 ? (
          <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-2xl bg-slate-100 p-3 text-slate-900">
                <Heart size={20} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-[16px] font-black text-slate-900">
                  Le fil vit grâce aux contributions de la famille
                </div>
                <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
                  Chaque souvenir, photo ou réaction enrichit les fiches et aide
                  à faire vivre la mémoire familiale.
                </p>
              </div>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}