// src/components/shared/NotesTableInput.tsx
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { NoteDraft, NoteTypeCode, DatePrecision, TargetKind } from '@/types/notes';
import { supabase } from '@/lib/supabase';
import { X } from 'lucide-react';

// --- Constantes d’énumération
const NOTE_TYPES: readonly NoteTypeCode[] = [
  'etat_civil_inscription',
  'administratif',
  'statut_familial',
  'transaction',
  'libre',
] as const;

const DATE_PRECISIONS: readonly DatePrecision[] = ['jour', 'mois', 'annee', 'inconnue'] as const;

const TARGET_KINDS: readonly TargetKind[] = ['acte_not', 'acte_etat_civil', 'texte'] as const;

const INSCRIPTION_NATURES = [
  'naissance',
  'mariage',
  'deces',
  'affranchissement',
  'nouveaux libres',
  'autre',
] as const;

// --- Helpers UI
const controlCls =
  'w-full rounded-sm border border-gray-300 bg-white px-3 py-2.5 text-[15px] shadow-sm ' +
  'placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500';

function EnumSelect<T extends string>({
  value,
  onChange,
  options,
  placeholder,
  id,
}: {
  value: T | null | undefined;
  onChange: (v: T | null) => void;
  options: readonly T[];
  placeholder?: string;
  id?: string;
}) {
  return (
    <select
      id={id}
      className={controlCls}
      value={value ?? ''}
      onChange={(e) => onChange((e.target.value || null) as T | null)}
    >
      <option value="">{placeholder ?? '--'}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

// --- Cache léger des libellés (bureaux / registres / actes EC)
function useEtatCivilLabels() {
  const [bureaux, setBureaux] = useState<Map<string, string>>(new Map());
  const [registres, setRegistres] = useState<Map<string, string>>(new Map());
  const [actes, setActes] = useState<Map<string, string>>(new Map());

  async function fetchAndCache(
    table: 'etat_civil_bureaux' | 'etat_civil_registres' | 'etat_civil_actes',
    id: string,
  ): Promise<string> {
    if (!id) return '';
    const cache = table === 'etat_civil_bureaux' ? bureaux : table === 'etat_civil_registres' ? registres : actes;
    const setCache = table === 'etat_civil_bureaux' ? setBureaux : table === 'etat_civil_registres' ? setRegistres : setActes;

    if (cache.has(id)) return cache.get(id)!;

    // On sélectionne quelques colonnes “compatibles”
    const cols =
      table === 'etat_civil_bureaux'
        ? 'id, nom'
        : table === 'etat_civil_registres'
          ? 'id, annee, type_acte'
          : 'id, label, numero_acte';

    const { data, error } = await supabase.from(table).select(cols).eq('id', id).maybeSingle();
    let label = id;
    if (!error && data) {
      if (table === 'etat_civil_bureaux') {
        label = (data as any).nom || id;
      } else if (table === 'etat_civil_registres') {
        const a = (data as any).annee ?? '—';
        const t = (data as any).type_acte ?? '';
        label = `${a} ${t}`.trim();
      } else {
        label = (data as any).label ?? `Acte n°${(data as any).numero_acte ?? '—'}`;
      }
    }

    setCache((prev) => {
      const next = new Map(prev);
      next.set(id, label);
      return next;
    });

    return label;
  }

  return {
    async labelBureau(id?: string | null) {
      return id ? fetchAndCache('etat_civil_bureaux', id) : '';
    },
    async labelRegistre(id?: string | null) {
      return id ? fetchAndCache('etat_civil_registres', id) : '';
    },
    async labelActe(id?: string | null) {
      return id ? fetchAndCache('etat_civil_actes', id) : '';
    },
  };
}

// --- Résumés pour la table
function summarizeDate(n: NoteDraft): string {
  if (!n.date_evenement) return '';
  return n.date_precision && n.date_precision !== 'jour'
    ? `${n.date_evenement} (~${n.date_precision})`
    : n.date_evenement;
}

function summarizeInscription(n: NoteDraft): string {
  if (n.type_code !== 'etat_civil_inscription') return '';
  const parts = [
    n.inscription_nature || '',
    n.annee_registre ? `(${n.annee_registre})` : '',
    n.numero_acte ? `n°${n.numero_acte}` : '',
  ].filter(Boolean);
  return parts.join(' ');
}

function summarizeCible(n: NoteDraft): string {
  if (!n.target_kind) return '';
  if (n.target_kind === 'texte') return n.target_label ?? '';
  if (n.target_kind === 'acte_not') return 'Acte notarié';
  if (n.target_kind === 'acte_etat_civil') return 'Acte état civil';
  return '';
}

// --- Dialog d’édition
function NoteEditorDialog({
  open,
  initial,
  onCancel,
  onSave,
}: {
  open: boolean;
  initial: NoteDraft | null;
  onCancel: () => void;
  onSave: (next: NoteDraft) => void;
}) {
  const [draft, setDraft] = useState<NoteDraft>(
    initial ?? {
      type_code: 'libre',
      texte: '',
      date_precision: 'inconnue',
    },
  );

  useEffect(() => {
    setDraft(
      initial ?? {
        type_code: 'libre',
        texte: '',
        date_precision: 'inconnue',
      },
    );
  }, [initial]);

  // Validation minimale côté client sur la cible (respect des CHECK)
  function normalizeAndSave() {
    const d: NoteDraft = { ...draft };

    // Champs vides -> null
    if (!d.texte) d.texte = null;
    if (!d.date_evenement) d.date_evenement = null;
    if (!d.date_precision) d.date_precision = 'inconnue';

    // Cible
    if (!d.target_kind) {
      d.target_acte_ac_id = null;
      d.target_acte_ec_id = null;
      d.target_label = null;
    } else if (d.target_kind === 'acte_not') {
      d.target_acte_ec_id = null;
      d.target_label = null;
      if (!d.target_acte_ac_id) {
        // on tolère côté UI, la contrainte sera gérée DB (SET NULL) ou refusée par CHECK si modifié
        d.target_kind = null;
      }
    } else if (d.target_kind === 'acte_etat_civil') {
      d.target_acte_ac_id = null;
      d.target_label = null;
      if (!d.target_acte_ec_id) {
        d.target_kind = null;
      }
    } else if (d.target_kind === 'texte') {
      d.target_acte_ac_id = null;
      d.target_acte_ec_id = null;
      if (!d.target_label) {
        d.target_kind = null;
      }
    }

    // Inscription : rien d’obligatoire mais on garde cohérent
    if (d.type_code !== 'etat_civil_inscription') {
      d.inscription_nature = null;
      d.annee_registre = null;
      d.numero_acte = null;
    }

    onSave(d);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onCancel() : null)}>
      <DialogContent className="rounded-md max-w-3xl">
        <DialogHeader>
          <DialogTitle>{initial ? 'Modifier la note' : 'Ajouter une note'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Type */}
          <div>
            <Label>Type</Label>
            <EnumSelect<NoteTypeCode>
              value={draft.type_code}
              onChange={(v) => setDraft((p) => ({ ...p, type_code: (v ?? 'libre') as NoteTypeCode }))}
              options={NOTE_TYPES}
            />
          </div>

          {/* Résumé */}
          <div>
            <Label>Résumé / Texte</Label>
            <Textarea
              className={controlCls}
              value={draft.texte ?? ''}
              onChange={(e) => setDraft((p) => ({ ...p, texte: e.target.value }))}
              placeholder="Texte libre, résumé…"
            />
          </div>

          {/* Datation */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date (ISO)</Label>
              <Input
                className={controlCls}
                type="date"
                value={draft.date_evenement ?? ''}
                onChange={(e) => setDraft((p) => ({ ...p, date_evenement: e.target.value || null }))}
              />
            </div>
            <div>
              <Label>Précision</Label>
              <EnumSelect<DatePrecision>
                value={draft.date_precision ?? 'inconnue'}
                onChange={(v) => setDraft((p) => ({ ...p, date_precision: v ?? 'inconnue' }))}
                options={DATE_PRECISIONS}
              />
            </div>
          </div>

          {/* Ancrages état-civil */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Bureau (id)</Label>
              <Input
                className={controlCls}
                value={draft.bureau_id ?? ''}
                onChange={(e) => setDraft((p) => ({ ...p, bureau_id: e.target.value || null }))}
                placeholder="uuid bureau"
              />
            </div>
            <div>
              <Label>Registre (id)</Label>
              <Input
                className={controlCls}
                value={draft.registre_id ?? ''}
                onChange={(e) => setDraft((p) => ({ ...p, registre_id: e.target.value || null }))}
                placeholder="uuid registre"
              />
            </div>
            <div>
              <Label>Acte EC (id)</Label>
              <Input
                className={controlCls}
                value={draft.acte_id ?? ''}
                onChange={(e) => setDraft((p) => ({ ...p, acte_id: e.target.value || null }))}
                placeholder="uuid acte EC"
              />
            </div>
          </div>

          {/* Détails “inscription” */}
          {draft.type_code === 'etat_civil_inscription' && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Nature</Label>
                <EnumSelect<any>
                  value={(draft.inscription_nature as any) ?? null}
                  onChange={(v) => setDraft((p) => ({ ...p, inscription_nature: (v as any) ?? null }))}
                  options={INSCRIPTION_NATURES as any}
                />
              </div>
              <div>
                <Label>Année registre</Label>
                <Input
                  className={controlCls}
                  type="number"
                  value={draft.annee_registre ?? ''}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, annee_registre: e.target.value ? Number(e.target.value) : null }))
                  }
                />
              </div>
              <div>
                <Label>Numéro d’acte</Label>
                <Input
                  className={controlCls}
                  type="number"
                  value={draft.numero_acte ?? ''}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, numero_acte: e.target.value ? Number(e.target.value) : null }))
                  }
                />
              </div>
            </div>
          )}

          {/* Cible éventuelle */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Cible — type</Label>
              <EnumSelect<TargetKind>
                value={draft.target_kind ?? null}
                onChange={(v) => setDraft((p) => ({ ...p, target_kind: v }))}
                options={TARGET_KINDS}
                placeholder="(aucune)"
              />
            </div>

            {draft.target_kind === 'acte_not' && (
              <div className="col-span-2">
                <Label>Acte notarié (id)</Label>
                <Input
                  className={controlCls}
                  value={draft.target_acte_ac_id ?? ''}
                  onChange={(e) => setDraft((p) => ({ ...p, target_acte_ac_id: e.target.value || null }))}
                  placeholder="uuid acte notarié"
                />
              </div>
            )}
            {draft.target_kind === 'acte_etat_civil' && (
              <div className="col-span-2">
                <Label>Acte EC (id)</Label>
                <Input
                  className={controlCls}
                  value={draft.target_acte_ec_id ?? ''}
                  onChange={(e) => setDraft((p) => ({ ...p, target_acte_ec_id: e.target.value || null }))}
                  placeholder="uuid acte état civil"
                />
              </div>
            )}
            {draft.target_kind === 'texte' && (
              <div className="col-span-2">
                <Label>Label cible (texte)</Label>
                <Input
                  className={controlCls}
                  value={draft.target_label ?? ''}
                  onChange={(e) => setDraft((p) => ({ ...p, target_label: e.target.value || null }))}
                  placeholder="ex. « le tuteur », « Mme X »"
                />
              </div>
            )}
          </div>

          {/* Position */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Ordre d’affichage</Label>
              <Input
                className={controlCls}
                type="number"
                value={draft.position ?? ''}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, position: e.target.value ? Number(e.target.value) : null }))
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button className="bg-indigo-700 hover:bg-indigo-800 text-white rounded-sm" onClick={normalizeAndSave}>
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Ligne du tableau
function NoteRow({
  n,
  onEdit,
  onDelete,
  labels,
}: {
  n: NoteDraft;
  onEdit: () => void;
  onDelete: () => void;
  labels: { bureau?: string; registre?: string; acte?: string };
}) {
  const dateTxt = summarizeDate(n);
  const inscriptionTxt = summarizeInscription(n);
  const cibleTxt = summarizeCible(n);

  const hasEC = !!(labels.bureau || labels.registre || labels.acte);

  return (
    <tr className="border-b">
      <td className="px-3 py-2 align-top text-sm">{n.type_code}</td>
      <td className="px-3 py-2 align-top text-sm">{n.texte || <span className="text-gray-400">—</span>}</td>
      <td className="px-3 py-2 align-top text-sm">{dateTxt || <span className="text-gray-400">—</span>}</td>
      <td className="px-3 py-2 align-top text-sm">
        {hasEC ? (
          <div className="space-y-0.5">
            {labels.bureau && <div>Bureau : {labels.bureau}</div>}
            {labels.registre && <div>Registre : {labels.registre}</div>}
            {labels.acte && <div>Acte : {labels.acte}</div>}
          </div>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
      <td className="px-3 py-2 align-top text-sm">{inscriptionTxt || <span className="text-gray-400">—</span>}</td>
      <td className="px-3 py-2 align-top text-sm">{cibleTxt || <span className="text-gray-400">—</span>}</td>
      <td className="px-3 py-2 align-top text-sm w-28">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            Modifier
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-700">
            Supprimer
          </Button>
        </div>
      </td>
    </tr>
  );
}

// --- Composant principal
export function NotesTableInput({
  title,
  value,
  acteurId: _acteurId, // non utilisé ici mais conservé pour signature homogène
  onChange,
}: {
  title: string;
  value: NoteDraft[] | null;
  acteurId: string | null;
  onChange: (next: NoteDraft[] | null) => void;
}) {
  const items = useMemo(() => (value ?? []).slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0)), [value]);

  const [open, setOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingInitial, setEditingInitial] = useState<NoteDraft | null>(null);

  // Résolution des libellés EC (lazy + cache)
  const { labelActe, labelBureau, labelRegistre } = useEtatCivilLabels();
  const [labelsByKey, setLabelsByKey] = useState<Record<string, { bureau?: string; registre?: string; acte?: string }>>(
    {},
  );

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const next: Record<string, { bureau?: string; registre?: string; acte?: string }> = {};
      for (let i = 0; i < items.length; i++) {
        const n = items[i];
        const key = `${n.bureau_id || ''}-${n.registre_id || ''}-${n.acte_id || ''}`;
        if (labelsByKey[key]) {
          next[key] = labelsByKey[key];
          continue;
        }
        const [b, r, a] = await Promise.all([labelBureau(n.bureau_id), labelRegistre(n.registre_id), labelActe(n.acte_id)]);
        next[key] = {
          bureau: b || undefined,
          registre: r || undefined,
          acte: a || undefined,
        };
      }
      if (!cancelled) setLabelsByKey(next);
    }
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map((n) => `${n.bureau_id}-${n.registre_id}-${n.acte_id}`).join('|')]);

  function normalizePositions(arr: NoteDraft[]): NoteDraft[] {
    return arr
      .slice()
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map((n, idx) => ({ ...n, position: idx + 1 }));
  }

  function openCreate() {
    setEditingIndex(null);
    setEditingInitial({
      type_code: 'libre',
      texte: '',
      date_precision: 'inconnue',
      position: (items?.[items.length - 1]?.position ?? items.length) + 1,
    });
    setOpen(true);
  }

  function openEdit(idx: number) {
    setEditingIndex(idx);
    setEditingInitial(items[idx]);
    setOpen(true);
  }

  function doDelete(idx: number) {
    const next = items.filter((_, i) => i !== idx);
    onChange(next.length ? normalizePositions(next) : null);
  }

  function saveFromDialog(nextDraft: NoteDraft) {
    const next =
      editingIndex === null
        ? [...items, nextDraft]
        : items.map((it, i) => (i === editingIndex ? nextDraft : it));

    onChange(normalizePositions(next));
    setOpen(false);
    setEditingInitial(null);
    setEditingIndex(null);
  }

  function cancelDialog() {
    setOpen(false);
    setEditingInitial(null);
    setEditingIndex(null);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{title}</div>
        <Button variant="outline" onClick={openCreate}>
          Ajouter
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Résumé</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Ancrages EC</th>
              <th className="px-3 py-2">Inscription</th>
              <th className="px-3 py-2">Cible</th>
              <th className="px-3 py-2 w-28">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-center text-gray-400">
                  — Aucune note —
                </td>
              </tr>
            ) : (
              items.map((n, i) => {
                const key = `${n.bureau_id || ''}-${n.registre_id || ''}-${n.acte_id || ''}`;
                const labels = labelsByKey[key] || {};
                return (
                  <NoteRow
                    key={n.id ?? i}
                    n={n}
                    onEdit={() => openEdit(i)}
                    onDelete={() => doDelete(i)}
                    labels={labels}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <NoteEditorDialog open={open} initial={editingInitial} onCancel={cancelDialog} onSave={saveFromDialog} />
    </div>
  );
}
