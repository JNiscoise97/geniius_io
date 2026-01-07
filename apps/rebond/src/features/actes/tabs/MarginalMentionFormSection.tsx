import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ListeChipsViewSmart } from "@/components/shared/ListeChipsViewSmart";
import {
  DictionnaireEditorPanel,
  type DictionnaireKind,
} from "@/components/shared/DictionnaireEditorPanel";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

import { useDictMonoField, type DictOpenArgs } from "@/hooks/useDictMonoField";

function Help({ children }: { children: React.ReactNode }) {
  return <div className="mt-1 text-[11px] text-slate-600">{children}</div>;
}

export type MarginalMentionFormSlice = {
  loading: boolean;
  workingVersion: any | null;

  // --- type acte ---
  mmTypeActeRef: string | null;
  setMmTypeActeRef?: (v: string | null) => void;
  mmTypeActeLabel?: string | null;
  setMmTypeActeLabel?: (v: string | null) => void;
  mmTypeActeColor?: string | null;
  setMmTypeActeColor?: (v: string | null) => void;

  // --- confidence ---
  mmConfidenceRef: string | null;
  setMmConfidenceRef?: (v: string | null) => void;
  mmConfidenceLabel?: string | null;
  setMmConfidenceLabel?: (v: string | null) => void;

  // --- legibility ---
  mmLegibilityRef: string | null;
  setMmLegibilityRef?: (v: string | null) => void;
  mmLegibilityLabel?: string | null;
  setMmLegibilityLabel?: (v: string | null) => void;

  // --- handwriting style ---
  mmHandwritingStyleRef: string | null;
  setMmHandwritingStyleRef?: (v: string | null) => void;
  mmHandwritingStyleLabel?: string | null;
  setMmHandwritingStyleLabel?: (v: string | null) => void;

  // --- handwriting legibility ---
  mmHandwritingLegibilityRef: string | null;
  setMmHandwritingLegibilityRef?: (v: string | null) => void;
  mmHandwritingLegibilityLabel?: string | null;
  setMmHandwritingLegibilityLabel?: (v: string | null) => void;

  // --- fields ---
  mmDateRaw: string | null;
  setMmDateRaw?: (v: string) => void;

  mmDate: string | null;
  setMmDate?: (v: string) => void;

  mmContent: string | null;
  setMmContent?: (v: string) => void;

  mmNote: string | null;
  setMmNote?: (v: string) => void;
};

export function MarginalMentionFormSection({ t }: { t: MarginalMentionFormSlice }) {
  const disabled = t.loading || !t.workingVersion;

  // --- Drawer dictionnaire partagé (1 seul Sheet) ---
  const [dictOpen, setDictOpen] = useState(false);
  const [dictArgs, setDictArgs] = useState<DictOpenArgs | null>(null);

  const openDict = (args: DictOpenArgs) => {
    setDictArgs(args);
    setDictOpen(true);
  };

  // --- Champs dictionnaire mono ---
  const typeActe = useDictMonoField({
    openDict,
    kind: "type_acte_ref",
    title: "Modifier le type d'acte",
    id: t.mmTypeActeRef,
    setId: t.setMmTypeActeRef,
    label: t.mmTypeActeLabel,
    setLabel: t.setMmTypeActeLabel,
    color: t.mmTypeActeColor,
    setColor: t.setMmTypeActeColor,
    hydrate: {
      table: "ref_ec_type_acte",
      select: "id,label,color",
      map: (row) => ({ label: row?.label ?? null, color: row?.color ?? null }),
    },
    fallbackLabelPrefix: "Type:",
  });

  const confidence = useDictMonoField({
    openDict,
    kind: "confidence_ref",
    title: "Modifier la confiance",
    id: t.mmConfidenceRef,
    setId: t.setMmConfidenceRef,
    label: t.mmConfidenceLabel,
    setLabel: t.setMmConfidenceLabel,
    hydrate: {
      table: "ref_confiance",
      select: "id,label",
      map: (row) => ({ label: row?.label ?? null }),
    },
    fallbackLabelPrefix: "Confiance:",
  });

  const legibility = useDictMonoField({
    openDict,
    kind: "legibility_ref",
    title: "Modifier la lisibilité",
    id: t.mmLegibilityRef,
    setId: t.setMmLegibilityRef,
    label: t.mmLegibilityLabel,
    setLabel: t.setMmLegibilityLabel,
    hydrate: {
      table: "ref_legibilite",
      select: "id,label",
      map: (row) => ({ label: row?.label ?? null }),
    },
    fallbackLabelPrefix: "Lisibilité:",
  });

  const handwritingStyle = useDictMonoField({
    openDict,
    kind: "handwriting_style_ref",
    title: "Modifier le style d’écriture",
    id: t.mmHandwritingStyleRef,
    setId: t.setMmHandwritingStyleRef,
    label: t.mmHandwritingStyleLabel,
    setLabel: t.setMmHandwritingStyleLabel,
    hydrate: {
      table: "ref_handwriting_style",
      select: "id,label",
      map: (row) => ({ label: row?.label ?? null }),
    },
    fallbackLabelPrefix: "Style:",
  });

  const handwritingLegibility = useDictMonoField({
    openDict,
    kind: "handwriting_legibility_ref",
    title: "Modifier la lisibilité de l’écriture",
    id: t.mmHandwritingLegibilityRef,
    setId: t.setMmHandwritingLegibilityRef,
    label: t.mmHandwritingLegibilityLabel,
    setLabel: t.setMmHandwritingLegibilityLabel,
    hydrate: {
      table: "ref_handwriting_legibility",
      select: "id,label",
      map: (row) => ({ label: row?.label ?? null }),
    },
    fallbackLabelPrefix: "Lisib. écriture:",
  });

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* type acte ref */}
      <div className="col-span-2">
        <Label className="text-xs font-medium text-slate-700">Type de mention (référence)</Label>

        <ListeChipsViewSmart
          titre="Type d'acte"
          values={typeActe.labels}
          colors={typeActe.colors}
          dense
          onEdit={typeActe.onEdit}
          onDelete={typeActe.onDelete}
        />
      </div>

      {/* confidence_ref */}
      <div className="col-span-1">
        <Label className="text-xs font-medium text-slate-700">Confiance</Label>
        <ListeChipsViewSmart
          titre="Confiance"
          values={confidence.labels}
          colors={confidence.colors}
          dense
          onEdit={confidence.onEdit}
          onDelete={confidence.onDelete}
        />
        <Help>
          Référentiel : <span className="font-mono">ref_confiance</span>
        </Help>
      </div>

      {/* legibility_ref */}
      <div className="col-span-1">
        <Label className="text-xs font-medium text-slate-700">Lisibilité (globale)</Label>
        <ListeChipsViewSmart
          titre="Lisibilité"
          values={legibility.labels}
          colors={legibility.colors}
          dense
          onEdit={legibility.onEdit}
          onDelete={legibility.onDelete}
        />
        <Help>
          Référentiel : <span className="font-mono">ref_legibilite</span>
        </Help>
      </div>

      {/* handwriting_style_ref */}
      <div className="col-span-1">
        <Label className="text-xs font-medium text-slate-700">Style d’écriture</Label>
        <ListeChipsViewSmart
          titre="Style d’écriture"
          values={handwritingStyle.labels}
          colors={handwritingStyle.colors}
          dense
          onEdit={handwritingStyle.onEdit}
          onDelete={handwritingStyle.onDelete}
        />
        <Help>
          Référentiel : <span className="font-mono">ref_handwriting_style</span>
        </Help>
      </div>

      {/* handwriting_legibility_ref */}
      <div className="col-span-1">
        <Label className="text-xs font-medium text-slate-700">Lisibilité de l’écriture</Label>
        <ListeChipsViewSmart
          titre="Lisibilité de l’écriture"
          values={handwritingLegibility.labels}
          colors={handwritingLegibility.colors}
          dense
          onEdit={handwritingLegibility.onEdit}
          onDelete={handwritingLegibility.onDelete}
        />
        <Help>
          Référentiel : <span className="font-mono">ref_handwriting_legibility</span>
        </Help>
      </div>

      {/* date raw */}
      <div>
        <Label className="text-xs font-medium text-slate-700">Date telle que lue</Label>
        <Input
          className="mt-1"
          placeholder='ex: "le 3 Xbre 1881"'
          value={t.mmDateRaw ?? ""}
          onChange={(e) => t.setMmDateRaw?.(e.target.value)}
          disabled={disabled}
        />
        <Help>Recopie la date telle qu’elle apparaît, même si elle est bizarre.</Help>
      </div>

      {/* date norm */}
      <div>
        <Label className="text-xs font-medium text-slate-700">Date normalisée (option)</Label>
        <Input
          className="mt-1"
          placeholder="YYYY-MM-DD"
          value={t.mmDate ?? ""}
          onChange={(e) => t.setMmDate?.(e.target.value)}
          disabled={disabled}
        />
        <Help>Si tu es sûr(e), tu peux normaliser. Sinon laisse vide.</Help>
      </div>

      {/* content required */}
      <div className="col-span-2">
        <Label className="text-xs font-medium text-slate-700">
          Texte transcrit <span className="text-red-600">*</span>
        </Label>
        <Textarea
          className="mt-1 min-h-[160px]"
          placeholder="Transcris exactement la mention marginale…"
          value={t.mmContent ?? ""}
          onChange={(e) => t.setMmContent?.(e.target.value)}
          disabled={disabled}
        />
        <Help>Transcription brute, sans interprétation. Garde les hésitations dans la note.</Help>
      </div>

      {/* note */}
      <div className="col-span-2">
        <Label className="text-xs font-medium text-slate-700">Note</Label>
        <Textarea
          className="mt-1 min-h-[90px]"
          placeholder="Contexte, ambiguïtés, lecture incertaine…"
          value={t.mmNote ?? ""}
          onChange={(e) => t.setMmNote?.(e.target.value)}
          disabled={disabled}
        />
        <Help>Tout ce qui aide à relire / arbitrer plus tard.</Help>
      </div>

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
