import {
  ArrowLeft,
  Camera,
  Clock3,
  Pencil,
  Trash2,
} from "lucide-react";
import { SmartImage } from "../../../../lib/media/useSmartImage";
import type { PersonPhotoItem } from "../../data/photos/getVisiblePersonPhotos";

type PersonPhotosPanelProps = {
  photos: PersonPhotoItem[];
  currentParticipantId?: string | null;
  isDeletingPhotoId?: string | null;
  onEditPhoto: (photoId: string) => void;
  onDeletePhoto: (photoId: string) => void;
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

function getStatusChip(status: PersonPhotoItem["moderation_status"]) {
  if (status === "pending") {
    return (
      <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-800">
        En attente
      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span className="rounded-full bg-rose-100 px-2 py-1 text-[10px] font-black text-rose-800">
        Refusée
      </span>
    );
  }

  return null;
}

export function PersonPhotosPanel({
  photos,
  currentParticipantId,
  isDeletingPhotoId,
  onEditPhoto,
  onDeletePhoto,
  onBack,
}: PersonPhotosPanelProps) {
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

      {photos.length === 0 ? (
        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-500 shadow-sm">
          Aucune photo visible pour le moment.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {photos.map((photo) => {
            const isMine =
              Boolean(currentParticipantId) &&
              photo.participant_id === currentParticipantId;

            return (
              <article
                key={photo.id}
                className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm"
              >
                <div className="aspect-square bg-slate-100">
                  <SmartImage
                    src={photo.public_url}
                    alt={photo.caption?.trim() || "Photo de famille"}
                  />
                </div>

                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        photo.moderation_status === "pending"
                          ? "bg-amber-100 text-amber-800"
                          : photo.moderation_status === "rejected"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {photo.moderation_status === "pending" ? (
                        <Clock3 size={16} />
                      ) : (
                        <Camera size={16} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <div className="text-sm font-black text-slate-900">
                          {isMine
                            ? "Ma photo"
                            : photo.authorDisplayName ??
                              "Un membre de la famille"}
                        </div>

                        {getStatusChip(photo.moderation_status)}

                        <div className="text-xs font-semibold text-slate-500">
                          {formatDate(photo.submitted_at)}
                        </div>
                      </div>

                      {photo.caption?.trim() ? (
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {photo.caption}
                        </p>
                      ) : null}

                      {isMine &&
                      photo.moderation_status === "rejected" &&
                      photo.moderator_comment ? (
                        <div className="mt-3 rounded-[16px] border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] leading-5 text-rose-900">
                          {photo.moderator_comment}
                        </div>
                      ) : null}

                      {isMine ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => onEditPhoto(photo.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-[12px] font-semibold text-slate-700 transition"
                          >
                            <Pencil size={14} />
                            Modifier
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeletePhoto(photo.id)}
                            disabled={isDeletingPhotoId === photo.id}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-100 px-3 py-2 text-[12px] font-semibold text-rose-900 transition disabled:opacity-60"
                          >
                            <Trash2 size={14} />
                            {isDeletingPhotoId === photo.id
                              ? "Suppression..."
                              : "Supprimer"}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}