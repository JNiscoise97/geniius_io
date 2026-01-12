//QuestionPhoto.tsx

import { useMemo, useRef, useState } from "react";
import type { PhotoQuestion } from "../../engine/types";
import { supabase } from "../../../../../lib/supabase/client";

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

function zoneIdFromUrl(): string {
  const m = window.location.pathname.match(/\/z\/([^/]+)/);
  return m?.[1] ?? "z01";
}

function computePoints(
  question: PhotoQuestion,
  tierValue: number | null
): number {
  if (question.tier?.options?.length && tierValue != null) {
    const opt = question.tier.options.find((o) => o.value === tierValue);
    return opt?.points ?? 0;
  }
  return question.points ?? 0;
}

export function QuestionPhoto({
  question,
  onSubmit,
  disabled,
}: {
  question: PhotoQuestion;
  onSubmit: (answer: any) => void;
  disabled?: boolean;
}) {
  const slug = slugFromUrl();
  const zoneId = zoneIdFromUrl();
  const s = useMemo(() => getSession(slug), [slug]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [consent, setConsent] = useState(false);
  const [tierValue, setTierValue] = useState<number | null>(
    question.tier?.options?.length
      ? (question.tier.options[0]?.value ?? null)
      : null
  );
  const [note, setNote] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDisabled = Boolean(disabled) || busy;

  const bucket = question.upload?.bucket ?? "connect-public";
  const folder = question.upload?.folder ?? "answers";

  const points = computePoints(question, tierValue);

  function onPickFile(f: File | null) {
    setError(null);
    if (!f) return;

    if (!f.type.startsWith("image/")) {
      setError("Fichier non supporté (image requise).");
      return;
    }

    setFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return url;
    });
  }

  function retake() {
    setFile(null);
    setError(null);
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    fileInputRef.current?.click();
  }

  async function uploadAndSubmit() {
    setError(null);

    if (!s) return setError("Session introuvable. Reviens sur standby.");
    if (!consent) return setError("Consentement requis pour envoyer la photo.");
    if (!file) return setError("Prends une photo d’abord.");

    setBusy(true);
    try {
      // ✅ Qualité: on envoie tel quel (pas de compression) pour v1.
      // Attention: en 4G, des images très lourdes peuvent échouer.
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

      // 2) Insert answer row (si table answers existe)
      // Si tu n'as pas encore la table, commente ce bloc et garde juste onSubmit(...)
      const ins = await supabase.from("answers").insert({
        event_id: s.eventId,
        team_id: s.teamId,
        zone_id: zoneId,
        question_id: question.id,
        question_type: "photo",
        status: "pending",
        points_awarded: null,
        storage_bucket: bucket,
        storage_path: storagePath,
        mime_type: file.type || "image/jpeg",
        size_bytes: blob.size,
        tier_value: tierValue,
        note: question.note?.enabled ? note.trim() || null : null,
      });
      if (ins.error) throw new Error(ins.error.message);

      // 3) Return payload au moteur
      onSubmit({
        kind: "photo",
        storage_bucket: bucket,
        storage_path: storagePath,
        status: "pending",
        tier_value: tierValue ?? undefined,
        note: question.note?.enabled ? note.trim() || undefined : undefined,
      });
    } catch (e: any) {
      setError(e?.message ?? "Erreur upload");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack" style={{ marginTop: 12 }}>
      {/* Consent */}
      <label style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <input
          type="checkbox"
          checked={consent}
          disabled={isDisabled}
          onChange={(e) => setConsent(e.target.checked)}
          style={{ marginTop: 4 }}
        />
        <span className="muted">
          {question.consentText ??
            "Nous acceptons que cette photo soit utilisée par l’organisateur."}
        </span>
      </label>

      {/* Tier */}
      {question.tier?.options?.length ? (
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 14,
            padding: 12,
          }}
        >
          <div className="muted" style={{ marginBottom: 8 }}>
            {question.tier.label ?? "Choisis un palier"}
          </div>
          <div className="stack">
            {question.tier.options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`btn ${tierValue === opt.value ? "btn--primary" : ""}`}
                disabled={isDisabled}
                onClick={() => setTierValue(opt.value)}
              >
                {opt.label} — <strong>{opt.points} pts</strong>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="muted" style={{ fontSize: 12, opacity: 0.9 }}>
          Valeur : <strong>{points} pts</strong>
        </div>
      )}

      {/* Note */}
      {question.note?.enabled ? (
        <textarea
          className="btn"
          style={{ textAlign: "left", minHeight: 90, resize: "vertical" }}
          placeholder={question.note.placeholder ?? "Note (optionnel)"}
          value={note}
          disabled={isDisabled}
          onChange={(e) => setNote(e.target.value)}
        />
      ) : null}

      {/* File input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
        style={{ display: "none" }}
      />

      {!file ? (
        <button
          className="btn btn--primary"
          type="button"
          disabled={isDisabled}
          onClick={() => fileInputRef.current?.click()}
        >
          Prendre la photo
        </button>
      ) : (
        <>
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Aperçu"
              style={{
                width: "100%",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            />
          ) : null}

          <button
            className="btn"
            type="button"
            disabled={isDisabled}
            onClick={retake}
          >
            Reprendre la photo
          </button>

          <button
            className="btn btn--primary"
            type="button"
            disabled={isDisabled || !consent}
            onClick={uploadAndSubmit}
          >
            {busy ? "Envoi..." : "Envoyer"}
          </button>
        </>
      )}

      {error ? (
        <div
          style={{
            border: "1px solid rgba(255,0,0,0.35)",
            padding: 12,
            borderRadius: 12,
          }}
        >
          <strong>Erreur :</strong> <span className="muted">{error}</span>
        </div>
      ) : null}

      {!s ? (
        <div className="muted" style={{ fontSize: 12 }}>
          ⚠️ Session non trouvée (localStorage).
        </div>
      ) : null}
    </div>
  );
}
