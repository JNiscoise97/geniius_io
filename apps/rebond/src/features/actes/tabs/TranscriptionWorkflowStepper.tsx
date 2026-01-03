//TranscriptionWorkflowStepper.tsx
import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Circle, FileText, ClipboardCheck, Pencil, Save } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


/**
 * UI-only. Pas de logique Supabase ici.
 * Le parent passe value + setters/callbacks.
 */

// --- Types (alignés sur ta table ec_transcriptions) -------------------------

export type EcTranscriptionDraft = {
  visibility: "private" | "shared" | "public" | null;
  state: "active" | "needs_review" | "locked" | "archived" | null;

  source_lecture_kind: "image_originale" | "microfilm" | "transcription_secondaire" | "autre" | null;

  scope: "full_acte" | "extrait" | "mentions_marginales" | "autre" | null;
  scope_details: string | null;

  langue_vue: string | null;
  language_confidence: "high" | "medium" | "low" | null;

  handwriting_style: "cursive" | "imprime" | "mixte" | "autre" | null;
  handwriting_legibility: "clear" | "medium" | "hard" | "impossible" | null;

  goal:
    | "indexation"
    | "publication"
    | "extraction_acteurs"
    | "traduction"
    | "lecture_personnelle"
    | "autre"
    | null;

  // JSON policy éditable “raw” en UI
  normalisation_policy_raw: string; // string JSON (on reste UI-only)

  conventions_id: string | null;
  conventions_override_text: string | null;

  completeness: "complete" | "partial" | "fragment" | null;
  incompleteness_reason: string | null;

  reserve_level: "none" | "minor" | "major" | null;
  reserve_reason: string | null;

  source_page_from: number | null;
  source_page_to: number | null;

  image_transform_notes: string | null;
  note: string | null;
};

type RigourChecklistState = {
  majuscules: boolean;
  ponctuation: boolean;
  grammaire: boolean;
  orthographe_noms: boolean;
  orthographe_lieux: boolean;
  format_dates: boolean;
  // extensible
  autres: boolean;
};

export type VersionEventRow = {
  id: string;
  event_type: string;
  event_at: string;
  event_by: string | null;
  payload: any;
};


export type TranscriptionWorkflowStepperProps = {
  disabled?: boolean;

  // Pour afficher “done” sur les steps, le parent peut fournir des flags simples
  step1Done?: boolean; // metadata ok
  step2Done?: boolean; // checklist ok

  // Données formulaire meta (UI-only)
  metaDraft: EcTranscriptionDraft;
  setMetaDraft: React.Dispatch<React.SetStateAction<EcTranscriptionDraft>>;

  // Checklist (UI-only)
  checklist: RigourChecklistState;
  setChecklist: React.Dispatch<React.SetStateAction<RigourChecklistState>>;

  // Actions (branchées sur ta logic existante)
  onSaveMetadata: () => void;
  onMarkAsTranscribed: () => void;

  // Contrôles
  canSaveMetadata?: boolean;
  canMarkAsTranscribed?: boolean;

    historyEvents?: VersionEventRow[];
};

// --- Helpers validation UI (light) -----------------------------------------

function safeJsonHint(raw: string) {
  if (!raw?.trim()) return { ok: true, msg: "JSON vide = {}" };
  try {
    JSON.parse(raw);
    return { ok: true, msg: "JSON valide" };
  } catch {
    return { ok: false, msg: "JSON invalide" };
  }
}

function pagesRangeOk(from: number | null, to: number | null) {
  if (from == null && to == null) return true;
  if (from == null || to == null) return false;
  return from <= to;
}

function completenessOk(c: EcTranscriptionDraft) {
  if (c.completeness === "complete") return !c.incompleteness_reason;
  if (c.completeness === "partial" || c.completeness === "fragment") return !!c.incompleteness_reason?.trim();
  return true;
}

function checklistAllDone(ch: RigourChecklistState) {
  // tu peux décider de rendre “autres” optionnel
  return (
    ch.majuscules &&
    ch.ponctuation &&
    ch.grammaire &&
    ch.orthographe_noms &&
    ch.orthographe_lieux &&
    ch.format_dates
  );
}

// --- UI --------------------------------------------------------------------

export function TranscriptionWorkflowStepper(props: TranscriptionWorkflowStepperProps) {
  const {
    disabled,
    metaDraft,
    setMetaDraft,
    checklist,
    setChecklist,
    onSaveMetadata,
    onMarkAsTranscribed,
    canSaveMetadata = true,
    canMarkAsTranscribed = true,
    step1Done,
    step2Done,
  } = props;

  const [metaOpen, setMetaOpen] = React.useState(false);
  const [checkOpen, setCheckOpen] = React.useState(false);

  const json = safeJsonHint(metaDraft.normalisation_policy_raw);
  const pagesOk = pagesRangeOk(metaDraft.source_page_from, metaDraft.source_page_to);
  const compOk = completenessOk(metaDraft);

  const metaLooksOk = Boolean(json.ok && pagesOk && compOk);
  const checklistDone = checklistAllDone(checklist);

  const s1Done = step1Done ?? metaLooksOk;
  const s2Done = step2Done ?? checklistDone;

  const StepRow = ({
    idx,
    title,
    subtitle,
    done,
    icon,
    action,
  }: {
    idx: 1 | 2 | 3;
    title: string;
    subtitle: string;
    done: boolean;
    icon: React.ReactNode;
    action: React.ReactNode;
  }) => (
    <div className="flex items-start gap-3">
      <div
        className={[
          "mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border",
          done ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-600",
        ].join(" ")}
      >
        {done ? <CheckCircle2 className="h-4 w-4" /> : icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-slate-900">
          {idx}. {title}
        </div>
        <div className="text-xs text-slate-600">{subtitle}</div>
        <div className="mt-2">{action}</div>
      </div>
    </div>
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900">Workflow</div>
        <Badge variant="secondary" className="text-[11px]">
          UI stepper
        </Badge>
      </div>

      <div className="mt-3 space-y-4">
        {/* STEP 1 */}
        <StepRow
          idx={1}
          title="Métadonnées"
          subtitle="Contexte de lecture, périmètre, langue, lisibilité, conventions…"
          done={s1Done}
          icon={<FileText className="h-4 w-4" />}
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setMetaOpen(true)}
              disabled={!!disabled}
              className="gap-2"
              title="Renseigner les métadonnées de la transcription"
            >
              <Pencil className="h-4 w-4" />
              Ouvrir le formulaire
            </Button>
          }
        />

        {/* STEP 2 */}
        <StepRow
          idx={2}
          title="Vérifications de rigueur"
          subtitle="Checklist rapide avant de marquer “transcrit”."
          done={s2Done}
          icon={<ClipboardCheck className="h-4 w-4" />}
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCheckOpen(true)}
              disabled={!!disabled}
              className="gap-2"
            >
              <Circle className="h-4 w-4" />
              Ouvrir la checklist
            </Button>
          }
        />

        {/* STEP 3 */}
        <StepRow
          idx={3}
          title="Marquer comme transcrit"
          subtitle="Une fois métadonnées + checklist ok."
          done={false}
          icon={<CheckCircle2 className="h-4 w-4" />}
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={onMarkAsTranscribed}
              disabled={!!disabled || !canMarkAsTranscribed || !s1Done || !s2Done}
            >
              Marquer comme transcrit
            </Button>
          }
        />

        {/* petit hint */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
          <div className="font-semibold text-slate-800">Conseil</div>
          <div className="mt-1">
            Le step 1 passe “OK” si : JSON valide, pages cohérentes, et si complétude ≠ complete alors une raison est renseignée.
          </div>
        </div>
      </div>

      {/* -------------------- Sheet 1 : Metadata form -------------------- */}
      <Sheet open={metaOpen} onOpenChange={setMetaOpen}>
        <SheetContent side="right" className="!w-[50vw] !max-w-none p-0 flex flex-col max-h-screen">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Métadonnées (ec_transcriptions)</SheetTitle>
            <SheetDescription>
              Formulaire UI basé sur la table. (Sauvegarde branchée via callback)
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4">
  <Tabs defaultValue="meta" className="w-full">
    <TabsList className="grid w-full grid-cols-2">
      <TabsTrigger value="meta">Métadonnées</TabsTrigger>
      <TabsTrigger value="history">Historique</TabsTrigger>
    </TabsList>

    <TabsContent value="meta" className="mt-4 space-y-6">
               {/* Bloc 1 */}
            <div className="grid grid-cols-2 gap-3">
              <FieldSelect
                label="Visibilité"
                value={metaDraft.visibility ?? ""}
                onChange={(v) => setMetaDraft((p) => ({ ...p, visibility: (v || null) as any }))}
                options={[
                  ["private", "private"],
                  ["shared", "shared"],
                  ["public", "public"],
                ]}
              />

              <FieldSelect
                label="État global"
                value={metaDraft.state ?? ""}
                onChange={(v) => setMetaDraft((p) => ({ ...p, state: (v || null) as any }))}
                options={[
                  ["active", "active"],
                  ["needs_review", "needs_review"],
                  ["locked", "locked"],
                  ["archived", "archived"],
                ]}
              />

              <FieldSelect
                label="Support de lecture"
                value={metaDraft.source_lecture_kind ?? ""}
                onChange={(v) => setMetaDraft((p) => ({ ...p, source_lecture_kind: (v || null) as any }))}
                options={[
                  ["image_originale", "image_originale"],
                  ["microfilm", "microfilm"],
                  ["transcription_secondaire", "transcription_secondaire"],
                  ["autre", "autre"],
                ]}
              />

              <FieldSelect
                label="Périmètre transcrit"
                value={metaDraft.scope ?? ""}
                onChange={(v) => setMetaDraft((p) => ({ ...p, scope: (v || null) as any }))}
                options={[
                  ["full_acte", "acte complet"],
                  ["extrait", "extrait"],
                  ["mentions_marginales", "mentions marginales"],
                  ["autre", "autre"],
                ]}
              />

              <div className="col-span-2">
                <div className="text-xs font-medium text-slate-700">Détails périmètre</div>
                <Textarea
                  className="mt-1 min-h-[80px]"
                  value={metaDraft.scope_details ?? ""}
                  onChange={(e) => setMetaDraft((p) => ({ ...p, scope_details: e.target.value || null }))}
                  placeholder='Ex : “sans signatures”, “marges illisibles”…'
                />
              </div>
            </div>

            {/* Bloc 2 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs font-medium text-slate-700">Langue observée</div>
                <Input
                  className="mt-1"
                  value={metaDraft.langue_vue ?? ""}
                  onChange={(e) => setMetaDraft((p) => ({ ...p, langue_vue: e.target.value || null }))}
                  placeholder="fr, la, créole…"
                />
              </div>

              <FieldSelect
                label="Confiance langue"
                value={metaDraft.language_confidence ?? ""}
                onChange={(v) => setMetaDraft((p) => ({ ...p, language_confidence: (v || null) as any }))}
                options={[
                  ["high", "high"],
                  ["medium", "medium"],
                  ["low", "low"],
                ]}
              />

              <FieldSelect
                label="Type d’écriture"
                value={metaDraft.handwriting_style ?? ""}
                onChange={(v) => setMetaDraft((p) => ({ ...p, handwriting_style: (v || null) as any }))}
                options={[
                  ["cursive", "cursive"],
                  ["imprime", "imprimé"],
                  ["mixte", "mixte"],
                  ["autre", "autre"],
                ]}
              />

              <FieldSelect
                label="Lisibilité"
                value={metaDraft.handwriting_legibility ?? ""}
                onChange={(v) => setMetaDraft((p) => ({ ...p, handwriting_legibility: (v || null) as any }))}
                options={[
                  ["clear", "clear"],
                  ["medium", "medium"],
                  ["hard", "hard"],
                  ["impossible", "impossible"],
                ]}
              />

              <FieldSelect
                label="Objectif"
                value={metaDraft.goal ?? ""}
                onChange={(v) => setMetaDraft((p) => ({ ...p, goal: (v || null) as any }))}
                options={[
                  ["indexation", "indexation"],
                  ["publication", "publication"],
                  ["extraction_acteurs", "extraction_acteurs"],
                  ["traduction", "traduction"],
                  ["lecture_personnelle", "lecture_personnelle"],
                  ["autre", "autre"],
                ]}
              />

              <div className="col-span-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-slate-700">Règles de normalisation (JSON)</div>
                  <span className={["text-[11px]", json.ok ? "text-emerald-700" : "text-red-700"].join(" ")}>
                    {json.msg}
                  </span>
                </div>
                <Textarea
                  className="mt-1 min-h-[120px] font-mono text-[12px]"
                  value={metaDraft.normalisation_policy_raw}
                  onChange={(e) => setMetaDraft((p) => ({ ...p, normalisation_policy_raw: e.target.value }))}
                  placeholder={`{\n  "abreviations": {"dme":"dame"},\n  "accents": "keep"\n}`}
                />
              </div>
            </div>

            {/* Bloc 3 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs font-medium text-slate-700">Conventions standard (id)</div>
                <Input
                  className="mt-1"
                  value={metaDraft.conventions_id ?? ""}
                  onChange={(e) => setMetaDraft((p) => ({ ...p, conventions_id: e.target.value || null }))}
                  placeholder="uuid (optionnel)"
                />
              </div>

              <div className="col-span-2">
                <div className="text-xs font-medium text-slate-700">Conventions spécifiques (override)</div>
                <Textarea
                  className="mt-1 min-h-[110px]"
                  value={metaDraft.conventions_override_text ?? ""}
                  onChange={(e) => setMetaDraft((p) => ({ ...p, conventions_override_text: e.target.value || null }))}
                  placeholder="Règles spécifiques à cette transcription…"
                />
              </div>
            </div>

            {/* Bloc 4 */}
            <div className="grid grid-cols-2 gap-3">
              <FieldSelect
                label="Complétude"
                value={metaDraft.completeness ?? ""}
                onChange={(v) => setMetaDraft((p) => ({ ...p, completeness: (v || null) as any }))}
                options={[
                  ["complete", "complete"],
                  ["partial", "partial"],
                  ["fragment", "fragment"],
                ]}
              />

              <FieldSelect
                label="Niveau de réserve"
                value={metaDraft.reserve_level ?? ""}
                onChange={(v) => setMetaDraft((p) => ({ ...p, reserve_level: (v || null) as any }))}
                options={[
                  ["none", "none"],
                  ["minor", "minor"],
                  ["major", "major"],
                ]}
              />

              <div className="col-span-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-slate-700">Raison si complétude ≠ complete</div>
                  <span className={["text-[11px]", compOk ? "text-emerald-700" : "text-red-700"].join(" ")}>
                    {compOk ? "OK" : "Requis si partial/fragment"}
                  </span>
                </div>
                <Textarea
                  className="mt-1 min-h-[80px]"
                  value={metaDraft.incompleteness_reason ?? ""}
                  onChange={(e) => setMetaDraft((p) => ({ ...p, incompleteness_reason: e.target.value || null }))}
                  placeholder="Pourquoi partiel / fragment ?"
                />
              </div>

              <div className="col-span-2">
                <div className="text-xs font-medium text-slate-700">Motif de réserve</div>
                <Textarea
                  className="mt-1 min-h-[80px]"
                  value={metaDraft.reserve_reason ?? ""}
                  onChange={(e) => setMetaDraft((p) => ({ ...p, reserve_reason: e.target.value || null }))}
                  placeholder="Ex : doute paléo, source secondaire…"
                />
              </div>
            </div>

            {/* Bloc 5 : Pages */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs font-medium text-slate-700">Page/vues de</div>
                <Input
                  className="mt-1"
                  type="number"
                  value={metaDraft.source_page_from ?? ""}
                  onChange={(e) =>
                    setMetaDraft((p) => ({ ...p, source_page_from: e.target.value === "" ? null : Number(e.target.value) }))
                  }
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-slate-700">à</div>
                  <span className={["text-[11px]", pagesOk ? "text-emerald-700" : "text-red-700"].join(" ")}>
                    {pagesOk ? "OK" : "from/to requis + from ≤ to"}
                  </span>
                </div>
                <Input
                  className="mt-1"
                  type="number"
                  value={metaDraft.source_page_to ?? ""}
                  onChange={(e) =>
                    setMetaDraft((p) => ({ ...p, source_page_to: e.target.value === "" ? null : Number(e.target.value) }))
                  }
                />
              </div>

              <div className="col-span-2">
                <div className="text-xs font-medium text-slate-700">Notes de transformation image</div>
                <Textarea
                  className="mt-1 min-h-[80px]"
                  value={metaDraft.image_transform_notes ?? ""}
                  onChange={(e) => setMetaDraft((p) => ({ ...p, image_transform_notes: e.target.value || null }))}
                  placeholder="Rotation, contraste, zoom, etc."
                />
              </div>

              <div className="col-span-2">
                <div className="text-xs font-medium text-slate-700">Note</div>
                <Textarea
                  className="mt-1 min-h-[90px]"
                  value={metaDraft.note ?? ""}
                  onChange={(e) => setMetaDraft((p) => ({ ...p, note: e.target.value || null }))}
                  placeholder="Notes internes…"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setMetaOpen(false)}>
                Fermer
              </Button>
              <Button onClick={onSaveMetadata} disabled={!!disabled || !canSaveMetadata} className="gap-2">
                <Save className="h-4 w-4" />
                Enregistrer
              </Button>
            </div>
            
    </TabsContent>
            <TabsContent value="history" className="mt-4">
      <div className="space-y-2">
        {props.historyEvents?.length ? (
          props.historyEvents.map((ev) => (
            <div
              key={ev.id}
              className="rounded-xl border border-slate-200 bg-white p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate">
                    {ev.event_type}
                  </div>
                  <div className="text-xs text-slate-600">
                    {new Date(ev.event_at).toLocaleString()}
                    {ev.event_by ? (
                      <>
                        {" "}
                        · <span className="font-mono">{ev.event_by}</span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
              <pre className="mt-2 max-h-[240px] overflow-auto rounded-lg bg-slate-50 p-2 text-[11px] text-slate-800">
                {JSON.stringify(ev.payload ?? {}, null, 2)}
              </pre>
            </div>
          ))
        ) : (
          <div className="text-sm text-slate-600">Aucun événement.</div>
        )}
      </div>
    </TabsContent>
  </Tabs>
</div>
        </SheetContent>
      </Sheet>

      {/* -------------------- Sheet 2 : Rigour checklist -------------------- */}
      <Sheet open={checkOpen} onOpenChange={setCheckOpen}>
        <SheetContent side="right" className="!w-[420px] !max-w-none p-0 flex flex-col max-h-screen">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Vérifications de rigueur</SheetTitle>
            <SheetDescription>Checklist rapide avant “transcrit”.</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <CheckRow
              label="Majuscules cohérentes (noms, titres, débuts de phrase)"
              checked={checklist.majuscules}
              onChange={(v) => setChecklist((p) => ({ ...p, majuscules: v }))}
            />
            <CheckRow
              label="Ponctuation (virgules, points, espaces)"
              checked={checklist.ponctuation}
              onChange={(v) => setChecklist((p) => ({ ...p, ponctuation: v }))}
            />
            <CheckRow
              label="Accords / grammaire (sans sur-normaliser)"
              checked={checklist.grammaire}
              onChange={(v) => setChecklist((p) => ({ ...p, grammaire: v }))}
            />
            <CheckRow
              label="Orthographe des noms (variantes contrôlées)"
              checked={checklist.orthographe_noms}
              onChange={(v) => setChecklist((p) => ({ ...p, orthographe_noms: v }))}
            />
            <CheckRow
              label="Orthographe des lieux (communes/quartiers)"
              checked={checklist.orthographe_lieux}
              onChange={(v) => setChecklist((p) => ({ ...p, orthographe_lieux: v }))}
            />
            <CheckRow
              label="Format des dates (cohérent sur tout l’acte)"
              checked={checklist.format_dates}
              onChange={(v) => setChecklist((p) => ({ ...p, format_dates: v }))}
            />

            <div className="pt-2">
              <CheckRow
                label="Autres vérifications (si besoin)"
                checked={checklist.autres}
                onChange={(v) => setChecklist((p) => ({ ...p, autres: v }))}
              />
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
              <div className="font-semibold text-slate-800">Astuce</div>
              <div className="mt-1">
                Tu peux ajouter plus tard des checks auto (repérages “dates/numéros/majuscules”) pour pré-cocher/alerter.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setCheckOpen(false)}>
                Fermer
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// -------------------- Small UI atoms ---------------------------------------

function FieldSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <div>
      <div className="text-xs font-medium text-slate-700">{label}</div>
      <select
        className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">—</option>
        {options.map(([v, lab]) => (
          <option key={v} value={v}>
            {lab}
          </option>
        ))}
      </select>
    </div>
  );
}

function CheckRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={[
        "w-full rounded-xl border px-3 py-3 text-left text-sm transition-colors",
        checked ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div
          className={[
            "mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border",
            checked ? "border-emerald-300 bg-white text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-600",
          ].join(" ")}
        >
          {checked ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
        </div>
        <div className="min-w-0">
          <div className="font-medium text-slate-900">{label}</div>
        </div>
      </div>
    </button>
  );
}
