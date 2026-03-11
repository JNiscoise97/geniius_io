import { AlertTriangle, House, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BreadcrumbNav } from "../components/BreadcrumbNav";
import { PersonRow } from "../components/PersonRow";
import { getSiblings, type GetSiblingsResult } from "../api/getSiblings";

export function SiblingsPage() {
  const nav = useNavigate();
  const { eventSlug, familyId } = useParams();
  const slug = eventSlug ?? "demo";
  const resolvedFamilyId = familyId ?? "";

  const [data, setData] = useState<GetSiblingsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!resolvedFamilyId) {
        setError("Foyer introuvable.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await getSiblings(resolvedFamilyId);
        if (!isMounted) return;
        setData(result);
      } catch (e: any) {
        if (!isMounted) return;
        setError(e?.message ?? "Impossible de charger la fratrie.");
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
  }, [resolvedFamilyId]);

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pt-3 pb-24">
        <section className="rounded-[28px] bg-white border border-slate-200 shadow-sm p-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-extrabold text-indigo-700">
            <Users size={14} />
            Fratrie
          </div>

          <h1 className="mt-4 text-[28px] leading-[1.05] font-black tracking-tight text-slate-900">
            Explorer la fratrie
          </h1>

          <p className="mt-3 text-sm font-bold leading-6 text-slate-700">
            Choisis une personne pour ouvrir sa fiche, voir ses liens directs et
            retrouver sa place dans l’arbre.
          </p>
        </section>

        {loading ? (
          <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-bold text-slate-700">
              Chargement de la fratrie…
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
                  Impossible de charger la fratrie
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
                  {
                    label: data.branch.name,
                    to: `/e/${slug}/arbre/branches/${data.branch.id}/families`,
                  },
                  { label: data.family.label },
                ]}
                onNavigate={(to) => nav(to)}
              />
            </div>

            <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-2xl bg-slate-100 p-2 text-slate-700">
                  <House size={18} />
                </div>
                <div className="min-w-0">
                  <div className="text-[16px] font-black text-slate-900">
                    {data.family.parentsLabel}
                  </div>
                  <div className="mt-1 text-sm font-bold text-slate-700">
                    {data.family.childrenCount} enfant
                    {data.family.childrenCount > 1 ? "s" : ""}
                    {typeof data.family.descendantsCount === "number"
                      ? ` • ${data.family.descendantsCount} descendant${
                          data.family.descendantsCount > 1 ? "s" : ""
                        }`
                      : ""}
                  </div>
                </div>
              </div>
            </section>

            <div className="mt-5 space-y-3">
              {data.siblings.map((person) => (
                <PersonRow
                  key={person.id}
                  person={person}
                  onClick={() => nav(`/e/${slug}/arbre/persons/${person.id}`)}
                />
              ))}
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}