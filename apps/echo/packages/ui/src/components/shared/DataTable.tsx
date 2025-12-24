// DataTable.tsx

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from './table';
import { Input } from './input';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { GripVertical, MoreHorizontal, Search, X, Eye, EyeOff, Filter } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { formatNombre } from '@echo/ui/lib/number';

export interface ColumnDef<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
  columnWidth?: string;
}

type Operateur =
  | 'contient'
  | 'ne contient pas'
  | 'commence par'
  | 'termine par'
  | 'est'
  | 'n’est pas'
  | 'est vide'
  | 'n’est pas vide';

export type Filtre = {
  colonne: string;
  operateur: Operateur;
  valeur: string;
};

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  defaultVisibleColumns?: string[];
  title?: string;
  defaultSort?: string[];
  pageSize?: number;
  rowClassName?: (row: T) => string;
  onPageViewed?: (pageIndex: number) => void;
  search?: string;
  onSearchChange?: (val: string) => void;
  initialFiltres?: Filtre[];
  initialFiltreActif?: boolean;
  showMenu?: boolean;
}

export interface DataTableRef {
  setFiltres: (filtres: Filtre[]) => void;
  setFiltreActif: (val: boolean) => void;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  defaultVisibleColumns,
  title = '',
  defaultSort,
  pageSize = 10,
  rowClassName,
  onPageViewed,
  search,
  onSearchChange,
  initialFiltres,
  initialFiltreActif,
  showMenu = true,
}: DataTableProps<T>) {
  const [visibleColumns, setVisibleColumns] = useState<(keyof T)[]>(
    defaultVisibleColumns || columns.map((c) => c.key),
  );

  const [searchState, setSearchState] = useState('');
  const controlledSearch = typeof search === 'string' ? search : searchState;
  const [showSearch, setShowSearch] = useState(false);
  const [draggedColumnKey, setDraggedColumnKey] = useState<keyof T | null>(null);
  const [draggedOverKey, setDraggedOverKey] = useState<keyof T | null>(null);
  const [filtreActif, setFiltreActif] = useState(initialFiltreActif ?? false);
  const [filtres, setFiltres] = useState<Filtre[]>(initialFiltres ?? []);

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (showSearch) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50); // petit délai pour laisser le champ apparaître

      return () => clearTimeout(timer);
    }
  }, [showSearch]);

  const [pageIndex, setPageIndex] = useState(0);

  const [initialMount, setInitialMount] = useState(true);

  useEffect(() => {
    if (initialFiltres && initialFiltres.length > 0) {
      setFiltres(initialFiltres);
    }
  }, [JSON.stringify(initialFiltres)]); // compare le contenu, pas juste la référence

  useEffect(() => {
    if (initialFiltreActif) {
      setFiltreActif(true);
    }
  }, [initialFiltreActif]);

  // Reset page index sur changement de filtres/recherche
  useEffect(() => {
    setPageIndex(0);
    setInitialMount(true); // On vient de filtrer/rechercher
  }, [controlledSearch, filtres]);

  // Appel du callback de page vue
  useEffect(() => {
    if (initialMount) {
      setInitialMount(false);
      // ✅ Notifie immédiatement la page 0 comme vue si présente
      if (pageIndex === 0) {
        onPageViewed?.(0);
      }
      return;
    }

    onPageViewed?.(pageIndex);
  }, [pageIndex, onPageViewed, initialMount]);
  const filtered = data
    .filter((r) =>
      Object.values(r)
        .filter((val) => val !== null && val !== undefined)
        .join(' ')
        .toLowerCase()
        .includes(controlledSearch.toLowerCase()),
    )
    .filter((r) =>
      filtres.every((filtre) => {
        const val = (r[filtre.colonne] || '').toString().toLowerCase();
        const cmp = filtre.valeur.toLowerCase();
        switch (filtre.operateur) {
          case 'contient':
            return val.includes(cmp);
          case 'ne contient pas':
            return !val.includes(cmp);
          case 'commence par':
            return val.startsWith(cmp);
          case 'termine par':
            return val.endsWith(cmp);
          case 'est':
            return val === cmp;
          case 'n’est pas':
            return val !== cmp;
          case 'est vide':
            return val === '' || val === 'null' || val === 'undefined';
          case 'n’est pas vide':
            return val !== '' && val !== 'null' && val !== 'undefined';
          default:
            return true;
        }
      }),
    );

  const sorted = [...filtered];

  if (defaultSort?.length) {
    sorted.sort((a, b) => {
      for (const key of defaultSort) {
        const valA = String(a[key as keyof T] ?? '').toLowerCase();
        const valB = String(b[key as keyof T] ?? '').toLowerCase();
        if (valA < valB) return -1;
        if (valA > valB) return 1;
      }
      return 0;
    });
  }

  const paginated =
    pageSize === -1 ? sorted : sorted.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  const totalCount = data.length;
  const filteredCount = filtered.length;

  const tableContent = (
    <Table>
      <TableHeader>
        <TableRow>
          {visibleColumns.map((key) => {
            const col = columns.find((c) => c.key === key);
            return <TableHead key={String(key)}>{col?.label}</TableHead>;
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {paginated.map((row, i) => (
          <TableRow key={i} className={rowClassName?.(row)}>
            {visibleColumns.map((key) => {
              const column = columns.find((c) => c.key === key);
              const content = column?.render
                ? column.render(row)
                : highlightMatch(String(row[key as keyof T] ?? ''), controlledSearch);

              return <TableCell
                key={String(key)}
                style={{ width: column?.columnWidth }}
                className='break-words whitespace-normal'
              >{content}</TableCell>;
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const tableContentWithSize = (
    <div className="overflow-x-auto">
      <Table className='table-fixed w-full'>
        <colgroup>
          {visibleColumns.map((key) => {
            const col = columns.find((c) => c.key === key);
            return <col key={String(key)} style={{
              width: col?.columnWidth,
              minWidth: col?.columnWidth,
            }} />;
          })}
        </colgroup>
        <TableHeader>
          <TableRow>
            {visibleColumns.map((key) => {
              const col = columns.find((c) => c.key === key);
              return (
                <TableHead key={String(key)}>
                  {col?.label}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginated.map((row, i) => (
            <TableRow key={i} className={rowClassName?.(row)}>
              {visibleColumns.map((key) => {
                const column = columns.find((c) => c.key === key);
                const content = column?.render
                  ? column.render(row)
                  : highlightMatch(String(row[key as keyof T] ?? ''), controlledSearch);

                return (
                  <TableCell key={String(key)} style={{ width: column?.columnWidth }} className='break-words whitespace-normal'>
                    {content}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const hasColumnWidths = columns.some((c) => !!c.columnWidth);

  const renderedTable =
    pageSize === -1 ? (
      hasColumnWidths ? tableContentWithSize : tableContent
    ) : (
      <div className='max-h-[70vh] overflow-y-auto'>
        {hasColumnWidths ? tableContentWithSize : tableContent}
      </div>
    );


  return (
    <div className='space-y-4'>
      {showMenu && (<div className='flex items-center justify-between'>
        <h2 className='text-xl font-semibold'>{title}</h2>

        <div className='flex items-center justify-end gap-4'>
          <div className='text-sm text-muted-foreground'>
            {filteredCount !== totalCount ? (
              <>
                {formatNombre(filteredCount)} résultat{filteredCount > 1 ? 's' : ''} / {formatNombre(totalCount)} au total
              </>
            ) : (
              <>
                {formatNombre(totalCount)} résultat{totalCount > 1 ? 's' : ''}
              </>
            )}
          </div>
          <Button
            variant='ghost'
            className={filtres.length > 0 ? 'text-blue-600' : ''}
            size='icon'
            onClick={() => setFiltreActif((prev) => !prev)}
          >
            <Filter className='w-4 h-4' />
          </Button>
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
                ref={inputRef}
                placeholder='Rechercher...'
                value={controlledSearch}
                onChange={(e) => {
                  onSearchChange?.(e.target.value);
                  setSearchState(e.target.value);
                }}
                className='w-64'
              />
              {controlledSearch && (
                <Button
                  size='icon'
                  variant='ghost'
                  onClick={() => {
                    onSearchChange?.('');
                    setSearchState('');
                  }}
                >
                  <X className='w-4 h-4' />
                </Button>
              )}
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon'>
                <MoreHorizontal className='w-4 h-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-56'>
              <DropdownMenuCheckboxItem>Colonnes</DropdownMenuCheckboxItem>
              <DropdownMenuItem onSelect={(e:any) => e.preventDefault()}>
                <div className='w-64'>
                  <h4 className='text-xs font-semibold mb-1 flex justify-between'>
                    Affichées
                    <Button
                      variant='ghost'
                      className='text-xs'
                      onClick={() => setVisibleColumns([])}
                    >
                      Tout masquer
                    </Button>
                  </h4>
                  {visibleColumns.map((key) => {
                    const col = columns.find((c) => c.key === key);
                    return (
                      <div key={String(key)}>
                        {draggedOverKey === key && (
                          <div className='h-1 w-full bg-primary/30 rounded-md mb-1' />
                        )}
                        <div
                          className={`flex items-center justify-between py-1 px-2 rounded ${draggedOverKey === key ? 'shadow-md border border-primary' : ''
                            }`}
                          draggable
                          onDragStart={() => setDraggedColumnKey(key)}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDraggedOverKey(key);
                          }}
                          onDragLeave={() => setDraggedOverKey(null)}
                          onDrop={() => {
                            if (!draggedColumnKey || draggedColumnKey === key) return;
                            const oldIndex = visibleColumns.indexOf(draggedColumnKey);
                            const newIndex = visibleColumns.indexOf(key);
                            const newOrder = [...visibleColumns];
                            newOrder.splice(oldIndex, 1);
                            newOrder.splice(newIndex, 0, draggedColumnKey);
                            setVisibleColumns(newOrder);
                            setDraggedOverKey(null);
                          }}
                        >
                          <GripVertical className='w-3 h-3 text-muted-foreground mr-2' />
                          <span className='flex-1 text-sm'>{col?.label}</span>
                          <button
                            onClick={() =>
                              setVisibleColumns((cols) => cols.filter((c) => c !== key))
                            }
                          >
                            <Eye className='w-4 h-4 text-foreground' />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <h4 className='text-xs font-semibold mt-4 mb-1 flex justify-between'>
                    Masquées
                    <Button
                      variant='ghost'
                      className='text-xs'
                      onClick={() => setVisibleColumns(columns.map((c) => c.key))}
                    >
                      Tout afficher
                    </Button>
                  </h4>
                  {columns
                    .filter((c) => !visibleColumns.includes(c.key))
                    .map((col) => (
                      <div
                        key={String(col.key)}
                        className='flex items-center justify-between py-1 px-2 rounded'
                      >
                        <GripVertical className='w-3 h-3 text-muted-foreground mr-2' />
                        <span className='flex-1 text-sm'>{col.label}</span>
                        <button onClick={() => setVisibleColumns((cols) => [...cols, col.key])}>
                          <EyeOff className='w-4 h-4 text-muted-foreground' />
                        </button>
                      </div>
                    ))}
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>)}

      {filtreActif && (
        <div className='space-y-2 border bg-muted p-3 rounded-md'>
          {filtres.map((filtre, index) => (
            <div key={index} className='flex items-center gap-2'>
              <select
                value={filtre.colonne}
                onChange={(e) => {
                  const newFiltres = [...filtres];
                  newFiltres[index].colonne = e.target.value;
                  setFiltres(newFiltres);
                }}
                className='text-sm rounded-md border px-2 py-1'
              >
                {columns.map((col) => (
                  <option key={String(col.key)} value={String(col.key)}>
                    {col.label}
                  </option>
                ))}
              </select>
              <select
                value={filtre.operateur}
                onChange={(e) => {
                  const newFiltres = [...filtres];
                  newFiltres[index].operateur = e.target.value as Operateur;
                  setFiltres(newFiltres);
                }}
                className='text-sm rounded-md border px-2 py-1'
              >
                <option value='contient'>contient</option>
                <option value='commence par'>commence par</option>
                <option value='est'>est</option>
                <option value='est vide'>est vide</option>
                <option value='ne contient pas'>ne contient pas</option>
                <option value='termine par'>termine par</option>
                <option value='n’est pas'>n’est pas</option>
                <option value='n’est pas vide'>n’est pas vide</option>
              </select>
              {!['est vide', 'n’est pas vide'].includes(filtre.operateur) && (
                <Input
                  placeholder='Valeur...'
                  value={filtre.valeur}
                  onChange={(e) => {
                    const newFiltres = [...filtres];
                    newFiltres[index].valeur = e.target.value;
                    setFiltres(newFiltres);
                  }}
                />
              )}
              <Button
                variant='ghost'
                size='icon'
                onClick={() => setFiltres(filtres.filter((_, i) => i !== index))}
              >
                ✕
              </Button>
            </div>
          ))}
          <Button
            variant='outline'
            size='sm'
            onClick={() =>
              setFiltres([
                ...filtres,
                { colonne: columns[0].key as string, operateur: 'contient', valeur: '' },
              ])
            }
          >
            Ajouter un filtre
          </Button>
        </div>
      )}

      {renderedTable}
      {pageSize !== -1 && (
        <div className='flex justify-between items-center pt-4'>
          <div className='space-x-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setPageIndex((p) => Math.max(p - 1, 0))}
              disabled={pageIndex === 0}
            >
              Précédent
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() =>
                setPageIndex((p) => (p + 1 < Math.ceil(filtered.length / pageSize) ? p + 1 : p))
              }
              disabled={pageIndex + 1 >= Math.ceil(filtered.length / pageSize)}
            >
              Suivant
            </Button>
          </div>
          <span className='text-sm text-muted-foreground'>
            Page {formatNombre(pageIndex + 1)} / {formatNombre(Math.max(1, Math.ceil(filtered.length / pageSize)))}
          </span>
        </div>
      )}
    </div>
  );
}

export function highlightMatch(text: string, search: string) {
  if (!search) return text;
  const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    part.toLowerCase() === search.toLowerCase() ? (
      <span key={i} className='bg-yellow-200 font-medium rounded-sm px-1'>
        {part}
      </span>
    ) : (
      part
    ),
  );
}
