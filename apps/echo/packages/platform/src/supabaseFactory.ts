import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseStorage } from "@echo/data";

export function createSupabaseStorage(client: SupabaseClient) {
  return new SupabaseStorage(client);
}
