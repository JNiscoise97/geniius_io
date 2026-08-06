// PathTreeView.tsx
import { usePathClipboardStore } from "@/store/usePathClipboardStore";
import { Check, ChevronRight, Copy, Pencil, Trash } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type PathTreeViewProps = {
  path_labels: string[];
  emphasizeLeaf?: boolean;
  dense?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function PathTreeView({
  path_labels,
  emphasizeLeaf = true,
  dense = false,
  onEdit,
  onDelete,
}: PathTreeViewProps) {
  const [copiedFlash, setCopiedFlash] = useState(false);
  const isEmpty = !path_labels || path_labels.length === 0;
  const setClipboard = usePathClipboardStore((s) => s.set);

  const copied = useMemo(() => (path_labels ?? []).join(" > "), [path_labels]);

  // Heuristique de compaction : 1–2 éléments et labels courts, ou dense=true
  const totalLen = (path_labels ?? []).join("").length;
  const maxLabelLen = Math.max(0, ...(path_labels ?? []).map((l) => l.length));
  const compact = dense || (!isEmpty && path_labels.length <= 2 && totalLen <= 28 && maxLabelLen <= 18);

  const handleCopyLocal = () => {
    if (!isEmpty) setClipboard(copied);
    setCopiedFlash(true);
    toast.success("Chemin prêt pour la recherche", { duration: 1400 });
    setTimeout(() => setCopiedFlash(false), 2200);
  };

  const handleDelete = () => {
    if (!onDelete) return;
    const ok = window.confirm("Supprimer ce chemin ? Cette action remettra le champ à NULL.");
    if (ok) onDelete();
  };

  if (compact) {
    // ===== Mode COMPACT : tient sur une ligne, sans carte =====
    return (
      <div className="group flex items-center gap-2 text-sm" role="group" aria-label="Chemin">
        <span className="text-gray-600">Chemin :</span>

        {isEmpty ? (
          <span className="text-gray-400 italic">—</span>
        ) : (
          <nav aria-label="Chemin">
            <ol className="flex flex-wrap items-center gap-x-1 gap-y-1">
              {path_labels.map((label, idx) => {
                const isLeaf = idx === path_labels.length - 1;
                return (
                  <li key={`${label}-${idx}`} className="flex items-center">
                    <span
                      title={label}
                      className={[
                        "px-2 py-0.5 rounded border text-xs",
                        isLeaf && emphasizeLeaf
                          ? "border-gray-300 font-semibold text-gray-800 bg-gray-50"
                          : "border-transparent text-gray-700",
                      ].join(" ")}
                    >
                      {label}
                    </span>
                    {!isLeaf && <ChevronRight aria-hidden className="mx-1 h-4 w-4 text-gray-400" />}
                  </li>
                );
              })}
            </ol>
          </nav>
        )}

        {/* Actions au survol/focus */}
        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button
            onClick={handleCopyLocal}
            title="Copier dans la recherche (local)"
            aria-label="Copier le chemin"
            className="p-1 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900 disabled:opacity-50"
            disabled={isEmpty || copiedFlash}
          >
            {copiedFlash ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={onEdit}
            title="Modifier"
            aria-label="Modifier le chemin"
            className="p-1 rounded hover:bg-gray-100 text-gray-600 hover:text-indigo-700"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            title="Supprimer"
            aria-label="Supprimer le chemin"
            className="p-1 rounded hover:bg-gray-100 text-gray-600 hover:text-red-700"
          >
            <Trash className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ===== Mode CARTE =====
  return (
    <div className={["group rounded-md border bg-white shadow-sm", dense ? "p-2" : "p-3"].join(" ")}>
      {/* Header */}
      <div className="flex items-center mb-2">
        <span className="font-semibold text-sm text-gray-900">Chemin</span>
        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button
            onClick={handleCopyLocal}
            title="Copier dans la recherche (local)"
            aria-label="Copier le chemin"
            className="p-1.5 rounded-sm hover:bg-gray-50 text-gray-700 hover:text-gray-900 disabled:opacity-50"
            disabled={isEmpty || copiedFlash}
          >
            {copiedFlash ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={onEdit}
            title="Modifier"
            aria-label="Modifier le chemin"
            className="p-1.5 rounded-sm hover:bg-gray-50 text-gray-700 hover:text-indigo-700"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            title="Supprimer"
            aria-label="Supprimer le chemin"
            className="p-1.5 rounded-sm hover:bg-gray-50 text-gray-700 hover:text-red-700"
          >
            <Trash className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Corps */}
      {isEmpty ? (
        <div className="text-sm text-gray-500 italic border border-dashed rounded-sm px-3 py-2 bg-gray-50">
          Aucun chemin
        </div>
      ) : (
        <nav aria-label="Chemin">
          <ol className="flex flex-wrap items-center gap-x-1 gap-y-2">
            {path_labels.map((label, idx) => {
              const isLeaf = idx === path_labels.length - 1;
              return (
                <li key={`${label}-${idx}`} className="flex items-center">
                  <span
                    title={label}
                    className={[
                      "px-2 py-0.5 rounded text-sm border",
                      isLeaf && emphasizeLeaf
                        ? "border-gray-300 font-semibold text-gray-800 bg-gray-50"
                        : "border-transparent text-gray-700",
                    ].join(" ")}
                  >
                    {label}
                  </span>
                  {!isLeaf && <ChevronRight aria-hidden className="mx-1 h-4 w-4 text-gray-400" />}
                </li>
              );
            })}
          </ol>
        </nav>
      )}
    </div>
  );
}
