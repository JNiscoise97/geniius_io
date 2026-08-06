import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type MetaTable = {
  table_schema: string;
  table_name: string;
  table_type: "BASE TABLE" | "VIEW" | string;
};

type MetaColumn = {
  table_schema: string;
  table_name: string;
  column_name: string;
  ordinal_position: number;
  data_type: string;
  udt_name: string;
  is_nullable: "YES" | "NO";
  character_maximum_length: number | null;
  numeric_precision: number | null;
  numeric_scale: number | null;
  datetime_precision: number | null;
  column_default: string | null;
};

type MetaConstraint = {
  table_schema: string;
  table_name: string;
  constraint_name: string;
  constraint_type: "PRIMARY KEY" | "UNIQUE" | "CHECK" | "FOREIGN KEY" | string;
};

type MetaConstraintCol = MetaConstraint & {
  column_name: string | null;
  foreign_table_schema: string | null;
  foreign_table_name: string | null;
  foreign_column_name: string | null;
};


export function SchemaExplorer() {
  const [tables, setTables] = useState<MetaTable[]>([]);
  const [columns, setColumns] = useState<MetaColumn[]>([]);
  const [constraints, setConstraints] = useState<MetaConstraint[]>([]);
  const [constraintCols, setConstraintCols] = useState<MetaConstraintCol[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<{ schema: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load all metadata once
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [t, c, k, kc] = await Promise.all([
          supabase.from("v_meta_tables").select("*"),
          supabase.from("v_meta_columns").select("*"),
          supabase.from("v_meta_constraints").select("*"),
          supabase.from("v_meta_constraint_columns").select("*"),
        ]);
        if (t.error) throw t.error;
        if (c.error) throw c.error;
        if (k.error) throw k.error;
        if (kc.error) throw kc.error;

        setTables((t.data ?? []) as MetaTable[]);
        setColumns((c.data ?? []) as MetaColumn[]);
        setConstraints((k.data ?? []) as MetaConstraint[]);
        setConstraintCols((kc.data ?? []) as MetaConstraintCol[]);
      } catch (e: any) {
        setError(e.message ?? "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const schemas = useMemo(
    () => Array.from(new Set(tables.map((t) => t.table_schema))).sort(),
    [tables]
  );

  const tablesBySchema = useMemo(() => {
    const m = new Map<string, MetaTable[]>();
    for (const s of schemas) m.set(s, []);
    for (const t of tables) {
      m.set(t.table_schema, [...(m.get(t.table_schema) ?? []), t]);
    }
    for (const [s, arr] of m) m.set(s, arr.sort((a, b) => a.table_name.localeCompare(b.table_name)));
    return m;
  }, [schemas, tables]);

  const selectedColumns = useMemo(() => {
    if (!selected) return [];
    return columns
      .filter((c) => c.table_schema === selected.schema && c.table_name === selected.name)
      .sort((a, b) => a.ordinal_position - b.ordinal_position);
  }, [selected, columns]);

  const selectedConstraints = useMemo(() => {
    if (!selected) return [];
    return constraints.filter(
      (k) => k.table_schema === selected.schema && k.table_name === selected.name
    );
  }, [selected, constraints]);

  const selectedConstraintCols = useMemo(() => {
    if (!selected) return [];
    return constraintCols.filter(
      (kc) => kc.table_schema === selected.schema && kc.table_name === selected.name
    );
  }, [selected, constraintCols]);

  if (loading) return <div className="p-4">Chargement du schéma…</div>;
  if (error) return <div className="p-4 text-red-600">Erreur : {error}</div>;

  return (
    <div className="grid grid-cols-12 gap-4 p-4">
      {/* Colonne gauche : liste des tables */}
      <div className="col-span-4 border rounded-xl overflow-hidden">
        <div className="p-3 font-semibold bg-gray-50 border-b">Tables</div>
        <div className="max-h-[70vh] overflow-auto">
          {schemas.map((schema) => (
            <div key={schema} className="px-3 py-2">
              <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">{schema}</div>
              <ul className="space-y-1">
                {tablesBySchema.get(schema)?.map((t) => {
                  const isSel = selected?.schema === t.table_schema && selected?.name === t.table_name;
                  return (
                    <li key={`${t.table_schema}.${t.table_name}`}>
                      <button
                        className={`w-full text-left px-2 py-1 rounded hover:bg-gray-100 ${
                          isSel ? "bg-gray-100 font-medium" : ""
                        }`}
                        onClick={() => setSelected({ schema: t.table_schema, name: t.table_name })}
                      >
                        {t.table_name}
                        <span className="ml-2 text-[10px] text-gray-500">({t.table_type})</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Colonne droite : détails */}
      <div className="col-span-8">
        {!selected ? (
          <div className="h-full grid place-items-center text-gray-500">
            Sélectionne une table à gauche
          </div>
        ) : (
          <div className="space-y-6">
            <div className="border rounded-xl overflow-hidden">
              <div className="p-3 bg-gray-50 border-b">
                <div className="font-semibold">
                  {selected.schema}.{selected.name}
                </div>
              </div>
              <div className="p-3">
                <div className="text-sm mb-2 font-medium">Colonnes</div>
                <div className="overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead className="text-left border-b">
                      <tr>
                        <th className="py-1 pr-3">#</th>
                        <th className="py-1 pr-3">Colonne</th>
                        <th className="py-1 pr-3">Type</th>
                        <th className="py-1 pr-3">Nullable</th>
                        <th className="py-1 pr-3">Default</th>
                        <th className="py-1 pr-3">Taille/Précision</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedColumns.map((c) => (
                        <tr key={c.column_name} className="border-b last:border-0">
                          <td className="py-1 pr-3 tabular-nums">{c.ordinal_position}</td>
                          <td className="py-1 pr-3 font-mono">{c.column_name}</td>
                          <td className="py-1 pr-3">
                            {c.data_type}
                            {c.udt_name && c.udt_name !== c.data_type ? ` (${c.udt_name})` : ""}
                          </td>
                          <td className="py-1 pr-3">{c.is_nullable}</td>
                          <td className="py-1 pr-3 font-mono">{c.column_default ?? "—"}</td>
                          <td className="py-1 pr-3">
                            {c.character_maximum_length ?? c.numeric_precision ?? c.datetime_precision ?? "—"}
                            {c.numeric_scale != null ? ` / ${c.numeric_scale}` : ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="border rounded-xl overflow-hidden">
              <div className="p-3 bg-gray-50 border-b">
                <div className="text-sm font-medium">Contraintes</div>
              </div>
              <div className="p-3 space-y-4">
                {selectedConstraints.length === 0 ? (
                  <div className="text-sm text-gray-500">Aucune contrainte.</div>
                ) : (
                  selectedConstraints.map((k) => {
                    const cols = selectedConstraintCols.filter(
                      (c) => c.constraint_name === k.constraint_name
                    );
                    return (
                      <div key={k.constraint_name} className="border rounded p-3">
                        <div className="text-sm font-semibold">
                          {k.constraint_type} — <span className="font-mono">{k.constraint_name}</span>
                        </div>
                        {cols.length > 0 && (
                          <ul className="mt-2 text-sm list-disc pl-5">
                            {cols.map((c, i) => (
                              <li key={i}>
                                {c.column_name ? (
                                  <span>
                                    colonne <span className="font-mono">{c.column_name}</span>
                                  </span>
                                ) : (
                                  <span>—</span>
                                )}
                                {k.constraint_type === "FOREIGN KEY" && c.foreign_table_name && (
                                  <span>
                                    {" "}
                                    → {c.foreign_table_schema}.{c.foreign_table_name}.
                                    <span className="font-mono">{c.foreign_column_name}</span>
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
