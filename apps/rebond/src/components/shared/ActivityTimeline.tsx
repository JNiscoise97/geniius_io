import React, { memo, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  MessageSquareText,
  Paperclip,
  Tag as TagIcon,
  UserCircle2,
  CheckCircle2,
  GitCommit,
} from "lucide-react";

/** Badges de tag (avec ou sans pastille colorée) */
function Pill({ label, dotColor }: { label: string; dotColor?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200/70 bg-neutral-50 px-2.5 py-0.5 text-xs font-medium text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-200">
      {dotColor ? (
        <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} aria-hidden />
      ) : (
        <TagIcon className="h-3 w-3 opacity-70" aria-hidden />
      )}
      {label}
    </span>
  );
}

/** Avatar minimal (initiales si pas d’image) */
function Avatar({ name, src }: { name: string; src?: string }) {
  const initials = useMemo(
    () => name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase(),
    [name]
  );
  return (
    <div className="h-9 w-9 overflow-hidden rounded-full ring-1 ring-black/5 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xs font-semibold text-neutral-700 dark:text-neutral-100">
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : initials ? (
        <span>{initials}</span>
      ) : (
        <UserCircle2 className="h-5 w-5" />
      )}
    </div>
  );
}

/** Modèle de données (corrigé) */
export type ActivityItem =
  | {
      id: string;
      type: "status_change";
      user: string;
      time: string; // "04:20 PM"
      date?: string; // "2025-08-15"
      ticket: string; // "PD-127"
      status: string; // "In progress"
      isUnread?: boolean;
    }
  | {
    id: string;
    type: "comment";
    user: string;
    time: string;
    date?: string;
    subject: string;
    text: string;
    isUnread?: boolean;
  }
  | {
    id: string;
    type: "tags";
    user: string;
    time: string;
    date?: string;
    tags: { label: string; dotColorClass: string }[];
    isUnread?: boolean;
  }
  | {
    id: string;
    type: "file";
    user: string;
    time: string;
    date?: string;
    filename: string;
    isUnread?: boolean;
  }
  | {
    id: string;
    type: "mention";
    user: string;
    time: string;
    date?: string;
    subject: string;
    text: string;
    isUnread?: boolean;
  };

/** Données de démo */
const sample: ActivityItem[] = [
  {
    id: "1",
    type: "status_change",
    user: "Angelina Gotelli",
    time: "04:20 PM",
    date: "2025-08-15",
    ticket: "PD-127",
    status: "In progress",
    isUnread: true,
  },
  {
    id: "2",
    type: "comment",
    user: "Arlene Pierce",
    time: "03:53 PM",
    date: "2025-08-15",
    subject: "Post",
    text:
      "Helvetica 8-bit photo booth tumblr food truck. Enamel pin wolf tousled sartorial, brunch shoreditch skateboard beard helvetica. Plaid typewriter gastropub bespoke.",
  },
  {
    id: "3",
    type: "tags",
    user: "Eugene Stewart",
    time: "02:40 PM",
    date: "2025-08-15",
    tags: [
      { label: "Live Issue", dotColorClass: "bg-pink-500" },
      { label: "Bug", dotColorClass: "bg-amber-400" },
    ],
  },
  {
    id: "4",
    type: "file",
    user: "Shannon Baker",
    time: "01:18 PM",
    date: "2025-08-14",
    filename: "document.csv",
  },
  {
    id: "5",
    type: "mention",
    user: "Roberta Horton",
    time: "12:17 PM",
    date: "2025-08-14",
    subject: "Post",
    text:
      "@Angelina One of the main causes of the fall of the Roman Empire was that—lacking zero—they had no way to indicate successful termination of their C programs.",
  },
];

/** Icône par type */
function RowIcon({ type }: { type: ActivityItem["type"] }) {
  const base = "h-4 w-4";
  switch (type) {
    case "status_change":
      return <GitCommit className={base} aria-hidden />;
    case "comment":
      return <MessageSquareText className={base} aria-hidden />;
    case "tags":
      return <Paperclip className={base} aria-hidden />;
    case "file":
      return <FileText className={base} aria-hidden />;
    case "mention":
      return <MessageSquareText className={base} aria-hidden />;
  }
}

/** Texte long repliable */
function SeeMore({ text, limit = 180 }: { text: string; limit?: number }) {
  const tooLong = text.length > limit;
  const [open, setOpen] = useState(false);
  if (!tooLong) return <>{text}</>;
  return (
    <>
      {open ? text : text.slice(0, limit) + "…"}
      <button
        className="ml-2 text-xs font-medium text-emerald-700 underline decoration-dotted underline-offset-2 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 rounded"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? "Voir moins" : "Voir plus"}
      </button>
    </>
  );
}

/** En-tête de groupe (Today / Yesterday / 14 Aug 2025) */
function formatHeading(dateISO?: string) {
  if (!dateISO) return "";
  const d = new Date(dateISO + "T00:00:00");
  const today = new Date();
  const yday = new Date();
  yday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yday)) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default memo(function ActivityTimeline({
  items = sample,
  onOpenFile,
  onOpenTicket,
}: {
  items?: ActivityItem[];
  onOpenFile?: (filename: string, item: ActivityItem) => void;
  onOpenTicket?: (ticket: string, item: ActivityItem) => void;
}) {
  const [filter, setFilter] = useState<null | ActivityItem["type"]>(null);
  const filtered = useMemo(
    () => (filter ? items.filter((i) => i.type === filter) : items),
    [items, filter]
  );

  // Groupement par date (ordre décroissant)
  const groups = useMemo(() => {
    const map = new Map<string, ActivityItem[]>();
    for (const it of filtered) {
      const k = it.date || "";
      const arr = map.get(k) || [];
      arr.push(it);
      map.set(k, arr);
    }
    return Array.from(map.entries()).sort((a, b) => (b[0] > a[0] ? 1 : -1));
  }, [filtered]);

  // Compteurs par type (pour les filtres)
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const it of items) c[it.type] = (c[it.type] || 0) + 1;
    return c as Record<ActivityItem["type"], number>;
  }, [items]);

  const TypeChip = ({
    t,
    label,
  }: {
    t: ActivityItem["type"] | null;
    label: string;
  }) => (
    <button
      onClick={() => setFilter(t as any)}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
        (filter ?? null) === t
          ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300"
          : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
      }`}
      aria-pressed={(filter ?? null) === t}
    >
      {label}
      {t && (
        <span className="ml-1 rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] tabular-nums dark:bg-neutral-800">
          {counts[t] || 0}
        </span>
      )}
    </button>
  );

  return (
    <section
      className="mx-auto max-w-2xl rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950"
      aria-label="Activity timeline"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          Activity
        </h2>
        <div className="flex items-center gap-2">
          <TypeChip t={null} label="All" />
          <TypeChip t="status_change" label="Status" />
          <TypeChip t="comment" label="Comments" />
          <TypeChip t="mention" label="Mentions" />
          <TypeChip t="tags" label="Tags" />
          <TypeChip t="file" label="Files" />
        </div>
      </div>

      {/* Timeline */}
      <div className="relative mt-4">
        <div className="absolute left-[1.375rem] top-0 h-full w-px bg-neutral-200 dark:bg-neutral-800" />
        {groups.map(([dateKey, list]) => (
          <div key={dateKey || "nodate"} className="mb-6">
            {dateKey && (
              <div className="sticky top-0 z-10 mb-3 -ml-1 inline-flex items-center gap-2 rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-neutral-600 backdrop-blur dark:bg-neutral-950/70 dark:text-neutral-300">
                {formatHeading(dateKey)}
              </div>
            )}
            <ul className="space-y-5">
              {list.map((it, idx) => (
                <motion.li
                  key={it.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, delay: idx * 0.03 }}
                  className="relative pl-14 focus-within:ring-2 focus-within:ring-emerald-400/50 rounded-lg"
                >
                  <div className="absolute left-0 top-0">
                    <Avatar name={it.user} />
                  </div>

                  <div
                    className={`group rounded-xl border border-neutral-200/80 bg-white p-3.5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900/60 ${
                      it.isUnread ? "ring-2 ring-emerald-300/40" : ""
                    }`}
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-4 text-[13px] text-neutral-500 dark:text-neutral-400">
                      <div className="flex items-center gap-2.5">
                        <RowIcon type={it.type} />
                        <span className="font-medium text-neutral-900 dark:text-neutral-100">
                          {it.user}
                        </span>
                        {it.isUnread && (
                          <span className="ml-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                            New
                          </span>
                        )}
                      </div>
                      <time className="tabular-nums" aria-label={`at ${it.time}`} title={it.time}>
                        {it.time}
                      </time>
                    </div>

                    {it.type === "status_change" && (
                      <div className="text-sm text-neutral-700 dark:text-neutral-200">
                        <span className="text-neutral-500 dark:text-neutral-400">changed</span>
                        <button
                          onClick={() => onOpenTicket?.((it as any).ticket, it)}
                          className="mx-1.5 rounded-md bg-neutral-50 px-1.5 py-0.5 font-semibold underline decoration-dotted underline-offset-2 ring-1 ring-neutral-200 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 dark:bg-neutral-800/60 dark:ring-neutral-700"
                        >
                          {(it as any).ticket}
                        </button>
                        <span className="text-neutral-500 dark:text-neutral-400">status to</span>
                        <span className="mx-1.5 inline-flex items-center gap-2 rounded-md bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-900/40">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                          {(it as any).status}
                        </span>
                      </div>
                    )}

                    {it.type === "comment" && (
                      <div className="text-sm text-neutral-700 dark:text-neutral-200">
                        <span className="text-neutral-500 dark:text-neutral-400">commented on your</span>
                        <span className="mx-1 font-semibold">{(it as any).subject}</span>
                        <div className="mt-2 rounded-xl bg-neutral-50 p-3 text-[13px] leading-relaxed text-neutral-600 ring-1 ring-neutral-200 dark:bg-neutral-900/50 dark:text-neutral-300 dark:ring-neutral-800">
                          <SeeMore text={(it as any).text} />
                        </div>
                      </div>
                    )}

                    {it.type === "tags" && (
                      <div className="text-sm text-neutral-700 dark:text-neutral-200">
                        <div className="mb-2 inline-flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
                          <Paperclip className="h-4 w-4" aria-hidden />
                          <span>added tags</span>
                        </div>
                        <div className="flex flex-wrap gap-2" role="list">
                          {(it as any).tags.map((t: any, i: number) => (
                            <Pill key={i} label={t.label} dotColor={t.dotColorClass} />
                          ))}
                        </div>
                      </div>
                    )}

                    {it.type === "file" && (
                      <div className="text-sm text-neutral-700 dark:text-neutral-200">
                        <div className="inline-flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
                          <FileText className="h-4 w-4" aria-hidden />
                          <span>added</span>
                          <button
                            className="underline decoration-dotted underline-offset-2 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 rounded"
                            aria-label={`Open ${(it as any).filename}`}
                            onClick={() => onOpenFile?.((it as any).filename, it)}
                          >
                            {(it as any).filename}
                          </button>
                        </div>
                      </div>
                    )}

                    {it.type === "mention" && (
                      <div className="text-sm text-neutral-700 dark:text-neutral-200">
                        <div className="inline-flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
                          <MessageSquareText className="h-4 w-4" aria-hidden />
                          <span>mentioned you in a comment</span>
                          <span className="font-semibold text-neutral-800 dark:text-neutral-100">
                            {(it as any).subject}
                          </span>
                        </div>
                        <div className="mt-2 rounded-xl bg-neutral-50 p-3 text-[13px] leading-relaxed text-neutral-600 ring-1 ring-neutral-200 dark:bg-neutral-900/50 dark:text-neutral-300 dark:ring-neutral-800">
                          <SeeMore text={(it as any).text} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* marqueur sur la ligne */}
                  <div className="absolute left-[1.125rem] top-10 h-4 w-4 -translate-x-1/2 rounded-full bg-white dark:bg-neutral-950 ring-2 ring-neutral-200 dark:ring-neutral-800 flex items-center justify-center group-hover:ring-emerald-300/60 transition">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
});
