import { ArrowLeft, Camera } from "lucide-react";
import type { ApprovedPersonPhoto } from "../api/getApprovedPersonPhotos";
import { SmartImage } from "../../../lib/media/useSmartImage";

type PersonPhotosPanelProps = {
  photos: ApprovedPersonPhoto[];
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

function getAuthorLabel(photo: ApprovedPersonPhoto): string {
  if (photo.authorDisplayName?.trim()) {
    return photo.authorDisplayName.trim();
  }

  return "Un membre de la famille";
}

export function PersonPhotosPanel({
  photos,
  onBack,
}: PersonPhotosPanelProps) {
  const mockPhotos: ApprovedPersonPhoto[] = [
    {
      id: "mock-photo-1",
      event_slug: "demo",
      participant_id: "mock-participant-1",
      person_id: "mock-person-1",
      storage_path: "mock/photo-1.jpg",
      public_url:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80",
      caption:
        "Une photo ancienne que ma mère gardait précieusement. On disait souvent que c’était l’un de ses plus beaux portraits.",
      moderation_status: "approved",
      submitted_at: "2025-06-12T10:00:00.000Z",
      updated_at: "2025-06-12T10:00:00.000Z",
      authorDisplayName: "Marie dite Manzel DURAND",
    } as ApprovedPersonPhoto,
    {
      id: "mock-photo-2",
      event_slug: "demo",
      participant_id: "mock-participant-2",
      person_id: "mock-person-1",
      storage_path: "mock/photo-2.jpg",
      public_url:
        "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?auto=format&fit=crop&w=1200&q=80",
      caption:
        "Photo transmise par mon oncle. Il disait qu’on retrouvait bien son regard et sa posture sur ce cliché.",
      moderation_status: "approved",
      submitted_at: "2025-07-03T10:00:00.000Z",
      updated_at: "2025-07-03T10:00:00.000Z",
      authorDisplayName: "Jean dit Ti Marco PAYET",
    } as ApprovedPersonPhoto,
  ];

  const displayedPhotos = photos.length > 0 ? photos : mockPhotos;

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

      {displayedPhotos.length === 0 ? (
        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-500 shadow-sm">
          Aucune photo validée n’est visible pour le moment.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {displayedPhotos.map((photo) => (
            <article
              key={photo.id}
              className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm"
            >
              <div className="aspect-square bg-slate-100">
                <SmartImage
                  src={photo.public_url}
                  alt={photo.caption?.trim() || ""}
                />
              </div>

              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                    <Camera size={16} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <div className="text-sm font-black text-slate-900">
                        {getAuthorLabel(photo)}
                      </div>
                      <div className="text-xs font-semibold text-slate-500">
                        {formatDate(photo.submitted_at)}
                      </div>
                    </div>

                    {photo.caption?.trim() ? (
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {photo.caption}
                      </p>
                    ) : null}
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