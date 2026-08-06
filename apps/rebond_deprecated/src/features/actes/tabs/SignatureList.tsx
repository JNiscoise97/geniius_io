import React from "react";
import {
  Pencil,
  Trash2,
  Signature as SignatureIcon,
  Tag,
  Gauge,
  Eye,
  StickyNote,
} from "lucide-react";
import type { EcSignatureRow } from "./transcriptionTab.service";
import { EntityListCard, type EntityListMode } from "@/components/shared/EntityListCard";
import { IconActionButton } from "@/components/shared/IconActionButton";

function MetaPill({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700">
      <Icon className="h-3 w-3 text-slate-400" />
      {children}
    </span>
  );
}

function SignatureListItem({
  s,
  disabled,
  showNote,
  onToggleNote,
  onEdit,
  onDelete,
}: {
  s: EcSignatureRow;
  disabled: boolean;
  showNote: boolean;
  onToggleNote: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const kind = s.signature_kind_label;
  const conf = s.confidence_label;
  const leg = s.handwriting_legibility_label;
  const hasMeta = Boolean(kind || conf || leg);
  const patterns = (s.pattern ?? "").split(";").map((p) => p.trim()).filter(Boolean);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-colors hover:border-slate-300">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
          <SignatureIcon className="h-4 w-4 text-slate-700" />
        </span>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 truncate text-sm font-semibold text-slate-900">{s.label}</div>
            <div className="flex shrink-0 items-center gap-1.5">
              <IconActionButton title="Modifier" onClick={onEdit} disabled={disabled}>
                <Pencil className="h-4 w-4 text-slate-700" />
              </IconActionButton>
              <IconActionButton title="Supprimer" onClick={onDelete} disabled={disabled}>
                <Trash2 className="h-4 w-4 text-slate-700" />
              </IconActionButton>
            </div>
          </div>

          {hasMeta ? (
            <div className="flex flex-wrap gap-1.5">
              {kind ? <MetaPill icon={Tag}>{kind}</MetaPill> : null}
              {conf ? <MetaPill icon={Gauge}>{conf}</MetaPill> : null}
              {leg ? <MetaPill icon={Eye}>{leg}</MetaPill> : null}
            </div>
          ) : (
            <div className="text-[11px] italic text-slate-400">
              Type, confiance et lisibilité non renseignés
            </div>
          )}

          {patterns.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {patterns.map((p, i) => (
                <span
                  key={`${s.id}-p-${i}`}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700"
                  title="Motif récurrent"
                >
                  {p}
                </span>
              ))}
            </div>
          ) : null}

          {s.note ? (
            <div>
              <button
                type="button"
                onClick={onToggleNote}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
              >
                <StickyNote className="h-3.5 w-3.5" />
                {showNote ? "Masquer la note" : "Voir la note"}
              </button>

              {showNote ? (
                <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700 whitespace-pre-wrap">
                  {s.note}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function SignatureList({
  items,
  disabled,
  mode,
  onNew,
  onEdit,
  onDelete,
}: {
  items: EcSignatureRow[];
  disabled: boolean;
  mode: EntityListMode;
  onNew: () => void;
  onEdit: (row: EcSignatureRow) => void;
  onDelete: (id: string) => void;
}) {
  const [openNotes, setOpenNotes] = React.useState<Record<string, boolean>>({});

  return (
    <EntityListCard<EcSignatureRow>
      title="Signatures"
      items={items ?? []}
      disabled={disabled}
      mode={mode}
      onNew={onNew}
      countLabel={(c) => (c === 0 ? "Aucune signature saisie." : `${c} signature(s) enregistrée(s).`)}
      emptyTitle="Rien pour l’instant"
      emptyHint={
        <>
          Clique sur <span className="font-medium">Nouvelle</span> pour saisir une signature telle que lue.
        </>
      }
      renderItem={(s) => (
        <SignatureListItem
          key={s.id}
          s={s}
          disabled={disabled}
          showNote={!!openNotes[s.id]}
          onToggleNote={() => setOpenNotes((prev) => ({ ...prev, [s.id]: !prev[s.id] }))}
          onEdit={() => onEdit(s)}
          onDelete={() => onDelete(s.id)}
        />
      )}
    />
  );
}
