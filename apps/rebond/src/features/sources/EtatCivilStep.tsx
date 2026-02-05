//EtatCivilStep.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronsDown, ChevronsUp, ChevronRight } from 'lucide-react';
import { RefSinglePickerSmart } from '@/components/shared/RefSinglePickerSmart';

type BureauOption = {
  id: string;
  nom: string;
  commune: string | null;
  departement: string | null;
  region: string | null;
  label: string;
};

type TypeActeOption = { id: string; label: string };

type BureauTree = Record<string, Record<string, Record<string, BureauOption[]>>>;

const UNKNOWN_REGION = '— Région inconnue —';
const UNKNOWN_DEP = '— Département inconnu —';
const UNKNOWN_COM = '— Commune inconnue —';

function cmpText(a?: string | null, b?: string | null) {
  const A = (a ?? '').trim();
  const B = (b ?? '').trim();
  if (!A && !B) return 0;
  if (!A) return 1;
  if (!B) return -1;
  return A.localeCompare(B, 'fr', { sensitivity: 'base' });
}

function cmpKey(a: string, b: string) {
  const aU = a === UNKNOWN_REGION || a === UNKNOWN_DEP || a === UNKNOWN_COM ? 1 : 0;
  const bU = b === UNKNOWN_REGION || b === UNKNOWN_DEP || b === UNKNOWN_COM ? 1 : 0;
  if (aU !== bU) return aU - bU;
  return a.localeCompare(b, 'fr', { sensitivity: 'base' });
}

function groupBureauxTree(bureaux: BureauOption[]): BureauTree {
  const sorted = [...bureaux].sort((a, b) => {
    const r = cmpText(a.region, b.region);
    if (r) return r;
    const d = cmpText(a.departement, b.departement);
    if (d) return d;
    const c = cmpText(a.commune, b.commune);
    if (c) return c;
    return cmpText(a.nom, b.nom);
  });

  const tree: BureauTree = {};
  for (const b of sorted) {
    const r = b.region ?? UNKNOWN_REGION;
    const d = b.departement ?? UNKNOWN_DEP;
    const c = b.commune ?? UNKNOWN_COM;

    tree[r] ??= {};
    tree[r][d] ??= {};
    tree[r][d][c] ??= [];
    tree[r][d][c].push(b);
  }

  for (const r of Object.keys(tree)) {
    for (const d of Object.keys(tree[r])) {
      for (const c of Object.keys(tree[r][d])) {
        tree[r][d][c].sort((a, b) => cmpText(a.nom, b.nom));
      }
    }
  }
  return tree;
}

function idsFromTreeNode(node: any): string[] {
  if (Array.isArray(node)) return node.map((x) => x.id);
  const out: string[] = [];
  for (const k of Object.keys(node)) out.push(...idsFromTreeNode(node[k]));
  return out;
}

function isAllChecked(allIds: string[], selected: string[]) {
  return allIds.length > 0 && allIds.every((id) => selected.includes(id));
}
function isSomeChecked(allIds: string[], selected: string[]) {
  return allIds.some((id) => selected.includes(id)) && !isAllChecked(allIds, selected);
}

function TreeChevron({ open }: { open: boolean }) {
  return (
    <ChevronRight
      className={[
        'h-4 w-4 shrink-0 transition-transform text-muted-foreground',
        open ? 'rotate-90' : '',
      ].join(' ')}
    />
  );
}

type TreeOpenState = Record<string, boolean>;

const keyRegion = (r: string) => `r::${r}`;
const keyDepartement = (r: string, d: string) => `d::${r}::${d}`;
const keyCommune = (r: string, d: string, c: string) => `c::${r}::${d}::${c}`;

type Props = {
  isEtatCivil: boolean;
  serieLabel: string;

  bureaux: BureauOption[];
  bureauIds: string[];
  setBureauIds: React.Dispatch<React.SetStateAction<string[]>>;

  typeActeIds: string[];
  setTypeActeIds: React.Dispatch<React.SetStateAction<string[]>>;
};

export function EtatCivilStep({
  isEtatCivil,
  serieLabel,

  bureaux,
  bureauIds,
  setBureauIds,

  typeActeIds,
  setTypeActeIds,
}: Props) {
  const toggleInList = (list: string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  const bureauxTree = useMemo(() => groupBureauxTree(bureaux), [bureaux]);

  // UI open state
  const [openRegions, setOpenRegions] = useState<TreeOpenState>({});
  const [openDeps, setOpenDeps] = useState<TreeOpenState>({});
  const [openComs, setOpenComs] = useState<TreeOpenState>({});

  // optionnel : reset open state si on quitte/revient sur l’étape, à toi de voir
  useEffect(() => {
    if (!isEtatCivil) {
      setOpenRegions({});
      setOpenDeps({});
      setOpenComs({});
    }
  }, [isEtatCivil]);

  const setAllTreeOpen = (open: boolean) => {
    const nextRegions: TreeOpenState = {};
    const nextDeps: TreeOpenState = {};
    const nextComs: TreeOpenState = {};

    for (const [r, depMap] of Object.entries(bureauxTree)) {
      nextRegions[keyRegion(r)] = open;
      for (const [d, comMap] of Object.entries(depMap)) {
        nextDeps[keyDepartement(r, d)] = open;
        for (const c of Object.keys(comMap)) {
          nextComs[keyCommune(r, d, c)] = open;
        }
      }
    }

    setOpenRegions(nextRegions);
    setOpenDeps(nextDeps);
    setOpenComs(nextComs);
  };

  // checkbox indeterminate
  const IndeterminateCheckbox = ({
    checked,
    indeterminate,
    onChange,
  }: {
    checked: boolean;
    indeterminate: boolean;
    onChange: (next: boolean) => void;
  }) => {
    const ref = React.useRef<HTMLInputElement | null>(null);

    useEffect(() => {
      if (ref.current) ref.current.indeterminate = indeterminate;
    }, [indeterminate]);

    return (
      <input
        ref={ref}
        type='checkbox'
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    );
  };

  if (!isEtatCivil) {
    return (
      <div className='text-sm text-muted-foreground space-y-2'>
        <div>
          Cette étape (série <b>{serieLabel || '—'}</b>) est <b>à construire</b>.
        </div>
        <div>Pour l’instant, tu peux la passer.</div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div>
        <div className='flex items-center justify-between gap-2 mb-2'>
          <div className='text-sm font-semibold'>Bureaux</div>

          <div className='flex gap-2'>
            <Button
              type='button'
              size='sm'
              variant='secondary'
              onClick={() => setAllTreeOpen(true)}
              className='gap-2'
            >
              <ChevronsDown className='h-4 w-4' />
              Tout déplier
            </Button>

            <Button
              type='button'
              size='sm'
              variant='outline'
              onClick={() => setAllTreeOpen(false)}
              className='gap-2'
            >
              <ChevronsUp className='h-4 w-4' />
              Tout replier
            </Button>
          </div>
        </div>

        <div className='space-y-2'>
          {Object.entries(bureauxTree)
            .sort(([a], [b]) => cmpKey(a, b))
            .map(([region, depMap]) => {
              const regionKey = keyRegion(region);

              const regionIds = idsFromTreeNode(depMap);
              const regionAll = isAllChecked(regionIds, bureauIds);
              const regionSome = isSomeChecked(regionIds, bureauIds);

              return (
                <details
                  key={region}
                  className='rounded border p-2'
                  open={!!openRegions[regionKey]}
                  onToggle={(e) => {
                    const el = e.currentTarget as HTMLDetailsElement;
                    setOpenRegions((prev) => ({ ...prev, [regionKey]: el.open }));
                  }}
                >
                  <summary className='cursor-pointer flex items-center justify-between gap-3'>
                    <div className='flex items-center gap-2'>
                      <TreeChevron open={!!openRegions[regionKey]} />
                      <label className='flex items-center gap-2 text-sm'>
                        <IndeterminateCheckbox
                          checked={regionAll}
                          indeterminate={regionSome}
                          onChange={(next) => {
                            setBureauIds((prev) => {
                              const set = new Set(prev);
                              if (next) regionIds.forEach((id) => set.add(id));
                              else regionIds.forEach((id) => set.delete(id));
                              return Array.from(set);
                            });
                          }}
                        />
                        <Badge variant='outline' className='bg-muted border-border text-[11px]'>
                          région
                        </Badge>
                        <span className='font-medium'>{region}</span>
                      </label>
                    </div>

                    <span className='text-xs text-muted-foreground'>
                      {regionIds.filter((id) => bureauIds.includes(id)).length}/{regionIds.length}
                    </span>
                  </summary>

                  <div className='mt-2 space-y-2 pl-3'>
                    {Object.entries(depMap)
                      .sort(([a], [b]) => cmpKey(a, b))
                      .map(([departement, comMap]) => {
                        const depKey = keyDepartement(region, departement);

                        const depIds = idsFromTreeNode(comMap);
                        const depAll = isAllChecked(depIds, bureauIds);
                        const depSome = isSomeChecked(depIds, bureauIds);

                        return (
                          <details
                            key={departement}
                            className='rounded border bg-muted/20 p-2'
                            open={!!openDeps[depKey]}
                            onToggle={(e) => {
                              const el = e.currentTarget as HTMLDetailsElement;
                              setOpenDeps((prev) => ({ ...prev, [depKey]: el.open }));
                            }}
                          >
                            <summary className='cursor-pointer flex items-center justify-between gap-3'>
                              <div className='flex items-center gap-2'>
                                <TreeChevron open={!!openDeps[depKey]} />
                                <label className='flex items-center gap-2 text-sm'>
                                  <IndeterminateCheckbox
                                    checked={depAll}
                                    indeterminate={depSome}
                                    onChange={(next) => {
                                      setBureauIds((prev) => {
                                        const set = new Set(prev);
                                        if (next) depIds.forEach((id) => set.add(id));
                                        else depIds.forEach((id) => set.delete(id));
                                        return Array.from(set);
                                      });
                                    }}
                                  />
                                  <Badge
                                    variant='outline'
                                    className='bg-muted border-border text-[11px]'
                                  >
                                    département
                                  </Badge>
                                  <span className='font-medium'>{departement}</span>
                                </label>
                              </div>

                              <span className='text-xs text-muted-foreground'>
                                {depIds.filter((id) => bureauIds.includes(id)).length}/
                                {depIds.length}
                              </span>
                            </summary>

                            <div className='mt-2 space-y-2 pl-3'>
                              {Object.entries(comMap)
                                .sort(([a], [b]) => cmpKey(a, b))
                                .map(([commune, annexes]) => {
                                  const comKey = keyCommune(region, departement, commune);

                                  const communeIds = annexes.map((x) => x.id);
                                  const comAll = isAllChecked(communeIds, bureauIds);
                                  const comSome = isSomeChecked(communeIds, bureauIds);

                                  return (
                                    <details
                                      key={commune}
                                      className='rounded border bg-background p-2'
                                      open={!!openComs[comKey]}
                                      onToggle={(e) => {
                                        const el = e.currentTarget as HTMLDetailsElement;
                                        setOpenComs((prev) => ({ ...prev, [comKey]: el.open }));
                                      }}
                                    >
                                      <summary className='cursor-pointer flex items-center justify-between gap-3'>
                                        <div className='flex items-center gap-2'>
                                          <TreeChevron open={!!openComs[comKey]} />
                                          <label className='flex items-center gap-2 text-sm'>
                                            <IndeterminateCheckbox
                                              checked={comAll}
                                              indeterminate={comSome}
                                              onChange={(next) => {
                                                setBureauIds((prev) => {
                                                  const set = new Set(prev);
                                                  if (next) communeIds.forEach((id) => set.add(id));
                                                  else communeIds.forEach((id) => set.delete(id));
                                                  return Array.from(set);
                                                });
                                              }}
                                            />
                                            <Badge
                                              variant='outline'
                                              className='bg-muted border-border text-[11px]'
                                            >
                                              commune
                                            </Badge>
                                            <span className='font-medium'>{commune}</span>
                                          </label>
                                        </div>

                                        <span className='text-xs text-muted-foreground'>
                                          {communeIds.filter((id) => bureauIds.includes(id)).length}
                                          /{communeIds.length}
                                        </span>
                                      </summary>

                                      <div className='mt-2 grid gap-2 md:grid-cols-2 pl-3'>
                                        {annexes.map((b) => (
                                          <label
                                            key={b.id}
                                            className='flex items-center gap-2 text-sm'
                                          >
                                            <input
                                              type='checkbox'
                                              checked={bureauIds.includes(b.id)}
                                              onChange={() =>
                                                setBureauIds((prev) => toggleInList(prev, b.id))
                                              }
                                            />
                                            <span>{b.nom}</span>
                                          </label>
                                        ))}
                                      </div>
                                    </details>
                                  );
                                })}
                            </div>
                          </details>
                        );
                      })}
                  </div>
                </details>
              );
            })}
        </div>
      </div>

      <div className='h-px bg-border' />

      <div>
        <div className='text-sm font-semibold mb-2'>Types d’actes</div>
        <RefSinglePickerSmart
          table='ref_ec_type_acte'
          mode='edit'
          actionsInvisible={false}
          multi={true}
          value={typeActeIds as any}
          onChange={(next) => setTypeActeIds((next ?? []) as any)}
          titleOverride='Types d’actes'
        />
      </div>
    </div>
  );
}
