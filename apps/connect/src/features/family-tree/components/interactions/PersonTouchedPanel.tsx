import { ArrowLeft, Heart } from "lucide-react";
import type { TouchedParticipantItem } from "../../data/reactions/getTouchedParticipants";

type PersonTouchedPanelProps = {
  participants: TouchedParticipantItem[];
  onBack: () => void;
};

function getDisplayName(participant: TouchedParticipantItem): string {
  const fullName = [participant.firstName, participant.nickname, participant.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || "Membre de la famille";
}

export function PersonTouchedPanel({
  participants,
  onBack,
}: PersonTouchedPanelProps) {
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

      {participants.length === 0 ? (
        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-500 shadow-sm">
          Personne n’a encore indiqué avoir été touché par cette fiche.
        </div>
      ) : (
        <div className="space-y-3">
          {participants.map((participant) => (
            <article
              key={participant.participantId}
              className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                  <Heart size={16} fill="currentColor" />
                </div>

                <div className="min-w-0">
                  <div className="text-sm font-black text-slate-900">
                    {getDisplayName(participant)}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}