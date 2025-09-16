//DictionnaireEditorPanel.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Filter, X } from "lucide-react";
import { toast } from "sonner";
import { fetchFiliation, fetchSignature, fetchQualite, fetchProfession, fetchStatuts, fetchSituationMatrimoniale, type DictionnaireItem, fetchStatutProprietaire, fetchCategorieCouleur, fetchStatutJuridique, fetchSituationFiscale } from "@/services/dictionnaires.rpc";

export type DictionnaireKind = "statut" 
| "filiation" 
| "qualite_ref"
| "situation_matrimoniale_ref"
| "profession_ref"
| "statut_proprietaire_ref"
| "categorie_couleur_ref"
| "statut_juridique_ref"
| "situation_fiscale_ref"
| "signature_ref";

export type DictionnaireEditorPanelProps = {
  title: string;                 // ex: "Modifier les professions"
  kind: DictionnaireKind;
  multi?: boolean;               // true = sélection multiple
  defaultSelectedIds?: string[]; // pour précocher
  onCancel: () => void;
  onValidate: (items: DictionnaireItem[]) => Promise<void> | void;
};

export function DictionnaireEditorPanel({
  title,
  kind,
  multi = true,
  defaultSelectedIds = [],
  onCancel,
  onValidate,
}: DictionnaireEditorPanelProps) {
  const [all, setAll] = useState<DictionnaireItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(defaultSelectedIds));

  const filterRef = useRef<HTMLInputElement | null>(null);

  // Charger les données
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let loader ;
      if(kind === "filiation"){
        loader = fetchFiliation;
      } else if(kind === "qualite_ref"){
        loader = fetchQualite;
      } else if(kind === "situation_matrimoniale_ref"){
        loader = fetchSituationMatrimoniale;
      } else if(kind === "signature_ref"){
        loader = fetchSignature;
      } else if(kind === "profession_ref"){
        loader = fetchProfession;
      } else if(kind === "statut_proprietaire_ref"){
        loader = fetchStatutProprietaire;
      } else if(kind === "categorie_couleur_ref"){
        loader = fetchCategorieCouleur;
      } else if(kind === "statut_juridique_ref"){
        loader = fetchStatutJuridique;
      } else if(kind === "situation_fiscale_ref"){
        loader = fetchSituationFiscale;
      } else {
        loader = fetchStatuts;
      } ;
      const { data, error } = await loader();
      setLoading(false);
      if (error) {
        toast.error("Erreur de chargement");
        return;
      }
      setAll(data);
    };
    load();
  }, [kind]);

  // Filtre + recherche (simple)
  const visible = useMemo(() => {
    let res = all;
    if (filter) {
      const f = filter.toLowerCase();
      res = res.filter((i) => i.label.toLowerCase().includes(f));
    }
    return res;
  }, [all, filter]);

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (!multi) next.clear();
        next.add(id);
      }
      return next;
    });
  };

  const handleValidate = async () => {
    const items = all.filter((i) => selected.has(i.id));
    if (items.length === 0) {
      toast.error("Aucune valeur sélectionnée");
      return;
    }
    await onValidate(items);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b">
        <h3 className="font-semibold">{title}</h3>
      </div>

      {/* Bandeau sélection */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground py-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="whitespace-nowrap">Sélection :</span>
            {[...selected]
              .map((id) => all.find((x) => x.id === id)?.label)
              .filter(Boolean)
              .join(" · ")}
          </div>
          <Button variant="link" size="sm" onClick={() => setSelected(new Set())}>
            Réinitialiser
          </Button>
        </div>
      )}

      {/* Toolbar filtre / recherche */}
      <div className="flex items-center justify-between w-full py-2">
        {/* Filtre */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setFilterOpen(!filterOpen);
              requestAnimationFrame(() => filterRef.current?.focus());
            }}
            className={filterOpen ? "text-primary" : ""}
          >
            <Filter className="w-4 h-4" />
          </Button>
          {filterOpen && (
            <div className="flex items-center gap-2">
              <Input
                ref={filterRef}
                placeholder="Filtrer..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-64"
              />
              {filter && (
                <Button size="icon" variant="ghost" onClick={() => setFilter("")}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-auto rounded border p-0 bg-white">
        {loading ? (
          <div className="p-3 text-sm text-muted-foreground">Chargement…</div>
        ) : visible.length === 0 ? (
          <div className="p-3 text-sm text-muted-foreground">Aucun résultat</div>
        ) : (
          <ul role="listbox">
            {visible.map((item) => {
              const checked = selected.has(item.id);
              return (
                <li
                  key={item.id}
                  role="option"
                  aria-selected={checked}
                  className={[
                    "flex items-center justify-between cursor-pointer border-b px-3 py-2 hover:bg-gray-50",
                    checked ? "bg-gray-50" : "",
                  ].join(" ")}
                  onClick={() => toggleOne(item.id)}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type={multi ? "checkbox" : "radio"}
                      checked={checked}
                      onChange={() => toggleOne(item.id)}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">{item.label}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer sticky */}
      <div
        className="
          sticky bottom-0 left-0 right-0 border-t
          bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60
          px-4 py-3
          pb-[calc(0.75rem+env(safe-area-inset-bottom))]
        "
      >
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Annuler
          </Button>
          <Button onClick={handleValidate}>
            Valider
          </Button>
        </div>
      </div>
    </div>
  );
}
