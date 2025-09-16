// ActeCoherence.tsx — version simplifiée
import { useEffect, useMemo, useRef, useState } from 'react';
import { useEtatCivilActesStore } from '@/store/useEtatCivilActesStore';
import type { Incoherence, RelationPreview } from '@/features/etat-civil/validation/types';
import { runAllValidators } from '@/features/etat-civil/validation/validators';

type Props = {
  acteId: string;
  erreurs?: Incoherence[];
  relations?: RelationPreview[];
};

const EMPTY_ERR: Readonly<Incoherence[]> = Object.freeze([]);
const EMPTY_REL: Readonly<RelationPreview[]> = Object.freeze([]);

export function ActeCoherence({ acteId, erreurs, relations }: Props) {
  const [loading, setLoading] = useState(true);
  const { fetchActeDetail, entites, acte } = useEtatCivilActesStore();

  const fetchRef = useRef(fetchActeDetail);
  useEffect(() => { fetchRef.current(acteId); }, [acteId]);

  const computed = useMemo(() => {
    if (!acte) return EMPTY_ERR;
    if (erreurs?.length) return erreurs;
    return runAllValidators(acte as any, entites as any[], (relations ?? EMPTY_REL) as any[]);
  }, [acte, entites, erreurs, relations]);

  useEffect(() => { if (loading && acte) setLoading(false); }, [loading, acte]);

  if (loading) return <p className="text-sm text-muted-foreground">Analyse en cours…</p>;

  const byActor = useMemo(() => {
    return computed.reduce<Record<string, Incoherence[]>>((acc, e) => {
      (acc[e.acteurId] ||= []).push(e);
      return acc;
    }, {});
  }, [computed]);

  const count = computed.length;
  const has = Object.keys(byActor).length > 0;

  return (
    <div className="rounded-md border p-4 mt-4 bg-muted/10">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold text-base">Incohérences détectées</h2>
        <span className="text-xs text-muted-foreground">{count} point{count>1?'s':''}</span>
      </div>

      {!has ? (
        <p className="text-sm text-green-700">✅ Pas d’incohérence.</p>
      ) : (
        Object.entries(byActor).map(([acteurId, errs]) => (
          <div key={acteurId} className="mb-3">
            <h3 className="text-sm font-medium mb-1">👤 {errs[0].acteurLabel}</h3>
            <ul className="list-disc list-inside text-sm space-y-1">
              {errs.map((e, i) => (
                <li key={i} className={
                  e.level === 'error' ? 'text-red-700' :
                  e.level === 'warning' ? 'text-orange-700' : 'text-blue-700'
                }>
                  {e.message}
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
