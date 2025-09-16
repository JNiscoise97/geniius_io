//AssocierToponymeButton.tsx

import {
  fetchToponymes as fetchToponymesSvc,
  getMentionsPreview,
  associerMentions,
} from '@/features/toponymes-associer/services/toponymes.rpc';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Filter, X, ArrowRight, ArrowLeft, Search } from 'lucide-react';
import { DataTable, type ColumnDef } from '@/components/shared/DataTable';
import { Input } from '@/components/ui/input';
import { highlightSearchResult } from '@/features/toponymes-associer/utils/highlight';
import { TreeNodeSelect } from '@/features/toponymes-associer/TreeNodeSelect';

import {
  type ToponymeNode,
  buildTreeFromToponymes,
  enrichPaths,
  isPathValid,
  addVarianteIntoTree,
  addChildLieuIntoTree,
} from '@/features/toponymes-associer/utils/tree';

import { useToponymeFilter } from '@/features/toponymes-associer/hooks/useToponymeFilter';
import { useToponymeSearch } from '@/features/toponymes-associer/hooks/useToponymeSearch';

type Props = {
  texteBrut: string;
  onSuccess?: () => void;
};

export function AssocierToponymeButton({ texteBrut, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [previews, setPreviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [rootNode, setRootNode] = useState<ToponymeNode | null>(null);
  const [selectedPath, setSelectedPath] = useState<ToponymeNode[] | null>(null);

  const selectedIds = useMemo(
    () => new Set(selectedPath?.map((n) => n.toponyme_id) ?? []),
    [selectedPath]
  );

  // --- Filtre (hook)
  const {
    filter,
    setFilter,
    showFilter,
    setShowFilter,
    inputRef,
    filteredRoot,
    clearFilter,
  } = useToponymeFilter(rootNode);

  // --- Recherche (hook)
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
  const loadToponymesTree = async () => {
    const { data, error } = await fetchToponymesSvc();

    if (error) {
      toast.error('Erreur chargement des toponymes');
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
      lieu_id: 'root',
      label: '/',
      toponyme_id: 'fake',
      is_principal: true,
      children: tree,
      path: [],
    };
    enrichPaths(wrapper);
    setRootNode(wrapper);
  };

  // --- Prévisualisation & confirmation
  const fetchPreviewInsertions = async () => {
    if (!selectedPath || selectedPath.length === 0) {
      toast.error('Aucun chemin sélectionné');
      return;
    }
    if (!isPathValid(selectedPath)) {
      toast.error("Le chemin sélectionné n'est pas valide");
      return;
    }

    setLoading(true);
    const { data, error } = await getMentionsPreview(texteBrut);
    setLoading(false);

    if (error) {
      toast.error('Erreur prévisualisation');
    } else {
      setPreviews(data ?? []);
      setStep(2);
    }
  };

  const handleConfirm = async () => {
    if (!selectedPath) return;
    const lastToponyme = selectedPath[selectedPath.length - 1];

    setLoading(true);
    const { error } = await associerMentions(
      texteBrut,
      lastToponyme.toponyme_id,
      selectedPath.map((t) => t.toponyme_id),
    );
    setLoading(false);

    setOpen(false);
    setStep(1);

    if (error) {
      toast.error("Erreur lors de l'insertion");
    } else {
      toast.success('Mentions insérées avec succès');
      onSuccess?.();
    }
  };

  // --- Sélection dans l’arbre
  const toggleSelection = (clickedPath: ToponymeNode[]) => {
    const clickedId = clickedPath[clickedPath.length - 1].toponyme_id;
    if (selectedIds.has(clickedId)) {
      const newPath = selectedPath?.filter((n) => n.toponyme_id !== clickedId) ?? [];
      setSelectedPath(newPath);
    } else {
      const newPath = [...(selectedPath ?? []), clickedPath[clickedPath.length - 1]];
      setSelectedPath(newPath);
    }
  };

  // --- Colonnes preview
  const columns: ColumnDef<any>[] = [
    { key: 'acteur_nom_complet', label: 'Acteur' },
    { key: 'fonction', label: 'Fonction' },
    { key: 'mention_acte_date', label: 'Date' },
    { key: 'mention_acte_label', label: 'Acte' },
    { key: 'mention_source_table', label: 'Source' },
  ];

  return (
    <>
      <Button
        onClick={() => {
          setOpen(true);
          loadToponymesTree();
        }}
        variant='outline'
        size='sm'
      >
        Associer
      </Button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          setStep(1);
        }}
      >
        <DialogContent className='!max-w-none sm:!max-w-none w-[70vw] h-[90vh] overflow-hidden p-6 flex flex-col gap-4'>
          <DialogHeader>
            <DialogTitle className='text-xl font-semibold'>
              {step === 1
                ? `Associer à un toponyme (${texteBrut})`
                : `Prévisualisation des insertions (${texteBrut})`}
            </DialogTitle>
          </DialogHeader>

          {selectedPath && selectedPath.length > 0 && (
            <div className='flex items-center justify-between mt-1 mb-1 text-sm text-muted-foreground'>
              <div>
                Chemin sélectionné :{' '}
                <span className='font-medium text-gray-900'>
                  {selectedPath.map((n) => n.label).join(' > ')}
                </span>
              </div>
              <Button variant='link' size='sm' onClick={() => setSelectedPath([])}>
                Réinitialiser
              </Button>
            </div>
          )}

          {step === 1 && rootNode && (
            <>
              {/* Toolbar filtre / recherche */}
              <div className='flex items-center justify-between w-full'>
                {/* Filtre */}
                <div className='flex items-center gap-4'>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => setShowFilter((prev) => !prev)}
                    className={showFilter ? 'text-primary' : ''}
                  >
                    <Filter className='w-4 h-4' />
                  </Button>
                  {showFilter && (
                    <div className='flex items-center gap-2 transition-all animate-in fade-in slide-in-from-right-2'>
                      <Input
                        ref={inputRef}
                        placeholder='Filtrer...'
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className='w-64'
                      />
                      {filter && (
                        <Button size='icon' variant='ghost' onClick={clearFilter}>
                          <X className='w-4 h-4' />
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Recherche */}
                <div className='flex items-center gap-4'>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => setShowSearch((prev) => !prev)}
                    className={showSearch ? 'text-primary' : ''}
                  >
                    <Search className='w-4 h-4' />
                  </Button>
                  {showSearch && (
                    <div className='flex items-center gap-2 transition-all animate-in fade-in slide-in-from-right-2'>
                      <Input
                        ref={inputSearchRef}
                        placeholder='Rechercher...'
                        value={search}
                        onChange={(e) => setSearch?.(e.target.value)}
                        className='w-64'
                      />
                      {search && (
                        <Button size='icon' variant='ghost' onClick={clearSearch}>
                          <X className='w-4 h-4' />
                        </Button>
                      )}
                      {search && totalMatches > 0 && (
                        <div className='flex items-center gap-2'>
                          <Button variant='ghost' size='icon' onClick={goToPrevMatch}>
                            <ArrowLeft className='w-4 h-4' />
                          </Button>
                          <span className='text-xs text-muted-foreground'>
                            {currentMatchIndex + 1} / {totalMatches}
                          </span>
                          <Button variant='ghost' size='icon' onClick={goToNextMatch}>
                            <ArrowRight className='w-4 h-4' />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Arbre */}
              <div className='flex-1 overflow-auto rounded border p-4 bg-white'>
                {filteredRoot ? (
                  <TreeNodeSelect
                    node={filteredRoot}
                    selectedIds={selectedIds}
                    onSelect={toggleSelection}
                    onAddVariante={handleAddVariante}
                    onAddLieu={handleAddLieu}
                    defaultLabel={texteBrut}
                    filter={filter}
                    search={search}
                    registerMatchRef={registerMatchRef}
                    autoOpenSet={autoOpenSet}
                  />
                ) : (
                  <div className='text-sm text-muted-foreground'>Aucun résultat</div>
                )}
              </div>

              {/* Actions */}
              <div className='mt-auto flex justify-end gap-2'>
                <Button variant='secondary' onClick={() => setOpen(false)}>
                  Annuler
                </Button>
                <Button disabled={!selectedPath} onClick={fetchPreviewInsertions}>
                  Suivant
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className='flex-1 overflow-auto rounded border bg-white p-4'>
                <DataTable
                  data={previews}
                  columns={columns}
                  title=''
                  pageSize={-1}
                  defaultSort={['mention_acte_date']}
                />
              </div>

              <div className='mt-auto flex justify-end gap-2'>
                <Button onClick={() => setStep(1)} variant='secondary'>
                  Retour
                </Button>
                <Button onClick={handleConfirm} disabled={loading}>
                  Confirmer l'insertion
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
