import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── Helpers ─────────────────────────────────────────────

function getGaps(person: Record<string, unknown>): string[] {
  const gaps: string[] = [];
  if (!person.birth_date)  gaps.push("birth_date");
  if (!person.birth_place) gaps.push("birth_place");
  if (!person.death_date)  gaps.push("death_date");
  if (!person.death_place) gaps.push("death_place");
  if (!person.occupation)  gaps.push("occupation");
  // Vérifie si les parents sont connus
  if (!((person.famc_ids as string[] | null)?.length)) gaps.push("parents");
  return gaps;
}

function formatPerson(p: Record<string, unknown>) {
  return {
    id:          p.id,
    first_name:  p.first_name,
    last_name:   p.last_name,
    nickname:    p.nickname,
    sex:         p.sex,
    birth_date:  p.birth_date,
    birth_year:  p.birth_year,
    birth_place: p.birth_place,
    death_date:  p.death_date,
    death_year:  p.death_year,
    death_place: p.death_place,
    occupation:  p.occupation,
    famc_ids:    p.famc_ids,
    fams_ids:    p.fams_ids,
  };
}

// ─── Handler ─────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const url  = new URL(req.url);
  const path = url.pathname.replace(/^\/functions\/v1\/tree-api/, "");

  // ── GET /person/search?q= ──────────────────────────────
  if (req.method === "GET" && path === "/person/search") {
    const q = url.searchParams.get("q")?.trim() ?? "";
    if (!q) return json({ results: [] });

    const { data, error } = await supabase
      .from("persons")
      .select("id, first_name, last_name, nickname, sex, birth_date, birth_year, birth_place, death_date, death_year, occupation, famc_ids, fams_ids")
      .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,nickname.ilike.%${q}%`)
      .limit(10);

    if (error) return json({ results: [], error: error.message });
    return json({ results: data ?? [] });
  }

  // ── GET /person/:id/relatives ──────────────────────────
  const relativesMatch = path.match(/^\/person\/([^/]+)\/relatives$/);
  if (req.method === "GET" && relativesMatch) {
    const personId = relativesMatch[1];
    const { data: person } = await supabase
      .from("persons")
      .select("famc_ids, fams_ids, first_name, last_name")
      .eq("id", personId)
      .single();

    if (!person) return json({ relatives: [] });

    const relatives: Record<string, unknown>[] = [];

    // Parents et fratrie via famcIds
    for (const famId of (person.famc_ids as string[] ?? [])) {
      const { data: fam } = await supabase
        .from("families")
        .select("husband_id, wife_id, child_ids")
        .eq("id", famId)
        .single();
      if (!fam) continue;

      const parentIds = [fam.husband_id, fam.wife_id].filter(Boolean) as string[];
      const siblingIds = ((fam.child_ids as string[]) ?? []).filter((id: string) => id !== personId);
      const allIds = [...parentIds, ...siblingIds];

      if (allIds.length > 0) {
        const { data: people } = await supabase
          .from("persons")
          .select("id, first_name, last_name, sex, birth_year, death_year")
          .in("id", allIds);

        for (const p of (people ?? [])) {
          const role =
            parentIds.includes(p.id as string)
              ? (p.sex === "M" ? "father" : "mother")
              : "sibling";
          relatives.push({ ...p, role });
        }
      }
    }

    // Conjoints et enfants via famsIds
    for (const famId of (person.fams_ids as string[] ?? [])) {
      const { data: fam } = await supabase
        .from("families")
        .select("husband_id, wife_id, child_ids")
        .eq("id", famId)
        .single();
      if (!fam) continue;

      const spouseId = fam.husband_id === personId ? fam.wife_id : fam.husband_id;
      const childIds = (fam.child_ids as string[]) ?? [];
      const allIds = [spouseId, ...childIds].filter(Boolean) as string[];

      if (allIds.length > 0) {
        const { data: people } = await supabase
          .from("persons")
          .select("id, first_name, last_name, sex, birth_year, death_year")
          .in("id", allIds);

        for (const p of (people ?? [])) {
          const role = p.id === spouseId ? "spouse" : "child";
          relatives.push({ ...p, role });
        }
      }
    }

    return json({ relatives });
  }

  // ── GET /person/:id/gaps ───────────────────────────────
  const gapsMatch = path.match(/^\/person\/([^/]+)\/gaps$/);
  if (req.method === "GET" && gapsMatch) {
    const personId = gapsMatch[1];
    const { data, error } = await supabase
      .from("persons")
      .select("*")
      .eq("id", personId)
      .single();

    if (error || !data) return json({ error: "Personne introuvable" }, 404);
    return json({ gaps: getGaps(data as Record<string, unknown>) });
  }

  // ── GET /person/:id/identities ─────────────────────────
  const identitiesMatch = path.match(/^\/person\/([^/]+)\/identities$/);
  if (req.method === "GET" && identitiesMatch) {
    const personId = identitiesMatch[1];
    const { data } = await supabase
      .from("person_identities")
      .select("*")
      .eq("person_id", personId);
    return json({ identities: data ?? [] });
  }

  // ── GET /person/:id ────────────────────────────────────
  const personMatch = path.match(/^\/person\/([^/]+)$/);
  if (req.method === "GET" && personMatch) {
    const personId = personMatch[1];
    const { data, error } = await supabase
      .from("persons")
      .select("*")
      .eq("id", personId)
      .single();

    if (error || !data) return json({ error: "Personne introuvable" }, 404);
    return json({ person: formatPerson(data as Record<string, unknown>) });
  }

  // ── PATCH /person/:id ─────────────────────────────────
  if (req.method === "PATCH" && personMatch) {
    return json(
      { error: "Mises à jour via journal_proposals uniquement (status: pending)" },
      403
    );
  }

  return json({ error: "Route introuvable", path }, 404);
});
