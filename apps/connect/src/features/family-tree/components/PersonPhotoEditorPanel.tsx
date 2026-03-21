import { ArrowLeft, Camera, Info, Save, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { SmartImage } from "../../../lib/media/useSmartImage";

type PhotoModerationCounts = {
  pending: number;
  approved: number;
  rejected: number;
};

type PersonPhotoEditorPanelProps = {
  personDisplayName: string;
  isPossiblyAlive: boolean;
  isOwnProfile: boolean;
  mode: "create" | "edit";
  selectedFile: File | null;
  existingPhotoUrl?: string | null;
  caption: string;
  consentObtained: boolean;
  setAsProfilePhoto: boolean;
  counts: PhotoModerationCounts;
  publishSuccessMessage?: string | null;
  isSubmitting: boolean;
  onBack: () => void;
  onSelectFile: (file: File) => void;
  onChangeCaption: (value: string) => void;
  onChangeConsent: (value: boolean) => void;
  onChangeSetAsProfilePhoto: (value: boolean) => void;
  onSubmit: () => void;
};

export function PersonPhotoEditorPanel({
  personDisplayName,
  isPossiblyAlive,
  isOwnProfile,
  mode,
  selectedFile,
  existingPhotoUrl,
  caption,
  consentObtained,
  setAsProfilePhoto,
  counts,
  publishSuccessMessage,
  isSubmitting,
  onBack,
  onSelectFile,
  onChangeCaption,
  onChangeConsent,
  onChangeSetAsProfilePhoto,
  onSubmit,
}: PersonPhotoEditorPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [imageChanged, setImageChanged] = useState(false);

  const previewUrl = useMemo(() => {
    if (!selectedFile) return existingPhotoUrl ?? null;
    return URL.createObjectURL(selectedFile);
  }, [existingPhotoUrl, selectedFile]);

  useEffect(() => {
    if (!selectedFile) {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      return;
    }

    const url = previewUrl;
    if (url && url !== existingPhotoUrl) {
      objectUrlRef.current = url;
    }

    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [existingPhotoUrl, previewUrl, selectedFile]);

  const consentIsRequired = isPossiblyAlive && !isOwnProfile;

  const canSubmit =
    !isSubmitting &&
    (mode === "edit" || Boolean(selectedFile)) &&
    (!consentIsRequired || consentObtained);

  const sectionLabel = isOwnProfile
    ? "Mes photos"
    : "Mes photos pour cette personne";

  const moderationInfoText = isOwnProfile
    ? mode === "edit"
      ? "Ta mise à jour sera soumise à modération avant d’apparaître dans les photos visibles par la famille. Tu peux aussi proposer cette image comme photo de profil."
      : "Ta photo sera soumise à modération avant d’apparaître dans les photos visibles par la famille. Tu peux aussi proposer cette image comme photo de profil."
    : mode === "edit"
      ? "Ta mise à jour sera soumise à modération avant d’apparaître dans les photos visibles par la famille."
      : "Ta photo sera soumise à modération avant d’apparaître dans les photos visibles par la famille.";

  const editorTitle = mode === "edit" ? "Modifier la photo" : "Ajouter une photo";

  const editorDescription = isOwnProfile
    ? mode === "edit"
      ? "Tu peux mettre à jour la description de ta photo et, si besoin, remplacer l’image."
      : "Choisis une photo nette si possible et ajoute quelques informations utiles pour la famille."
    : mode === "edit"
      ? `Tu peux mettre à jour la description de la photo de ${personDisplayName} et, si besoin, remplacer l’image.`
      : `Sélectionne une image nette si possible et ajoute quelques informations pour aider la famille à l’identifier.`;

  const submitLabel = isSubmitting
    ? "Publication..."
    : mode === "edit"
      ? "Mettre à jour la photo"
      : "Publier la photo";

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

      {publishSuccessMessage ? (
        <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-3">
          <div className="text-sm font-semibold text-emerald-900">
            {publishSuccessMessage}
          </div>
        </div>
      ) : null}

      <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
          {sectionLabel}
        </div>

        <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
          <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-900">
            En attente : {counts.pending}
          </span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-900">
            Acceptées : {counts.approved}
          </span>
          <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-900">
            Refusées : {counts.rejected}
          </span>
        </div>
      </div>

      <div className="rounded-[20px] border border-indigo-200 bg-indigo-50 px-4 py-3">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-700" />
          <div className="min-w-0">
            <div className="text-sm text-indigo-900">{moderationInfoText}</div>
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-slate-900">
          <Camera size={16} />
          <div className="text-sm font-black">{editorTitle}</div>
        </div>

        <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
          {editorDescription}
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setImageChanged(true);
              onSelectFile(file);
            }
          }}
        />

        {previewUrl ? (
          <div className="mt-4 overflow-hidden rounded-[20px] border border-slate-200 bg-slate-100">
            <div className="aspect-square">
              <SmartImage
                src={previewUrl}
                alt={caption.trim() || `Photo de ${personDisplayName}`}
              />
            </div>
          </div>
        ) : null}

        <div className="mt-4">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-800 transition disabled:opacity-50"
          >
            <Upload size={16} />
            {mode === "edit"
              ? selectedFile
                ? "Changer à nouveau l’image"
                : "Remplacer l’image"
              : "Choisir une photo"}
          </button>
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-xs font-extrabold uppercase tracking-wide text-slate-500">
            Commentaire
          </label>
          <textarea
            value={caption}
            onChange={(e) => onChangeCaption(e.target.value)}
            placeholder={
              isOwnProfile
                ? "Décris la photo, le contexte, le lieu, la période…"
                : "Décris la photo, le contexte, le lieu, la période, les personnes visibles…"
            }
            className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>

        {consentIsRequired ? (
          <label className="mt-4 flex items-start gap-3 rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3">
            <input
              type="checkbox"
              checked={consentObtained}
              onChange={(e) => onChangeConsent(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300"
            />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-amber-950">
                J’ai obtenu le consentement de la personne pour afficher cette
                photo dans l’arbre.
              </div>
              <div className="mt-1 text-xs leading-5 text-amber-900">
                Cette confirmation est obligatoire car cette personne est
                potentiellement vivante.
              </div>
            </div>
          </label>
        ) : null}

        {isOwnProfile ? (
          <label className="mt-4 flex items-start gap-3 rounded-[20px] border border-indigo-200 bg-indigo-50 px-4 py-3">
            <input
              type="checkbox"
              checked={setAsProfilePhoto}
              onChange={(e) => onChangeSetAsProfilePhoto(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-950">
                Définir cette photo comme photo de profil
              </div>
              <div className="mt-1 text-xs leading-5 text-indigo-900">
                {imageChanged || mode === "create"
                  ? "Si la photo est validée, elle pourra être utilisée comme photo principale de ta fiche."
                  : "Tu peux demander à utiliser cette photo comme photo principale de ta fiche."}
              </div>
            </div>
          </label>
        ) : null}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 rounded-2xl bg-[color:var(--blue)] px-4 py-3 text-sm font-black text-white transition disabled:opacity-50"
          >
            <Save size={16} />
            {submitLabel}
          </button>
        </div>
      </div>
    </section>
  );
}