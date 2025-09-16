// src/pages/FunctionExecutorPage.tsx

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectItem, SelectTrigger, SelectContent, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/shared/DataTable';
import { supabase } from '@/lib/supabase';

type SqlFunction = {
  label: string;
  value: string;
  execute: () => Promise<any[]>;
};

const functionsList: SqlFunction[] = [
  {
    label: 'Rôles distincts',
    value: 'get_distinct_roles',
    execute: async () => {
      const { data, error } = await supabase.rpc('get_distinct_roles');
      if (error) throw new Error(error.message);
      return data;
    },
  },
  // Ajoute ici d'autres fonctions si besoin
];

export function SqlFunctionsExecutorPage() {
  const [selectedFunc, setSelectedFunc] = useState<string | null>(null);
  const [results, setResults] = useState<any[] | null>(null);
  const [columns, setColumns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const selected = functionsList.find((f) => f.value === selectedFunc);

  const handleExecute = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const data = await selected.execute();
      setResults(data);

      // Génère dynamiquement les colonnes du DataTable
      if (data.length > 0) {
        const cols = Object.keys(data[0]).map((key) => ({
          key: key,
          label: key.toUpperCase(),
        }));
        setColumns(cols);
      } else {
        setColumns([]);
      }
    } catch (e) {
      console.error('[FunctionExecutorPage] Error executing function:', e);
      setResults([]);
      setColumns([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Exécuter une fonction SQL</h1>

      <div className="flex items-center gap-4">
        <Select onValueChange={(v) => setSelectedFunc(v)}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Choisir une fonction..." />
          </SelectTrigger>
          <SelectContent>
            {functionsList.map((func) => (
              <SelectItem key={func.value} value={func.value}>
                {func.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={handleExecute} disabled={!selected || loading}>
          {loading ? 'Exécution...' : 'Exécuter'}
        </Button>
      </div>

      <div className="mt-6">
        {results && <DataTable data={results} columns={columns} />}
        {!results && <p className="text-muted-foreground">Aucun résultat à afficher.</p>}
      </div>
    </div>
  );
}
