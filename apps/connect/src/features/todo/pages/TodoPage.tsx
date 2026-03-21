import { useMemo } from "react";
import { ArrowLeft, CalendarDays, FileText, FolderKanban } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  TODO_ITEMS,
  type TodoItem,
  type TodoItemStatus,
} from "../config/todoConfig";

function formatDate(date?: string) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("fr-FR");
}

function getStatusLabel(status: TodoItemStatus) {
  switch (status) {
    case "backlog":
      return "Backlog";
    case "in_progress":
      return "En cours";
    case "done":
      return "Terminé";
    default:
      return status;
  }
}

function getStatusClass(status: TodoItemStatus) {
  switch (status) {
    case "done":
      return "bg-emerald-100 text-emerald-700";
    case "in_progress":
      return "bg-amber-100 text-amber-800";
    case "backlog":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function TodoCard({ item }: { item: TodoItem }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900">{item.label}</div>

          <div className="mt-2 flex flex-col gap-1 text-xs text-slate-500">
            {item.filePath ? (
              <div className="flex items-center gap-2">
                <FileText size={13} />
                <span className="break-all">{item.filePath}</span>
              </div>
            ) : null}

            <div className="flex items-center gap-2">
              <CalendarDays size={13} />
              <span>Livraison attendue : {formatDate(item.expectedAt)}</span>
            </div>

            {item.category ? (
              <div className="flex items-center gap-2">
                <FolderKanban size={13} />
                <span>Catégorie : {item.category}</span>
              </div>
            ) : null}
          </div>

          {item.details?.length ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-slate-600">
              {item.details.map((detail, index) => (
                <li key={`${item.id}-detail-${index}`}>{detail}</li>
              ))}
            </ul>
          ) : null}
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${getStatusClass(
            item.status,
          )}`}
        >
          {getStatusLabel(item.status)}
        </span>
      </div>
    </div>
  );
}

export function TodoPage() {
  const navigate = useNavigate();

  const { todos, niceToHaves } = useMemo(() => {
    const sorted = [...TODO_ITEMS].sort((a, b) =>
      (a.expectedAt || "").localeCompare(b.expectedAt || ""),
    );

    return {
      todos: sorted.filter((item) => item.type === "todo"),
      niceToHaves: sorted.filter((item) => item.type === "nice_to_have"),
    };
  }, []);

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-xl border border-slate-200 p-2"
        >
          <ArrowLeft size={16} />
        </button>

        <div>
          <h1 className="text-lg font-bold text-slate-900">Pilotage produit</h1>
          <p className="text-sm text-slate-500">Todo, nice-to-have et livraisons attendues</p>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">Todo</h2>
          <p className="mt-1 text-xs text-slate-500">{todos.length} élément(s)</p>
        </div>

        <div className="flex flex-col gap-3">
          {todos.map((item) => (
            <TodoCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">
            Nice-to-have
          </h2>
          <p className="mt-1 text-xs text-slate-500">{niceToHaves.length} élément(s)</p>
        </div>

        <div className="flex flex-col gap-3">
          {niceToHaves.map((item) => (
            <TodoCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}