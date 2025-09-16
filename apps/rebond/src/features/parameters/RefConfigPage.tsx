import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, RefreshCw, Save, X } from "lucide-react";

/**
 * Generic configuration page to CRUD your ref_* tables.
 * Assumes a common schema across tables:
 * id (uuid), code (text, unique), label (text), description (text),
 * scope (text[]), period_from (date), period_to (date), note (text)
 */

// If one table deviates, simply add a mapping here to hide unsupported columns.
const REF_TABLES: { value: string; label: string; columns?: Partial<Record<RefColumnKey, boolean>> }[] = [
  { value: "ref_profession", label: "Professions" },
  { value: "ref_statut_juridique", label: "Statuts juridiques" },
  { value: "ref_categorie_couleur", label: "Catégories de couleur" },
  { value: "ref_situation_fiscale", label: "Situations fiscales" },
  { value: "ref_statut_proprietaire", label: "Statuts de propriété" },
  { value: "ref_qualite", label: "Qualités (appellations)" },
  { value: "ref_filiation", label: "Filiations" },
  { value: "ref_signature", label: "Signature" },
  { value: "ref_situation_matrimoniale", label: "Situations matrimoniales" },
];

// Column keys we support in the UI
const ALL_COLUMNS = [
  "code",
  "label",
  "description",
  "note",
] as const;

type RefColumnKey = typeof ALL_COLUMNS[number];

type RefRow = {
  id: string;
  code: string;
  label: string | null;
  description: string | null;
  note: string | null;
};

const emptyRow: Omit<RefRow, "id"> = {
  code: "",
  label: "",
  description: "",
  note: "",
};

export default function RefConfigPage() {
  const [activeTable, setActiveTable] = useState<string>(REF_TABLES[0].value);
  const [rows, setRows] = useState<RefRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<RefRow | null>(null);
  const [form, setForm] = useState<Omit<RefRow, "id">>(emptyRow);

  const visibleColumns = useMemo(() => {
    const tableCfg = REF_TABLES.find(t => t.value === activeTable)?.columns || {};
    const cols: RefColumnKey[] = [] as any;
    for (const c of ALL_COLUMNS) {
      // If column explicitly disabled in cfg, skip; otherwise show
      if (tableCfg[c] === false) continue;
      cols.push(c);
    }
    return cols;
  }, [activeTable]);

  useEffect(() => {
    void fetchRows();
  }, [activeTable]);

  async function fetchRows() {
    setLoading(true);
    setRows([]);
    const { data, error } = await supabase
      .from(activeTable)
      .select("id, code, label, description, note")
      .order("code", { ascending: true });
    setLoading(false);
    if (error) {
      toast.error(`Erreur de chargement: ${error.message}`);
      return;
    }
    setRows((data || []) as RefRow[]);
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyRow);
    setOpenDialog(true);
  }

  function openEdit(row: RefRow) {
    setEditing(row);
    setForm({
      code: row.code || "",
      label: row.label ?? "",
      description: row.description ?? "",
      note: row.note ?? "",
    });
    setOpenDialog(true);
  }

  async function handleSave() {
    // Basic validation
    if (!form.code?.trim()) return toast.error("Code requis");
    if (!/^[A-Z0-9_]+$/.test(form.code)) return toast.error("Code: MAJUSCULES, chiffres et _ uniquement");
    if (!form.label?.toString().trim()) return toast.error("Label requis");

    const payload = {
      code: form.code.trim(),
      label: (form.label || "").toString().trim(),
      description: form.description?.toString().trim() || null,
      note: form.note?.toString().trim() || null,
    };

    const isEdit = !!editing;
    let error;
    if (isEdit) {
      ({ error } = await supabase.from(activeTable).update(payload).eq("id", editing!.id));
    } else {
      ({ error } = await supabase.from(activeTable).insert(payload));
    }

    if (error) return toast.error(`Échec de l'enregistrement: ${error.message}`);

    toast.success("Enregistré ✅");
    setOpenDialog(false);
    setEditing(null);
    setForm(emptyRow);
    await fetchRows();
  }

  async function handleDelete(row: RefRow) {
    if (!confirm(`Supprimer ${row.code} ?`)) return;
    const { error } = await supabase.from(activeTable).delete().eq("id", row.id);
    if (error) return toast.error(`Suppression impossible: ${error.message}`);
    toast.success("Supprimé ✅");
    await fetchRows();
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const s = search.toLowerCase();
    return rows.filter(r =>
      (r.code || "").toLowerCase().includes(s) ||
      (r.label || "").toLowerCase().includes(s) ||
      (r.description || "").toLowerCase().includes(s)
    );
  }, [rows, search]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Select value={activeTable} onValueChange={setActiveTable}>
            <SelectTrigger className="w-80">
              <SelectValue placeholder="Choisir une table" />
            </SelectTrigger>
            <SelectContent>
              {REF_TABLES.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchRows} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" /> Rafraîchir
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Rechercher code/label/description…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-80"
          />
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Nouveau
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Éléments ({filtered.length}{search ? `/${rows.length}` : ``})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto border rounded-md">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 text-left">
                  <th className="px-3 py-2 w-[220px]">code</th>
                  <th className="px-3 py-2 w-[280px]">label</th>
                  {visibleColumns.includes("description") && <th className="px-3 py-2">description</th>}
                  {visibleColumns.includes("note") && <th className="px-3 py-2">note</th>}
                  <th className="px-3 py-2 w-[120px]"></th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td className="px-3 py-4" colSpan={8}>Chargement…</td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td className="px-3 py-4" colSpan={8}>Aucun élément</td>
                  </tr>
                )}
                {!loading && filtered.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2 font-mono">{r.code}</td>
                    <td className="px-3 py-2">{r.label}</td>
                    {visibleColumns.includes("description") && (
                      <td className="px-3 py-2 max-w-[420px] truncate" title={r.description || undefined}>{r.description}</td>
                    )}
                    
                    {visibleColumns.includes("note") && (
                      <td className="px-3 py-2 max-w-[420px] truncate" title={r.note || undefined}>{r.note}</td>
                    )}
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2 justify-end">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(r)} title="Modifier">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(r)} title="Supprimer">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <EditDialog
        open={openDialog}
        setOpen={setOpenDialog}
        form={form}
        setForm={setForm}
        onCancel={() => {
          setOpenDialog(false);
          setEditing(null);
        }}
        onSave={handleSave}
        title={editing ? `Modifier ${editing.code}` : "Nouvelle entrée"}
        visibleColumns={visibleColumns}
      />
    </div>
  );
}

function EditDialog({
  open,
  setOpen,
  form,
  setForm,
  onCancel,
  onSave,
  title,
  visibleColumns,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  form: Omit<RefRow, "id">;
  setForm: (v: Omit<RefRow, "id">) => void;
  onCancel: () => void;
  onSave: () => void;
  title: string;
  visibleColumns: RefColumnKey[];
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="code">code</Label>
            <Input
              id="code"
              placeholder="ESCLAVE / LIBRE_DE_COULEUR …"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            />
            <p className="text-xs text-muted-foreground">MAJUSCULES, chiffres et underscore uniquement.</p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="label">label</Label>
            <Input
              id="label"
              placeholder="libellé lisible (minuscule)"
              value={form.label ?? ""}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />
          </div>

          {visibleColumns.includes("description") && (
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="description">description</Label>
              <Textarea
                id="description"
                placeholder="explication courte / contexte historique"
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          )}

          {visibleColumns.includes("note") && (
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="note">note</Label>
              <Textarea
                id="note"
                placeholder="références juridiques, sources archivistiques…"
                value={form.note ?? ""}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" /> Annuler
          </Button>
          <Button onClick={onSave}>
            <Save className="mr-2 h-4 w-4" /> Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
