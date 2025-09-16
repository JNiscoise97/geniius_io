//ListeChipsView.tsx

import { Pencil, Trash } from "lucide-react";

type ListeChipsViewProps = {
  titre?: string;
  values: string[];
  dense?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function ListeChipsView({
  titre = "Valeurs",
  values,
  dense = false,
  onEdit,
  onDelete,
}: ListeChipsViewProps) {
  const isEmpty = !values || values.length === 0;

  const handleDelete = () => {
    if (!onDelete) return;
    const ok = window.confirm("Supprimer ces valeurs ? Le champ passera à NULL.");
    if (ok) onDelete();
  };

  return (
    <div
      className={[
        // conteneur “carte” discret : arrondi modéré + bordure + légère ombre
        "rounded-md border bg-white shadow-sm",
        dense ? "p-2" : "p-3",
      ].join(" ")}
    >
      <div className="flex items-center mb-2">
        <span className="font-semibold text-sm text-gray-900">{titre}</span>

        <div className="ml-auto flex items-center gap-1">
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
              className="px-2.5 py-0.5 rounded-sm border text-sm bg-indigo-50 text-indigo-800 border-indigo-100"
              title={v}
            >
              {v}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
