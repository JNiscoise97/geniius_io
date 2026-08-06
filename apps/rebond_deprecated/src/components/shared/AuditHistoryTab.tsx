import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  CheckCircle2,
  PlusCircle,
  MinusCircle,
  Trash2,
  RefreshCw,
  User,
  Database,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type AuditRow = {
  id: string;
  at: string; // timestamptz
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  table_name: string;
  row_id: string | null;
  pk_text: string | null;
  user_id: string | null;
  session_id: string | null;
  old_data: Record<string, any> | null;
  new_data: Record<string, any> | null;
  diff: Record<string, { old: any; new: any }> | null;
  ip: string | null;
  ua: string | null;
  entity_type: string | null;
  entity_id: string | null;
  entity_label: string | null;
};

export default function AuditHistoryTab({
  acteId,
  actorIds = [],
}: {
  acteId: string;
  actorIds?: string[];
}) {
  console.log('acteId', acteId);
  console.log('actorIds', actorIds);
  const [includeActors, setIncludeActors] = useState(true);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageSize] = useState(50);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<AuditRow[]>([]);

  const friendlyTable = (t?: string | null) => {
    if (!t) return '—';
    if (t === 'etat_civil_actes') return 'Acte';
    if (t === 'transcription_entites_acteurs') return 'Acteur';
    return t;
  };

  const actionIcon = (a: AuditRow['action']) => {
    if (a === 'INSERT') return <PlusCircle className='w-4 h-4' />;
    if (a === 'UPDATE') return <CheckCircle2 className='w-4 h-4' />;
    return <Trash2 className='w-4 h-4' />;
  };

  const actionBadgeClass = (a: AuditRow['action']) =>
    a === 'INSERT'
      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
      : a === 'UPDATE'
        ? 'bg-amber-50 text-amber-700 border border-amber-200'
        : 'bg-rose-50 text-rose-700 border border-rose-200';

  const shallowDiff = (
    oldObj?: Record<string, any> | null,
    newObj?: Record<string, any> | null,
  ) => {
    const out: Record<string, { old: any; new: any }> = {};
    const keys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);
    keys.forEach((k) => {
      const ov = oldObj?.[k];
      const nv = newObj?.[k];
      const same = JSON.stringify(ov) === JSON.stringify(nv);
      if (!same) out[k] = { old: ov, new: nv };
    });
    return out;
  };

  const fetchOnce = useCallback(async () => {
    setLoading(true);
    console.log('ici 1');
    try {
      // 1) Logs de l'acte
      const { data: acteLogs, error: acteErr } = await supabase
        .from('app_audit_log')
        .select('*')
        .or(`row_id.eq.${acteId},entity_id.eq.${acteId}`)
        .eq('table_name', 'etat_civil_actes')
        .order('at', { ascending: false });

      if (acteErr) throw acteErr;

      // 2) Logs des acteurs liés (si demandé et si on a des ids)
      let acteurLogs: AuditRow[] = [];

      if (includeActors && actorIds.length) {
        const ids = [...new Set(actorIds.filter(Boolean))];
        const parts: AuditRow[][] = [];

        // A) via row_id
        const { data: byRowId, error: errRow } = await supabase
          .from('app_audit_log')
          .select('*')
          .eq('table_name', 'transcription_entites_acteurs')
          .in('row_id', ids)
          .order('at', { ascending: false });
        if (errRow) throw errRow;
        parts.push((byRowId as AuditRow[]) || []);

        // B) via entity_id (au cas où row_id serait null / non rempli sur certaines lignes)
        const { data: byEntityId, error: errEnt } = await supabase
          .from('app_audit_log')
          .select('*')
          .eq('table_name', 'transcription_entites_acteurs')
          .in('entity_id', ids)
          .order('at', { ascending: false });
        if (errEnt) throw errEnt;
        parts.push((byEntityId as AuditRow[]) || []);

        // Merge & de-dupe par id
        const map = new Map<string, AuditRow>();
        parts.flat().forEach((r) => map.set(r.id, r));
        acteurLogs = Array.from(map.values());
      }

      console.log('acteLogs', acteLogs);
      console.log('acteurLogs', acteurLogs);

      const merged = [...(acteLogs || []), ...(acteurLogs || [])]
        .map((r) => ({
          ...r,
          // fallback diff si non fourni
          diff: r.diff && Object.keys(r.diff).length ? r.diff : shallowDiff(r.old_data, r.new_data),
        }))
        .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

      setRows(merged);
    } catch (e: any) {
      console.error(e);
      toast.error(`Impossible de charger l’historique : ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  }, [acteId, actorIds, includeActors]);

  useEffect(() => {
    setPage(1);
    fetchOnce();
  }, [fetchOnce]);

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) => {
      const blob =
        JSON.stringify(
          {
            at: r.at,
            action: r.action,
            table: r.table_name,
            entity_label: r.entity_label,
            pk_text: r.pk_text,
            diff: r.diff,
            old: r.old_data,
            neu: r.new_data,
          },
          null,
          2,
        ) || '';
      return blob.toLowerCase().includes(q);
    });
  }, [rows, query]);

  const pageRows = filtered.slice(0, page * pageSize);

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center gap-3'>
        <div className='flex items-center gap-2'>
          <Switch checked={includeActors} onCheckedChange={setIncludeActors} id='include-actors' />
          <label htmlFor='include-actors' className='text-sm text-gray-700'>
            Inclure l’activité des acteurs liés
          </label>
        </div>
        <div className='flex-1' />
        <div className='flex items-center gap-2'>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Rechercher dans l’historique…'
            className='w-72'
          />
          <Button variant='outline' onClick={() => fetchOnce()} disabled={loading}>
            <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
            Rafraîchir
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-base'>
            Historique ({filtered.length}
            {rows.length !== filtered.length ? ` / ${rows.length}` : ''})
          </CardTitle>
        </CardHeader>
        <CardContent className='divide-y'>
          {loading && <div className='py-6 text-sm text-muted-foreground'>Chargement…</div>}
          {!loading && pageRows.length === 0 && (
            <div className='py-6 text-sm text-muted-foreground'>Aucune entrée.</div>
          )}

          {pageRows.map((r) => {
            const fields = Object.keys(r.diff || {});
            const label = r.entity_label || r.pk_text || (r.row_id ?? '—');
            return (
              <div key={r.id} className='py-3'>
                <div className='flex items-start gap-3'>
                  <Badge
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[11px]',
                      actionBadgeClass(r.action),
                    )}
                  >
                    <span className='inline-flex items-center gap-1'>
                      {actionIcon(r.action)} {r.action}
                    </span>
                  </Badge>

                  <div className='flex-1 min-w-0'>
                    <div className='flex flex-wrap items-center gap-x-3 gap-y-1'>
                      <span className='text-sm text-gray-900 font-medium'>
                        {friendlyTable(r.table_name)}
                      </span>
                      <span className='text-sm text-gray-500'>•</span>
                      <span className='text-sm text-gray-700 truncate'>{label}</span>
                      <span className='text-sm text-gray-500'>•</span>
                      <span className='text-xs text-gray-500'>
                        {new Date(r.at).toLocaleString()}
                      </span>
                      {r.user_id && (
                        <>
                          <span className='text-sm text-gray-500'>•</span>
                          <span className='inline-flex items-center gap-1 text-xs text-gray-600'>
                            <User className='w-3 h-3' /> {r.user_id}
                          </span>
                        </>
                      )}
                    </div>

                    {fields.length > 0 ? (
                      <div className='mt-1 text-xs text-gray-700'>
                        <span className='font-medium'>Champs modifiés:</span>{' '}
                        {fields.slice(0, 8).map((f, i) => (
                          <code key={f} className='px-1 py-0.5 rounded bg-gray-100 mr-1 break-all'>
                            {f}
                          </code>
                        ))}
                        {fields.length > 8 && (
                          <span className='text-gray-500'>+{fields.length - 8}</span>
                        )}
                      </div>
                    ) : (
                      <div className='mt-1 text-xs text-gray-500'>Aucun diff détecté.</div>
                    )}

                    {/* Détails déroulants */}
                    <details className='mt-2 group'>
                      <summary className='text-xs text-blue-700 hover:underline inline-flex items-center gap-1 cursor-pointer'>
                        <ChevronDown className='w-3 h-3 transition-transform group-open:rotate-180' />
                        Détails (old/new)
                      </summary>
                      <div className='mt-2 grid md:grid-cols-2 gap-3'>
                        <div>
                          <div className='text-[11px] text-gray-500 mb-1 inline-flex items-center gap-1'>
                            <MinusCircle className='w-3 h-3' /> Ancien
                          </div>
                          <pre className='text-xs bg-gray-50 p-2 rounded border overflow-auto max-h-72'>
                            {JSON.stringify(r.old_data, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <div className='text-[11px] text-gray-500 mb-1 inline-flex items-center gap-1'>
                            <PlusCircle className='w-3 h-3' /> Nouveau
                          </div>
                          <pre className='text-xs bg-gray-50 p-2 rounded border overflow-auto max-h-72'>
                            {JSON.stringify(r.new_data, null, 2)}
                          </pre>
                        </div>
                      </div>

                      {r.diff && Object.keys(r.diff).length > 0 && (
                        <>
                          <Separator className='my-3' />
                          <div>
                            <div className='text-[11px] text-gray-500 mb-1 inline-flex items-center gap-1'>
                              <Database className='w-3 h-3' /> Diff (champ → old → new)
                            </div>
                            <div className='grid md:grid-cols-2 gap-2'>
                              {Object.entries(r.diff).map(([k, v]) => (
                                <div key={k} className='text-xs bg-white border rounded p-2'>
                                  <div className='font-mono text-[11px] mb-1'>{k}</div>
                                  <div className='grid grid-cols-2 gap-2'>
                                    <pre className='bg-gray-50 p-2 rounded overflow-auto'>
                                      {JSON.stringify((v as any).old, null, 2)}
                                    </pre>
                                    <pre className='bg-gray-50 p-2 rounded overflow-auto'>
                                      {JSON.stringify((v as any).new, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </details>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {filtered.length > pageRows.length && (
        <div className='flex justify-center'>
          <Button variant='outline' onClick={() => setPage((p) => p + 1)}>
            Charger plus
          </Button>
        </div>
      )}
    </div>
  );
}
