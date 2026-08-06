// src/components/actes/LiensTableInput.tsx
import { Button } from '@/components/ui/button';
import { Pencil, Plus, Trash } from 'lucide-react';
import { useMemo } from 'react';
import type { LienDraft } from '@/types/liens';
import { useEtatCivilActesStore } from '@/store/useEtatCivilActesStore';

export function LiensTableInput({
  title,
  value,
  onChange,
  onOpenLienEditor,
  acteurId,
  filterNature, // 'mariage' | 'autre' (pour l’éditeur)
}: {
  title: string;
  value: LienDraft[] | null | undefined;
  onChange: (next: LienDraft[] | null) => void;
  onOpenLienEditor: (args: {
    title: string;
    initial?: LienDraft | null;
    filterNature?: 'mariage' | 'autre';
    onSave: (item: LienDraft) => void;
  }) => void;
  acteurId?: string | null;
  filterNature?: 'mariage' | 'autre';
}) {
  const liens = value ?? [];
  const { entites } = useEtatCivilActesStore();

  const acteursById = useMemo(() => {
    const map = new Map<string, { label: string; role?: string }>();
    (entites ?? [])
      .filter((e) => e.mapping?.acteur?.id)
      .forEach((e) => {
        map.set(e.mapping!.acteur!.id!, {
          label: e.mapping!.acteur!.prenom || e.mapping!.acteur!.nom
            ? `${e.mapping!.acteur!.qualite_labels?.[0] ?? ''}  ${e.mapping!.acteur!.prenom ?? ''} ${e.mapping!.acteur!.nom ?? ''}`.trim()
            : e.label,
          role: e.mapping!.acteur!.role ?? undefined,
        });
      });
    return map;
  }, [entites]);

  const cibleToText = (l: LienDraft) => {
    if (l.cible_type === 'acteur' && l.cible_acteur_id) {
      const a = acteursById.get(l.cible_acteur_id);
      return a ? `${a.label}${a.role ? ` (${a.role})` : ''}` : `acteur#${l.cible_acteur_id.slice(0, 6)}`;
    }
    if (l.cible_type === 'role') return l.cible_role ?? '—';
    if (l.cible_type === 'texte') return l.cible_label ?? '—';
    return '—';
  };

  const qualifsToText = (l: LienDraft) => {
    const parts: string[] = [];
    if (l.cote) parts.push(l.cote);
    if (l.fratrie_qualif) parts.push(l.fratrie_qualif);
    if (l.cousin_degre) parts.push(`${l.cousin_degre}e degré`);
    if (typeof l.cousin_removal === 'number' && l.cousin_removal !== 0) {
      parts.push(`issu de ${Math.abs(l.cousin_removal)} (±)`);
    }
    if (l.cousin_double) parts.push('double');
    if (l.ascend_n) parts.push(`ascend. n=${l.ascend_n}`);
    if (l.descend_n) parts.push(`descend. n=${l.descend_n}`);
    return parts.join(', ') || '—';
  };

  return (
    <div className="border rounded-md">
      <div className="px-3 py-2 flex items-center justify-between bg-gray-50 border-b">
        <h5 className="text-sm font-medium">{title}</h5>
        <Button
          size="sm"
          onClick={() =>
            onOpenLienEditor({
              title: `Ajouter un lien`,
              filterNature,
              initial: null,
              onSave: (created) => {
                const next = [...liens];
                // position par défaut = fin
                if (!created.position) created.position = (liens.length || 0) + 1;
                next.push(created);
                onChange(next);
              },
            })
          }
        >
          <Plus className="w-4 h-4 mr-1" /> Ajouter
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left px-3 py-2">Lien</th>
              <th className="text-left px-3 py-2">Cible</th>
              <th className="text-left px-3 py-2">Qualificatifs</th>
              <th className="text-left px-3 py-2 w-16">Pos.</th>
              <th className="text-right px-3 py-2 w-28">Actions</th>
            </tr>
          </thead>
          <tbody>
            {liens.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-3 text-gray-400 italic">
                  Aucun lien
                </td>
              </tr>
            )}
            {liens
              .map((l, i) => ({ ...l, _i: i }))
              .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
              .map((l) => (
                <tr key={`${l.lien_id}-${l._i}`} className="border-b">
                  <td className="px-3 py-2">{l.lien_label ?? '—'}</td>
                  <td className="px-3 py-2">{cibleToText(l)}</td>
                  <td className="px-3 py-2">{qualifsToText(l)}</td>
                  <td className="px-3 py-2">{l.position ?? '—'}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="icon"
                        variant="outline"
                        className="w-8 h-8"
                        onClick={() =>
                          onOpenLienEditor({
                            title: 'Modifier le lien',
                            filterNature,
                            initial: l,
                            onSave: (edited) => {
                              const next = [...liens];
                              next[l._i] = { ...edited };
                              onChange(next);
                            },
                          })
                        }
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8 border border-red-200 hover:bg-red-100"
                        onClick={() => {
                          const next = liens.filter((_, idx) => idx !== l._i);
                          onChange(next.length ? next : null);
                        }}
                      >
                        <Trash className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
