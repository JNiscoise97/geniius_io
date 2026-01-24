// ExemplairesStep.tsx

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
import { ETAT_CONSERVATION_OPTIONS, QUALITE_OPTIONS } from './source.constants';
import type { AccesDraft, DepotOption, ExemplaireDraft, NatureOption, PlateformeOption, SupportOption, TypeAccesOption } from './source.types';


type Props = {
  depots: DepotOption[];
  natures: NatureOption[];
  supports: SupportOption[];
  paginationOptions: Array<{ value: string; label: string }>;

  plateformes: PlateformeOption[];
  typesAcces: TypeAccesOption[];
  defaultTypeAccesId: string | null;

  uniteCouvertureLabel: string;

  exemplaires: ExemplaireDraft[];
  setExemplaires: React.Dispatch<React.SetStateAction<ExemplaireDraft[]>>;

  selectedExId: string | null;
  setSelectedExId: (id: string) => void;

  onAdd: () => void;
};

export function ExemplairesStep({
  depots,
  natures,
  supports,
  paginationOptions,
  plateformes,
  typesAcces,
  defaultTypeAccesId,
  uniteCouvertureLabel,
  exemplaires,
  setExemplaires,
  selectedExId,
  setSelectedExId,
  onAdd,
}: Props) {
  const selected = exemplaires.find((e) => e.id === selectedExId) ?? null;

  const patchSelected = (patch: Partial<ExemplaireDraft>) => {
    if (!selected) return;
    setExemplaires((prev) => prev.map((e) => (e.id === selected.id ? { ...e, ...patch } : e)));
  };

  const patchSelectedAcces = (accesId: string, patch: Partial<AccesDraft>) => {
    if (!selected) return;
    setExemplaires((prev) =>
      prev.map((e) => {
        if (e.id !== selected.id) return e;
        return {
          ...e,
          acces: (e.acces ?? []).map((a) => (a.id === accesId ? { ...a, ...patch } : a)),
        };
      }),
    );
  };

  const addAcces = () => {
    if (!selected) return;
    setExemplaires((prev) =>
      prev.map((e) => {
        if (e.id !== selected.id) return e;
        return {
          ...e,
          acces: [
            ...(e.acces ?? []),
            {
              id: crypto.randomUUID(),
              plateforme_id: null,
              type_acces_id: defaultTypeAccesId,
              url_base: '',
              schema_deep_link: '',
              restrictions: '',
              note: '',
            },
          ],
        };
      }),
    );
  };

  const removeAcces = (accesId: string) => {
    if (!selected) return;
    setExemplaires((prev) =>
      prev.map((e) => {
        if (e.id !== selected.id) return e;
        const nextAcces = (e.acces ?? []).filter((a) => a.id !== accesId);
        return { ...e, acces: nextAcces }; // ✅ autorise []
      }),
    );
  };

  const removeSelected = () => {
    if (!selected) return;
    setExemplaires((prev) => {
      const next = prev.filter((e) => e.id !== selected.id);
      // si on supprime le sélectionné, sélectionner le 1er restant
      const fallback = next[0]?.id ?? null;
      if (fallback) setSelectedExId(fallback);
      return next.length ? next : prev; // option: empêcher 0 exemplaire
    });
  };

  const getDepotLabel = (id: string) => depots.find((d) => d.id === id)?.labelCourt ?? 'Dépôt ?';

  return (
    <div className='grid gap-4 md:grid-cols-[280px_1fr] h-full min-h-0'>
      {/* Left panel (scroll indépendant) */}
      <div className='rounded-md border bg-muted/20 flex flex-col min-h-0'>
        {/* Header fixe */}
        <div className='shrink-0 p-3 border-b bg-muted/10'>
          <div className='flex items-center justify-between gap-2'>
            <div className='text-sm font-semibold'>Exemplaires</div>
            <Button size='sm' variant='secondary' className='gap-2' onClick={onAdd}>
              <Plus className='h-4 w-4' />
              Ajouter
            </Button>
          </div>
        </div>

        {/* Liste scrollable */}
        <div className='flex-1 min-h-0 overflow-y-auto p-3'>
          <div className='space-y-2'>
            {exemplaires.map((e, idx) => {
              const active = e.id === selectedExId;

              // --- helpers locaux ---
              const norm = (s: string) =>
                (s ?? '')
                  .trim()
                  .toLowerCase()
                  .normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, ''); // enlève les accents

              const getNature = (natureId?: string | null) =>
                natureId ? natures.find((n) => n.id === natureId) ?? null : null;

              const isComplementNature = (nature: any | null) => {
                if (!nature) return false;

                // si tu as un code dans NatureOption (selon ton modèle), on le privilégie
                const code = norm(String((nature as any).code ?? ''));
                if (code === 'numerisation' || code === 'double') return true;

                // fallback: comparaison sur label
                const label = norm(String((nature as any).label ?? ''));
                return label === 'numerisation' || label === 'double';
              };

              const primary = e.cote_locale?.trim() ? e.cote_locale.trim() : '';

              // --- complément ---
              // condition: (nature == numerisation ou double) ET source_exemplaire_id non null
              const nature = getNature(e.nature_id ?? null);
              const sourceId = e.source_exemplaire_id?.trim() ? e.source_exemplaire_id.trim() : '';

              let complement = '';
              if (isComplementNature(nature) && sourceId) {
                const sourceEx = exemplaires.find((x) => x.id === sourceId) ?? null;
                const sourceCote = sourceEx?.cote_locale?.trim() ? sourceEx.cote_locale.trim() : '';
                if (sourceCote) {
                  // "nature.libelle de source_exemplaire_id.cote_locale"
                  complement = `${nature?.label ?? ''} de ${sourceCote}`.trim();
                }
              }

              // --- règles demandées ---
              // si e.cote_locale et complément => "cote (complément)"
              // si e.cote_locale et pas complément => "cote"
              // si pas cote et complément => "complément"
              // si ni cote ni complément => "Exemplaire N"
              const title =
                primary && complement
                  ? `${primary} (${complement})`
                  : primary
                    ? primary
                    : complement
                      ? complement
                      : `Exemplaire ${idx + 1}`;

              const subtitle = e.depot_id ? getDepotLabel(e.depot_id) : 'Dépôt non renseigné';

              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setSelectedExId(e.id)}
                  className={[
                    'w-full text-left rounded-md border px-3 py-2 transition',
                    active ? 'bg-background border-foreground' : 'bg-background/60 hover:bg-background',
                  ].join(' ')}
                >
                  <div className="text-sm font-medium truncate">{title}</div>
                  <div className="text-xs text-muted-foreground truncate">{subtitle}</div>
                </button>
              );
            })}

          </div>
        </div>
      </div>

      {/* Right panel (scroll indépendant) */}
      <div className='rounded-md border flex flex-col min-h-0'>
        {!selected ? (
          <div className='p-4 text-sm text-muted-foreground'>
            Aucun exemplaire sélectionné. Clique sur “Ajouter”.
          </div>
        ) : (
          <>
            {/* Header fixe */}
            <div className='shrink-0 p-4 border-b flex items-center justify-between'>
              <div className='text-sm font-semibold'>Détails de l’exemplaire</div>
              <Button size='sm' variant='destructive' className='gap-2' onClick={removeSelected}>
                <Trash2 className='h-4 w-4' />
                Supprimer
              </Button>
            </div>

            {/* Contenu scrollable */}
            <div className='flex-1 min-h-0 overflow-y-auto p-4'>
              <div className='space-y-3'>
                {/* dépôt */}
                <div className='space-y-1'>
                  <div className='text-xs font-medium'>Dépôt *</div>
                  <select
                    className='w-full rounded-md border px-2 py-2 text-sm'
                    value={selected.depot_id}
                    onChange={(e) => patchSelected({ depot_id: e.target.value })}
                  >
                    <option value=''>— Choisir —</option>
                    {depots.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.labelLong}
                      </option>
                    ))}
                  </select>
                </div>

                <div className='grid gap-2 md:grid-cols-2'>
                  <div className='space-y-1'>
                    <div className='text-xs font-medium'>Cote locale</div>
                    <Input
                      value={selected.cote_locale}
                      onChange={(e) => patchSelected({ cote_locale: e.target.value })}
                      placeholder='ex: 2E/123, 1MI/45…'
                    />
                  </div>

                  <div className='space-y-1'>
                    <div className='text-xs font-medium'>Support</div>
                    <select
                      className='w-full rounded-md border px-2 py-2 text-sm'
                      value={selected.support_id ?? ''}
                      onChange={(e) => patchSelected({ support_id: e.target.value || null })}
                    >
                      <option value=''>— Choisir —</option>
                      {supports.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                </div>

                <div className='grid gap-2 md:grid-cols-2'>
                  <div className='space-y-1'>
                    <div className='text-xs font-medium'>Nature</div>
                    <select
                      className='w-full rounded-md border px-2 py-2 text-sm'
                      value={selected.nature_id ?? ''}
                      onChange={(e) => patchSelected({ nature_id: e.target.value || null })}
                    >
                      <option value=''>— Choisir —</option>
                      {natures.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className='space-y-1'>
                    <div className='text-xs font-medium'>source_exemplaire_id</div>
                    <Input
                      value={selected.source_exemplaire_id}
                      onChange={(e) => patchSelected({ source_exemplaire_id: e.target.value })}
                      placeholder='uuid (optionnel)'
                    />
                  </div>
                </div>

                <div className='grid gap-2 md:grid-cols-2'>
                  <div className='space-y-1'>
                    <div className='text-xs font-medium'>Pagination type</div>
                    <select
                      className='w-full rounded-md border px-2 py-2 text-sm'
                      value={selected.pagination_type}
                      onChange={(e) => patchSelected({ pagination_type: e.target.value })}
                    >
                      <option value=''>— Choisir —</option>
                      {paginationOptions.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className='space-y-1'>
                    <div className='text-xs font-medium'>Nombre</div>
                    <Input
                      value={selected.nb_pages}
                      onChange={(e) => patchSelected({ nb_pages: e.target.value })}
                      placeholder='ex: 300'
                      inputMode='numeric'
                    />
                  </div>
                </div>

                <div className='grid gap-2 md:grid-cols-2'>
                  {/* État de conservation */}
                  <div className='space-y-1'>
                    <div className='text-xs font-medium'>État de conservation</div>
                    <select
                      className='w-full rounded-md border px-2 py-2 text-sm'
                      value={selected.etat_conservation}
                      onChange={(e) => patchSelected({ etat_conservation: e.target.value })}
                    >
                      <option value=''>— Choisir —</option>
                      {ETAT_CONSERVATION_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Qualité */}
                  <div className='space-y-1'>
                    <div className='text-xs font-medium'>Qualité</div>
                    <select
                      className='w-full rounded-md border px-2 py-2 text-sm'
                      value={selected.qualite}
                      onChange={(e) => patchSelected({ qualite: e.target.value })}
                    >
                      <option value=''>— Choisir —</option>
                      {QUALITE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className='grid gap-2 md:grid-cols-2'>
                  <div className='space-y-1'>
                    <div className='text-xs font-medium'>Identifiant interne</div>
                    <Input
                      value={selected.identifiant_interne}
                      onChange={(e) => patchSelected({ identifiant_interne: e.target.value })}
                      placeholder='optionnel'
                    />
                  </div>

                  <div className='space-y-1'>
                    <div className='text-xs font-medium'>Localisation interne</div>
                    <Input
                      value={selected.localisation_interne}
                      onChange={(e) => patchSelected({ localisation_interne: e.target.value })}
                      placeholder='armoire / carton / étagère…'
                    />
                  </div>
                </div>

                <div className='space-y-1'>
                  <div className='text-xs font-medium'>Conditionnement</div>
                  <Input
                    value={selected.conditionnement}
                    onChange={(e) => patchSelected({ conditionnement: e.target.value })}
                    placeholder='boîte, carton…'
                  />
                </div>

                <div className='space-y-1'>
                  <div className='text-xs font-medium'>
                    Couverture de l’exemplaire (optionnelle)
                  </div>

                  <Input
                    value={selected.couverture_label}
                    onChange={(e) => patchSelected({ couverture_label: e.target.value })}
                    placeholder='ex: 1859 ; 1859-1860 ; octobre 1821-05/1830…'
                  />

                  <div className='text-xs text-muted-foreground'>
                    À renseigner <b>uniquement si la couverture de cet exemplaire diffère</b> de la
                    période de l’unité documentaire :{' '}
                    <b>{uniteCouvertureLabel || '— non renseignée —'}</b>.
                  </div>
                </div>

                <div className='space-y-1'>
                  <div className='text-xs font-medium'>Description</div>
                  <Textarea
                    value={selected.description}
                    onChange={(e) => patchSelected({ description: e.target.value })}
                    placeholder='optionnel'
                    className='min-h-[80px]'
                  />
                </div>

                <div className='space-y-1'>
                  <div className='text-xs font-medium'>Note</div>
                  <Textarea
                    value={selected.note}
                    onChange={(e) => patchSelected({ note: e.target.value })}
                    placeholder='optionnel'
                    className='min-h-[80px]'
                  />
                </div>

                <div className='h-px bg-border' />

                {/* Accès numériques */}
                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <div className='text-sm font-semibold'>Accès numériques (0..n)</div>
                    <Button size='sm' variant='secondary' className='gap-2' onClick={addAcces}>
                      <Plus className='h-4 w-4' />
                      Ajouter
                    </Button>
                  </div>

                  <div className='space-y-2'>
                    {(selected.acces ?? []).length === 0 ? (
                      <div className='rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground'>
                        Aucun accès numérique pour cet exemplaire.
                        <div className='text-xs mt-1'>
                          Clique sur <b>Ajouter</b> si cet exemplaire est consultable en ligne.
                        </div>
                      </div>
                    ) : (
                      (selected.acces ?? []).map((a) => (
                        <div key={a.id} className='rounded border p-3 space-y-2'>
                          <div className='grid gap-2 md:grid-cols-3'>
                            <div className='space-y-1'>
                              <div className='text-xs font-medium'>Type d’accès</div>
                              <select
                                className='w-full rounded-md border px-2 py-2 text-sm'
                                value={a.type_acces_id ?? defaultTypeAccesId ?? ''}
                                onChange={(e) =>
                                  patchSelectedAcces(a.id, { type_acces_id: e.target.value })
                                }
                              >
                                <option value=''>— Choisir —</option>
                                {typesAcces.map((t) => (
                                  <option key={t.id} value={t.id}>
                                    {t.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className='space-y-1'>
                              <div className='text-xs font-medium'>Plateforme</div>
                              <select
                                className='w-full rounded-md border px-2 py-2 text-sm'
                                value={a.plateforme_id ?? ''}
                                onChange={(e) =>
                                  patchSelectedAcces(a.id, {
                                    plateforme_id: e.target.value || null,
                                  })
                                }
                              >
                                <option value=''>— Choisir —</option>
                                {plateformes.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className='space-y-1'>
                              <div className='text-xs font-medium'>URL base</div>
                              <Input
                                value={a.url_base}
                                onChange={(e) =>
                                  patchSelectedAcces(a.id, { url_base: e.target.value })
                                }
                                placeholder='https://…'
                              />
                            </div>

                            <div className='space-y-1 md:col-span-2'>
                              <div className='text-xs font-medium'>Deep-link</div>
                              <Input
                                value={a.schema_deep_link}
                                onChange={(e) =>
                                  patchSelectedAcces(a.id, { schema_deep_link: e.target.value })
                                }
                                placeholder='https://site/{page}'
                              />
                            </div>

                            <div className='space-y-1 md:col-span-1'>
                              <div className='text-xs font-medium'>Restrictions</div>
                              <Input
                                value={a.restrictions}
                                onChange={(e) =>
                                  patchSelectedAcces(a.id, { restrictions: e.target.value })
                                }
                                placeholder='abonnement, lecteur…'
                              />
                            </div>

                            <div className='space-y-1 md:col-span-3'>
                              <div className='text-xs font-medium'>Note</div>
                              <Input
                                value={a.note}
                                onChange={(e) => patchSelectedAcces(a.id, { note: e.target.value })}
                                placeholder='notes internes…'
                              />
                            </div>
                          </div>

                          <div className='flex justify-end'>
                            <Button
                              size='sm'
                              variant='destructive'
                              onClick={() => removeAcces(a.id)}
                              className='gap-2'
                            >
                              <Trash2 className='h-4 w-4' />
                              Supprimer
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className='text-xs text-muted-foreground'>
                    Tu peux laisser les accès vides : seuls ceux avec une URL seront insérés.
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
