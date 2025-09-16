// ProfessionsTable.tsx
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { AssocierProfessionButton } from './AssocierProfessionButton';

type Row = { profession_brut: string; occurence_transcription: number; occurence_assoc: number };

function status(t: number, m: number) {
  if (m === 0)
    return {
      label: 'À faire',
      cls: 'bg-red-100 text-red-800',
      icon: <XCircle className='w-4 h-4 text-red-600' />,
    };
  if (m === t)
    return {
      label: 'Terminé',
      cls: 'bg-green-100 text-green-800',
      icon: <CheckCircle className='w-4 h-4 text-green-600' />,
    };
  return {
    label: 'Partiel',
    cls: 'bg-yellow-100 text-yellow-800',
    icon: <AlertCircle className='w-4 h-4 text-yellow-600' />,
  };
}

export default function ProfessionsTable() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('v_professions_stats').select('*');
    if (!error)
      setRows(
        (data ?? []).sort((a, b) => a.profession_brut?.localeCompare(b.profession_brut ?? '') || 0),
      );
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // 👉 Calcul des totaux par statut
  const totals = rows.reduce(
    (acc, r) => {
      const s = status(r.occurence_transcription, r.occurence_assoc);
      acc[s.label] = (acc[s.label] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className='p-4'>
      <h2 className='text-lg font-semibold mb-4'>Professions à associer</h2>
      {/* Résumé des statuts */}
      <div className='flex gap-4 mb-4'>
        <span className='flex items-center gap-1'>
          <XCircle className='w-4 h-4 text-red-600' /> À faire : {totals['À faire'] || 0}
        </span>
        <span className='flex items-center gap-1'>
          <AlertCircle className='w-4 h-4 text-yellow-600' /> Partiel : {totals['Partiel'] || 0}
        </span>
        <span className='flex items-center gap-1'>
          <CheckCircle className='w-4 h-4 text-green-600' /> Terminé : {totals['Terminé'] || 0}
        </span>
      </div>
      {loading ? (
        <p>Chargement…</p>
      ) : (
        <table className='min-w-full text-sm border'>
          <thead>
            <tr className='bg-gray-100 dark:bg-gray-800'>
              <th className='p-2 border'>Profession brute</th>
              <th className='p-2 border'># transcriptions</th>
              <th className='p-2 border'># associés</th>
              <th className='p-2 border'>Action</th>
              <th className='p-2 border'>Statut</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const s = status(r.occurence_transcription, r.occurence_assoc);
              return (
                <tr key={r.profession_brut}>
                  <td className='p-2 border'>
                    <div className='flex items-center gap-2'>
                      {s.icon}
                      {r.profession_brut}
                    </div>
                  </td>
                  <td className='p-2 border text-center'>{r.occurence_transcription}</td>
                  <td className='p-2 border text-center'>{r.occurence_assoc}</td>
                  <td className='p-2 border text-center'>
                    <AssocierProfessionButton
                      professionBrut={r.profession_brut}
                      onSuccess={fetchStats}
                    />
                  </td>
                  <td className='p-2 border text-center'>
                    <Badge className={s.cls}>{s.label}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
