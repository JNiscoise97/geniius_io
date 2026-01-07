//SignatureFormSection.tsx
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListeChipsViewSmart } from "@/components/shared/ListeChipsViewSmart";
import {
  DictionnaireEditorPanel,
  type DictionnaireKind,
} from "@/components/shared/DictionnaireEditorPanel";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

import { useDictMonoField, type DictOpenArgs } from "@/hooks/useDictMonoField";
import { useState } from "react";

function Help({ children }: { children: React.ReactNode }) {
  return <div className="mt-1 text-[11px] text-slate-600">{children}</div>;
}

type SignatureFormSlice = {
  loading: boolean;
  workingVersion: any | null;

  sigLabel: string | null;
  setSigLabel?: (v: string) => void;

  sigKind: string | null;
  setSigKind?: (v: string) => void;

  sigConfidence: string | null;
  setSigConfidence?: (v: string) => void;

  sigLegibility: string | null;
  setSigLegibility?: (v: string) => void;

  // --- handwriting legibility ---
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

  const [dictOpen, setDictOpen] = useState(false);
    const [dictArgs, setDictArgs] = useState<DictOpenArgs | null>(null);

  const openDict = (args: DictOpenArgs) => {
      setDictArgs(args);
      setDictOpen(true);
    };
  const handwritingLegibility = useDictMonoField({
      openDict,
      kind: "handwriting_legibility_ref",
      title: "Modifier la lisibilité de la signature",
      id: t.sigHandwritingLegibilityRef,
      setId: t.setSigHandwritingLegibilityRef,
      label: t.sigHandwritingLegibilityLabel,
      setLabel: t.setSigHandwritingLegibilityLabel,
      hydrate: {
        table: "ref_handwriting_legibility",
        select: "id,label",
        map: (row) => ({ label: row?.label ?? null }),
      },
      fallbackLabelPrefix: "Lisib. signature:",
    });

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* label (required) */}
      <div className="col-span-2">
        <Label className="text-xs font-medium text-slate-700">
          Signature (telle que lue) <span className="text-red-600">*</span>
        </Label>
        <Input
          className="mt-1"
          placeholder="Ex : « DURAND », « J. Martin », « X » (marque), « illisible »…"
          value={t.sigLabel ?? ""}
          onChange={(e) => t.setSigLabel?.(e.target.value)}
          disabled={disabled}
        />
        <Help>
          Recopie ce que tu vois, sans corriger. Si tu ne peux pas lire : écris{" "}
          <span className="font-mono">illisible</span> (ou décris la marque).
        </Help>
      </div>

      {/* signature_kind */}
      <div>
        <Label className="text-xs font-medium text-slate-700">Type</Label>
        <Select
          value={t.sigKind ?? ""}
          onValueChange={(v) => t.setSigKind?.(v)}
          disabled={disabled}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Choisir…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="signature">Signature</SelectItem>
            <SelectItem value="paraphe">Paraphe</SelectItem>
            <SelectItem value="initiales">Initiales</SelectItem>
            <SelectItem value="marque">Marque / croix / X</SelectItem>
            <SelectItem value="tampon">Tampon / cachet</SelectItem>
            <SelectItem value="autre">Autre</SelectItem>
          </SelectContent>
        </Select>
        <Help>
          Choisis ce qui correspond le mieux à la forme (signature complète, paraphe, initiales…).
        </Help>
      </div>

      {/* confidence */}
      <div>
        <Label className="text-xs font-medium text-slate-700">Confiance</Label>
        <Select
          value={t.sigConfidence ?? ""}
          onValueChange={(v) => t.setSigConfidence?.(v)}
          disabled={disabled}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Choisir…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Faible</SelectItem>
            <SelectItem value="medium">Moyenne</SelectItem>
            <SelectItem value="high">Haute</SelectItem>
          </SelectContent>
        </Select>
        <Help>
          À quel point tu es sûr(e) de la lecture du <em>label</em>.
        </Help>
      </div>

      {/* legibility */}
      <div className="col-span-2">
        <Label className="text-xs font-medium text-slate-700">Lisibilité</Label>
        <Select
          value={t.sigLegibility ?? ""}
          onValueChange={(v) => t.setSigLegibility?.(v)}
          disabled={disabled}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Choisir…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="clear">Claire</SelectItem>
            <SelectItem value="partial">Partielle</SelectItem>
            <SelectItem value="poor">Faible</SelectItem>
            <SelectItem value="illegible">Illisible</SelectItem>
          </SelectContent>
        </Select>
        <ListeChipsViewSmart
                  titre="Lisibilité de la signature"
                  values={handwritingLegibility.labels}
                  colors={handwritingLegibility.colors}
                  dense
                  onEdit={handwritingLegibility.onEdit}
                  onDelete={handwritingLegibility.onDelete}
                />
        <Help>
          Qualité visuelle de la signature (encre pâle, griffonnage, superposition…).
        </Help>
      </div>

      {/* note */}
      <div className="col-span-2">
        <Label className="text-xs font-medium text-slate-700">Note</Label>
        <Textarea
          className="mt-1 min-h-[90px]"
          placeholder="Ex : « encre très pâle », « surcharge », « semble être M. Durand mais incertain », « paraphe seul »…"
          value={t.sigNote ?? ""}
          onChange={(e) => t.setSigNote?.(e.target.value)}
          disabled={disabled}
        />
        <Help>
          Infos utiles pour comprendre la lecture (conditions, ambiguïtés, détails visuels). Évite les conclusions.
        </Help>
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
