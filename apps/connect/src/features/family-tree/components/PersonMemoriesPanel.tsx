import { ArrowLeft, Clock3, MessageCircle } from "lucide-react";
import type { ApprovedPersonMemory } from "../api/getApprovedPersonMemories";

type PendingPersonMemory = {
  content: string;
  updatedAt?: string | null;
};

type PersonMemoriesPanelProps = {
  memories: ApprovedPersonMemory[];
  pendingMemory?: PendingPersonMemory | null;
  onBack: () => void;
};

function formatDate(value?: string | null): string {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function getAuthorLabel(memory: ApprovedPersonMemory): string {
  const authorName =
    "authorDisplayName" in memory ? memory.authorDisplayName : null;

  if (authorName && typeof authorName === "string" && authorName.trim()) {
    return authorName.trim();
  }

  return "Un membre de la famille";
}

export function PersonMemoriesPanel({
  memories,
  pendingMemory,
  onBack,
}: PersonMemoriesPanelProps) {
  const mockMemories: ApprovedPersonMemory[] = [
    {
      id: "mock-1",
      event_slug: "demo",
      participant_id: "p1",
      person_id: "person-1",
      content:
        "Je me souviens d’une personne très douce, toujours bien habillée et attentive aux autres. On parlait souvent de sa gentillesse dans la famille.",
      moderation_status: "approved",
      submitted_at: "2025-06-14T10:00:00.000Z",
      updated_at: "2025-06-14T10:00:00.000Z",
      authorDisplayName: "Marie-Ange",
    } as ApprovedPersonMemory,
    {
      id: "mock-2",
      event_slug: "demo",
      participant_id: "p2",
      person_id: "person-1",
      content:
        "Chez nous, on racontait qu’elle aimait recevoir et qu’elle avait beaucoup de caractère. Même ceux qui ne l’ont pas connue en ont entendu parler.",
      moderation_status: "approved",
      submitted_at: "2025-07-03T10:00:00.000Z",
      updated_at: "2025-07-03T10:00:00.000Z",
      authorDisplayName: "Jean-Marc",
    } as ApprovedPersonMemory,
  ];

  const displayedMemories = memories.length > 0 ? memories : mockMemories;

  return (
    <section className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm"
        >
          <ArrowLeft size={14} />
          Retour
        </button>
      </div>

      {pendingMemory?.content?.trim() ? (
        <div className="space-y-2">
          <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex items-start gap-3">
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-amber-950">
                  Ton souvenir est en attente de modération
                </div>
                <div className="mt-1 text-xs leading-5 text-amber-900">
                  Il sera visible ici après validation.
                </div>
              </div>
            </div>
          </div>

          <article className="rounded-[24px] border border-amber-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800">
                <MessageCircle size={16} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <div className="text-sm font-black text-slate-900">
                    Mon souvenir
                  </div>
                  <div className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-800">
                    En attente
                  </div>
                  {pendingMemory.updatedAt ? (
                    <div className="text-xs font-semibold text-slate-500">
                      {formatDate(pendingMemory.updatedAt)}
                    </div>
                  ) : null}
                </div>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {pendingMemory.content}
                </p>
              </div>
            </div>
          </article>
        </div>
      ) : null}

      {displayedMemories.length === 0 ? (
        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-500 shadow-sm">
          Aucun souvenir validé n’est visible pour le moment.
        </div>
      ) : (
        <div className="space-y-3">
          {displayedMemories.map((memory) => (
            <article
              key={memory.id}
              className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                  <MessageCircle size={16} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <div className="text-sm font-black text-slate-900">
                      {getAuthorLabel(memory)}
                    </div>
                    <div className="text-xs font-semibold text-slate-500">
                      {formatDate(memory.submitted_at)}
                    </div>
                  </div>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {memory.content}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}