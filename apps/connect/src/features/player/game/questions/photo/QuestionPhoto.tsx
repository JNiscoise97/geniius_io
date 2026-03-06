// src/features/player/game/questions/photo/QuestionPhoto.tsx
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { PhotoQuestion } from "../../engine/types";
import { supabase } from "../../../../../lib/supabase/client";
import "../../question-screen.css";

type SessionCtx = {
  eventSlug: string;
  eventId: string;
  teamId: string;
  teamName: string;
  session_token: string;
};

function getSession(slug: string): SessionCtx | null {
  const raw = localStorage.getItem(`connect:${slug}:session`);
  return raw ? (JSON.parse(raw) as SessionCtx) : null;
}

function slugFromUrl(): string {
  const m = window.location.pathname.match(/\/e\/([^/]+)/);
  return m?.[1] ?? "demo";
}

// ⚠️ adapte si ta route est /zone/:zoneId (dans ton TeamZonesPage c'est /zone/:id)
// Ici on accepte /z/:id OU /zone/:id
function zoneIdFromUrl(): string {
  const m1 = window.location.pathname.match(/\/z\/([^/]+)/);
  if (m1?.[1]) return m1[1];
  const m2 = window.location.pathname.match(/\/zone\/([^/]+)/);
  return m2?.[1] ?? "z01";
}

function computePoints(
  question: PhotoQuestion,
  tierValue: number | null,
): number {
  if (question.tier?.options?.length && tierValue != null) {
    const opt = question.tier.options.find((o) => o.value === tierValue);
    return opt?.points ?? 0;
  }
  return question.points ?? 0;
}

/**
 * Draft piloté par QuestionRenderer (remonté au parent)
 * - doit contenir tout ce qui conditionne canSubmit
 * - on évite d'y mettre previewUrl (détail UI local)
 */
export type PhotoDraft = {
  consent: boolean;
  tierValue: number | null;
  note: string;
  file: File | null;
};

export type QuestionPhotoHandle = {
  canSubmit: () => boolean;
  submit: () => Promise<void>;
};

export const QuestionPhoto = forwardRef<
  QuestionPhotoHandle,
  {
    question: PhotoQuestion;
    draft: PhotoDraft;
    onDraftChange: (next: PhotoDraft) => void;
    onSubmit: (answer: any) => void; // payload pour ton moteur
    disabled?: boolean;
  }
>(function QuestionPhoto(
  { question, draft, onDraftChange, onSubmit, disabled },
  ref,
) {
  const slug = slugFromUrl();
  const zoneId = zoneIdFromUrl();
  const s = useMemo(() => getSession(slug), [slug]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // UI local (pas dans le draft)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDisabled = Boolean(disabled) || busy;

  const bucket = question.upload?.bucket ?? "connect-public";
  const folder = question.upload?.folder ?? "answers";

  const hasTier = !!question.tier?.options?.length;
  const hasNote = question.note?.enabled === true;

  // ⚠️ affichage uniquement : les points ne sont PAS attribués tant que l’admin n’a pas validé
  const pointsPreview = computePoints(question, draft.tierValue);

  function setDraft(patch: Partial<PhotoDraft>) {
    onDraftChange({ ...draft, ...patch });
  }

  function onPickFile(f: File | null) {
    setError(null);
    if (!f) return;

    if (!f.type.startsWith("image/")) {
      setError("Fichier non supporté (image requise).");
      return;
    }

    setDraft({ file: f });

    const url = URL.createObjectURL(f);
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return url;
    });
  }

  function retake() {
    setError(null);
    setDraft({ file: null });

    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });

    fileInputRef.current?.click();
  }

  function internalCanSubmit(): boolean {
    if (isDisabled) return false;
    if (!s) return false;

    if (!draft.consent) return false;
    if (!draft.file) return false;

    if (hasTier && typeof draft.tierValue !== "number") return false;

    return true;
  }

  async function uploadAndSubmit() {
    setError(null);

    if (!s) {
      setError("Session introuvable. Reviens sur standby.");
      return;
    }
    if (!draft.consent) {
      setError("Consentement requis pour envoyer la photo.");
      return;
    }
    if (!draft.file) {
      setError("Prends une photo d’abord.");
      return;
    }
    if (hasTier && typeof draft.tierValue !== "number") {
      setError("Choisis un palier avant d’envoyer.");
      return;
    }

    setBusy(true);
    try {
      // v1: pas de compression
      const file = draft.file;
      const blob: Blob = file;

      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext)
        ? ext
        : "jpg";

      const filename = `${question.id}-${Date.now()}.${safeExt}`;
      const storagePath = `events/${s.eventId}/teams/${s.teamId}/${folder}/${filename}`;

      // 1) Upload Storage
      const up = await supabase.storage.from(bucket).upload(storagePath, blob, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });
      if (up.error) throw new Error(up.error.message);

      // 2) Enqueue via RPC submit_answer (PHOTO => pending, points attribués plus tard par l’admin)
      const mime = file.type || "image/jpeg";
      const note = hasNote ? draft.note.trim() || null : null;

      const answerJson = {
        kind: "photo",
        consent: true,
        tier_value: draft.tierValue,
        note,
        storage_bucket: bucket,
        storage_path: storagePath,
        mime_type: mime,
        size_bytes: blob.size,
      };

      const rpc = await supabase.rpc("submit_answer", {
        p_event_id: s.eventId,
        p_team_id: s.teamId,
        p_zone_id: zoneId,
        p_question_id: question.id,
        p_question_type: "photo",
        p_answer_json: answerJson,

        // 🔥 photo => queue "pending"
        p_status: "pending",

        // ✅ si ta fonction SQL supporte ces paramètres, on les passe
        p_storage_bucket: bucket,
        p_storage_path: storagePath,
        p_mime_type: mime,
        p_size_bytes: blob.size,
        p_tier_value: draft.tierValue,
        p_note: note,
        p_max_attempts: question.retry ? 2 : 1,
      });

      if (rpc.error) throw new Error(rpc.error.message);

      // 3) payload moteur (après persistance OK)
      onSubmit({
        kind: "photo",
        storage_bucket: bucket,
        storage_path: storagePath,
        mime_type: mime,
        size_bytes: blob.size,
        status: "pending",
        tier_value: draft.tierValue ?? null,
        note,
        consent: true,
      });
    } catch (e: any) {
      const msg = e?.message ?? "Erreur upload";
      setError(
        msg.includes("MAX_ATTEMPTS_REACHED") ? "Nombre d’essais atteint." : msg,
      );
      throw e;
    } finally {
      setBusy(false);
    }
  }

  // Exposition à QuestionRenderer (CTA footer)
  useImperativeHandle(
    ref,
    () => ({
      canSubmit: () => internalCanSubmit(),
      submit: async () => {
        await uploadAndSubmit();
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draft, disabled, busy, s, hasTier, hasNote, bucket, folder, zoneId],
  );

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      setPreviewUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return null;
      });
    };
  }, []);

  // Si draft.file change depuis l'extérieur, sync preview
  useEffect(() => {
    if (!draft.file) {
      setPreviewUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return null;
      });
      return;
    }
    // si on a déjà un preview, on garde (évite recréer URL à chaque render)
    // sinon on crée
    setPreviewUrl((old) => old ?? URL.createObjectURL(draft.file as File));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.file]);

  return (
    <div className="qs-body">
      {/* Hint */}
      <div className="qs-hint" style={{ marginTop: 0 }}>
        {hasTier ? (
          "Choisis un palier, puis prends la photo."
        ) : (
          <>
            Valeur : <b>{pointsPreview} pts</b> (après validation)
          </>
        )}
      </div>

      {/* Consent */}
      <label
        className={`qs-consent ${isDisabled ? "is-disabled" : ""}`}
        style={{ marginTop: 10 }}
      >
        <input
          type="checkbox"
          checked={!!draft.consent}
          disabled={isDisabled}
          onChange={(e) => setDraft({ consent: e.target.checked })}
        />
        <div className="qs-consent__text">
          <div className="qs-consent__title">Consentement</div>
          <div className="qs-consent__body">
            {question.consentText ??
              "Nous acceptons que cette photo soit utilisée par l’organisateur."}
          </div>
        </div>
      </label>

      {/* Tier */}
      {hasTier ? (
        <div style={{ marginTop: 12 }}>
          <div className="qs-label">
            {question.tier?.label ?? "Choisis un palier"}
          </div>
          <div className="qs-options" style={{ marginTop: 10 }}>
            {question.tier!.options.map((opt) => {
              const active = draft.tierValue === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`qs-option ${active ? "is-active" : ""}`}
                  disabled={isDisabled}
                  onClick={() => setDraft({ tierValue: opt.value })}
                >
                  <div className="qs-option__left">
                    <div className="qs-option__value">{opt.label}</div>
                    <div className="qs-option__sub">+{opt.points} pts</div>
                  </div>
                  <div
                    className={`qs-dot ${active ? "is-on" : ""}`}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Note */}
      {hasNote ? (
        <div className="qs-field" style={{ marginTop: 12 }}>
          <label className="qs-label">Note (optionnel)</label>
          <textarea
            className="qs-textarea"
            value={draft.note ?? ""}
            disabled={isDisabled}
            onChange={(e) => setDraft({ note: e.target.value })}
            placeholder={
              question.note?.placeholder ?? "Optionnel : prénoms / lien…"
            }
            rows={3}
          />
        </div>
      ) : null}

      {/* File input (hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
        style={{ display: "none" }}
      />

      {/* Capture / preview (NO submit button here) */}
      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
        {!draft.file ? (
          <button
            className="qs-primary"
            type="button"
            disabled={isDisabled}
            onClick={() => fileInputRef.current?.click()}
          >
            Prendre la photo
          </button>
        ) : (
          <>
            {previewUrl ? (
              <div
                style={{
                  width: "100%",
                  aspectRatio: "1 / 1",
                  borderRadius: 16,
                  border: "1px solid rgba(15, 23, 42, 0.18)",
                  background: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                <img
                  src={previewUrl}
                  alt="Aperçu"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                  }}
                />
              </div>
            ) : null}

            <button
              className="qs-option"
              type="button"
              disabled={isDisabled}
              onClick={retake}
            >
              <div className="qs-option__left">
                <div className="qs-option__value">Reprendre la photo</div>
                <div className="qs-option__sub">Nouvelle prise</div>
              </div>
              <div className="qs-dot" aria-hidden="true" />
            </button>

            {!draft.consent ? (
              <div className="qs-hint">
                Coche le consentement pour pouvoir envoyer.
              </div>
            ) : null}
          </>
        )}
      </div>

      {/* Meta */}
      <div className="qs-hint" style={{ marginTop: 10 }}>
        Upload : <b>{bucket}</b> / {folder}
      </div>

      {/* Errors */}
      {error ? (
        <div
          style={{
            marginTop: 12,
            border: "1px solid rgba(220, 38, 38, 0.35)",
            background: "rgba(220, 38, 38, 0.06)",
            padding: 12,
            borderRadius: 16,
            fontWeight: 900,
          }}
        >
          <div style={{ fontWeight: 1000 }}>Erreur</div>
          <div style={{ marginTop: 4, color: "rgba(15, 23, 42, 0.85)" }}>
            {error}
          </div>
        </div>
      ) : null}

      {!s ? (
        <div className="qs-hint" style={{ marginTop: 10 }}>
          ⚠️ Session non trouvée (localStorage).
        </div>
      ) : null}
    </div>
  );
});
