import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Pencil,
  Trash2,
  Signature as SignatureIcon,
  ShieldCheck,
  Eye,
} from "lucide-react";
import type { EcSignatureRow } from "./transcriptionTab.service";
import { EntityListCard, type EntityListMode } from "@/components/shared/EntityListCard";
import { IconActionButton } from "@/components/shared/IconActionButton";

function formatKind(kind?: string | null) {
  if (!kind) return null;
  const map: Record<string, string> = {
    signature: "Signature",
    paraphe: "Paraphe",
    initiales: "Initiales",
    marque: "Marque",
    tampon: "Tampon",
    autre: "Autre",
  };
  return map[kind] ?? kind;
}

function formatConfidence(c?: string | null) {
  if (!c) return null;
  const map: Record<string, string> = {
    low: "Faible",
    medium: "Moyenne",
    high: "Élevée",
  };
  return map[c] ?? c;
}

function formatLegibility(l?: string | null) {
  if (!l) return null;
  const map: Record<string, string> = {
    clear: "Clair",
    partial: "Partiel",
    poor: "Difficile",
    illegible: "Illisible",
  };
  return map[l] ?? l;
}

function MetaPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700">
      {children}
    </span>
  );
}

function SignatureListItem({
  s,
  disabled,
  onEdit,
  onDelete,
}: {
  s: EcSignatureRow;
  disabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [showNote, setShowNote] = React.useState(false);

  const kind = formatKind(s.signature_kind);
  const conf = formatConfidence(s.confidence);
  const leg = formatLegibility(s.legibility);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
              <SignatureIcon className="h-4 w-4 text-slate-700" />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900">{s.label}</div>
                {conf === "Élevée" ? (
                  <Badge variant="secondary" className="gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    sûr
                  </Badge>
                ) : null}
              </div>

              <div className="mt-1 flex flex-wrap gap-2">
                {kind ? <MetaPill>{kind}</MetaPill> : null}
                {conf ? <MetaPill>Confiance: {conf}</MetaPill> : null}
                {leg ? <MetaPill>Lisibilité: {leg}</MetaPill> : null}
              </div>

              {s.pattern ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {s.pattern.split(';').filter(Boolean).map((p, i) => (
                    <span
                      key={`${s.id}-p-${i}`}
                      className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700"
                      title="Pattern"
                    >
                      {p.trim()}
                    </span>
                  ))}
                </div>
              ) : null}

              {s.note ? (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setShowNote((v) => !v)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                  >
                    <Eye className="h-3.5 w-3.5" />
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
          onEdit={() => onEdit(s)}
          onDelete={() => onDelete(s.id)}
        />
      )}
    />
  );
}
