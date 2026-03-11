import { AlertTriangle, GitBranch, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BranchCard } from "../components/BranchCard";
import { getBranches, type GetBranchesResult } from "../api/getBranches";

export function BranchesPage() {
  const nav = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const [data, setData] = useState<GetBranchesResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const result = await getBranches();
        if (!isMounted) return;
        setData(result);
      } catch (e: any) {
        if (!isMounted) return;
        setError(e?.message ?? "Impossible de charger les branches.");
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
  }, []);

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pt-3 pb-24">
        <section className="rounded-[28px] bg-white border border-slate-200 shadow-sm p-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-extrabold text-indigo-700">
            <GitBranch size={14} />
            Arbre familial
          </div>

          <h1 className="mt-4 text-[28px] leading-[1.05] font-black tracking-tight text-slate-900">
            Explorer la famille
          </h1>

          <p className="mt-3 text-sm font-bold leading-6 text-slate-700">
            Choisis une branche pour entrer dans l’arbre généalogique et
            retrouver les foyers, les fratries et les lignées.
          </p>
        </section>

        {loading ? (
          <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-bold text-slate-700">
              Chargement des branches…
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
                  Impossible de charger l’arbre
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
            <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-2xl bg-slate-100 p-2 text-slate-700">
                  <Users size={18} />
                </div>
                <div className="min-w-0">
                  <div className="text-[16px] font-black text-slate-900">
                    Ancêtre racine
                  </div>
                  <div className="mt-1 text-sm font-bold text-slate-700">
                    {data.rootAncestor.name}
                  </div>
                </div>
              </div>
            </section>

            <div className="mt-5 space-y-3">
              {data.branches.map((branch) => (
                <BranchCard
                  key={branch.id}
                  branch={branch}
                  onClick={() =>
                    nav(`/e/${slug}/arbre/branches/${branch.id}/families`)
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