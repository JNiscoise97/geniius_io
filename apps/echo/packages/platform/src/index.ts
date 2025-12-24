export type { Storage } from "@echo/data";
export { createMemoryStorage } from "@echo/data";
export { createSupabaseStorage } from "./supabaseFactory";

// TODO: add platform-specific factories later, e.g.:
// export { createWebSqliteStorage } from "./web/sqlite";
// export { createTauriSqliteStorage } from "./tauri/sqlite";
// export { createCapacitorSqliteStorage } from "./capacitor/sqlite";
