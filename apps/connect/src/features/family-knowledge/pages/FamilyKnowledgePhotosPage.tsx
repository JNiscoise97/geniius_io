import { useEffect, useMemo, useState } from "react";
import { Images, Loader2 } from "lucide-react";
import { useParams } from "react-router-dom";
import { getParticipantSession } from "../../../lib/participant-session/getActiveParticipant";
import { getFamilyKnowledgePhotoTargets } from "../api/getFamilyKnowledgePhotoTargets";
import { sendFamilyKnowledgePhotoEmail } from "../api/sendFamilyKnowledgePhotoEmail";
import { uploadFamilyKnowledgePhoto } from "../api/uploadFamilyKnowledgePhoto";
import { FamilyKnowledgePhotoCard } from "../components/FamilyKnowledgePhotoCard";
import type { FamilyPhotoTarget } from "../types/familyKnowledgePhotoTargets";

type UploadStatus = "idle" | "uploading" | "sent" | "error";

type UploadState = {
  status: UploadStatus;
  errorMessage: string | null;
};

function makeStateKey(target: FamilyPhotoTarget): string {
  return [
    target.sourceTable,
    target.personType,
    target.key,
    target.rawPath,
  ].join("::");
}

function groupTitle(personType: FamilyPhotoTarget["personType"]): string {
  switch (personType) {
    case "parent":
      return "Parents";
    case "child":
      return "Enfants";
    case "partner":
      return "Conjoint";
    case "current_link":
      return "Liens actuels";
    case "grandparent":
      return "Grands-parents";
    case "aunt_uncle":
      return "Oncles et tantes";
    case "story_teller":
      return "Personnes ressources";
    default:
      return "Autres";
  }
}

export function FamilyKnowledgePhotosPage() {
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const [loading, setLoading] = useState(true);
  const [targets, setTargets] = useState<FamilyPhotoTarget[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [uploadStates, setUploadStates] = useState<Record<string, UploadState>>(
    {},
  );

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setGlobalError(null);

      try {
        const session = await getParticipantSession(slug);

        if (!session?.participantId) {
          throw new Error("Participant introuvable.");
        }

        const rows = await getFamilyKnowledgePhotoTargets({
          participantId: session.participantId,
        });

        if (!cancelled) {
          setTargets(rows);
        }
      } catch (error) {
        if (!cancelled) {
          setGlobalError(
            error instanceof Error
              ? error.message
              : "Impossible de charger les personnes à photographier.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const groupedTargets = useMemo(() => {
    const map = new Map<string, FamilyPhotoTarget[]>();

    for (const target of targets) {
      const title = groupTitle(target.personType);
      const list = map.get(title) ?? [];
      list.push(target);
      map.set(title, list);
    }

    return Array.from(map.entries());
  }, [targets]);

  async function handleUpload(target: FamilyPhotoTarget, file: File) {
    const session = await getParticipantSession(slug);

    if (!session?.participantId) {
      throw new Error("Participant introuvable.");
    }

    const stateKey = makeStateKey(target);

    setUploadStates((prev) => ({
      ...prev,
      [stateKey]: {
        status: "uploading",
        errorMessage: null,
      },
    }));

    try {
      const uploadResult = await uploadFamilyKnowledgePhoto({
        eventSlug: slug,
        participantId: session.participantId,
        target,
        file,
      });

      await sendFamilyKnowledgePhotoEmail({
        eventSlug: slug,
        participantId: session.participantId,
        target,
        storagePath: uploadResult.storagePath,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream",
      });

      setUploadStates((prev) => ({
        ...prev,
        [stateKey]: {
          status: "sent",
          errorMessage: null,
        },
      }));
    } catch (error) {
      setUploadStates((prev) => ({
        ...prev,
        [stateKey]: {
          status: "error",
          errorMessage:
            error instanceof Error
              ? error.message
              : "Une erreur est survenue.",
        },
      }));
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center gap-2 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Chargement des personnes concernées...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-700 p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-white/10 p-3">
            <Images className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Photos de la famille</h1>
            <p className="mt-1 text-sm text-slate-200">
              Ajoute les photos des personnes pour lesquelles la photo est indiquée comme disponible.
            </p>
          </div>
        </div>
      </div>

      {globalError ? (
        <div className="mb-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {globalError}
        </div>
      ) : null}

      {!targets.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
          Aucune personne avec <code>hasPhoto = yes</code> n’a été trouvée dans les données familiales.
        </div>
      ) : null}

      <div className="space-y-8">
        {groupedTargets.map(([title, items]) => (
          <section key={title}>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              {title}
            </h2>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((target) => {
                const stateKey = makeStateKey(target);
                const state = uploadStates[stateKey] ?? {
                  status: "idle" as const,
                  errorMessage: null,
                };

                return (
                  <FamilyKnowledgePhotoCard
                    key={stateKey}
                    target={target}
                    status={state.status}
                    errorMessage={state.errorMessage}
                    onPickFile={(file) => handleUpload(target, file)}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}