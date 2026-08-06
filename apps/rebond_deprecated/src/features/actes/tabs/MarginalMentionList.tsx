import React from "react";
import { Eye, Pencil, Trash2, PenLine } from "lucide-react";
import type { EcMarginalMentionRow } from "./transcriptionTab.service";
import { EntityListCard, type EntityListMode } from "@/components/shared/EntityListCard";
import { IconActionButton } from "@/components/shared/IconActionButton";

function SmallPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700">
      {children}
    </span>
  );
}

function MentionItem({
  m,
  disabled,
  showNote,
  onToggleNote,
  onEdit,
  onDelete,
}: {
  m: EcMarginalMentionRow;
  disabled: boolean;
  showNote: boolean;
  onToggleNote: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const title = m.type_acte_label ?? "Mention marginale";
  const date = m.mention_date_raw || m.mention_date || null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
              <PenLine className="h-4 w-4 text-slate-700" />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900">{title}</div>
              </div>

              <div className="mt-1 flex flex-wrap gap-2">
                {date ? <SmallPill>{date}</SmallPill> : null}
                {m.type_acte_label ? <SmallPill>{m.type_acte_label}</SmallPill> : null}
                {m.confidence_label ? <SmallPill>{m.confidence_label}</SmallPill> : null}
                {m.legibility_label ? <SmallPill>{m.legibility_label}</SmallPill> : null}
                {m.handwriting_style_label ? <SmallPill>{m.handwriting_style_label}</SmallPill> : null}
                {m.handwriting_legibility_label ? (
                  <SmallPill>{m.handwriting_legibility_label}</SmallPill>
                ) : null}
              </div>

              <div className="mt-2 text-sm text-slate-800 whitespace-pre-wrap">
                {m.mention_content ?? "—"}
              </div>

              {m.note ? (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={onToggleNote}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    {showNote ? "Masquer la note" : "Voir la note"}
                  </button>

                  {showNote ? (
                    <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700 whitespace-pre-wrap">
                      {m.note}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <IconActionButton title="Modifier" onClick={onEdit} disabled={disabled}>
            <Pencil className="h-4 w-4 text-slate-700" />
          </IconActionButton>
          <IconActionButton title="Supprimer" onClick={onDelete} disabled={disabled}>
            <Trash2 className="h-4 w-4 text-slate-700" />
          </IconActionButton>
        </div>
      </div>
    </div>
  );
}

export function MarginalMentionList({
  items,
  disabled,
  mode,
  onNew,
  onEdit,
  onDelete,
}: {
  items: EcMarginalMentionRow[];
  disabled: boolean;
  mode: EntityListMode; // "idle" | "create" | "edit"
  onNew: () => void;
  onEdit: (row: EcMarginalMentionRow) => void;
  onDelete: (id: string) => void;
}) {
  const [openNotes, setOpenNotes] = React.useState<Record<string, boolean>>({});

  return (
    <EntityListCard<EcMarginalMentionRow>
      title="Mentions marginales"
      items={items ?? []}
      disabled={disabled}
      mode={mode}
      onNew={onNew}
      countLabel={(c) => (c === 0 ? "Aucune mention saisie." : `${c} mention(s) enregistrée(s).`)}
      emptyTitle="Rien pour l’instant"
      emptyHint={
        <>
          Clique sur <span className="font-medium">Nouvelle</span> pour saisir une mention marginale.
        </>
      }
      renderItem={(m) => (
        <MentionItem
          key={m.id}
          m={m}
          disabled={disabled}
          showNote={!!openNotes[m.id]}
          onToggleNote={() => setOpenNotes((prev) => ({ ...prev, [m.id]: !prev[m.id] }))}
          onEdit={() => onEdit(m)}
          onDelete={() => onDelete(m.id)}
        />
      )}
    />
  );
}
