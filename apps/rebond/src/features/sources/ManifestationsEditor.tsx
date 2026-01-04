import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Save, Layers } from "lucide-react";
import { toast } from "sonner";
import { AccesNumeriqueEditor } from "./AccesNumeriqueEditor";

type ManifestationRow = {
  id: string;
  unite_documentaire_id: string;
  type_manifestation: "original" | "microfilm" | "numerisation";
  qualite: string | null;
  note: string | null;
  support_id: string | null;
};

export function ManifestationsEditor({ uniteDocumentaireId }: { uniteDocumentaireId: string }) {
  const [rows, setRows] = useState<ManifestationRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ref_manifestations")
      .select("id, unite_documentaire_id, type_manifestation, qualite, note, support_id")
      .eq("unite_documentaire_id", uniteDocumentaireId)
      .order("created_at", { ascending: true });

    if (error) toast.error(error.message);
    setRows((data ?? []) as any);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uniteDocumentaireId]);

  const add = async () => {
    const { error } = await supabase.from("ref_manifestations").insert({
      unite_documentaire_id: uniteDocumentaireId,
      type_manifestation: "numerisation",
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Manifestation ajoutée");
    await load();
  };

  const patch = (id: string, patcher: Partial<ManifestationRow>) => {
    setRows((prev) => prev.map((x) => (x.id === id ? { ...x, ...patcher } : x)));
  };

  const saveRow = async (m: ManifestationRow) => {
    const { error } = await supabase
      .from("ref_manifestations")
      .update({
        type_manifestation: m.type_manifestation,
        qualite: m.qualite?.trim() || null,
        note: m.note?.trim() || null,
        support_id: m.support_id,
      })
      .eq("id", m.id);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Manifestation sauvegardée");
    await load();
  };

  const removeRow = async (id: string) => {
    const ok = window.confirm(
      "Supprimer cette manifestation ?\n\n⚠️ Les accès numériques liés seront aussi supprimés (cascade)."
    );
    if (!ok) return;

    const { error } = await supabase.from("ref_manifestations").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Manifestation supprimée");
    await load();
  };

  return (
    <div className="space-y-3 border-t pt-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Layers className="h-4 w-4" />
          Manifestations
        </h3>

        <Button size="sm" onClick={add} className="gap-2" disabled={loading}>
          <Plus className="h-4 w-4" />
          Ajouter
        </Button>
      </div>

      {!rows.length && (
        <div className="text-sm text-muted-foreground">Aucune manifestation.</div>
      )}

      <div className="space-y-3">
        {rows.map((m) => (
          <div key={m.id} className="rounded border bg-background p-3">
            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-1">
                <div className="text-xs font-medium">Type</div>
                <select
                  className="w-full rounded-md border px-2 py-2 text-sm"
                  value={m.type_manifestation}
                  onChange={(e) => patch(m.id, { type_manifestation: e.target.value as any })}
                >
                  <option value="original">Original</option>
                  <option value="microfilm">Microfilm</option>
                  <option value="numerisation">Numérisation</option>
                </select>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-medium">Qualité (optionnelle)</div>
                <Input
                  value={m.qualite ?? ""}
                  onChange={(e) => patch(m.id, { qualite: e.target.value })}
                  placeholder="bonne, moyenne, faible…"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <div className="text-xs font-medium">Note (optionnelle)</div>
                <Input
                  value={m.note ?? ""}
                  onChange={(e) => patch(m.id, { note: e.target.value })}
                  placeholder="observations…"
                />
              </div>
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <Button size="sm" variant="secondary" onClick={() => void saveRow(m)} className="gap-2">
                <Save className="h-4 w-4" />
                Sauver
              </Button>
              <Button size="sm" variant="destructive" onClick={() => void removeRow(m.id)} className="gap-2">
                <Trash2 className="h-4 w-4" />
                Supprimer
              </Button>
            </div>

            {/* ✅ Conditionnel : accès numériques seulement pour une numérisation */}
            {m.type_manifestation === "numerisation" ? (
              <AccesNumeriqueEditor manifestationId={m.id} />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
