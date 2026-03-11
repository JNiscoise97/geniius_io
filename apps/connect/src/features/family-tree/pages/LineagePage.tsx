import { AlertTriangle, GitBranch, Route } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BreadcrumbNav } from "../components/BreadcrumbNav";
import { LineageNode } from "../components/LineageNode";
import { getLineage, type GetLineageResult } from "../api/getLineage";

export function LineagePage() {
  const nav = useNavigate();
  const { eventSlug, personId } = useParams();
  const slug = eventSlug ?? "demo";
  const resolvedPersonId = personId ?? "";

  const [data, setData] = useState<GetLineageResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!resolvedPersonId) {
        setError("Lignée introuvable.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await getLineage(resolvedPersonId);
        if (!isMounted) return;
        setData(result);
      } catch (e: any) {
        if (!isMounted) return;
        setError(e?.message ?? "Impossible de charger la lignée.");
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

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pt-3 pb-24">
        <section className="rounded-[28px] bg-white border border-slate-200 shadow-sm p-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-extrabold text-indigo-700">
            <Route size={14} />
            Lignée directe
          </div>

          <h1 className="mt-4 text-[28px] leading-[1.05] font-black tracking-tight text-slate-900">
            Retrouver sa place dans l’arbre
          </h1>

          <p className="mt-3 text-sm font-bold leading-6 text-slate-700">
            Suis la lignée directe entre l’ancêtre et la personne sélectionnée.
          </p>
        </section>

        {loading ? (
          <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-bold text-slate-700">
              Chargement de la lignée…
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
                  Impossible de charger la lignée
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
                      if (index === arr.length - 2) {
                        return {
                          label: item.label,
                          to: `/e/${slug}/arbre/persons/${resolvedPersonId}`,
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
                <div className="mt-0.5 rounded-2xl bg-slate-100 p-2 text-slate-700">
                  <GitBranch size={18} />
                </div>
                <div className="min-w-0">
                  <div className="text-[16px] font-black text-slate-900">
                    Lignée de {data.lineage.personName}
                  </div>
                  <div className="mt-1 text-sm font-bold text-slate-700">
                    {data.lineage.nodes.length} génération
                    {data.lineage.nodes.length > 1 ? "s" : ""} affichée
                    {data.lineage.nodes.length > 1 ? "s" : ""}
                  </div>
                </div>
              </div>
            </section>

            <div className="mt-5">
              {data.lineage.nodes.map((node, index) => (
                <LineageNode
                  key={node.id}
                  node={node}
                  isLast={index === data.lineage.nodes.length - 1}
                  onClick={() => nav(`/e/${slug}/arbre/persons/${node.id}`)}
                />
              ))}
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}