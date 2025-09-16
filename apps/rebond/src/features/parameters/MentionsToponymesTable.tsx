//MentionsToponymesTable.tsx

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { AssocierToponymeButton } from './AssocierToponymeButton';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

type LieuBrutStat = {
    texte_brut: string;
    occurence_transcription: number;
    occurence_mentions: number;
};

function getStatusLabel(t: number, m: number) {
    if (m === 0) {
        return { label: 'À faire', className: 'bg-red-100 text-red-800', icon: <XCircle className="w-4 h-4 text-red-600" />, };
    }
    if (t === m) {
        return { label: 'Terminé', className: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4 text-green-600" /> };
    }
    return { label: 'Partiel', className: 'bg-yellow-100 text-yellow-800', icon: <AlertCircle className="w-4 h-4 text-yellow-600" /> };
}

export default function MentionsToponymesTable() {
    const [data, setData] = useState<LieuBrutStat[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('v_toponymes_mentions_stats')
      .select('*');

    if (error) {
      console.error('Erreur chargement stats lieux', error);
    } else {
      setData((data ?? []).sort((a, b) => a.texte_brut?.localeCompare(b.texte_brut ?? '') || 0));
    }

    setLoading(false);
  };

    return (
        <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">Mentions toponymes à associer</h2>
            {loading ? (
                <p>Chargement...</p>
            ) : (
                <table className="min-w-full text-sm border">
                    <thead>
                        <tr className="bg-gray-100 dark:bg-gray-800">
                            <th className="p-2 border">Lieu brut</th>
                            <th className="p-2 border"># transcription</th>
                            <th className="p-2 border"># mentions</th>
                            <th className="p-2 border">Action</th>
                            <th className="p-2 border">Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row) => {
                            const status = getStatusLabel(row.occurence_transcription, row.occurence_mentions);
                            return (
                                <tr key={row.texte_brut}>
                                    <td className="p-2 border">
                                        <div className="flex items-center gap-2">
                                            {status.icon}
                                            {row.texte_brut}
                                        </div>
                                    </td>
                                    <td className="p-2 border text-center">{row.occurence_transcription}</td>
                                    <td className="p-2 border text-center">{row.occurence_mentions}</td>
                                    <td className="p-2 border text-center">
                                        <AssocierToponymeButton texteBrut={row.texte_brut} onSuccess={fetchStats} />
                                    </td>
                                    <td className="p-2 border text-center">
                                        <Badge className={status.className}>{status.label}</Badge>
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
