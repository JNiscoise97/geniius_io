// ExemplairesStep.tsx

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

import type {
  AccesDraft,
  DepotOption,
  ExemplaireDraft,
  NatureOption,
  PlateformeOption,
} from './source.types';
import { RefSinglePickerSmart } from '@/components/shared/RefSinglePickerSmart';

type Props = {
  depots: DepotOption[];
  natures: NatureOption[];

  plateformes: PlateformeOption[];
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

  plateformes,
  defaultTypeAccesId,

  uniteCouvertureLabel,

  exemplaires,
  setExemplaires,
  selectedExId,
  setSelectedExId,
  onAdd,
}: Props) {
  const selected = useMemo(
    () => exemplaires.find((e) => e.id === selectedExId) ?? null,
    [exemplaires, selectedExId],
  );

  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }

    setCopied(true);
    toast.success('ID copié dans le presse-papier');
    window.setTimeout(() => setCopied(false), 1200);
  };

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
        return { ...e, acces: (e.acces ?? []).filter((a) => a.id !== accesId) };
      }),
    );
  };

  const removeSelected = () => {
    if (!selected) return;
    setExemplaires((prev) => {
      const next = prev.filter((e) => e.id !== selected.id);
      const fallback = next[0]?.id ?? null;
      if (fallback) setSelectedExId(fallback);
      return next.length ? next : prev; // option: empêcher 0 exemplaire
    });
  };

  const getDepotLabel = (id: string) => depots.find((d) => d.id === id)?.labelCourt ?? 'Dépôt ?';

  // --- helpers pour la liste de gauche (titre + complément) ---
  const norm = (s: string) =>
    (s ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const getNature = (natureId?: string | null) =>
    natureId ? (natures.find((n) => n.id === natureId) ?? null) : null;

  const isComplementNature = (nature: any | null) => {
    if (!nature) return false;
    const code = norm(String((nature as any).code ?? ''));
    if (code === 'numerisation' || code === 'double') return true;

    const label = norm(String((nature as any).label ?? ''));
    return label === 'numerisation' || label === 'double';
  };

  const renderLeftTitle = (e: ExemplaireDraft, idx: number) => {
    const primary = e.cote_locale?.trim() ? e.cote_locale.trim() : '';

    const nature = getNature(e.nature_ref ?? null);
    const sourceId = e.source_exemplaire_id?.trim() ? e.source_exemplaire_id.trim() : '';

    let complement = '';
    if (isComplementNature(nature) && sourceId) {
      const sourceEx = exemplaires.find((x) => x.id === sourceId) ?? null;
      const sourceCote = sourceEx?.cote_locale?.trim() ? sourceEx.cote_locale.trim() : '';
      if (sourceCote) complement = `${nature?.label ?? ''} de ${sourceCote}`.trim();
    }

    return primary && complement
      ? `${primary} (${complement})`
      : primary
        ? primary
        : complement
          ? complement
          : `Exemplaire ${idx + 1}`;
  };

  // --- petits composants UI (blocs) ---
  const Section = ({
    title,
    description,
    children,
  }: {
    title: string;
    description?: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <section className='rounded-md border bg-background'>
      <div className='border-b px-4 py-3'>
        <div className='text-sm font-semibold'>{title}</div>
        {description ? (
          <div className='text-xs text-muted-foreground mt-1'>{description}</div>
        ) : null}
      </div>
      <div className='p-4 space-y-3'>{children}</div>
    </section>
  );

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className='space-y-1'>
      <div className='text-xs font-medium'>{label}</div>
      {children}
    </div>
  );

  return (
    <div className='grid gap-4 md:grid-cols-[280px_1fr] h-full min-h-0'>
      {/* =========================================================
          LEFT: liste des exemplaires (scroll indépendant)
         ========================================================= */}
      <div className='rounded-md border bg-muted/20 flex flex-col min-h-0'>
        <div className='shrink-0 p-3 border-b bg-muted/10'>
          <div className='flex items-center justify-between gap-2'>
            <div className='text-sm font-semibold'>Exemplaires</div>
            <Button size='sm' variant='secondary' className='gap-2' onClick={onAdd}>
              <Plus className='h-4 w-4' />
              Ajouter
            </Button>
          </div>
        </div>

        <div className='flex-1 min-h-0 overflow-y-auto p-3'  id="debug-scroll-7">
          <div className='space-y-2'>
            {exemplaires.map((e, idx) => {
              const active = e.id === selectedExId;
              const title = renderLeftTitle(e, idx);
              const subtitle = e.depot_id ? getDepotLabel(e.depot_id) : 'Dépôt non renseigné';

              return (
                <button
                  key={e.id}
                  type='button'
                  onClick={() => setSelectedExId(e.id)}
                  className={[
                    'w-full text-left rounded-md border px-3 py-2 transition',
                    active
                      ? 'bg-background border-foreground'
                      : 'bg-background/60 hover:bg-background',
                  ].join(' ')}
                >
                  <div className='text-sm font-medium truncate'>{title}</div>
                  <div className='text-xs text-muted-foreground truncate'>{subtitle}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================================
          RIGHT: formulaire détaillé (scroll indépendant)
         ========================================================= */}
      <div className='rounded-md border flex flex-col min-h-0'>
        {!selected ? (
          <div className='p-4 text-sm text-muted-foreground'>
            Aucun exemplaire sélectionné. Clique sur “Ajouter”.
          </div>
        ) : (
          <>
            {/* header fixe */}
            <div className='shrink-0 p-4 border-b flex items-center justify-between'>
              <div className='text-sm font-semibold'>Détails de l’exemplaire</div>
              <Button size='sm' variant='destructive' className='gap-2' onClick={removeSelected}>
                <Trash2 className='h-4 w-4' />
                Supprimer
              </Button>
            </div>

            {/* contenu scrollable */}
            <div className='flex-1 min-h-0 overflow-y-auto p-4' id="debug-scroll-8">
              <div className='space-y-4'>
                {/* 0) Identité */}
                <Section
                  title='Identité'
                  description='Infos techniques (utile pour debug / liens internes).'
                >
                  <Field label='id'>
                    <div className='flex gap-2'>
                      <Input value={selected.id} disabled className='font-mono' />
                      <Button
                        type='button'
                        size='icon'
                        variant='secondary'
                        onClick={() => copyToClipboard(selected.id)}
                        title='Copier l’id'
                        aria-label='Copier l’id'
                      >
                        {copied ? <Check className='h-4 w-4' /> : <Copy className='h-4 w-4' />}
                      </Button>
                    </div>
                  </Field>
                </Section>

                {/* 1) Localisation & repérage */}
                <Section
                  title='Repérage'
                  description='Où se trouve l’exemplaire et comment le retrouver.'
                >
                  <Field label='Dépôt *'>
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
                  </Field>

                  <div className='grid gap-3 md:grid-cols-2'>
                    <Field label='Cote locale'>
                      <Input
                        value={selected.cote_locale}
                        onChange={(e) => patchSelected({ cote_locale: e.target.value })}
                        placeholder='ex: 2E/123, 1MI/45…'
                      />
                    </Field>

                    <Field label='Identifiant interne'>
                      <Input
                        value={selected.identifiant_interne}
                        onChange={(e) => patchSelected({ identifiant_interne: e.target.value })}
                        placeholder='optionnel'
                      />
                    </Field>

                    <Field label='Localisation interne'>
                      <Input
                        value={selected.localisation_interne}
                        onChange={(e) => patchSelected({ localisation_interne: e.target.value })}
                        placeholder='armoire / carton / étagère…'
                      />
                    </Field>

                    <Field label='Conditionnement'>
                      <Input
                        value={selected.conditionnement}
                        onChange={(e) => patchSelected({ conditionnement: e.target.value })}
                        placeholder='boîte, carton…'
                      />
                    </Field>
                  </div>
                </Section>

                {/* 2) Typologie & état */}
                <Section
                  title='Caractéristiques'
                  description='Nature, support, pagination, état physique.'
                >
                  <div className='grid gap-3 md:grid-cols-2'>
                    <Field label='Nature'>
                      <RefSinglePickerSmart
                        table='ref_natures'
                        value={selected.nature_ref ?? null}
                        onChange={(id) => patchSelected({ nature_ref: id ?? null })}
                        mode='edit'
                        actionsInvisible={false}
                      />
                    </Field>

                    <Field label='Condition physique'>
                      <RefSinglePickerSmart
                        table='ref_physical_condition'
                        value={selected.physical_condition_ref ?? null}
                        onChange={(id) => patchSelected({ physical_condition_ref: id ?? null })}
                        mode='edit'
                        actionsInvisible={false}
                      />
                    </Field>

                    <Field label='Support'>
                      <RefSinglePickerSmart
                        table='ref_supports'
                        value={selected.support_ref ?? null}
                        onChange={(id) => patchSelected({ support_ref: id ?? null })}
                        mode='edit'
                        actionsInvisible={false}
                      />
                    </Field>

                    <Field label='source_exemplaire_id'>
                      <Input
                        value={selected.source_exemplaire_id}
                        onChange={(e) => patchSelected({ source_exemplaire_id: e.target.value })}
                        placeholder='uuid (optionnel)'
                      />
                    </Field>

                    <Field label='Type de pagination'>
                      <RefSinglePickerSmart
                        table='ref_pagination_type'
                        value={selected.pagination_type_ref ?? null}
                        onChange={(id) => patchSelected({ pagination_type_ref: id ?? null })}
                        mode='edit'
                        actionsInvisible={false}
                      />
                    </Field>

                    <Field label='Nombre'>
                      <Input
                        value={selected.nb_pages}
                        onChange={(e) => patchSelected({ nb_pages: e.target.value })}
                        placeholder='ex: 300'
                        inputMode='numeric'
                      />
                    </Field>
                  </div>
                </Section>

                {/* 3) Couverture */}
                <Section
                  title='Couverture'
                  description={
                    <>
                      À renseigner <b>uniquement si la couverture diffère</b> de l’unité
                      documentaire : <b>{uniteCouvertureLabel || '— non renseignée —'}</b>.
                    </>
                  }
                >
                  <Field label='Couverture de l’exemplaire (optionnelle)'>
                    <Input
                      value={selected.couverture_label}
                      onChange={(e) => patchSelected({ couverture_label: e.target.value })}
                      placeholder='ex: 1859 ; 1859-1860 ; octobre 1821-05/1830…'
                    />
                  </Field>
                </Section>

                {/* 4) Notes */}
                <Section title='Texte libre' description='Infos complémentaires (non structurées).'>
                  <Field label='Description'>
                    <Textarea
                      value={selected.description}
                      onChange={(e) => patchSelected({ description: e.target.value })}
                      placeholder='optionnel'
                      className='min-h-[80px]'
                    />
                  </Field>

                  <Field label='Note'>
                    <Textarea
                      value={selected.note}
                      onChange={(e) => patchSelected({ note: e.target.value })}
                      placeholder='optionnel'
                      className='min-h-[80px]'
                    />
                  </Field>
                </Section>

                {/* 5) Accès numériques */}
                <Section
                  title='Accès numériques'
                  description="0..n (ne seront insérés que s'il y a une URL)."
                >
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
                              <Field label='Type d’accès'>
                                <RefSinglePickerSmart
                                  table='ref_type_acces'
                                  value={(a.type_acces_id ?? defaultTypeAccesId) || null}
                                  onChange={(id) =>
                                    patchSelectedAcces(a.id, {
                                      type_acces_id: id, // id peut être null si "Aucune sélection"
                                    })
                                  }
                                  mode='edit'
                                  actionsInvisible={false}
                                />
                              </Field>
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
                </Section>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
