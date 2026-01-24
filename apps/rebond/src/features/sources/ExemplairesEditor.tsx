// ExemplairesEditor.tsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Save, Layers } from "lucide-react";
import { toast } from "sonner";
import { AccesNumeriqueEditor } from "./AccesNumeriqueEditor";

type ExemplaireRow = {
  id: string;
  unite_documentaire_id: string;

  depot_id: string;
  nature_id: string | null;
  support_id: string | null;

  cote_locale: string | null;
  localisation_interne: string | null;
  conditionnement: string | null;

  qualite: string | null;
  note: string | null;

  source_exemplaire_id: string | null;
};

type DepotOption = { id: string; label: string };
type NatureOption = { id: string; label: string; code?: string | null };
type SupportOption = { id: string; label: string; code?: string | null };

export function ExemplairesEditor({ uniteDocumentaireId }: { uniteDocumentaireId: string }) {
  const [rows, setRows] = useState<ExemplaireRow[]>([]);
  const [depots, setDepots] = useState<DepotOption[]>([]);
  const [natures, setNatures] = useState<NatureOption[]>([]);
  const [supports, setSupports] = useState<SupportOption[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);

    const [
      { data: exs, error: e1 },
      { data: dep, error: e2 },
      { data: nat, error: e3 },
      { data: sup, error: e4 },
    ] = await Promise.all([
      supabase
        .from("ref_exemplaires")
        .select(
          `
          id,
          unite_documentaire_id,
          depot_id,
          nature_id,
          support_id,
          cote_locale,
          localisation_interne,
          conditionnement,
          qualite,
          note,
          source_exemplaire_id,
          created_at
        `
        )
        .eq("unite_documentaire_id", uniteDocumentaireId)
        .order("created_at", { ascending: true }),

      supabase
        .from("ref_depots")
        .select(
          `
          id,
          nom,
          institution:ref_institutions ( nom, sigle )
        `
        )
        .order("nom", { ascending: true }),

      supabase
        .from("ref_natures")
        .select("id, code, libelle")
        .order("libelle", { ascending: true }),

      supabase
        .from("ref_supports")
        .select("id, code, libelle")
        .order("libelle", { ascending: true }),
    ]);

    if (e1) toast.error(e1.message);
    if (e2) toast.error(e2.message);
    if (e3) toast.error(e3.message);
    if (e4) toast.error(e4.message);

    setRows((exs ?? []) as any);

    setDepots(
      (dep ?? []).map((d: any) => ({
        id: d.id,
        label: d.institution?.sigle
          ? `${d.institution.sigle} — ${d.nom}`
          : `${d.institution?.nom ?? "Institution"} — ${d.nom}`,
      }))
    );

    setNatures(
      (nat ?? []).map((n: any) => ({
        id: n.id,
        code: n.code,
        label: n.code ? `${n.libelle} (${n.code})` : n.libelle,
      }))
    );

    setSupports(
      (sup ?? []).map((s: any) => ({
        id: s.id,
        code: s.code,
        label: s.code ? `${s.libelle} (${s.code})` : s.libelle,
      }))
    );

    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uniteDocumentaireId]);

  const defaultDepotId = useMemo(() => depots[0]?.id ?? null, [depots]);

  const add = async () => {
    if (!defaultDepotId) {
      toast.error("Aucun dépôt disponible (ref_depots).");
      return;
    }

    const { error } = await supabase.from("ref_exemplaires").insert({
      unite_documentaire_id: uniteDocumentaireId,
      depot_id: defaultDepotId,
      nature_id: null,
      support_id: null,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Exemplaire ajouté");
    await load();
  };

  const patch = (id: string, patcher: Partial<ExemplaireRow>) => {
    setRows((prev) => prev.map((x) => (x.id === id ? { ...x, ...patcher } : x)));
  };

  const saveRow = async (e: ExemplaireRow) => {
    if (!e.depot_id) {
      toast("Choisis un dépôt.", { icon: "🏛️" });
      return;
    }

    const { error } = await supabase
      .from("ref_exemplaires")
      .update({
        depot_id: e.depot_id,
        nature_id: e.nature_id,
        support_id: e.support_id,
        cote_locale: e.cote_locale?.trim() || null,
        localisation_interne: e.localisation_interne?.trim() || null,
        conditionnement: e.conditionnement?.trim() || null,
        qualite: e.qualite?.trim() || null,
        note: e.note?.trim() || null,
        source_exemplaire_id: e.source_exemplaire_id || null,
      })
      .eq("id", e.id);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Exemplaire sauvegardé");
    await load();
  };

  const removeRow = async (id: string) => {
    const ok = window.confirm(
      "Supprimer cet exemplaire ?\n\n⚠️ Les accès numériques liés seront aussi supprimés si tu as mis ON DELETE CASCADE côté DB."
    );
    if (!ok) return;

    const { error } = await supabase.from("ref_exemplaires").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Exemplaire supprimé");
    await load();
  };

  // Heuristique UI : on considère “numérisation” si support = numerise (ref_supports.code = 'numerise')
  const isNumerise = (ex: ExemplaireRow) => {
    const s = supports.find((x) => x.id === ex.support_id);
    return (s?.code ?? "").toLowerCase() === "numerise";
  };

  return (
    <div className="space-y-3 border-t pt-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Layers className="h-4 w-4" />
          Exemplaires
        </h3>

        <Button size="sm" onClick={add} className="gap-2" disabled={loading}>
          <Plus className="h-4 w-4" />
          Ajouter
        </Button>
      </div>

      {!rows.length && (
        <div className="text-sm text-muted-foreground">Aucun exemplaire.</div>
      )}

      <div className="space-y-3">
        {rows.map((ex) => (
          <div key={ex.id} className="rounded border bg-background p-3">
            <div className="grid gap-2 md:grid-cols-2">
              {/* Dépôt */}
              <div className="space-y-1">
                <div className="text-xs font-medium">Dépôt</div>
                <select
                  className="w-full rounded-md border px-2 py-2 text-sm"
                  value={ex.depot_id ?? ""}
                  onChange={(ev) => patch(ex.id, { depot_id: ev.target.value })}
                >
                  <option value="">— Choisir un dépôt —</option>
                  {depots.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nature */}
              <div className="space-y-1">
                <div className="text-xs font-medium">Nature (optionnelle)</div>
                <select
                  className="w-full rounded-md border px-2 py-2 text-sm"
                  value={ex.nature_id ?? ""}
                  onChange={(ev) => patch(ex.id, { nature_id: ev.target.value || null })}
                >
                  <option value="">— (Aucune) —</option>
                  {natures.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Support */}
              <div className="space-y-1">
                <div className="text-xs font-medium">Support (optionnel)</div>
                <select
                  className="w-full rounded-md border px-2 py-2 text-sm"
                  value={ex.support_id ?? ""}
                  onChange={(ev) => patch(ex.id, { support_id: ev.target.value || null })}
                >
                  <option value="">— (Aucun) —</option>
                  {supports.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cote locale */}
              <div className="space-y-1">
                <div className="text-xs font-medium">Cote locale (optionnelle)</div>
                <Input
                  value={ex.cote_locale ?? ""}
                  onChange={(ev) => patch(ex.id, { cote_locale: ev.target.value })}
                  placeholder="ex: 2E/123, 1MI/45…"
                />
              </div>

              {/* Localisation interne */}
              <div className="space-y-1 md:col-span-2">
                <div className="text-xs font-medium">Localisation interne (optionnelle)</div>
                <Input
                  value={ex.localisation_interne ?? ""}
                  onChange={(ev) => patch(ex.id, { localisation_interne: ev.target.value })}
                  placeholder="ex: Etat-civil > armoire La Saline > naissances"
                />
              </div>

              {/* Conditionnement */}
              <div className="space-y-1">
                <div className="text-xs font-medium">Conditionnement (optionnel)</div>
                <Input
                  value={ex.conditionnement ?? ""}
                  onChange={(ev) => patch(ex.id, { conditionnement: ev.target.value })}
                  placeholder="armoire, boîte, carton…"
                />
              </div>

              {/* Qualité */}
              <div className="space-y-1">
                <div className="text-xs font-medium">Qualité (optionnelle)</div>
                <Input
                  value={ex.qualite ?? ""}
                  onChange={(ev) => patch(ex.id, { qualite: ev.target.value })}
                  placeholder="bonne, HD, faible…"
                />
              </div>

              {/* Note */}
              <div className="space-y-1 md:col-span-2">
                <div className="text-xs font-medium">Note (optionnelle)</div>
                <Input
                  value={ex.note ?? ""}
                  onChange={(ev) => patch(ex.id, { note: ev.target.value })}
                  placeholder="observations…"
                />
              </div>

              {/* Source exemplaire */}
              <div className="space-y-1 md:col-span-2">
                <div className="text-xs font-medium">Copie de / dérivé de (source_exemplaire_id, optionnel)</div>
                <Input
                  value={ex.source_exemplaire_id ?? ""}
                  onChange={(ev) => patch(ex.id, { source_exemplaire_id: ev.target.value.trim() || null })}
                  placeholder="UUID d’un autre exemplaire (si copie/microfilm/numérisation de …)"
                />
              </div>
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <Button size="sm" variant="secondary" onClick={() => void saveRow(ex)} className="gap-2">
                <Save className="h-4 w-4" />
                Sauver
              </Button>
              <Button size="sm" variant="destructive" onClick={() => void removeRow(ex.id)} className="gap-2">
                <Trash2 className="h-4 w-4" />
                Supprimer
              </Button>
            </div>

            {/* ✅ Accès numériques : affiché seulement si on détecte un support numérisé */}
            {isNumerise(ex) ? <AccesNumeriqueEditor exemplaireId={ex.id} /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
