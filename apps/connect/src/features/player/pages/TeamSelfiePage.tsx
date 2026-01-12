import { useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../../lib/supabase/client";
import { compressImageFile } from "../../../lib/media/imageCompress";

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

export function TeamSelfiePage() {
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";
  const nav = useNavigate();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const session = useMemo(() => getSession(slug), [slug]);

  const [consent, setConsent] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session) {
    return (
      <div className="screen">
        <h1 className="h1">Aucune équipe</h1>
        <p className="muted">Crée ou reprends une équipe avant de prendre un selfie.</p>
      </div>
    );
  }

  const s = session;

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

  async function uploadSelfie() {
    setError(null);

    if (!consent) return setError("Consentement requis pour envoyer la photo.");
    if (!file) return setError("Prends un selfie d’équipe d’abord.");

    setLoading(true);
    try {
      // 1) Deux versions : HQ (com) + preview (app)
      const blobHQ = await compressImageFile(file, {
        maxSize: 4096,
        quality: 0.93,
        mimeType: "image/jpeg",
      });

      const blobPreview = await compressImageFile(file, {
        maxSize: 1600,
        quality: 0.82,
        mimeType: "image/jpeg",
      });

      const base = `events/${s.eventId}/teams/${s.teamId}`;
      const pathHQ = `${base}/selfie.hq.jpg`;
      const pathPreview = `${base}/selfie.preview.jpg`;

      // 2) Upload Storage (upsert pour retake)
      const upHQ = await supabase.storage
        .from("connect-public")
        .upload(pathHQ, blobHQ, { contentType: "image/jpeg", upsert: true });

      if (upHQ.error) throw new Error(upHQ.error.message);

      const upPrev = await supabase.storage
        .from("connect-public")
        .upload(pathPreview, blobPreview, { contentType: "image/jpeg", upsert: true });

      if (upPrev.error) throw new Error(upPrev.error.message);

      // 3) Update DB (⚠️ nécessite colonne selfie_path_preview)
      const upd = await supabase
        .from("teams")
        .update({ selfie_path: pathHQ, selfie_path_preview: pathPreview })
        .eq("id", s.teamId)
        .select("id, selfie_path, selfie_path_preview")
        .single();

      if (upd.error) throw new Error(upd.error.message);
      if (!upd.data) throw new Error("Update team failed (no row updated)");

      // 4) Tracking uploads (optionnel mais utile)
      const ins1 = await supabase.from("uploads").insert({
        event_id: s.eventId,
        team_id: s.teamId,
        kind: "team_selfie",
        storage_bucket: "connect-public",
        storage_path: pathHQ,
      });
      if (ins1.error) throw new Error(ins1.error.message);

      const ins2 = await supabase.from("uploads").insert({
        event_id: s.eventId,
        team_id: s.teamId,
        kind: "team_selfie",
        storage_bucket: "connect-public",
        storage_path: pathPreview,
      });
      if (ins2.error) throw new Error(ins2.error.message);

      nav(`/e/${slug}/standby`, { replace: true });
    } catch (e: any) {
      setError(e?.message ?? "Erreur upload");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="screen">
      <h1 className="h1">Selfie d’équipe</h1>
      <p className="muted">
        Équipe : <strong>{s.teamName}</strong>
      </p>

      <div style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            style={{ marginTop: 4 }}
          />
          <span className="muted">
            Nous acceptons que cette photo soit utilisée par l’organisateur dans le cadre de l’événement.
          </span>
        </label>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
          style={{ display: "none" }}
        />

        {!file ? (
          <button
            className="btn btn--primary"
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            Prendre le selfie
          </button>
        ) : (
          <>
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Aperçu selfie"
                style={{
                  width: "100%",
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              />
            )}

            <div className="stack">
              <button className="btn" type="button" onClick={retake} disabled={loading}>
                Reprendre la photo
              </button>
              <button
                className="btn btn--primary"
                type="button"
                onClick={uploadSelfie}
                disabled={loading}
              >
                {loading ? "Envoi..." : "Envoyer le selfie"}
              </button>
            </div>
          </>
        )}

        {error && (
          <div style={{ border: "1px solid rgba(255, 0, 0, 0.35)", padding: 12, borderRadius: 12 }}>
            <strong>Erreur :</strong> <span className="muted">{error}</span>
          </div>
        )}

        <p className="muted" style={{ fontSize: 12, opacity: 0.9 }}>
          Astuce : rapproche l’équipe, bonne lumière. Une version HQ est conservée pour la com + une preview
          optimisée pour l’app.
        </p>
      </div>
    </div>
  );
}
