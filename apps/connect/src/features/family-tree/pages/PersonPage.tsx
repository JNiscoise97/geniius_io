import {
  AlertTriangle,
  ArrowRight,
  GitBranch,
  UserCircle2,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BreadcrumbNav } from "../components/BreadcrumbNav";
import { PersonRelationsCard } from "../components/PersonRelationsCard";
import { getPerson, type GetPersonResult } from "../api/getPerson";

export function PersonPage() {
  const nav = useNavigate();
  const { eventSlug, personId } = useParams();
  const slug = eventSlug ?? "demo";
  const resolvedPersonId = personId ?? "";

  const [data, setData] = useState<GetPersonResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!resolvedPersonId) {
        setError("Personne introuvable.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await getPerson(resolvedPersonId);
        if (!isMounted) return;
        setData(result);
      } catch (e: any) {
        if (!isMounted) return;
        setError(e?.message ?? "Impossible de charger cette personne.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [resolvedPersonId]);

  function openPerson(nextPersonId: string) {
    nav(`/e/${slug}/arbre/persons/${nextPersonId}`);
  }

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pt-3 pb-24">
        <section className="rounded-[28px] bg-white border border-slate-200 shadow-sm p-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-extrabold text-indigo-700">
            <UserCircle2 size={14} />
            Fiche personne
          </div>

          <h1 className="mt-4 text-[28px] leading-[1.05] font-black tracking-tight text-slate-900">
            Explorer une personne
          </h1>

          <p className="mt-3 text-sm font-bold leading-6 text-slate-700">
            Retrouve ses liens directs, sa branche et sa place dans l’arbre.
          </p>
        </section>

        {loading ? (
          <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-bold text-slate-700">
              Chargement de la fiche personne…
            </div>
          </section>
        ) : null}

        {error ? (
          <section className="mt-4 rounded-[24px] border border-[rgba(220,38,38,0.18)] bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-[color:var(--bad)]">
                <AlertTriangle size={18} />
              </div>
              <div>
                <div className="text-sm font-black text-slate-900">
                  Impossible de charger cette fiche
                </div>
                <div className="mt-1 text-sm font-bold leading-6 text-slate-700">
                  {error}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {!loading && !error && data ? (
          <>
            <div className="mt-4">
              <BreadcrumbNav
                items={[
                  { label: "Famille", to: `/e/${slug}/arbre` },
                  ...data.breadcrumbs
                    .filter((item) => item.label !== "Famille")
                    .map((item, index, arr) => {
                      if (index === 0 && data.person.branchId) {
                        return {
                          label: item.label,
                          to: `/e/${slug}/arbre/branches/${data.person.branchId}/families`,
                        };
                      }

                      if (
                        index === 1 &&
                        data.person.familyId &&
                        arr.length >= 3
                      ) {
                        return {
                          label: item.label,
                          to: `/e/${slug}/arbre/families/${data.person.familyId}/siblings`,
                        };
                      }

                      return item;
                    }),
                ]}
                onNavigate={(to) => nav(to)}
              />
            </div>

            <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-2xl bg-slate-100 p-3 text-slate-900">
                  <UserCircle2 size={20} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-[20px] font-black text-slate-900">
                    {data.person.name}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-extrabold text-slate-700">
                      <Users size={12} />
                      {data.person.generation}
                    </div>

                    <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-extrabold text-slate-700">
                      <GitBranch size={12} />
                      Branche {data.person.branchName}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() =>
                    nav(`/e/${slug}/arbre/persons/${data.person.id}/lineage`)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition-all active:scale-[0.995] active:shadow-none"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-black text-slate-900">
                        Voir la lignée
                      </div>
                      <div className="mt-1 text-xs font-bold text-slate-600">
                        Retrouver le chemin entre l’ancêtre et cette personne.
                      </div>
                    </div>

                    <div className="shrink-0 rounded-2xl bg-slate-100 p-2 text-slate-900">
                      <ArrowRight size={18} />
                    </div>
                  </div>
                </button>
              </div>
            </section>

            <div className="mt-5 space-y-3">
              <PersonRelationsCard
                title="Parents"
                people={data.person.parents}
                emptyLabel="Aucun parent affiché."
                onPersonClick={openPerson}
              />

              <PersonRelationsCard
                title="Fratrie"
                people={data.person.siblings}
                emptyLabel="Aucune fratrie affichée."
                onPersonClick={openPerson}
              />

              <PersonRelationsCard
                title="Conjoint"
                people={data.person.spouse ? [data.person.spouse] : []}
                emptyLabel="Aucun conjoint affiché."
                onPersonClick={openPerson}
              />

              <PersonRelationsCard
                title="Enfants"
                people={data.person.children}
                emptyLabel="Aucun enfant affiché."
                onPersonClick={openPerson}
              />
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}