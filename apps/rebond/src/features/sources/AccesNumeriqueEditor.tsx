import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Save, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

type AccesRow = {
  id: string;
  exemplaire_id: string;
  plateforme_id: string | null;
  type_acces_id: string;
  url_base: string;
  schema_deep_link: string | null;
  restrictions: string | null;
  note: string | null;
};

type PlateformeOption = { id: string; label: string };
type TypeAccesOption = { id: string; label: string; code: string };

export function AccesNumeriqueEditor({ exemplaireId }: { exemplaireId: string }) {
  const [rows, setRows] = useState<AccesRow[]>([]);
  const [plateformes, setPlateformes] = useState<PlateformeOption[]>([]);
  const [typesAcces, setTypesAcces] = useState<TypeAccesOption[]>([]);
  const [loading, setLoading] = useState(false);

  const defaultTypeAccesId = useMemo(() => {
    const viewer = typesAcces.find((t) => t.code === "VIEWER");
    return viewer?.id ?? typesAcces[0]?.id ?? null;
  }, [typesAcces]);

  const load = async () => {
    setLoading(true);

    const [{ data: acces, error: e1 }, { data: plats, error: e2 }, { data: kinds, error: e3 }] =
      await Promise.all([
        supabase
          .from("ref_acces_numeriques")
          .select("id, exemplaire_id, plateforme_id, type_acces_id, url_base, schema_deep_link, restrictions, note")
          .eq("exemplaire_id", exemplaireId)
          .order("created_at", { ascending: true }),
        supabase.from("ref_plateformes").select("id, label, code").order("label", { ascending: true }),
        supabase.from("ref_type_acces").select("id, code, label").order("label", { ascending: true }),
      ]);

    if (e1) toast.error(e1.message);
    if (e2) toast.error(e2.message);
    if (e3) toast.error(e3.message);

    setRows((acces ?? []) as any);

    setPlateformes(
      (plats ?? []).map((p: any) => ({
        id: p.id,
        label: p.code ? `${p.code} — ${p.label}` : p.label,
      }))
    );

    setTypesAcces(
      (kinds ?? []).map((k: any) => ({
        id: k.id,
        code: k.code,
        label: `${k.label} (${k.code})`,
      }))
    );

    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exemplaireId]);

  const add = async () => {
    if (!defaultTypeAccesId) {
      toast.error("Aucun type d’accès disponible (ref_type_acces).");
      return;
    }

    const { error } = await supabase.from("ref_acces_numeriques").insert({
      exemplaire_id: exemplaireId,
      type_acces_id: defaultTypeAccesId,
      url_base: "",
      plateforme_id: null,
    });

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Accès ajouté");
    await load();
  };

  const saveRow = async (r: AccesRow) => {
    if (!r.url_base?.trim()) {
      toast("Renseigne l’URL.", { icon: "🔗" });
      return;
    }

    const { error } = await supabase
      .from("ref_acces_numeriques")
      .update({
        plateforme_id: r.plateforme_id,
        type_acces_id: r.type_acces_id,
        url_base: r.url_base.trim(),
        schema_deep_link: r.schema_deep_link?.trim() || null,
        restrictions: r.restrictions?.trim() || null,
        note: r.note?.trim() || null,
        last_checked_at: new Date().toISOString(),
      })
      .eq("id", r.id);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Accès sauvegardé");
    await load();
  };

  const removeRow = async (id: string) => {
    const ok = window.confirm("Supprimer cet accès numérique ?");
    if (!ok) return;

    const { error } = await supabase.from("ref_acces_numeriques").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Accès supprimé");
    await load();
  };

  const patch = (id: string, patcher: Partial<AccesRow>) => {
    setRows((prev) => prev.map((x) => (x.id === id ? { ...x, ...patcher } : x)));
  };

  return (
    <div className="ml-4 mt-3 space-y-2 rounded-md border bg-muted/20 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <LinkIcon className="h-4 w-4" />
          Accès numériques
        </div>

        <Button size="sm" onClick={add} className="gap-2" disabled={loading}>
          <Plus className="h-4 w-4" />
          Ajouter
        </Button>
      </div>

      {!rows.length && (
        <div className="text-xs text-muted-foreground">
          Aucun accès numérique pour cet exemplaire.
        </div>
      )}

      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="rounded border bg-background p-2">
            <div className="grid gap-2 md:grid-cols-3">
              <div className="space-y-1">
                <div className="text-xs font-medium">Type d’accès</div>
                <select
                  className="w-full rounded-md border px-2 py-2 text-sm"
                  value={r.type_acces_id}
                  onChange={(e) => patch(r.id, { type_acces_id: e.target.value })}
                >
                  {typesAcces.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-medium">Plateforme</div>
                <select
                  className="w-full rounded-md border px-2 py-2 text-sm"
                  value={r.plateforme_id ?? ""}
                  onChange={(e) => patch(r.id, { plateforme_id: e.target.value || null })}
                >
                  <option value="">— (Aucune) —</option>
                  {plateformes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 md:col-span-1">
                <div className="text-xs font-medium">URL de base</div>
                <Input
                  value={r.url_base ?? ""}
                  onChange={(e) => patch(r.id, { url_base: e.target.value })}
                  placeholder="https://…"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <div className="text-xs font-medium">Deep-link (optionnel)</div>
                <Input
                  value={r.schema_deep_link ?? ""}
                  onChange={(e) => patch(r.id, { schema_deep_link: e.target.value })}
                  placeholder="ex: https://site/{page}"
                />
              </div>

              <div className="space-y-1 md:col-span-1">
                <div className="text-xs font-medium">Restrictions (optionnel)</div>
                <Input
                  value={r.restrictions ?? ""}
                  onChange={(e) => patch(r.id, { restrictions: e.target.value })}
                  placeholder="accès lecteur, abonnement…"
                />
              </div>

              <div className="space-y-1 md:col-span-3">
                <div className="text-xs font-medium">Note (optionnelle)</div>
                <Input
                  value={r.note ?? ""}
                  onChange={(e) => patch(r.id, { note: e.target.value })}
                  placeholder="notes internes…"
                />
              </div>
            </div>

            <div className="mt-2 flex justify-end gap-2">
              <Button size="sm" variant="secondary" onClick={() => void saveRow(r)} className="gap-2">
                <Save className="h-4 w-4" />
                Sauver
              </Button>
              <Button size="sm" variant="destructive" onClick={() => void removeRow(r.id)} className="gap-2">
                <Trash2 className="h-4 w-4" />
                Supprimer
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
