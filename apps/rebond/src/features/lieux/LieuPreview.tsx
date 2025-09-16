import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  EllipsisVertical,
  Landmark,
  MapPin,
  ScrollText,
  BookOpen,
  FileText,
  Navigation,
  Users,
  Gavel,
  PencilLine,
  ShieldCheck,
  FileSignature,
  StickyNote,
  Settings,
  Pencil,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CarteVoisinageSketch from "./CarteVoisinageSketch";

// ------------------------------------------------------------
// LieuPreview
// Page complète : entête + onglets pour explorer un Lieu
// Données : lieux, toponymes, mentions_toponymes (stats & listing)
// ------------------------------------------------------------

const TABS = [
  { key: "overview", label: "Vue d’ensemble", icon: ScrollText },
  { key: "topos", label: "Toponymes & alias", icon: BookOpen },
  { key: "chrono", label: "Chronologie", icon: FileText },
  { key: "map", label: "Carte & voisinage", icon: Navigation },
  { key: "mentions", label: "Mentions", icon: Users },
  { key: "acts", label: "Actes liés", icon: Gavel },
  { key: "actors", label: "Acteurs", icon: PencilLine },
  { key: "quality", label: "Qualité des données", icon: ShieldCheck },
  { key: "files", label: "Fichiers", icon: FileSignature },
  { key: "notes", label: "Notes", icon: StickyNote },
  { key: "admin", label: "Administration", icon: Settings },
] as const;

type TabKey = typeof TABS[number]["key"];

export default function LieuPreview() {
  const { lieuId } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- core data
  const [lieu, setLieu] = useState<any | null>(null);
  const [principalToponyme, setPrincipalToponyme] = useState<any | null>(null);
  const [aliasToponymes, setAliasToponymes] = useState<any[]>([]);
  const [ancestors, setAncestors] = useState<Array<{ id: string; label: string }>>([]);

  // --- mentions & stats (pour CE lieu uniquement)
  const [stats, setStats] = useState({ nbMentions: 0, nbActes: 0, nbActeurs: 0, byFunction: [] as { fonction: string; nb: number }[] });
  const [mentions, setMentions] = useState<any[]>([]);

  // --- helpers
  const nowIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const isActif = useMemo(() => {
    if (!lieu) return false;
    const start = lieu.active_debut ? String(lieu.active_debut) : null;
    const end = lieu.active_fin ? String(lieu.active_fin) : null;
    const today = nowIso;
    const afterStart = !start || today >= start;
    const beforeEnd = !end || today <= end;
    return afterStart && beforeEnd;
  }, [lieu, nowIso]);

  function formatDate(d?: string | null) {
    if (!d) return "";
    try {
      return new Date(d).toLocaleDateString("fr-FR");
    } catch {
      return d ?? "";
    }
  }

  // --- data fetching
  useEffect(() => {
    if (!lieuId) return;
    let cancelled = false;

    async function run() {
      setIsLoading(true);
      setError(null);
      try {
        // 1) Lieu
        const { data: l, error: e1 } = await supabase
          .from("lieux")
          .select("id, type, parent_id, lat, lng, active_debut, active_fin, usage, statut_juridique, note")
          .eq("id", lieuId)
          .maybeSingle();
        if (e1) throw e1;
        if (!l) throw new Error("Lieu introuvable");
        if (cancelled) return;
        setLieu(l);

        // 2) Toponymes du lieu
        const { data: topos, error: e2 } = await supabase
          .from("toponymes")
          .select("id, libelle, alias, date_debut, date_fin, certitude, is_principal")
          .eq("lieu_id", l.id)
          .order("is_principal", { ascending: false })
          .order("date_debut", { ascending: true });
        if (e2) throw e2;
        const principal = (topos || []).find((t) => t.is_principal) || (topos || [])[0] || null;
        const aliases = (topos || []).filter((t) => (principal ? t.id !== principal.id : true));
        if (cancelled) return;
        setPrincipalToponyme(principal);
        setAliasToponymes(aliases);

        // 3) Breadcrumb (ancestors)
        const anc: Array<{ id: string; label: string }> = [];
        let parentId: string | null = l.parent_id;
        let safety = 0;
        while (parentId && safety < 32) {
          const { data: p, error: e3 } = await supabase
            .from("lieux")
            .select("id, parent_id")
            .eq("id", parentId)
            .maybeSingle();
          if (e3) throw e3;
          if (!p) break;
          const { data: pLabel } = await supabase
            .from("toponymes")
            .select("libelle, is_principal, date_debut")
            .eq("lieu_id", p.id)
            .order("is_principal", { ascending: false })
            .order("date_debut", { ascending: true })
            .limit(1);
          anc.push({ id: p.id, label: pLabel?.[0]?.libelle || "(sans libellé)" });
          parentId = p.parent_id;
          safety++;
        }
        if (cancelled) return;
        setAncestors(anc.reverse());

        // 4) Stats & mentions pour CE lieu
        const { data: topoIds, error: e4 } = await supabase
          .from("toponymes")
          .select("id")
          .eq("lieu_id", l.id);
        if (e4) throw e4;
        const ids = (topoIds || []).map((x) => x.id);

        let nbMentions = 0;
        let nbActes = 0;
        let nbActeurs = 0;
        let byFunction: { fonction: string; nb: number }[] = [];
        let mentionsRows: any[] = [];

        if (ids.length > 0) {
          // Count head
          const { count: c1, error: e5 } = await supabase
            .from("mentions_toponymes")
            .select("id", { count: "exact", head: true })
            .in("toponyme_id", ids);
          if (e5) throw e5;
          nbMentions = c1 || 0;

          // Distinct actes/acteurs + by fonction + fetch sample mentions
          const { data: rows, error: e6 } = await supabase
            .from("mentions_toponymes")
            .select(`
              id,
              acte_id,
              source_table,
              acteur_id,
              fonction,
              forme_originale,
              path_labels,
              acteur:v_acteurs_enrichis(nom_complet, acte_label)
            `)
            .in("toponyme_id", ids)
            .limit(5000);

          if (e6) throw e6;
          mentionsRows = rows || [];

          const actes = new Set<string>();
          const acteurs = new Set<string>();
          const fnMap = new Map<string, number>();
          for (const r of mentionsRows) {
            if (r.acte_id) actes.add(r.acte_id);
            if (r.acteur_id) acteurs.add(r.acteur_id);
            if (r.fonction) fnMap.set(r.fonction, (fnMap.get(r.fonction) || 0) + 1);
          }
          nbActes = actes.size;
          nbActeurs = acteurs.size;
          byFunction = Array.from(fnMap.entries()).map(([fonction, nb]) => ({ fonction, nb }));
          byFunction.sort((a, b) => b.nb - a.nb);
        }

        if (cancelled) return;
        setStats({ nbMentions, nbActes, nbActeurs, byFunction });
        setMentions(mentionsRows);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Erreur inconnue");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [lieuId]);

  // --- UI sections
  if (isLoading) {
    return (
      <div className="flex flex-col">
        <HeaderSkeleton />
      </div>
    );
  }
  if (error || !lieu) {
    return (
      <div className="flex flex-col">
        <HeaderError error={error || "Lieu introuvable"} onBack={() => navigate(-1)} />
      </div>
    );
  }

  const title = principalToponyme?.libelle || "(libellé manquant)";
  const aliasesCount = aliasToponymes.length;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3 min-w-0">
            {ancestors.length > 0 ? (
              <Link to={`/lieu/${ancestors[ancestors.length - 1].id}`} title="Remonter au parent">
                <ArrowLeft className="w-4 h-4 text-gray-600 hover:text-gray-800" />
              </Link>
            ) : (
              <ArrowLeft className="w-4 h-4 text-gray-600 hover:text-gray-800 cursor-pointer" onClick={() => navigate(-1)} />
            )}

            <nav className="flex items-center gap-2 text-sm text-gray-600 truncate">
              {ancestors.map((a) => (
                <div key={a.id} className="flex items-center gap-2">
                  <Link className="hover:underline hover:text-gray-900 truncate max-w-[180px]" to={`/lieu/${a.id}`} title={a.label}>
                    {a.label}
                  </Link>
                  <span className="text-gray-400">/</span>
                </div>
              ))}
              <span className="text-gray-900 font-medium truncate" title={title}>
                {title}
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Link to={`/lieu/edit/${lieu.id}`}>
              <Button variant="ghost" className="h-8 px-2 text-gray-700 hover:text-black">
                <Pencil className="w-4 h-4 mr-2" /> Éditer
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 rounded hover:bg-gray-100" title="Plus d'actions">
                  <EllipsisVertical className="w-5 h-5 text-gray-700" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate(`/lieu/${lieu.id}?action=add-alias`)}>
                  Ajouter un alias
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(`/lieu/${lieu.id}?action=move`)}>
                  Déplacer (changer le parent)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(`/lieu/${lieu.id}?action=merge`)}>
                  Fusionner ce lieu…
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(`/lieu/${lieu.id}?action=geocode`)}>
                  Renseigner la position
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Settings className="w-5 h-5 text-gray-700" />
          </div>
        </div>

        {/* Meta + KPIs */}
        <div className="flex flex-col gap-1 px-6 pb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
              <Landmark className="w-3 h-3" /> {lieu.type || "type inconnu"}
            </span>
            <ActivityPill actif={isActif} />
            {aliasesCount > 0 && <span className="text-xs text-gray-500">{aliasesCount} alias</span>}
          </div>
          <h1 className="text-lg font-semibold text-gray-900 truncate" title={title}>
            {title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
            {lieu.lat && lieu.lng ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {Number(lieu.lat).toFixed(6)}, {Number(lieu.lng).toFixed(6)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-gray-500">
                <MapPin className="w-3 h-3" /> Coordonnées manquantes
              </span>
            )}
            <span>
              Période d'activité : {lieu.active_debut ? formatDate(lieu.active_debut) : "—"} → {lieu.active_fin ? formatDate(lieu.active_fin) : "—"}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <Kpi label="Mentions" value={stats.nbMentions} />
            <Kpi label="Actes" value={stats.nbActes} />
            <Kpi label="Acteurs" value={stats.nbActeurs} />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 px-6 text-sm border-t overflow-x-auto bg-white">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`py-3 -mb-px border-b-2 flex items-center gap-2 transition-all ${activeTab === key
                  ? "border-gray-800 text-gray-900 font-medium"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        <section className="flex-1 overflow-y-auto p-6 mb-4">
          {activeTab === "overview" && (
            <OverviewSection stats={stats} byFunction={stats.byFunction} />
          )}

          {activeTab === "topos" && (
            <ToponymesSection principal={principalToponyme} aliases={aliasToponymes} />
          )}

          {activeTab === "chrono" && (
            <div className="text-sm text-gray-600">Timeline à brancher (Recharts). On pourra projeter l’intervalle d’activité du lieu en overlay.</div>
          )}

          {activeTab === "map" && (
            <div className="text-sm text-gray-600">Carte à brancher (Leaflet). Marker du lieu + enfants/voisins.<CarteVoisinageSketch /></div>
          )}

          {activeTab === "mentions" && (
            <MentionsTable rows={mentions} />
          )}

          {activeTab === "acts" && (
            <div className="text-sm text-gray-600">Regrouper par source/année/notaire dès que la vue des actes est accessible.</div>
          )}

          {activeTab === "actors" && (
            <div className="text-sm text-gray-600">Top acteurs liés à ce lieu (dès que la fiche acteur est branchée).</div>
          )}

          {activeTab === "quality" && (
            <QualitySection lieuId={lieu.id} />
          )}

          {activeTab === "files" && (
            <div className="text-sm text-gray-600">À venir : pièces jointes liées au lieu.</div>
          )}

          {activeTab === "notes" && (
            <div className="text-sm text-gray-600">À venir : bloc-notes et commentaires.</div>
          )}

          {activeTab === "admin" && (
            <div className="text-sm text-gray-600">Panneau d’administration : éditer type, parent, lat/lng, période, usage, statut, note, fusion.</div>
          )}
        </section>
      </div>
    </div>
  );
}

// ----------------------
// Sub-components
// ----------------------

function HeaderSkeleton() {
  return (
    <div className="sticky top-0 z-20 bg-white border-b">
      <div className="flex items-center gap-3 px-6 py-3">
        <div className="animate-pulse h-5 w-5 rounded bg-gray-200" />
        <div className="h-4 w-48 rounded bg-gray-200" />
      </div>
      <div className="px-6 pb-3">
        <div className="h-5 w-64 rounded bg-gray-200" />
      </div>
    </div>
  );
}

function HeaderError({ error, onBack }: { error: string; onBack: () => void }) {
  return (
    <div className="sticky top-0 z-20 bg-white border-b">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3 text-red-600">
          <ArrowLeft className="w-4 h-4 cursor-pointer" onClick={onBack} />
          <span className="font-medium">Erreur</span>
          <span className="text-sm text-red-700">{error}</span>
        </div>
      </div>
    </div>
  );
}

function ActivityPill({ actif }: { actif: boolean }) {
  return (
    <span
      className={
        "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border " +
        (actif ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-600 border-gray-200")
      }
      title={actif ? "Actif" : "Inactif"}
    >
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${actif ? "bg-emerald-500" : "bg-gray-400"}`} />
      {actif ? "Actif" : "Inactif"}
    </span>
  );
}

function Kpi({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="px-3 py-1 rounded-full border border-gray-200 text-gray-800 text-xs">
      <span className="font-medium">{value}</span> {label}
    </div>
  );
}

function OverviewSection({
  stats,
  byFunction,
}: {
  stats: { nbMentions: number; nbActes: number; nbActeurs: number };
  byFunction: { fonction: string; nb: number }[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Kpi label="Mentions" value={stats.nbMentions} />
        <Kpi label="Actes" value={stats.nbActes} />
        <Kpi label="Acteurs" value={stats.nbActeurs} />
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-2">Répartition par fonction</h3>
        {byFunction.length === 0 ? (
          <p className="text-sm text-gray-600">Aucune mention.</p>
        ) : (
          <ul className="text-sm text-gray-700 space-y-1">
            {byFunction.map((f) => (
              <li key={f.fonction} className="flex items-center justify-between border-b last:border-b-0 py-1">
                <span className="capitalize">{f.fonction}</span>
                <span className="text-gray-900 font-medium">{f.nb}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ToponymesSection({ principal, aliases }: { principal: any | null; aliases: any[] }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-2">Toponyme principal</h3>
        {principal ? (
          <div className="rounded-lg border p-3 text-sm">
            <div className="font-medium text-gray-900">{principal.libelle}</div>
            <div className="text-gray-600">{principal.certitude ? `Certitude : ${principal.certitude}` : ""}</div>
            <div className="text-gray-600">
              {principal.date_debut || principal.date_fin ? (
                <span>
                  Période : {principal.date_debut || "—"} → {principal.date_fin || "—"}
                </span>
              ) : (
                <span className="text-gray-500">Période non renseignée</span>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-600">Aucun toponyme trouvé.</p>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-2">Alias</h3>
        {aliases.length === 0 ? (
          <p className="text-sm text-gray-600">Aucun alias.</p>
        ) : (
          <ul className="grid md:grid-cols-2 gap-3">
            {aliases.map((a) => (
              <li key={a.id} className="rounded-lg border p-3 text-sm">
                <div className="font-medium text-gray-900">{a.libelle}</div>
                <div className="text-gray-600">{a.certitude ? `Certitude : ${a.certitude}` : ""}</div>
                <div className="text-gray-600">
                  {a.date_debut || a.date_fin ? (
                    <span>
                      Période : {a.date_debut || "—"} → {a.date_fin || "—"}
                    </span>
                  ) : (
                    <span className="text-gray-500">Période non renseignée</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function MentionsTable({ rows }: { rows: any[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-gray-600">Aucune mention pour ce lieu.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-gray-700">
          <tr>
            <th className="text-left px-3 py-2 border-b">Acteur</th>
            <th className="text-left px-3 py-2 border-b">Fonction</th>
            <th className="text-left px-3 py-2 border-b">Acte</th>
            <th className="text-left px-3 py-2 border-b">Forme originale</th>
            <th className="text-left px-3 py-2 border-b">Chemin choisi</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="odd:bg-white even:bg-gray-50">
              <td className="px-3 py-2 border-b text-gray-900 font-medium">
                {r.acteur.nom_complet}
              </td>
              <td className="px-3 py-2 border-b text-gray-700 capitalize">{r.fonction}</td>
              <td className="px-3 py-2 border-b">
                <Link to={`/${r.source_table === 'etat_civil_actes' ? 'ec' : 'ac'}-acte/${r.acte_id}`} className="text-gray-900 hover:underline">
                  {r.acteur.acte_label}
                </Link>
              </td>
              <td className="px-3 py-2 border-b text-gray-600 max-w-[320px] truncate" title={r.forme_originale || ""}>
                {r.forme_originale || "—"}
              </td>
              <td className="px-3 py-2 border-b">
                <div className="flex flex-wrap gap-1">
                  {(r.path_labels || []).map((lbl: string, i: number) => (
                    <span key={`${r.id}-lbl-${i}`} className="px-2 py-0.5 rounded-full bg-gray-100 border text-xs text-gray-700">
                      {lbl}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QualitySection({ lieuId }: { lieuId: string }) {
  const [issues, setIssues] = useState<{ title: string; details?: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      try {
        // Mentions sans chemin
        const { data: topos } = await supabase.from("toponymes").select("id").eq("lieu_id", lieuId);
        const ids = (topos || []).map((x) => x.id);
        let hasMentionsSansChemin = 0;
        if (ids.length) {
          const { data: m } = await supabase
            .from("mentions_toponymes")
            .select("id, path_toponyme_ids")
            .in("toponyme_id", ids)
            .limit(2000);
          hasMentionsSansChemin = (m || []).filter((x) => !x.path_toponyme_ids || x.path_toponyme_ids.length === 0).length;
        }
        const next: { title: string; details?: string }[] = [];
        if (hasMentionsSansChemin > 0) {
          next.push({ title: `Mentions sans chemin`, details: `${hasMentionsSansChemin} éléments` });
        }
        if (!cancelled) setIssues(next);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [lieuId]);

  if (loading) return <p className="text-sm text-gray-600">Analyse…</p>;
  if (issues.length === 0) return <p className="text-sm text-gray-600">Aucune alerte détectée.</p>;

  return (
    <div className="space-y-2">
      {issues.map((it, idx) => (
        <div key={idx} className="rounded-lg border p-3">
          <div className="text-sm font-medium text-gray-900">{it.title}</div>
          {it.details && <div className="text-sm text-gray-600">{it.details}</div>}
        </div>
      ))}
    </div>
  );
}
