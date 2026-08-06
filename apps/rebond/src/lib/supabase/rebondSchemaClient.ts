import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
}

// Le SDK Supabase ne peut cibler qu'un seul schéma par instance de client
// (défini à la création, pas par requête) — ce client dédié permet
// d'interroger le schéma `rebond` pendant que `./client.ts` continue de
// cibler `public` pour tout ce qui n'a pas encore été migré.
//
// L'authentification reste gérée exclusivement par le client par défaut
// (persistSession désactivé ici pour éviter un second GoTrueClient sur le
// même storage). Les requêtes passent donc en rôle `anon`, pas `authenticated`
// — cohérent pour l'instant puisque les policies RLS de rebond.* autorisent
// les deux (voir supabase/migrations/20260806100009_rls_institutions_plateformes.sql).
export const supabaseRebond = createClient(supabaseUrl, supabaseKey, {
  db: { schema: "rebond" },
  auth: { persistSession: false, autoRefreshToken: false },
});
