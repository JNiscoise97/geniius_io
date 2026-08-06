//useDictMonoField.ts

import { useEffect, useMemo } from "react";
import type { DictionnaireKind } from "@/components/shared/DictionnaireEditorPanel";
import { supabase } from "@/lib/supabase";

/**
 * Hook utilitaire pour gérer un champ "dictionnaire mono-sélection" :
 * - Affiche chips (labels + colors)
 * - Ouvre le drawer dictionnaire via un "openDict" fourni par le parent (1 seul Sheet partagé)
 * - Clear (UI + valeur persistée)
 * - Hydrate label/couleur depuis une table si label manquant
 */

export type DictOpenArgs = {
  kind: DictionnaireKind;
  title: string;
  multi: boolean;
  defaultSelectedIds: string[];
  onValidate: (items: { id: string; code: string; label: string }[]) => Promise<void> | void;
};

export type DictHydrateConfig = {
  table: string;
  select: string; // ex: "id,label" ou "id,label,color"
  map: (row: any) => { label?: string | null; color?: string | null };
};

export function useDictMonoField(opts: {
  // Drawer orchestration (parent)
  openDict: (args: DictOpenArgs) => void;

  // Dico
  kind: DictionnaireKind;
  title: string;

  // Valeur persistée
  id: string | null;
  setId?: (v: string | null) => void;

  // Cache UI (pour éviter re-fetch)
  label?: string | null;
  setLabel?: (v: string | null) => void;

  color?: string | null;
  setColor?: (v: string | null) => void;

  // Hydratation depuis table si label manquant
  hydrate?: DictHydrateConfig;

  // Display fallback si label vide
  fallbackLabelPrefix?: string; // ex: "Type:"
}) {
  const {
    openDict,
    kind,
    title,
    id,
    setId,
    label,
    setLabel,
    color,
    setColor,
    hydrate,
    fallbackLabelPrefix = "ID:",
  } = opts;

  // ---- Display ----
  const ids = useMemo(() => (id ? [id] : []), [id]);

  const labels = useMemo(() => {
    if (!id) return [];
    const l = (label ?? "").trim();
    if (l) return [l];
    return [`${fallbackLabelPrefix} ${id.slice(0, 8)}…`];
  }, [id, label, fallbackLabelPrefix]);

  const colors = useMemo(() => {
    if (!id) return [];
    return [color ?? null];
  }, [id, color]);

  // ---- Hydrate (si label vide) ----
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!hydrate) return;
      if (!id) return;

      const hasLabel = Boolean((label ?? "").trim());
      if (hasLabel) return;

      const res = await supabase
        .from(hydrate.table)
        .select(hydrate.select)
        .eq("id", id)
        .single();

      if (cancelled) return;
      if (res.error) return;

      const mapped = hydrate.map(res.data ?? {});
      if (mapped.label !== undefined) setLabel?.(mapped.label ?? null);
      if (mapped.color !== undefined) setColor?.(mapped.color ?? null);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [id, label, hydrate?.table, hydrate?.select]);

  // ---- Actions ----
  const onDelete = () => {
    setId?.(null);
    setLabel?.(null);
    setColor?.(null);
  };

  const onEdit = () => {
    openDict({
      kind,
      title,
      multi: false,
      defaultSelectedIds: ids,
      onValidate: async (items) => {
        const first = items?.[0];
        const nextId = first?.id ?? null;

        setId?.(nextId);
        setLabel?.(first?.label ?? null);

        // Si la couleur n'est pas fournie par le dictionnaire, on la récupère via hydrate (si configuré)
        if (nextId && hydrate?.select?.includes("color")) {
          const res = await supabase
            .from(hydrate.table)
            .select(hydrate.select)
            .eq("id", nextId)
            .single();

          if (!res.error) {
            const mapped = hydrate.map(res.data ?? {});
            if (mapped.color !== undefined) setColor?.(mapped.color ?? null);
          }
        } else {
          // sinon on clear la couleur, sauf si tu veux la conserver
          if (setColor) setColor(null);
        }
      },
    });
  };

  return { ids, labels, colors, onEdit, onDelete };
}
