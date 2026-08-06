// OverviewActeTab.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  FileText,
  Pickaxe,
  Users,
  Network,
  NotepadText,
  Link as LinkIcon,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

export type OverviewActeTabProps = {
  acteId: string;
  mode: "edit" | "view";
  onGoToTab?: (tabLabel: string) => void;
};

/**
 * 🎯 Objectif du mock
 * - Dashboard "admin" : aperçu rapide de chaque onglet + actions rapides
 * - Permet de naviguer vers un onglet (via onGoToTab) et de voir le niveau de complétion
 * - Affiche quelques KPIs synthétiques (transcription, extraction, acteurs, etc.)
 *
 * ⚠️ Ceci est un MOCK : à brancher sur tes vraies APIs.
 */

type TabKey =
  | "Référence archive"
  | "Transcription"
  | "Extraction"
  | "Acteurs & rôles"
  | "Faits familiaux"
  | "Mentions complémentaires"
  | "Documents liés"
  | "Analyse & contexte";

type OverviewSummary = {
  updatedAt: string; // ISO
  coherence: {
    incoherencesCount: number;
  };

  // ---- Référence archive
  archive: {
    hasRegistre: boolean;
    hasDepot: boolean;
    hasLieuRedaction: boolean;
    hasDateRedaction: boolean;
    docState?: "bon" | "moyen" | "fragile" | "inconnu";
  };

  // ---- Transcription
  transcription: {
    status: "missing" | "draft" | "validated";
    charCount: number;
    segmentsMarkedIllegible: number;
    versionsCount: number;
    lastEditedAt?: string;
  };

  // ---- Extraction
  extraction: {
    status: "missing" | "partial" | "complete";
    segmentsLinkedCount: number; // nb de "preuves" (segments) liés
    factsExtractedCount: number;
    placesExtractedCount: number;
    actorsLinkedCount: number;
  };

  // ---- Acteurs
  acteurs: {
    acteursCount: number;
    rolesCoveragePct: number; // 0..100
    withAgeCount: number;
    withProfessionCount: number;
    withDomicileCount: number;
  };

  // ---- Faits familiaux
  familyFacts: {
    unionsCount: number;
    filiationsCount: number;
    recognitionsCount: number;
    legitimationsCount: number;
  };

  // ---- Mentions
  mentions: {
    mentionsCount: number;
    rectificationsCount: number;
    renvoisCount: number;
  };

  // ---- Docs liés
  linkedDocs: {
    linkedDocsCount: number;
    categories: Array<{ label: string; count: number }>;
  };

  // ---- Analyse & contexte
  analysis: {
    hypothesesCount: number;
    conclusionsCount: number;
    nextActionsCount: number;
    sourcesMissingCount: number;
  };
};

function hashToInt(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Mock "fetch" : remplace par tes appels API
 * - Ici on génère un contenu stable en fonction de acteId
 */
async function mockFetchOverview(acteId: string): Promise<OverviewSummary> {
  const seed = hashToInt(acteId);
  const rand = (min: number, max: number) => {
    const x = (seed + min * 997 + max * 7919) % 1000;
    return min + (x / 999) * (max - min);
  };

  // Simule un petit délai réseau
  await new Promise((r) => setTimeout(r, 220));

  const incoh = Math.round(rand(0, 8));

  const transcriptionStatus: OverviewSummary["transcription"]["status"] =
    incoh > 6 ? "missing" : incoh > 2 ? "draft" : "validated";

  const extractionStatus: OverviewSummary["extraction"]["status"] =
    transcriptionStatus === "missing"
      ? "missing"
      : incoh > 4
        ? "partial"
        : "complete";

  const acteursCount = Math.round(rand(0, 14));
  const rolesCoveragePct = clamp(
    Math.round(rand(20, 100) - incoh * 6),
    0,
    100
  );

  const now = new Date();
  const updatedAt = new Date(now.getTime() - Math.round(rand(1, 72)) * 3600_000);

  return {
    updatedAt: updatedAt.toISOString(),
    coherence: { incoherencesCount: incoh },

    archive: {
      hasRegistre: rand(0, 1) > 0.15,
      hasDepot: rand(0, 1) > 0.35,
      hasLieuRedaction: rand(0, 1) > 0.25,
      hasDateRedaction: rand(0, 1) > 0.15,
      docState: (["bon", "moyen", "fragile", "inconnu"] as const)[
        Math.round(rand(0, 3))
      ],
    },

    transcription: {
      status: transcriptionStatus,
      charCount:
        transcriptionStatus === "missing" ? 0 : Math.round(rand(350, 8500)),
      segmentsMarkedIllegible:
        transcriptionStatus === "missing" ? 0 : Math.round(rand(0, 14)),
      versionsCount: transcriptionStatus === "missing" ? 0 : Math.round(rand(1, 6)),
      lastEditedAt:
        transcriptionStatus === "missing"
          ? undefined
          : new Date(now.getTime() - Math.round(rand(1, 120)) * 3600_000).toISOString(),
    },

    extraction: {
      status: extractionStatus,
      segmentsLinkedCount:
        extractionStatus === "missing" ? 0 : Math.round(rand(0, 80)),
      factsExtractedCount:
        extractionStatus === "missing" ? 0 : Math.round(rand(0, 24)),
      placesExtractedCount:
        extractionStatus === "missing" ? 0 : Math.round(rand(0, 18)),
      actorsLinkedCount:
        extractionStatus === "missing" ? 0 : Math.round(rand(0, acteursCount)),
    },

    acteurs: {
      acteursCount,
      rolesCoveragePct,
      withAgeCount: Math.round(rand(0, acteursCount)),
      withProfessionCount: Math.round(rand(0, acteursCount)),
      withDomicileCount: Math.round(rand(0, acteursCount)),
    },

    familyFacts: {
      unionsCount: Math.round(rand(0, 2)),
      filiationsCount: Math.round(rand(0, 6)),
      recognitionsCount: Math.round(rand(0, 2)),
      legitimationsCount: Math.round(rand(0, 1)),
    },

    mentions: {
      mentionsCount: Math.round(rand(0, 6)),
      rectificationsCount: Math.round(rand(0, 2)),
      renvoisCount: Math.round(rand(0, 3)),
    },

    linkedDocs: {
      linkedDocsCount: Math.round(rand(0, 9)),
      categories: [
        { label: "Contrat de mariage", count: Math.round(rand(0, 2)) },
        { label: "Acte notarié", count: Math.round(rand(0, 3)) },
        { label: "Hypothèque", count: Math.round(rand(0, 2)) },
        { label: "Jugement", count: Math.round(rand(0, 1)) },
      ].filter((c) => c.count > 0),
    },

    analysis: {
      hypothesesCount: Math.round(rand(0, 5)),
      conclusionsCount: Math.round(rand(0, 3)),
      nextActionsCount: Math.round(rand(0, 6)),
      sourcesMissingCount: Math.round(rand(0, 4)),
    },
  };
}

function formatDateTime(iso?: string) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function statusBadge(
  status:
    | "ok"
    | "warning"
    | "danger"
    | "missing"
    | "draft"
    | "validated"
    | "partial"
    | "complete"
) {
  switch (status) {
    case "ok":
    case "validated":
    case "complete":
      return <Badge className="bg-emerald-600 text-white">OK</Badge>;
    case "warning":
    case "draft":
    case "partial":
      return <Badge className="bg-amber-600 text-white">À compléter</Badge>;
    case "danger":
    case "missing":
      return <Badge className="bg-rose-600 text-white">Manquant</Badge>;
    default:
      return <Badge variant="secondary">—</Badge>;
  }
}

function TabCard({
  title,
  icon: Icon,
  status,
  subtitle,
  metrics,
  actionLabel,
  onAction,
  disabled,
}: {
  title: string;
  icon: any;
  status: React.ReactNode;
  subtitle: string;
  metrics: Array<{ label: string; value: React.ReactNode }>;
  actionLabel: string;
  onAction?: () => void;
  disabled?: boolean;
}) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl border flex items-center justify-center">
              <Icon className="h-4 w-4 text-slate-700" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold">{title}</CardTitle>
              <div className="text-xs text-muted-foreground">{subtitle}</div>
            </div>
          </div>
          <div className="shrink-0">{status}</div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-2">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-xl border px-3 py-2">
              <div className="text-[11px] text-muted-foreground">{m.label}</div>
              <div className="text-sm font-semibold text-slate-800">{m.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex justify-end">
          <Button
            variant="secondary"
            className="rounded-xl"
            onClick={onAction}
            disabled={disabled || !onAction}
          >
            {actionLabel}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OverviewActeTab({
  acteId,
  mode,
  onGoToTab,
}: OverviewActeTabProps) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<OverviewSummary | null>(null);

  const canEdit = mode === "edit";

  const refresh = async () => {
    setLoading(true);
    try {
      const s = await mockFetchOverview(acteId);
      setSummary(s);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acteId]);

  const globalCompletion = useMemo(() => {
    if (!summary) return 0;

    // Score simple (mock) basé sur plusieurs "dimensions"
    const parts: number[] = [];

    // archive
    parts.push(
      [
        summary.archive.hasRegistre,
        summary.archive.hasDepot,
        summary.archive.hasLieuRedaction,
        summary.archive.hasDateRedaction,
      ].filter(Boolean).length / 4
    );

    // transcription
    parts.push(
      summary.transcription.status === "validated"
        ? 1
        : summary.transcription.status === "draft"
          ? 0.6
          : 0
    );

    // extraction
    parts.push(
      summary.extraction.status === "complete"
        ? 1
        : summary.extraction.status === "partial"
          ? 0.55
          : 0
    );

    // acteurs/roles
    parts.push(summary.acteurs.rolesCoveragePct / 100);

    const avg = parts.reduce((a, b) => a + b, 0) / parts.length;
    return Math.round(avg * 100);
  }, [summary]);

  const go = (tab: TabKey) => onGoToTab?.(tab);

  if (loading || !summary) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">Overview</div>
            <div className="text-sm text-muted-foreground">Chargement du tableau de bord…</div>
          </div>
          <Button variant="secondary" disabled className="rounded-xl">
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="rounded-2xl">
              <CardHeader className="pb-3">
                <div className="h-4 w-32 bg-slate-200 rounded" />
                <div className="h-3 w-48 bg-slate-100 rounded mt-2" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-14 bg-slate-100 rounded-xl" />
                  <div className="h-14 bg-slate-100 rounded-xl" />
                  <div className="h-14 bg-slate-100 rounded-xl" />
                  <div className="h-14 bg-slate-100 rounded-xl" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // --- Statuts ---------------------------------------------------------------

  const coherenceStatus =
    summary.coherence.incoherencesCount === 0
      ? "ok"
      : summary.coherence.incoherencesCount <= 3
        ? "warning"
        : "danger";

  const archiveMissingCount =
    4 -
    [
      summary.archive.hasRegistre,
      summary.archive.hasDepot,
      summary.archive.hasLieuRedaction,
      summary.archive.hasDateRedaction,
    ].filter(Boolean).length;

  const archiveStatus =
    archiveMissingCount === 0 ? "ok" : archiveMissingCount <= 2 ? "warning" : "danger";

  const transcriptionStatus =
    summary.transcription.status === "validated"
      ? "validated"
      : summary.transcription.status === "draft"
        ? "draft"
        : "missing";

  const extractionStatus =
    summary.extraction.status === "complete"
      ? "complete"
      : summary.extraction.status === "partial"
        ? "partial"
        : "missing";

  const acteursStatus =
    summary.acteurs.acteursCount === 0
      ? "danger"
      : summary.acteurs.rolesCoveragePct >= 85
        ? "ok"
        : "warning";

  // --- Quick actions ---------------------------------------------------------

  const quickActions: Array<{
    label: string;
    hint: string;
    tab?: TabKey;
    disabled?: boolean;
  }> = [
    {
      label: "Compléter la référence archive",
      hint: "registre, dépôt, date/lieu de rédaction",
      tab: "Référence archive",
    },
    {
      label: "Démarrer / corriger la transcription",
      hint: "orthographe d’époque, illisibles, lacunes",
      tab: "Transcription",
    },
    {
      label: "Lier les preuves (segments) aux données",
      hint: "preuve pour chaque info (extraction)",
      tab: "Extraction",
      disabled: summary.transcription.status === "missing",
    },
    {
      label: "Revoir acteurs & rôles",
      hint: "variantes, âges, professions, domiciles",
      tab: "Acteurs & rôles",
    },
  ];

  // --- Rendering -------------------------------------------------------------

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-lg font-semibold">Overview</div>
            {statusBadge(
              globalCompletion >= 85 ? "ok" : globalCompletion >= 50 ? "warning" : "danger"
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            Dernière mise à jour : <span className="font-medium">{formatDateTime(summary.updatedAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={refresh} className="rounded-xl">
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>

          {canEdit && (
            <Button
              className="rounded-xl"
              onClick={() => {
                // action mock : typiquement tu feras "lancer un assistant" ou "recalcule incohérences"
                // ici on redirige vers l’onglet le plus critique
                if (archiveStatus === "danger") return go("Référence archive");
                if (transcriptionStatus === "missing") return go("Transcription");
                if (acteursStatus === "danger") return go("Acteurs & rôles");
                if (extractionStatus === "missing") return go("Extraction");
                return go("Analyse & contexte");
              }}
            >
              Prochaine action recommandée
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Global completion */}
      <Card className="mt-4 rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Progression globale</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-700">
              Niveau de complétion estimé (référence, transcription, extraction, acteurs)
            </div>
            <div className="text-sm font-semibold">{globalCompletion}%</div>
          </div>
          <Progress value={globalCompletion} className="mt-2" />
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="secondary" className="rounded-xl">
              Mode : {mode === "edit" ? "édition" : "lecture"}
            </Badge>
            <Badge variant="secondary" className="rounded-xl">
              Incohérences : {summary.coherence.incoherencesCount}
            </Badge>
            <Badge variant="secondary" className="rounded-xl">
              Acteurs : {summary.acteurs.acteursCount}
            </Badge>
            <Badge variant="secondary" className="rounded-xl">
              Preuves liées : {summary.extraction.segmentsLinkedCount}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Actions rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickActions.map((a) => (
              <button
                key={a.label}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition hover:bg-slate-50 ${
                  a.disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={() => {
                  if (a.disabled) return;
                  if (a.tab) go(a.tab);
                }}
                disabled={a.disabled}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-800">{a.label}</div>
                    <div className="text-xs text-muted-foreground">{a.hint}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-600" />
                </div>
              </button>
            ))}

            <Separator className="my-3" />

            <div className="rounded-2xl border bg-slate-50 px-4 py-3">
              <div className="flex items-start gap-2">
                {coherenceStatus === "ok" ? (
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-700" />
                ) : (
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-700" />
                )}
                <div className="min-w-0">
                  <div className="text-sm font-semibold">Contrôles rapides</div>
                  <div className="text-xs text-muted-foreground">
                    {summary.coherence.incoherencesCount === 0
                      ? "Aucune incohérence détectée."
                      : `${summary.coherence.incoherencesCount} incohérence(s) à corriger (acteurs, rôles, segments, cohérence des champs).`}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards grid */}
        <div className="grid gap-4 lg:col-span-2 md:grid-cols-2">
          <TabCard
            title="Référence archive"
            icon={Archive}
            status={statusBadge(
              archiveStatus === "ok" ? "ok" : archiveStatus === "warning" ? "warning" : "danger"
            )}
            subtitle="Registre, dépôt, lieu & date de rédaction, état du document"
            metrics={[
              { label: "Champs manquants", value: archiveMissingCount },
              { label: "État doc", value: summary.archive.docState ?? "—" },
              { label: "Dépôt", value: summary.archive.hasDepot ? "renseigné" : "à renseigner" },
              { label: "Registre", value: summary.archive.hasRegistre ? "lié" : "à lier" },
            ]}
            actionLabel="Ouvrir"
            onAction={() => go("Référence archive")}
            disabled={!onGoToTab}
          />

          <TabCard
            title="Transcription"
            icon={FileText}
            status={statusBadge(transcriptionStatus)}
            subtitle="Texte original, illisibles, lacunes, versions & validation"
            metrics={[
              { label: "Statut", value: summary.transcription.status },
              { label: "Caractères", value: summary.transcription.charCount.toLocaleString("fr-FR") },
              { label: "Illisibles", value: summary.transcription.segmentsMarkedIllegible },
              { label: "Versions", value: summary.transcription.versionsCount },
            ]}
            actionLabel="Ouvrir"
            onAction={() => go("Transcription")}
            disabled={!onGoToTab}
          />

          <TabCard
            title="Extraction"
            icon={Pickaxe}
            status={statusBadge(extractionStatus)}
            subtitle="Relier données extraites aux segments (preuves)"
            metrics={[
              { label: "Statut", value: summary.extraction.status },
              { label: "Preuves liées", value: summary.extraction.segmentsLinkedCount },
              { label: "Faits", value: summary.extraction.factsExtractedCount },
              { label: "Lieux", value: summary.extraction.placesExtractedCount },
            ]}
            actionLabel="Ouvrir"
            onAction={() => go("Extraction")}
            disabled={!onGoToTab || summary.transcription.status === "missing"}
          />

          <TabCard
            title="Acteurs & rôles"
            icon={Users}
            status={statusBadge(
              acteursStatus === "ok" ? "ok" : acteursStatus === "warning" ? "warning" : "danger"
            )}
            subtitle="Personnes citées + rôles + variantes (âge, prof., domicile, statut)"
            metrics={[
              { label: "Acteurs", value: summary.acteurs.acteursCount },
              { label: "Couverture rôles", value: `${summary.acteurs.rolesCoveragePct}%` },
              { label: "Âge", value: summary.acteurs.withAgeCount },
              { label: "Profession", value: summary.acteurs.withProfessionCount },
            ]}
            actionLabel="Ouvrir"
            onAction={() => go("Acteurs & rôles")}
            disabled={!onGoToTab}
          />
        </div>
      </div>

      {/* Secondary area: Family / Mentions / Linked / Analysis */}
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Network className="h-4 w-4" />
                Faits familiaux
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl"
                onClick={() => go("Faits familiaux")}
                disabled={!onGoToTab}
              >
                Voir
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Unions</span>
              <span className="font-semibold">{summary.familyFacts.unionsCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Filiations</span>
              <span className="font-semibold">{summary.familyFacts.filiationsCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Reconnaissances</span>
              <span className="font-semibold">{summary.familyFacts.recognitionsCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Légitimations</span>
              <span className="font-semibold">{summary.familyFacts.legitimationsCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <NotepadText className="h-4 w-4" />
                Mentions complémentaires
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl"
                onClick={() => go("Mentions complémentaires")}
                disabled={!onGoToTab}
              >
                Voir
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Mentions</span>
              <span className="font-semibold">{summary.mentions.mentionsCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Rectifications</span>
              <span className="font-semibold">{summary.mentions.rectificationsCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Renvois</span>
              <span className="font-semibold">{summary.mentions.renvoisCount}</span>
            </div>
            <div className="rounded-xl border px-3 py-2 text-xs text-muted-foreground">
              Tip: utile pour suivre la “vie administrative” de l’acte.
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Documents liés
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl"
                onClick={() => go("Documents liés")}
                disabled={!onGoToTab}
              >
                Voir
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold">{summary.linkedDocs.linkedDocsCount}</span>
            </div>

            {summary.linkedDocs.categories.length > 0 ? (
              <div className="space-y-1">
                {summary.linkedDocs.categories.slice(0, 4).map((c) => (
                  <div key={c.label} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{c.label}</span>
                    <span className="font-semibold">{c.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Aucun document lié.</div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Analyse & contexte
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl"
                onClick={() => go("Analyse & contexte")}
                disabled={!onGoToTab}
              >
                Voir
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Hypothèses</span>
              <span className="font-semibold">{summary.analysis.hypothesesCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Conclusions</span>
              <span className="font-semibold">{summary.analysis.conclusionsCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Prochaines actions</span>
              <span className="font-semibold">{summary.analysis.nextActionsCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Sources manquantes</span>
              <span className="font-semibold">{summary.analysis.sourcesMissingCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer hint */}
      <div className="mt-4 rounded-2xl border bg-white p-4">
        <div className="flex items-start gap-3">
          <Clock className="h-4 w-4 mt-0.5 text-slate-700" />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-800">Idée UX (facultatif)</div>
            <div className="text-sm text-muted-foreground">
              Ce tableau de bord peut afficher des “cartes cliquables” avec aperçu (ex: extrait de transcription,
              top acteurs, derniers segments liés) + raccourcis “corriger incohérences” quand tu branches ActeCoherence.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}