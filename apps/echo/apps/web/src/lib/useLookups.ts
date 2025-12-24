// apps/web/src/lib/useLookups.ts
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "apps/web/supabase";


// Tables à lire (readonly)
const TABLES = [
  "lk_civilite","lk_persona","lk_relationship_to_me","lk_lifecycle_stage","lk_lead_source",
  "lk_channel","lk_optin_status","lk_email_type","lk_phone_type","lk_address_type","lk_language",
  "lk_profile","lk_informant_trust","lk_comm_tone","lk_share_method","lk_org_type","lk_sector",
  "lk_person_org_relation"
] as const;

type LkRow = { id: string; label_fr: string; label_en: string };
type MapArr = Record<(typeof TABLES)[number], LkRow[]>;

const cache: { data?: MapArr; ts?: number } = {};

export function useLookups(locale: "fr" | "en" = "fr") {
  const [data, setData] = useState<MapArr | null>(cache.data ?? null);
  const [loading, setLoading] = useState(!cache.data);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (cache.data) { setLoading(false); return; }
      setLoading(true);
      try {
        const entries = await Promise.all(TABLES.map(async (t) => {
          const { data, error } = await supabase.from(t).select("id,label_fr,label_en").order("id");
          if (error) throw error;
          return [t, data as LkRow[]] as const;
        }));
        const map = Object.fromEntries(entries) as MapArr;
        cache.data = map; cache.ts = Date.now();
        if (mounted) setData(map);
      } catch (e:any) {
        if (mounted) setError(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const pick = (rows?: LkRow[]) => (rows ?? []).map(r => ({ id: r.id, label: locale === "fr" ? r.label_fr : r.label_en }));

  const lookups = useMemo(() => {
    if (!data) return null;
    return {
      civilites:            pick(data.lk_civilite),
      personas:             pick(data.lk_persona),
      relationships:        pick(data.lk_relationship_to_me),
      lifecycleStages:      pick(data.lk_lifecycle_stage),
      leadSources:          pick(data.lk_lead_source),
      channels:             pick(data.lk_channel),
      optins:               pick(data.lk_optin_status),
      emailTypes:           pick(data.lk_email_type),
      phoneTypes:           pick(data.lk_phone_type),
      addressTypes:         pick(data.lk_address_type),
      languages:            pick(data.lk_language),
      profiles:             pick(data.lk_profile),
      trusts:               pick(data.lk_informant_trust),
      commTones:            pick(data.lk_comm_tone),
      shareMethods:         pick(data.lk_share_method),
      orgTypes:             pick(data.lk_org_type),
      sectors:              pick(data.lk_sector),
      personOrgRelations:   pick(data.lk_person_org_relation),
    };
  }, [data, locale]);

  return { lookups, loading, error };
}