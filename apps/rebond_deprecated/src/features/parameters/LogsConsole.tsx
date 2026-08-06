import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Download, RefreshCw, Search, ExternalLink, PauseCircle, PlayCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

// Types
export type EntityKind = "acte" | "registre" | "bureau" | "acteur" | "autre" | "";

export type AuditRow = {
  id: string;
  at: string;
  action: "INSERT" | "UPDATE" | "DELETE";
  table_name: string;
  entity_type: EntityKind;
  entity_id: string | null;
  row_id: string | null;
  pk_text: string | null;
  user_id: string | null;
  diff: any | null;
  old_data: any | null;
  new_data: any | null;
};

export type EventRow = {
  id: string;
  at: string;
  level: "DEBUG" | "INFO" | "WARN" | "ERROR";
  type: string;
  entity_type: EntityKind | null;
  entity_id: string | null;
  user_id: string | null;
  message: string | null;
  payload: any | null;
};

// Utils
function useDebounced<T>(value: T, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

function formatDateLocal(dt?: string) {
  if (!dt) return "";
  try {
    const d = new Date(dt);
    return d.toLocaleString();
  } catch {
    return dt ?? "";
  }
}

function toCSV(rows: any[], columns: string[]): string {
  const escape = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "string" ? v : JSON.stringify(v);
    // Sans replaceAll: double les guillemets
    return `"${s.replace(/"/g, '""')}"`;
  };
  const header = columns.map((c) => `"${c}"`).join(",");
  const body = rows.map((r) => columns.map((c) => escape(r[c])).join(",")).join("\n");
  return `${header}\n${body}`;
}

// Filters shared state shape
type BaseFilters = {
  entityType: EntityKind | "";
  tableName: string;
  userId: string;
  entityId: string;
  action: "" | "INSERT" | "UPDATE" | "DELETE";
  from: string; // ISO string for input[type=datetime-local]
  to: string;   // ISO string
  search: string; // fulltext-ish (subset)
  page: number;
  pageSize: number;
  autoRefresh: boolean;
};

const DEFAULT_PAGE_SIZE = 50;
// On n’affiche plus la valeur vide dans la liste, on gère "ALL" côté UI
const entityKindsForUI = ["acte", "registre", "bureau", "acteur", "autre"] as const;

function presetRange(preset: "24h" | "7d" | "30d") {
  const now = new Date();
  const to = new Date(now);
  const from = new Date(now);
  if (preset === "24h") from.setDate(now.getDate() - 1);
  if (preset === "7d") from.setDate(now.getDate() - 7);
  if (preset === "30d") from.setDate(now.getDate() - 30);
  const toStr = to.toISOString().slice(0, 16);
  const fromStr = from.toISOString().slice(0, 16);
  return { fromStr, toStr };
}

export default function LogsConsole() {
  const [tab, setTab] = useState<"audit" | "events">("audit");

  const { fromStr, toStr } = useMemo(() => presetRange("7d"), []);
  const [auditFilters, setAuditFilters] = useState<BaseFilters>({
    entityType: "",
    tableName: "",
    userId: "",
    entityId: "",
    action: "",
    from: fromStr,
    to: toStr,
    search: "",
    page: 0,
    pageSize: DEFAULT_PAGE_SIZE,
    autoRefresh: false,
  });
  const [eventFilters, setEventFilters] = useState<BaseFilters>({
    entityType: "",
    tableName: "", // not used for events but keep for uniformity
    userId: "",
    entityId: "",
    action: "", // not used for events
    from: fromStr,
    to: toStr,
    search: "",
    page: 0,
    pageSize: DEFAULT_PAGE_SIZE,
    autoRefresh: false,
  });

  const debAuditSearch = useDebounced(auditFilters.search);
  const debEventSearch = useDebounced(eventFilters.search);

  // Data
  const [auditData, setAuditData] = useState<AuditRow[]>([]);
  const [auditCount, setAuditCount] = useState<number>(0);
  const [auditLoading, setAuditLoading] = useState<boolean>(false);
  const [eventsData, setEventsData] = useState<EventRow[]>([]);
  const [eventsCount, setEventsCount] = useState<number>(0);
  const [eventsLoading, setEventsLoading] = useState<boolean>(false);

  // JSON viewer sheet
  const [jsonOpen, setJsonOpen] = useState(false);
  const [jsonTitle, setJsonTitle] = useState("");
  const [jsonContent, setJsonContent] = useState<any>(null);

  const auditAbortRef = useRef<AbortController | null>(null);
  const eventAbortRef = useRef<AbortController | null>(null);

  // Fetch Audit
  const fetchAudit = async () => {
    setAuditLoading(true);
    auditAbortRef.current?.abort();
    const ac = new AbortController();
    auditAbortRef.current = ac;

    try {
      const qBase = supabase
        .from("app_audit_log")
        .select("id, at, action, table_name, entity_type, entity_id, row_id, pk_text, user_id, diff, old_data, new_data", { count: "exact" })
        .order("at", { ascending: false })
        .range(
          auditFilters.page * auditFilters.pageSize,
          auditFilters.page * auditFilters.pageSize + auditFilters.pageSize - 1
        );

      let q = qBase;

      if (auditFilters.entityType) q = q.eq("entity_type", auditFilters.entityType);
      if (auditFilters.tableName) q = q.ilike("table_name", `%${auditFilters.tableName}%`);
      if (auditFilters.userId) q = q.eq("user_id", auditFilters.userId);
      if (auditFilters.entityId) q = q.eq("entity_id", auditFilters.entityId);
      if (auditFilters.action) q = q.eq("action", auditFilters.action);
      if (auditFilters.from) q = q.gte("at", new Date(auditFilters.from).toISOString());
      if (auditFilters.to) q = q.lte("at", new Date(auditFilters.to).toISOString());
      if (debAuditSearch) {
        // @ts-ignore - supabase-js or() accepte une string
        q = q.or(
          `table_name.ilike.%${debAuditSearch}%,action.ilike.%${debAuditSearch}%,pk_text.ilike.%${debAuditSearch}%`
        );
      }

      const { data, error, count } = await q;
      if (error) throw error;
      setAuditData((data || []) as AuditRow[]);
      setAuditCount(count || 0);
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        console.error(e);
        toast.error("Erreur de chargement des logs d'audit");
      }
    } finally {
      setAuditLoading(false);
    }
  };

  // Fetch Events
  const fetchEvents = async () => {
    setEventsLoading(true);
    eventAbortRef.current?.abort();
    const ac = new AbortController();
    eventAbortRef.current = ac;

    try {
      const qBase = supabase
        .from("app_event_log")
        .select("id, at, level, type, entity_type, entity_id, user_id, message, payload", { count: "exact" })
        .order("at", { ascending: false })
        .range(
          eventFilters.page * eventFilters.pageSize,
          eventFilters.page * eventFilters.pageSize + eventFilters.pageSize - 1
        );

      let q = qBase;
      if (eventFilters.entityType) q = q.eq("entity_type", eventFilters.entityType);
      if (eventFilters.userId) q = q.eq("user_id", eventFilters.userId);
      if (eventFilters.entityId) q = q.eq("entity_id", eventFilters.entityId);
      if (eventFilters.from) q = q.gte("at", new Date(eventFilters.from).toISOString());
      if (eventFilters.to) q = q.lte("at", new Date(eventFilters.to).toISOString());
      if (debEventSearch) {
        // @ts-ignore
        q = q.or(
          `type.ilike.%${debEventSearch}%,message.ilike.%${debEventSearch}%`
        );
      }

      const { data, error, count } = await q;
      if (error) throw error;
      setEventsData((data || []) as EventRow[]);
      setEventsCount(count || 0);
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        console.error(e);
        toast.error("Erreur de chargement des événements");
      }
    } finally {
      setEventsLoading(false);
    }
  };

  // Initial & reactive fetch
  useEffect(() => { fetchAudit(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { fetchEvents(); /* eslint-disable-next-line */ }, []);

  useEffect(() => { fetchAudit(); /* eslint-disable-next-line */ }, [
    auditFilters.entityType,
    auditFilters.tableName,
    auditFilters.userId,
    auditFilters.entityId,
    auditFilters.action,
    auditFilters.from,
    auditFilters.to,
    debAuditSearch,
    auditFilters.page,
    auditFilters.pageSize,
  ]);

  useEffect(() => { fetchEvents(); /* eslint-disable-next-line */ }, [
    eventFilters.entityType,
    eventFilters.userId,
    eventFilters.entityId,
    eventFilters.from,
    eventFilters.to,
    debEventSearch,
    eventFilters.page,
    eventFilters.pageSize,
  ]);

  // Auto-refresh intervals
  useEffect(() => {
    if (!auditFilters.autoRefresh) return;
    const id = setInterval(fetchAudit, 10_000);
    return () => clearInterval(id);
  }, [auditFilters.autoRefresh]);

  useEffect(() => {
    if (!eventFilters.autoRefresh) return;
    const id = setInterval(fetchEvents, 10_000);
    return () => clearInterval(id);
  }, [eventFilters.autoRefresh]);

  // Handlers
  const openJson = (title: string, obj: any) => {
    setJsonTitle(title);
    setJsonContent(obj);
    setJsonOpen(true);
  };

  const exportAuditCSV = () => {
    const cols = ["id","at","action","table_name","entity_type","entity_id","row_id","pk_text","user_id","diff","old_data","new_data"];
    const rows = auditData.map(r => ({
      ...r,
      diff: r.diff ? JSON.stringify(r.diff) : null,
      old_data: r.old_data ? JSON.stringify(r.old_data) : null,
      new_data: r.new_data ? JSON.stringify(r.new_data) : null
    }));
    const csv = toCSV(rows, cols);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportEventsCSV = () => {
    const cols = ["id","at","level","type","entity_type","entity_id","user_id","message","payload"];
    const rows = eventsData.map(r => ({ ...r, payload: r.payload ? JSON.stringify(r.payload) : null }));
    const csv = toCSV(rows, cols);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `event-logs-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const AuditFiltersUI = (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <div>
        <Label>Type d'objet</Label>
        <Select
          value={auditFilters.entityType || "ALL"}
          onValueChange={(v) =>
            setAuditFilters((f) => ({ ...f, entityType: v === "ALL" ? "" : (v as EntityKind), page: 0 }))
          }
        >
          <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous</SelectItem>
            {entityKindsForUI.map((k) => (
              <SelectItem key={k} value={k}>{k}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Table</Label>
        <Input
          placeholder="etat_civil_actes…"
          value={auditFilters.tableName}
          onChange={(e)=>setAuditFilters(f=>({...f, tableName: e.target.value, page: 0}))}
        />
      </div>
      <div>
        <Label>Action</Label>
        <Select
          value={auditFilters.action || "ALL"}
          onValueChange={(v) =>
            setAuditFilters((f) => ({ ...f, action: v === "ALL" ? "" : (v as any), page: 0 }))
          }
        >
          <SelectTrigger><SelectValue placeholder="Toutes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Toutes</SelectItem>
            <SelectItem value="INSERT">INSERT</SelectItem>
            <SelectItem value="UPDATE">UPDATE</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>User ID</Label>
        <Input placeholder="uuid…" value={auditFilters.userId} onChange={(e)=>setAuditFilters(f=>({...f, userId: e.target.value, page: 0}))} />
      </div>
      <div>
        <Label>Entity ID</Label>
        <Input placeholder="uuid…" value={auditFilters.entityId} onChange={(e)=>setAuditFilters(f=>({...f, entityId: e.target.value, page: 0}))} />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Recherche</Label>
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          <Input placeholder="table/action/pk_text…" value={auditFilters.search} onChange={(e)=>setAuditFilters(f=>({...f, search: e.target.value, page: 0}))} />
        </div>
      </div>
      <div>
        <Label>De</Label>
        <Input type="datetime-local" value={auditFilters.from} onChange={(e)=>setAuditFilters(f=>({...f, from: e.target.value, page: 0}))} />
      </div>
      <div>
        <Label>À</Label>
        <Input type="datetime-local" value={auditFilters.to} onChange={(e)=>setAuditFilters(f=>({...f, to: e.target.value, page: 0}))} />
      </div>
      <div className="flex items-end gap-2">
        <Button variant="secondary" onClick={()=>{ const p = presetRange("24h"); setAuditFilters(f=>({...f, from: p.fromStr, to: p.toStr, page: 0})); }}>24h</Button>
        <Button variant="secondary" onClick={()=>{ const p = presetRange("7d"); setAuditFilters(f=>({...f, from: p.fromStr, to: p.toStr, page: 0})); }}>7j</Button>
        <Button variant="secondary" onClick={()=>{ const p = presetRange("30d"); setAuditFilters(f=>({...f, from: p.fromStr, to: p.toStr, page: 0})); }}>30j</Button>
      </div>
      <div className="flex items-end gap-2">
        <Button onClick={fetchAudit}><RefreshCw className="mr-2 h-4 w-4"/>Rafraîchir</Button>
        <Button
          variant="outline"
          onClick={()=>setAuditFilters(f=>({ ...f, entityType:"", tableName:"", userId:"", entityId:"", action:"", search:"", page:0 }))}
        >
          Réinitialiser
        </Button>
      </div>
      <div className="flex items-center justify-end gap-3">
        <div className="flex items-center gap-2">
          <Switch checked={auditFilters.autoRefresh} onCheckedChange={(v)=>setAuditFilters(f=>({...f, autoRefresh: v}))} />
          <span className="text-sm">Auto (10s)</span>
          {auditFilters.autoRefresh ? <PlayCircle className="h-4 w-4"/> : <PauseCircle className="h-4 w-4"/>}
        </div>
        <Button variant="outline" onClick={exportAuditCSV}><Download className="mr-2 h-4 w-4"/>CSV</Button>
      </div>
    </div>
  );

  const EventsFiltersUI = (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <div>
        <Label>Type d'objet</Label>
        <Select
          value={eventFilters.entityType || "ALL"}
          onValueChange={(v) =>
            setEventFilters((f) => ({ ...f, entityType: v === "ALL" ? "" : (v as EntityKind), page: 0 }))
          }
        >
          <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous</SelectItem>
            {entityKindsForUI.map((k) => (
              <SelectItem key={k} value={k}>{k}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>User ID</Label>
        <Input placeholder="uuid…" value={eventFilters.userId} onChange={(e)=>setEventFilters(f=>({...f, userId: e.target.value, page: 0}))} />
      </div>
      <div>
        <Label>Entity ID</Label>
        <Input placeholder="uuid…" value={eventFilters.entityId} onChange={(e)=>setEventFilters(f=>({...f, entityId: e.target.value, page: 0}))} />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Recherche</Label>
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          <Input placeholder="type/message…" value={eventFilters.search} onChange={(e)=>setEventFilters(f=>({...f, search: e.target.value, page: 0}))} />
        </div>
      </div>
      <div>
        <Label>De</Label>
        <Input type="datetime-local" value={eventFilters.from} onChange={(e)=>setEventFilters(f=>({...f, from: e.target.value, page: 0}))} />
      </div>
      <div>
        <Label>À</Label>
        <Input type="datetime-local" value={eventFilters.to} onChange={(e)=>setEventFilters(f=>({...f, to: e.target.value, page: 0}))} />
      </div>
      <div className="flex items-end gap-2">
        <Button variant="secondary" onClick={()=>{ const p = presetRange("24h"); setEventFilters(f=>({...f, from: p.fromStr, to: p.toStr, page: 0})); }}>24h</Button>
        <Button variant="secondary" onClick={()=>{ const p = presetRange("7d"); setEventFilters(f=>({...f, from: p.fromStr, to: p.toStr, page: 0})); }}>7j</Button>
        <Button variant="secondary" onClick={()=>{ const p = presetRange("30d"); setEventFilters(f=>({...f, from: p.fromStr, to: p.toStr, page: 0})); }}>30j</Button>
      </div>
      <div className="flex items-end gap-2">
        <Button onClick={fetchEvents}><RefreshCw className="mr-2 h-4 w-4"/>Rafraîchir</Button>
        <Button variant="outline" onClick={()=>setEventFilters(f=>({ ...f, entityType:"", userId:"", entityId:"", search:"", page:0 }))}>Réinitialiser</Button>
      </div>
      <div className="flex items-center justify-end gap-3">
        <div className="flex items-center gap-2">
          <Switch checked={eventFilters.autoRefresh} onCheckedChange={(v)=>setEventFilters(f=>({...f, autoRefresh: v}))} />
          <span className="text-sm">Auto (10s)</span>
          {eventFilters.autoRefresh ? <PlayCircle className="h-4 w-4"/> : <PauseCircle className="h-4 w-4"/>}
        </div>
        <Button variant="outline" onClick={exportEventsCSV}><Download className="mr-2 h-4 w-4"/>CSV</Button>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Journalisation – Console</h1>
        <div className="text-sm opacity-70">Consultation des logs Supabase (RLS appliquée)</div>
      </div>

      <Tabs value={tab} onValueChange={(v)=>setTab(v as "audit" | "events")}>
        <TabsList>
          <TabsTrigger value="audit">Audit</TabsTrigger>
          <TabsTrigger value="events">Événements</TabsTrigger>
        </TabsList>

        {/* AUDIT TAB */}
        <TabsContent value="audit">
          <Card className="mb-4">
            <CardHeader className="pb-2"><CardTitle className="text-base">Filtres (Audit)</CardTitle></CardHeader>
            <CardContent>{AuditFiltersUI}</CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Résultats ({auditCount})</CardTitle>
              <div className="flex items-center gap-2">
                <Label className="text-xs">Page</Label>
                <Button variant="outline" size="icon" onClick={()=>setAuditFilters(f=>({...f, page: Math.max(0, f.page-1)}))}><ChevronLeft className="h-4 w-4"/></Button>
                <div className="w-12 text-center text-sm">{auditFilters.page+1}</div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={()=>{
                    const maxPage = Math.max(0, Math.ceil(auditCount / auditFilters.pageSize) - 1);
                    setAuditFilters(f=>({...f, page: Math.min(maxPage, f.page+1)}));
                  }}
                >
                  <ChevronRight className="h-4 w-4"/>
                </Button>
                <Select value={String(auditFilters.pageSize)} onValueChange={(v)=>setAuditFilters(f=>({...f, pageSize: Number(v), page: 0}))}>
                  <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[25,50,100,200].map(n => <SelectItem key={n} value={String(n)}>{n}/page</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={fetchAudit}><RefreshCw className="mr-2 h-4 w-4"/>Rafraîchir</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="text-left">
                      <th className="p-2">Date</th>
                      <th className="p-2">Action</th>
                      <th className="p-2">Table</th>
                      <th className="p-2">Type</th>
                      <th className="p-2">Entity ID</th>
                      <th className="p-2">User</th>
                      <th className="p-2">Diff</th>
                      <th className="p-2">Old</th>
                      <th className="p-2">New</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLoading ? (
                      <tr><td className="p-4" colSpan={9}>Chargement…</td></tr>
                    ) : auditData.length === 0 ? (
                      <tr><td className="p-4" colSpan={9}>Aucun résultat</td></tr>
                    ) : (
                      auditData.map(row => (
                        <tr key={row.id} className="border-t">
                          <td className="p-2 whitespace-nowrap">{formatDateLocal(row.at)}</td>
                          <td className="p-2">{row.action}</td>
                          <td className="p-2">{row.table_name}</td>
                          <td className="p-2">{row.entity_type}</td>
                          <td className="p-2">
                            <code className="text-xs">{row.entity_id || row.row_id || row.pk_text || ""}</code>
                          </td>
                          <td className="p-2"><code className="text-xs">{row.user_id || ""}</code></td>
                          <td className="p-2">
                            <Button variant="ghost" size="sm" onClick={()=>openJson("Diff", row.diff)} disabled={!row.diff}><ExternalLink className="h-4 w-4"/></Button>
                          </td>
                          <td className="p-2">
                            <Button variant="ghost" size="sm" onClick={()=>openJson("Old", row.old_data)} disabled={!row.old_data}><ExternalLink className="h-4 w-4"/></Button>
                          </td>
                          <td className="p-2">
                            <Button variant="ghost" size="sm" onClick={()=>openJson("New", row.new_data)} disabled={!row.new_data}><ExternalLink className="h-4 w-4"/></Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EVENTS TAB */}
        <TabsContent value="events">
          <Card className="mb-4">
            <CardHeader className="pb-2"><CardTitle className="text-base">Filtres (Événements)</CardTitle></CardHeader>
            <CardContent>{EventsFiltersUI}</CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Résultats ({eventsCount})</CardTitle>
              <div className="flex items-center gap-2">
                <Label className="text-xs">Page</Label>
                <Button variant="outline" size="icon" onClick={()=>setEventFilters(f=>({...f, page: Math.max(0, f.page-1)}))}><ChevronLeft className="h-4 w-4"/></Button>
                <div className="w-12 text-center text-sm">{eventFilters.page+1}</div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={()=>{
                    const maxPage = Math.max(0, Math.ceil(eventsCount / eventFilters.pageSize) - 1);
                    setEventFilters(f=>({...f, page: Math.min(maxPage, f.page+1)}));
                  }}
                >
                  <ChevronRight className="h-4 w-4"/>
                </Button>
                <Select value={String(eventFilters.pageSize)} onValueChange={(v)=>setEventFilters(f=>({...f, pageSize: Number(v), page: 0}))}>
                  <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[25,50,100,200].map(n => <SelectItem key={n} value={String(n)}>{n}/page</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={fetchEvents}><RefreshCw className="mr-2 h-4 w-4"/>Rafraîchir</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="text-left">
                      <th className="p-2">Date</th>
                      <th className="p-2">Level</th>
                      <th className="p-2">Type</th>
                      <th className="p-2">Objet</th>
                      <th className="p-2">Entity ID</th>
                      <th className="p-2">User</th>
                      <th className="p-2">Message</th>
                      <th className="p-2">Payload</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventsLoading ? (
                      <tr><td className="p-4" colSpan={8}>Chargement…</td></tr>
                    ) : eventsData.length === 0 ? (
                      <tr><td className="p-4" colSpan={8}>Aucun résultat</td></tr>
                    ) : (
                      eventsData.map(row => (
                        <tr key={row.id} className="border-t">
                          <td className="p-2 whitespace-nowrap">{formatDateLocal(row.at)}</td>
                          <td className="p-2">{row.level}</td>
                          <td className="p-2">{row.type}</td>
                          <td className="p-2">{row.entity_type}</td>
                          <td className="p-2"><code className="text-xs">{row.entity_id || ""}</code></td>
                          <td className="p-2"><code className="text-xs">{row.user_id || ""}</code></td>
                          <td className="p-2 max-w-[30ch] truncate" title={row.message || undefined}>{row.message}</td>
                          <td className="p-2">
                            <Button variant="ghost" size="sm" onClick={()=>openJson("Payload", row.payload)} disabled={!row.payload}><ExternalLink className="h-4 w-4"/></Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* JSON Sheet */}
      <Sheet open={jsonOpen} onOpenChange={setJsonOpen}>
        <SheetContent className="w-[90vw] sm:w-[700px]">
          <SheetHeader>
            <SheetTitle>{jsonTitle}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 p-3 rounded-md bg-muted max-h-[75vh] overflow-auto">
            <pre className="text-xs whitespace-pre-wrap">
              {jsonContent ? JSON.stringify(jsonContent, null, 2) : "(vide)"}
            </pre>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
