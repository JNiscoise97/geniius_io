// useActeCitationsSources.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  type ActeCitationRow,
  type CitationDraft,
  type ExemplairePick,
} from '../transcriptionTab.service';

export function emptyCitation(acteId: string): CitationDraft {
  return {
    id: 'tmp-' + crypto.randomUUID(),
    acte_id: acteId,
    exemplaire_id: null,
    loc_start: null,
    loc_end: null,
    loc_raw: null,
    is_missing: null,
    note: null,
    sort_order: 0,
    marginal_mentions_present: null,
    marginal_mentions_count: null,
    signatures_present: null,
    signatures_count: null,
    marginal_crossouts_present: null,
    marginal_crossouts_count: null,
    exemplaire: null,
  };
}

function normalizeCitationRow(r: ActeCitationRow): CitationDraft {
  return {
    id: r.id,
    acte_id: r.acte_id,
    exemplaire_id: r.exemplaire_id,
    loc_start: r.loc_start,
    loc_end: r.loc_end,
    loc_raw: r.loc_raw,
    is_missing: Boolean(r.is_missing),
    note: r.note,
    sort_order: r.sort_order,
    marginal_mentions_present: r.marginal_mentions_present,
    marginal_mentions_count: r.marginal_mentions_count,
    signatures_present: r.signatures_present,
    signatures_count: r.signatures_count,
    marginal_crossouts_present: r.marginal_crossouts_present,
    marginal_crossouts_count: r.marginal_crossouts_count,
    exemplaire: null,
  };
}

function bestPickPerExemplaire(picks: any[]): Map<string, ExemplairePick> {
  const bestByManId = new Map<string, ExemplairePick>();

  for (const r of picks) {
    const candidate: ExemplairePick = {
      exemplaire_id: r.exemplaire_id,
      nature_id: r.nature_ref ?? null,
      unite_id: r.unite_id ?? null,
      unite_titre: r.unite_titre ?? null,
      nature_code: r.nature_code ?? null,
      nature_label: r.nature_label ?? null,
      support_id: r.support_ref ?? null,
      support_code: r.support_code ?? null,
      support_label: r.support_label ?? null,
      physical_condition_ref: r.physical_condition_ref ?? null,
      physical_condition_code: r.physical_condition_code ?? null,
      physical_condition_label: r.physical_condition_label ?? null,
      cote_locale: r.cote_locale ?? null,
      pagination_type_ref: r.pagination_type_ref ?? null,
      pagination_type_code: r.pagination_type_code ?? null,
      pagination_type_label: r.pagination_type_label ?? null,
      nb_pages: r.nb_pages,
      depot_nom: r.depot_nom ?? null,
      depot_is_online: r.depot_is_online ?? null,
      depot_is_physical: r.depot_is_physical ?? null,
      institution_nom: r.institution_nom ?? null,
      institution_sigle: r.institution_sigle ?? null,
      identifiant_interne: r.identifiant_interne,
      localisation_interne: r.localisation_interne,
      etat_conservation: r.etat_conservation,
      qualite: r.qualite,
      url_base: r.url_base ?? null,
      plateforme_code: r.plateforme_code ?? null,
      source_exemplaire_id: r.source_exemplaire_id ?? null,
    };

    const current = bestByManId.get(candidate.exemplaire_id);
    if (!current) {
      bestByManId.set(candidate.exemplaire_id, candidate);
      continue;
    }

    // règle: préférer une ligne avec url_base si possible
    const curHasUrl = Boolean((current.url_base ?? '').trim());
    const candHasUrl = Boolean((candidate.url_base ?? '').trim());

    if (!curHasUrl && candHasUrl) {
      bestByManId.set(candidate.exemplaire_id, candidate);
    }
  }

  return bestByManId;
}

export function useActeCitationsSources(acteId: string) {
  const [sources, setSources] = useState<CitationDraft[]>([]);
  const [loadingSources, setLoadingSources] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoadingSources(true);
      setErrorMsg(null);

      // 1) load raw citations
      const { data, error } = await supabase
        .from('etat_civil_acte_citations')
        .select(
          'id, acte_id, exemplaire_id, loc_start, loc_end, loc_raw, is_missing, note, sort_order, marginal_mentions_present,marginal_mentions_count, signatures_present, signatures_count, marginal_crossouts_present, marginal_crossouts_count',
        )
        .eq('acte_id', acteId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (cancelled) return;

      if (error) {
        setErrorMsg(error.message);
        setSources([]);
        setLoadingSources(false);
        return;
      }

      const rows = (data ?? []) as ActeCitationRow[];
      const drafts = rows.map((r) => normalizeCitationRow(r));

      if (!drafts.length) {
        setSources([]);
        setLoadingSources(false);
        return;
      }

      // 2) enrich from view
      const manIds = Array.from(
        new Set(drafts.map((d) => d.exemplaire_id).filter(Boolean) as string[]),
      );

      if (!manIds.length) {
        setSources(drafts);
        setLoadingSources(false);
        return;
      }

      const { data: pickData, error: pickErr } = await supabase
        .from('v_exemplaires_pick')
        .select(
          'exemplaire_id,nature_ref,nature_code,nature_label,support_ref,support_code,support_label,unite_id,unite_titre,cote_locale,pagination_type_ref,pagination_type_code,pagination_type_label,nb_pages,depot_nom,depot_is_online,depot_is_physical,institution_nom,institution_sigle,url_base,plateforme_code,source_exemplaire_id,identifiant_interne,localisation_interne,physical_condition_ref,physical_condition_code,physical_condition_label',
        )
        .in('exemplaire_id', manIds);

      if (cancelled) return;

      if (pickErr) {
        setSources(drafts);
        setLoadingSources(false);
        return;
      }

      const bestByManId = bestPickPerExemplaire(pickData ?? []);

      const enriched = drafts.map((d) => {
        const e = d.exemplaire_id ? bestByManId.get(d.exemplaire_id) : null;
        if (!e) return d;

        return {
          ...d,
          exemplaire: {
            exemplaire_id: e.exemplaire_id,
            unite_id: e.unite_id,
            nature_id: e.nature_id,
            nature_code: e.nature_code,
            nature_label: e.nature_label,
            support_id: e.support_id ?? null,
            support_code: e.support_code ?? null,
            support_label: e.support_label ?? null,
            physical_condition_ref: e.physical_condition_code ?? null,
            physical_condition_code: e.physical_condition_code ?? null,
            physical_condition_label: e.physical_condition_code ?? null,
            unite_titre: e.unite_titre,
            cote_locale: e.cote_locale,
            pagination_type_ref: e.pagination_type_ref,
            pagination_type_code: e.pagination_type_code,
            pagination_type_label: e.pagination_type_label,
            nb_pages: e.nb_pages,
            depot_nom: e.depot_nom,
            depot_is_online: e.depot_is_online,
            depot_is_physical: e.depot_is_physical,
            institution_nom: e.institution_nom,
            institution_sigle: e.institution_sigle,
            identifiant_interne: e.identifiant_interne,
            localisation_interne: e.localisation_interne,
            etat_conservation: e.etat_conservation,
            qualite: e.qualite,
            url_base: e.url_base,
            plateforme_code: e.plateforme_code,
            source_exemplaire_id: e.source_exemplaire_id,
          },
        } satisfies CitationDraft;
      });

      setSources(enriched);
      setLoadingSources(false);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [acteId]);

  return { sources, setSources, loadingSources, errorMsg };
}
