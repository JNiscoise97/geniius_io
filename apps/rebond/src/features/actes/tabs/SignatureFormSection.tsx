//SignatureFormSection.tsx
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, PenLine, Tag, Gauge, Eye, Tags, StickyNote } from "lucide-react";
import { ListeChipsViewSmart } from "@/components/shared/ListeChipsViewSmart";
import {
  DictionnaireEditorPanel,
  type DictionnaireKind,
} from "@/components/shared/DictionnaireEditorPanel";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useDictMonoField, type DictOpenArgs } from "@/hooks/useDictMonoField";

function Help({ children }: { children: React.ReactNode }) {
  return <div className="mt-1 text-[11px] text-slate-500">{children}</div>;
}

function CardSection({
  icon: Icon,
  title,
  help,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  help?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
        {title}
      </div>
      {children}
      {help ? <Help>{help}</Help> : null}
    </div>
  );
}

type DictField = {
  labels: string[];
  colors: Array<string | null | undefined>;
  onEdit: () => void;
  onDelete: () => void;
};

function DictPickerField({
  icon: Icon,
  label,
  field,
  help,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  field: DictField;
  help?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2.5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
        {label}
      </div>
      <div className="mt-1.5">
        <ListeChipsViewSmart
          titre={label}
          values={field.labels}
          colors={field.colors}
          dense
          actionsInvisible={false}
          onEdit={field.onEdit}
          onDelete={field.onDelete}
        />
      </div>
      {help ? <Help>{help}</Help> : null}
    </div>
  );
}

function splitPattern(raw: string | null | undefined): string[] {
  return (raw ?? "")
    .split(";")
    .map((p) => p.trim())
    .filter(Boolean);
}

function PatternChipsInput({
  value,
  onChange,
  disabled,
}: {
  value: string | null;
  onChange?: (v: string) => void;
  disabled: boolean;
}) {
  const chips = splitPattern(value);
  const [draft, setDraft] = useState("");

  const commit = (raw: string) => {
    const next = raw.trim();
    if (!next) return;
    if (chips.includes(next)) {
      setDraft("");
      return;
    }
    onChange?.([...chips, next].join(";"));
    setDraft("");
  };

  const removeAt = (idx: number) => {
    onChange?.(chips.filter((_, i) => i !== idx).join(";"));
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1.5 min-h-[38px]">
        {chips.map((p, i) => (
          <span
            key={`${p}-${i}`}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 pl-2 pr-1 py-0.5 text-[11px] text-slate-700"
          >
            {p}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="rounded-full p-0.5 hover:bg-slate-200"
                title="Retirer"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
        <input
          className="flex-1 min-w-[100px] border-0 bg-transparent text-sm outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
          placeholder={chips.length ? "Ajouter…" : "Ex : « Vu et approuvé », paraphe en marge…"}
          value={draft}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commit(draft);
            } else if (e.key === "Backspace" && !draft && chips.length) {
              removeAt(chips.length - 1);
            }
          }}
          onBlur={() => commit(draft)}
        />
      </div>
    </div>
  );
}

export type SignatureFormSlice = {
  loading: boolean;
  workingVersion: any | null;

  sigLabel: string | null;
  setSigLabel?: (v: string) => void;

  // --- type de marque (signature_kind_ref) ---
  sigKindRef: string | null;
  setSigKindRef?: (v: string | null) => void;
  sigKindLabel?: string | null;
  setSigKindLabel?: (v: string | null) => void;

  // --- confiance (confidence_ref) ---
  sigConfidenceRef: string | null;
  setSigConfidenceRef?: (v: string | null) => void;
  sigConfidenceLabel?: string | null;
  setSigConfidenceLabel?: (v: string | null) => void;

  // --- lisibilité (handwriting_legibility_ref) ---
  sigHandwritingLegibilityRef: string | null;
  setSigHandwritingLegibilityRef?: (v: string | null) => void;
  sigHandwritingLegibilityLabel?: string | null;
  setSigHandwritingLegibilityLabel?: (v: string | null) => void;

  sigPatternRaw: string | null;
  setSigPatternRaw?: (v: string) => void;

  sigNote: string | null;
  setSigNote?: (v: string) => void;
};

export function SignatureFormSection({ t }: { t: SignatureFormSlice }) {
  const disabled = t.loading || !t.workingVersion;

  // --- Drawer dictionnaire partagé (1 seul Sheet) ---
  const [dictOpen, setDictOpen] = useState(false);
  const [dictArgs, setDictArgs] = useState<DictOpenArgs | null>(null);

  const openDict = (args: DictOpenArgs) => {
    setDictArgs(args);
    setDictOpen(true);
  };

  const kind = useDictMonoField({
    openDict,
    kind: "signature_kind_ref",
    title: "Modifier le type de marque",
    id: t.sigKindRef,
    setId: t.setSigKindRef,
    label: t.sigKindLabel,
    setLabel: t.setSigKindLabel,
    hydrate: {
      table: "ref_signature_kind",
      select: "id,label",
      map: (row) => ({ label: row?.label ?? null }),
    },
    fallbackLabelPrefix: "Type:",
  });

  const confidence = useDictMonoField({
    openDict,
    kind: "confidence_ref",
    title: "Modifier la confiance",
    id: t.sigConfidenceRef,
    setId: t.setSigConfidenceRef,
    label: t.sigConfidenceLabel,
    setLabel: t.setSigConfidenceLabel,
    hydrate: {
      table: "ref_confiance",
      select: "id,label",
      map: (row) => ({ label: row?.label ?? null }),
    },
    fallbackLabelPrefix: "Confiance:",
  });

  const handwritingLegibility = useDictMonoField({
    openDict,
    kind: "handwriting_legibility_ref",
    title: "Modifier la lisibilité de la marque",
    id: t.sigHandwritingLegibilityRef,
    setId: t.setSigHandwritingLegibilityRef,
    label: t.sigHandwritingLegibilityLabel,
    setLabel: t.setSigHandwritingLegibilityLabel,
    hydrate: {
      table: "ref_handwriting_legibility",
      select: "id,label",
      map: (row) => ({ label: row?.label ?? null }),
    },
    fallbackLabelPrefix: "Lisibilité:",
  });

  return (
    <div className="space-y-3">
      {/* label (required) */}
      <CardSection
        icon={PenLine}
        title="Lecture"
        help={
          <>
            Recopie ce que tu vois, sans corriger. Si tu ne peux pas lire : écris{" "}
            <span className="font-mono">illisible</span> (ou décris la marque).
          </>
        }
      >
        <Label className="text-xs font-medium text-slate-700">
          Signature (telle que lue) <span className="text-red-600">*</span>
        </Label>
        <Input
          className="mt-1 bg-white text-sm"
          placeholder="Ex : « DURAND », « J. Martin », « X » (marque), « illisible »…"
          value={t.sigLabel ?? ""}
          onChange={(e) => t.setSigLabel?.(e.target.value)}
          disabled={disabled}
        />
      </CardSection>

      {/* Caractérisation : type / confiance / lisibilité */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
        <div className="text-xs font-semibold text-slate-700">Caractérisation</div>
        <div className="grid grid-cols-1 gap-2">
          <DictPickerField
            icon={Tag}
            label="Type de marque"
            field={kind}
            help={
              <>
                Forme de la marque (signature, paraphe, initiales…).
              </>
            }
          />
          <DictPickerField
            icon={Gauge}
            label="Confiance de lecture"
            field={confidence}
            help={
              <>
                À quel point tu es sûr(e) de la lecture. Référentiel :{" "}
                <span className="font-mono">ref_confiance</span>
              </>
            }
          />
          <DictPickerField
            icon={Eye}
            label="Lisibilité de la marque"
            field={handwritingLegibility}
            help={
              <>
                Qualité visuelle (encre pâle, griffonnage…).
              </>
            }
          />
        </div>
      </div>

      {/* pattern */}
      <CardSection
        icon={Tags}
        title="Motifs récurrents"
        help='Mots-clés ou formules qui reviennent (ex : "Vu et approuvé", "paraphe en marge"). Appuie sur Entrée ou virgule pour ajouter.'
      >
        <PatternChipsInput
          value={t.sigPatternRaw}
          onChange={t.setSigPatternRaw}
          disabled={disabled}
        />
      </CardSection>

      {/* note */}
      <CardSection
        icon={StickyNote}
        title="Note"
        help="Infos utiles pour comprendre la lecture (conditions, ambiguïtés, détails visuels). Évite les conclusions."
      >
        <Textarea
          className="min-h-[90px]"
          placeholder="Ex : « encre très pâle », « surcharge », « semble être M. Durand mais incertain », « paraphe seul »…"
          value={t.sigNote ?? ""}
          onChange={(e) => t.setSigNote?.(e.target.value)}
          disabled={disabled}
        />
      </CardSection>

      {/* DRAWER dictionnaire partagé */}
      <Sheet
        open={dictOpen}
        onOpenChange={(v) => {
          setDictOpen(v);
          if (!v) setDictArgs(null);
        }}
      >
        <SheetContent side="right" className="w-[520px] sm:w-[640px] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>{dictArgs?.title ?? "Dictionnaire"}</SheetTitle>
            <SheetDescription>Sélection d’une valeur de dictionnaire</SheetDescription>
          </SheetHeader>

          {dictArgs && (
            <DictionnaireEditorPanel
              kind={dictArgs.kind as DictionnaireKind}
              title={dictArgs.title}
              multi={dictArgs.multi}
              defaultSelectedIds={dictArgs.defaultSelectedIds}
              onValidate={async (items) => {
                await dictArgs.onValidate(items);
                setDictOpen(false);
              }}
              onCancel={() => setDictOpen(false)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
