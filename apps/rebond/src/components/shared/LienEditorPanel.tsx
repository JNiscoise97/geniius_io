// src/components/shared/LienEditorPanel.tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useEtatCivilActesStore } from '@/store/useEtatCivilActesStore';
import { useEffect, useMemo, useState } from 'react';
import type { LienDraft } from '@/types/liens';

type RefLien = {
  id: string;
  code: string;
  label: string;
  label_m?: string | null;
  label_f?: string | null;
  invariable?: boolean | null;
  nature?: 'parente' | 'mariage' | 'affinite' | 'spirituel' | 'tutelle' | 'autre' | null;
};

export function LienEditorPanel({
  title,
  initial,
  onCancel,
  onSave,
  filterNature, // 'mariage' | 'autre'
  acteurSexe,
  excludeActeurId,
}: {
  title: string;
  initial: LienDraft | null;
  onCancel: () => void;
  onSave: (item: LienDraft) => void;
  filterNature?: 'mariage' | 'autre';
  acteurSexe?: 'M' | 'F' | null;
  excludeActeurId?: string | null;
}) {
  const [saving, setSaving] = useState(false);
  const [liensRef, setLiensRef] = useState<RefLien[]>([]);
  const [form, setForm] = useState<LienDraft>(() => {
    const base: LienDraft = initial ?? {
      lien_id: '',
      cible_type: 'role',
      cible_role: null,
      position: null,
      cote: null,
      fratrie_qualif: null,
      cousin_degre: null,
      cousin_removal: null,
      cousin_double: false,
      ascend_n: null,
      descend_n: null,
    };
    return base;
  });

  const { entites } = useEtatCivilActesStore();
  console.log('entites',entites)
  const acteursOptions = useMemo(() => {
    return (entites ?? [])
      .filter(Boolean)
      .filter((a: any) => a?.id && a.id !== excludeActeurId)
      .map((a: any) => ({
        id: a.id as string,
        label:
          (a.prenom || a.nom ? `${a.qualite_labels?.[0] ?? ''} ${a.prenom ?? ''} ${a.nom ?? ''}`.trim() : '') +
          (a.role ? ` (${a.role})` : ''),
      }));
  }, [entites, excludeActeurId]);

  useEffect(() => {
    const run = async () => {
      const { data, error } = await supabase
        .from('ref_lien')
        .select('id, code, label, label_m, label_f, invariable, nature')
        .order('label', { ascending: true });
      if (!error && data) {
        const arr = data as RefLien[];
        setLiensRef(
          filterNature === 'mariage'
            ? arr.filter((r) => r.nature === 'mariage')
            : filterNature === 'autre'
            ? arr.filter((r) => r.nature !== 'mariage')
            : arr,
        );
      }
    };
    run();
  }, [filterNature]);

  const chooseGendered = (r: RefLien): string =>
    r.invariable
      ? r.label
      : acteurSexe === 'F'
      ? r.label_f || r.label || r.label_m || ''
      : acteurSexe === 'M'
      ? r.label_m || r.label || r.label_f || ''
      : r.label || r.label_m || r.label_f || '';

  console.log('acteursOptions',acteursOptions)

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b">
        <h3 className="font-medium">{title}</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Type de lien */}
        <div>
          <Label className="mb-1 block">Type de lien</Label>
          <select
            className="w-full border rounded-sm px-3 py-2"
            value={form.lien_id}
            onChange={(e) => {
              const lien = liensRef.find((r) => r.id === e.target.value);
              setForm((f) => ({
                ...f,
                lien_id: lien?.id ?? '',
                lien_code: lien?.code ?? null,
                lien_label: lien ? chooseGendered(lien) : null,
                nature: lien?.nature ?? null,
              }));
            }}
          >
            <option value="">— Choisir —</option>
            {liensRef.map((r) => (
              <option key={r.id} value={r.id}>
                {chooseGendered(r)}
              </option>
            ))}
          </select>
        </div>

        {/* Cible */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="mb-1 block">Cible : type</Label>
            <select
              className="w-full border rounded-sm px-3 py-2"
              value={form.cible_type}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  cible_type: e.target.value as any,
                  cible_acteur_id: null,
                  cible_role: null,
                  cible_label: null,
                }))
              }
            >
              <option value="acteur">acteur</option>
              <option value="role">rôle</option>
              <option value="texte">texte</option>
            </select>
          </div>
          <div className="col-span-2">
            <Label className="mb-1 block">Cible : valeur</Label>
            {form.cible_type === 'acteur' && (
              <select
                className="w-full border rounded-sm px-3 py-2"
                value={form.cible_acteur_id ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, cible_acteur_id: e.target.value || null }))}
              >
                <option value="">— Choisir un acteur —</option>
                {acteursOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            )}
            {form.cible_type === 'role' && (
              <Input
                value={form.cible_role ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, cible_role: e.target.value || null }))}
                placeholder="ex. enfant, défunt, mère…"
              />
            )}
            {form.cible_type === 'texte' && (
              <Input
                value={form.cible_label ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, cible_label: e.target.value || null }))}
                placeholder="ex. Mme X, tuteur Y…"
              />
            )}
          </div>
        </div>

        {/* Qualificatifs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="mb-1 block">Côté</Label>
            <select
              className="w-full border rounded-sm px-3 py-2"
              value={form.cote ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, cote: (e.target.value || null) as any }))
              }
            >
              <option value="">—</option>
              <option value="maternel">maternel</option>
              <option value="paternel">paternel</option>
            </select>
          </div>
          <div>
            <Label className="mb-1 block">Fratrie</Label>
            <select
              className="w-full border rounded-sm px-3 py-2"
              value={form.fratrie_qualif ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, fratrie_qualif: (e.target.value || null) as any }))
              }
            >
              <option value="">—</option>
              <option value="germain">germain</option>
              <option value="uterin">utérin</option>
              <option value="consanguin">consanguin</option>
            </select>
          </div>
          <div>
            <Label className="mb-1 block">Cousin (degré)</Label>
            <Input
              type="number"
              min={1}
              value={form.cousin_degre ?? ''}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  cousin_degre: e.target.value ? Number(e.target.value) : null,
                }))
              }
            />
          </div>
          <div>
            <Label className="mb-1 block">Issu de (±)</Label>
            <Input
              type="number"
              value={form.cousin_removal ?? ''}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  cousin_removal: e.target.value ? Number(e.target.value) : null,
                }))
              }
            />
          </div>
          <div>
            <Label className="mb-1 block">Double ?</Label>
            <select
              className="w-full border rounded-sm px-3 py-2"
              value={form.cousin_double ? '1' : '0'}
              onChange={(e) =>
                setForm((f) => ({ ...f, cousin_double: e.target.value === '1' }))
              }
            >
              <option value="0">Non</option>
              <option value="1">Oui</option>
            </select>
          </div>
          <div>
            <Label className="mb-1 block">Ascendant n</Label>
            <Input
              type="number"
              min={2}
              value={form.ascend_n ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, ascend_n: e.target.value ? Number(e.target.value) : null }))
              }
            />
          </div>
          <div>
            <Label className="mb-1 block">Descendant n</Label>
            <Input
              type="number"
              min={2}
              value={form.descend_n ?? ''}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  descend_n: e.target.value ? Number(e.target.value) : null,
                }))
              }
            />
          </div>
          <div>
            <Label className="mb-1 block">Position</Label>
            <Input
              type="number"
              min={1}
              value={form.position ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, position: e.target.value ? Number(e.target.value) : null }))
              }
            />
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-t flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button
          onClick={() => {
            if (!form.lien_id) return;
            setSaving(true);
            onSave(form);
            setSaving(false);
          }}
          disabled={!form.lien_id || saving}
        >
          Enregistrer
        </Button>
      </div>
    </div>
  );
}
