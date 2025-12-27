// ListeChipsViewSmart.tsx
import { Pencil, Trash } from "lucide-react";

type ListeChipsViewProps = {
  titre?: string;
  values: string[];
  dense?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function ListeChipsViewSmart({
  titre = "Valeurs",
  values,
  dense = false,
  onEdit,
  onDelete,
}: ListeChipsViewProps) {
  const isEmpty = !values || values.length === 0;

  // Heuristique : passe en mode compact si 1 valeur courte ou si dense=true
  const isSingleShort =
    values && values.length === 1 && (values[0]?.length ?? 0) <= 14;
  const compact = dense || isSingleShort;

  const handleDelete = () => {
    if (!onDelete) return;
    const ok = window.confirm("Supprimer ces valeurs ? Le champ passera à NULL.");
    if (ok) onDelete();
  };

  if (compact) {
    // === Mode COMPACT : tient sur une ligne, sans carte visuelle ===
    return (
      <div
        className="group flex items-center gap-2 text-sm"
        // rôle & étiquette pour lecteurs d’écran
        role="group"
        aria-label={titre}
      >
        {isEmpty ? (
          <span className="text-gray-400 italic">—</span>
        ) : (
          <div className="flex items-center gap-1.5" role="list" aria-label="Liste de valeurs">
            {values.map((v, i) => (
              <span
                key={`${v}-${i}`}
                role="listitem"
                title={v}
                className="px-2 py-0.5 mt-2 rounded border text-sm bg-indigo-50 text-indigo-800 border-indigo-100 max-w-[22ch] truncate"
              >
                {v}
              </span>
            ))}
          </div>
        )}

        {/* Actions : n’apparaissent qu’au survol/focus pour gagner de l’espace */}
        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            title="Modifier"
            aria-label="Modifier la sélection"
            className="p-1 rounded hover:bg-gray-100 text-gray-600 hover:text-indigo-700"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            title="Supprimer"
            aria-label="Supprimer la sélection"
            className="p-1 rounded hover:bg-gray-100 text-gray-600 hover:text-red-700"
          >
            <Trash className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // === Mode CARTE (liste plus longue ou valeurs plus verbeuses) ===
  return (
    <div
      className={[
        "group rounded-md border bg-white shadow-sm",
        dense ? "p-2" : "p-3",
      ].join(" ")}
    >
      <div className="flex items-center mb-2">
        <span className="font-semibold text-sm text-gray-900">{titre}</span>
        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            title="Modifier"
            aria-label="Modifier la sélection"
            className="p-1.5 rounded-sm hover:bg-gray-50 text-gray-700 hover:text-indigo-700"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            title="Supprimer"
            aria-label="Supprimer la sélection"
            className="p-1.5 rounded-sm hover:bg-gray-50 text-gray-700 hover:text-red-700"
          >
            <Trash className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isEmpty ? (
        <div className="text-sm text-gray-500 italic border border-dashed rounded-sm px-3 py-2 bg-gray-50">
          Aucune valeur
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5" role="list" aria-label="Liste de valeurs">
          {values.map((v, i) => (
            <span
              key={`${v}-${i}`}
              role="listitem"
              title={v}
              className="px-2.5 py-0.5 rounded-sm border text-sm bg-indigo-50 text-indigo-800 border-indigo-100 max-w-[32ch] truncate"
            >
              {v}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
