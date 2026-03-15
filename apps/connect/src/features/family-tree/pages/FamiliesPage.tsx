import { AlertTriangle, House, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FamilyCard } from "../components/FamilyCard";
import { BreadcrumbNav } from "../components/BreadcrumbNav";
import { getFamilies, type GetFamiliesResult } from "../api/getFamilies";

export function FamiliesPage() {
  const nav = useNavigate();
  const { eventSlug, branchId } = useParams();
  const slug = eventSlug ?? "demo";
  const resolvedBranchId = branchId ?? "";

  const [data, setData] = useState<GetFamiliesResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!resolvedBranchId) {
        setError("Branche introuvable.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await getFamilies(resolvedBranchId);
        if (!isMounted) return;
        setData(result);
      } catch (e: any) {
        if (!isMounted) return;
        setError(e?.message ?? "Impossible de charger les foyers.");
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
  }, [resolvedBranchId]);

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pt-3 pb-24">
        <section className="rounded-[28px] bg-white border border-slate-200 shadow-sm p-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-extrabold text-indigo-700">
            <House size={14} />
            Foyers de la branche
          </div>

          <h1 className="mt-4 text-[28px] leading-[1.05] font-black tracking-tight text-slate-900">
            Explorer les foyers
          </h1>

          <p className="mt-3 text-sm font-bold leading-6 text-slate-700">
            Choisis un foyer pour afficher la fratrie complète et entrer dans
            l’arbre par les personnes.
          </p>
        </section>

        {loading ? (
          <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-bold text-slate-700">
              Chargement des foyers…
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
                  Impossible de charger les foyers
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
                    .map((item, index) => {
                      if (index === 0) {
                        return {
                          label: item.label,
                          to: undefined,
                        };
                      }
                      return item;
                    }),
                ]}
              />
            </div>

            <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-2xl bg-slate-100 p-2 text-slate-700">
                  <Users size={18} />
                </div>
                <div className="min-w-0">
                  <div className="text-[16px] font-black text-slate-900">
                    Branche {data.branch.name}
                  </div>
                  <div className="mt-1 text-sm font-bold text-slate-700">
                    {data.branch.familiesCount} foyer
                    {data.branch.familiesCount > 1 ? "s" : ""} •{" "}
                    {data.branch.peopleCount} personne
                    {data.branch.peopleCount > 1 ? "s" : ""}
                  </div>
                </div>
              </div>
            </section>

            <div className="mt-5 space-y-3">
              {data.families.map((family) => (
                <FamilyCard
                  key={family.id}
                  family={family}
                  onClick={() =>
                    nav(`/e/${slug}/arbre/families/${family.id}/siblings`)
                  }
                />
              ))}
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}