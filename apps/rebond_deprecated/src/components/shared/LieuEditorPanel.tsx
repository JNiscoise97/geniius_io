// LieuEditorPanel.tsx
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Filter, X, Search, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { TreeNodeSelect } from "@/features/toponymes-associer/TreeNodeSelect";
import {
  fetchToponymes as fetchToponymesSvc,
} from "@/features/toponymes-associer/services/toponymes.rpc";
import {
  type ToponymeNode,
  buildTreeFromToponymes,
  enrichPaths,
  addVarianteIntoTree,
  addChildLieuIntoTree,
} from "@/features/toponymes-associer/utils/tree";
import { useToponymeFilter } from "@/features/toponymes-associer/hooks/useToponymeFilter";
import { useToponymeSearch } from "@/features/toponymes-associer/hooks/useToponymeSearch";
import { highlightSearchResult } from "@/features/toponymes-associer/utils/highlight";
import { usePathClipboardStore } from "@/store/usePathClipboardStore";

export type LieuEditorPanelProps = {
  title: string; // ex: "Modifier le lieu de naissance"
  defaultLabelForCreate?: string;
  onCancel: () => void;
  // NOTE: on renvoie une LISTE de nœuds sélectionnés (multi possible), pas un chemin complet
  onSaveSelection: (nodes: ToponymeNode[]) => Promise<void> | void;
};

export function LieuEditorPanel({
  title,
  defaultLabelForCreate,
  onCancel,
  onSaveSelection,
}: LieuEditorPanelProps) {
  const [rootNode, setRootNode] = useState<ToponymeNode | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<ToponymeNode[]>([]);

  const selectedIds = useMemo(
    () => new Set(selectedNodes.map((n) => n.toponyme_id)),
    [selectedNodes]
  );

  // --- Filtre
  const {
    filter,
    setFilter,
    showFilter,
    setShowFilter,
    inputRef,
    filteredRoot,
    clearFilter,
  } = useToponymeFilter(rootNode);

  // --- Recherche
  const {
    search,
    setSearch,
    showSearch,
    setShowSearch,
    inputSearchRef,
    registerMatchRef,
    currentMatchIndex,
    totalMatches,
    goToNextMatch,
    goToPrevMatch,
    clearSearch,
    autoOpenSet,
  } = useToponymeSearch(rootNode, filteredRoot, { highlightCurrent: highlightSearchResult });

  // --- Mutations locales de l’arbre
  const handleAddVariante = (parentLieuId: string, variante: ToponymeNode) => {
    setRootNode((prev) => {
      if (!prev) return prev;
      const updated = addVarianteIntoTree(prev, parentLieuId, variante);
      enrichPaths(updated);
      return updated;
    });
  };

  const handleAddLieu = (parentLieuId: string, child: ToponymeNode) => {
    setRootNode((prev) => {
      if (!prev) return prev;
      const updated = addChildLieuIntoTree(prev, parentLieuId, child);
      enrichPaths(updated);
      return updated;
    });
  };

  // --- Chargement de l’arbre
  useEffect(() => {
    const load = async () => {
      const { data, error } = await fetchToponymesSvc();
      if (error) {
        toast.error("Erreur chargement des toponymes");
        return;
      }
      const toponymesEnrichis = (data ?? []).map((t: any) => ({
        toponyme_id: t.id,
        label: t.libelle,
        lieu_id: t.lieu_id,
        parent_id: t.lieux?.parent_id ?? null,
        is_principal: t.is_principal,
      }));
      const tree = buildTreeFromToponymes(toponymesEnrichis);
      const wrapper: ToponymeNode = {
        lieu_id: "root",
        label: "/",
        toponyme_id: "fake",
        is_principal: true,
        children: tree,
        path: [],
      };
      enrichPaths(wrapper);
      setRootNode(wrapper);
    };
    load();
  }, []);

const clipboardPath = usePathClipboardStore((s) => s.path);
const clearClipboard = usePathClipboardStore((s) => s.clear);

// purge à l’unmount (filet de sécurité)
useEffect(() => {
  return () => clearClipboard();
}, [clearClipboard]);

// 1) Réagit quand un chemin est copié (ou quand le panneau s’ouvre alors qu’un chemin est déjà copié)
useEffect(() => {
  if (!rootNode) return;
  if (!clipboardPath) return; // rien à faire

  // ouvrir + préremplir + focus
  setShowFilter(true);
  setFilter(clipboardPath);
  requestAnimationFrame(() => inputRef.current?.focus());
  toast.success("Filtre prérempli avec le chemin copié", { duration: 1400 });

  // expand l’arbo
  const labels = splitLocalClipboardPath(clipboardPath); // "A > B > C" -> ["A","B","C"]
  const openedCount = expandTreeToLabelsAllMatches(rootNode, labels, autoOpenSet);
  if (openedCount === 0) toast("Aucun chemin correspondant.");

  // usage unique
  clearClipboard(); // ou consumeClipboard() si tu préfères le pattern "consume"
}, [clipboardPath, rootNode, setShowFilter, setFilter, inputRef, autoOpenSet, clearClipboard]);
 


  // --- Sélection (toggle de la feuille cliquée, comme dans AssocierToponymeButton)
  const toggleSelection = (clickedPath: ToponymeNode[]) => {
    const leaf = clickedPath[clickedPath.length - 1];
    setSelectedNodes((prev) => {
      const exists = prev.some((n) => n.toponyme_id === leaf.toponyme_id);
      if (exists) {
        return prev.filter((n) => n.toponyme_id !== leaf.toponyme_id);
      }
      return [...prev, leaf];
    });
  };

  // --- Validation : on renvoie la LISTE sélectionnée (pas de isPathValid ici)
  const handleValidate = async () => {
    if (selectedNodes.length === 0) {
      toast.error("Aucun lieu sélectionné");
      return;
    }
    await onSaveSelection(selectedNodes);
  };

  const handleCancel = () => {
    clearClipboard();
    onCancel();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b">
        <h3 className="font-semibold">{title}</h3>
      </div>

      {/* Bandeau sélection (multi) */}
      {selectedNodes.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground py-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="whitespace-nowrap">Chemin sélectionné :</span>
            {selectedNodes.map((n) => n.label).join(' > ')}
          </div>
          <Button variant="link" size="sm" onClick={() => setSelectedNodes([])}>
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
            onClick={() => setShowFilter(!showFilter)}
            className={showFilter ? "text-primary" : ""}
          >
            <Filter className="w-4 h-4" />
          </Button>
          {showFilter && (
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                placeholder="Filtrer..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-64"
              />
              {filter && (
                <Button size="icon" variant="ghost" onClick={clearFilter}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Recherche */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSearch(!showSearch)}
            className={showSearch ? "text-primary" : ""}
          >
            <Search className="w-4 h-4" />
          </Button>
          {showSearch && (
            <div className="flex items-center gap-2">
              <Input
                ref={inputSearchRef}
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64"
              />
              {search && (
                <>
                  <Button size="icon" variant="ghost" onClick={clearSearch}>
                    <X className="w-4 h-4" />
                  </Button>
                  {totalMatches > 0 && (
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={goToPrevMatch}>
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {currentMatchIndex + 1} / {totalMatches}
                      </span>
                      <Button variant="ghost" size="icon" onClick={goToNextMatch}>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Arbre */}
      <div className="flex-1 overflow-auto rounded border p-4 bg-white">
        {filteredRoot ? (
          <TreeNodeSelect
            node={filteredRoot}
            selectedIds={selectedIds}
            onSelect={toggleSelection}               // <— multi-toggle comme AssocierToponymeButton
            onAddVariante={handleAddVariante}
            onAddLieu={handleAddLieu}
            defaultLabel={defaultLabelForCreate}
            filter={filter}
            search={search}
            registerMatchRef={registerMatchRef}
            autoOpenSet={autoOpenSet}
          />
        ) : (
          <div className="text-sm text-muted-foreground">Aucun résultat</div>
        )}
      </div>

      {/* Footer sticky avec boutons d’action */}
      <div
        className="
          sticky bottom-0 left-0 right-0 border-t
          bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60
          px-4 py-3
          pb-[calc(0.75rem+env(safe-area-inset-bottom))]
        "
      >
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={handleCancel}>
            Retour
          </Button>
          <Button onClick={handleValidate} disabled={selectedNodes.length === 0}>
            Valider
          </Button>
        </div>
      </div>
    </div>
  );
}

function splitLocalClipboardPath(input: string): string[] {
  return input
    .split(">")
    .map((s) => s.trim())
    .filter(Boolean);
}

// Retourne toutes les correspondances d’une séquence de labels dans l’arbre
function findAllPathsByLabels(
  root: ToponymeNode,
  labels: string[]
): ToponymeNode[][] {
  const results: ToponymeNode[][] = [];
  if (!root || labels.length === 0) return results;

  const dfs = (
    node: ToponymeNode,
    idx: number,              // position dans `labels` (séquence en cours)
    current: ToponymeNode[]   // chemin accumulé si on a commencé à matcher
  ) => {
    const matchesHere = node.label === labels[idx];

    if (matchesHere) {
      const nextPath = [...current, node];
      const nextIdx = idx + 1;

      if (nextIdx === labels.length) {
        // séquence complète trouvée
        results.push(nextPath);
      } else if (node.children?.length) {
        for (const child of node.children) {
          dfs(child, nextIdx, nextPath);
        }
      }

      // Important : même si ce node match, on autorise aussi des "restarts" plus bas
      // pour d’éventuelles autres occurrences qui commenceraient chez ses enfants.
      if (node.children?.length) {
        for (const child of node.children) {
          dfs(child, 0, []);
        }
      }
    } else {
      // pas de match sur ce node pour la position courante :
      // - si on avait commencé une séquence (idx>0), on casse la séquence
      // - on continue la recherche fresh-start (idx=0) dans les enfants
      if (node.children?.length) {
        for (const child of node.children) {
          dfs(child, 0, []);
        }
      }
    }
  };

  dfs(root, 0, []);
  return results;
}

/**
 * Ouvre l’arbo pour TOUTES les occurrences de la séquence `labels`.
 * Ajoute tous les `toponyme_id` des chemins trouvés dans `autoOpenSet`.
 * Retourne le nombre de nœuds marqués "ouverts".
 */
function expandTreeToLabelsAllMatches(
  root: ToponymeNode,
  labels: string[],
  autoOpenSet: Set<string>
): number {
  const paths = findAllPathsByLabels(root, labels);
  let opened = 0;

  for (const path of paths) {
    for (const node of path) {
      if (!autoOpenSet.has(node.toponyme_id)) {
        autoOpenSet.add(node.toponyme_id);
        opened++;
      }
    }
    // Optionnel : n’ouvrir que les parents ? -> ignorer la dernière entrée de `path`
    // for (let i = 0; i < path.length - 1; i++) { ... }
  }

  return opened;
}
