import { ArrowRight, Loader2, UserRoundSearch, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { listAdminParticipants } from "../api/listAdminParticipants";
import type { AdminParticipantListItem } from "../types/adminParticipantTypes";

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; items: AdminParticipantListItem[] }
  | { kind: "error"; message: string };

function MetricCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-black uppercase tracking-wide text-slate-500">
        {title}
      </div>
      <div className="mt-2 text-3xl font-black text-slate-900">{value}</div>
    </div>
  );
}

export function AdminParticipantsPage() {
  const nav = useNavigate();
  const { eventSlug } = useParams();
  const resolvedEventSlug = eventSlug ?? "";
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setState({ kind: "loading" });
        const items = await listAdminParticipants(resolvedEventSlug);

        if (!cancelled) {
          setState({ kind: "ready", items });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            kind: "error",
            message:
              error instanceof Error
                ? error.message
                : "Impossible de charger les participants.",
          });
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [resolvedEventSlug]);

  const items = state.kind === "ready" ? state.items : [];

  const filteredItems = useMemo(() => {
    const needle = query.trim().toLowerCase();

    if (!needle) {
      return items;
    }

    return items.filter((item) => {
      const haystack = [
        item.firstName,
        item.lastName,
        item.nickname ?? "",
        item.email ?? "",
        item.phone ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [items, query]);

  const metrics = useMemo(() => {
    return {
      totalParticipants: items.length,
      visibleInTree: items.filter((item) => item.allowNameInFamilyTree).length,
      withBirthYear: items.filter((item) => item.birthYear !== null).length,
      withEmailOrPhone: items.filter(
        (item) => Boolean(item.email || item.phone)
      ).length,
    };
  }, [items]);

  if (state.kind === "loading") {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 text-slate-900">
            <Loader2 className="animate-spin" size={20} />
            <div className="text-lg font-black">Chargement des participants...</div>
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

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-900">
            <Users size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              Tableau de bord participants
            </h1>
            <div className="mt-1 text-sm font-medium text-slate-700">
              Événement : <span className="font-black">{resolvedEventSlug}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Participants" value={metrics.totalParticipants} />
        <MetricCard title="Affichés dans l’arbre" value={metrics.visibleInTree} />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <UserRoundSearch size={18} className="text-slate-900" />
          <div className="text-lg font-black text-slate-900">
            Liste des participants
          </div>
        </div>

        <div className="mt-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher par nom, prénom, surnom, email..."
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 font-bold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
          />
        </div>

        {filteredItems.length === 0 ? (
          <div className="mt-4 text-sm font-medium text-slate-700">
            Aucun participant trouvé.
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {filteredItems.map((item) => (
              <button
                key={item.participantId}
                type="button"
                onClick={() =>
                  nav(
                    `/admin/events/${resolvedEventSlug}/participants/${item.participantId}`
                  )
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-black text-slate-900">
                      {item.firstName} {item.lastName}
                    </div>

                    <div className="mt-1 flex flex-wrap gap-2">
                      {item.nickname ? (
                        <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-black text-slate-700">
                          {item.nickname}
                        </span>
                      ) : null}

                      <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-black text-slate-700">
                        {item.birthYear ?? "Année inconnue"}
                      </span>

                      <span
                        className={[
                          "rounded-full px-3 py-1 text-xs font-black",
                          item.allowNameInFamilyTree
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-200 text-slate-700",
                        ].join(" ")}
                      >
                        {item.allowNameInFamilyTree
                          ? "Affiché dans l’arbre"
                          : "Non affiché dans l’arbre"}
                      </span>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm">
                    Ouvrir
                    <ArrowRight size={14} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}