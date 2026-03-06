// src/features/player/team/TeamSelfiePage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../../lib/supabase/client";
import { compressImageFile } from "../../../lib/media/imageCompress";
import {
  Users,
  Camera,
  Image as ImageIcon,
  ShieldCheck,
  RotateCcw,
  ArrowRight,
  AlertTriangle,
  Info,
} from "lucide-react";
import "./team-selfie.css";

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

function isImageFile(f: File) {
  return f.type?.startsWith("image/");
}

export function TeamSelfiePage() {
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";
  const nav = useNavigate();

  const session = useMemo(() => getSession(slug), [slug]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [consent, setConsent] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }, []);

  // cleanup preview url
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!session) {
    return (
      <div className="ts-root">
        <div className="ts-container">
          <header className="ts-header">
            <div className="ts-header__top">
              <div className="ts-titleblock">
                <div className="ts-title">Selfie d’équipe</div>
                <div className="ts-subtitle">Aucune équipe en cours</div>
              </div>
            </div>
          </header>

          <main className="ts-card">
            <div className="ts-empty">
              <div className="ts-empty__icon">
                <Users size={22} />
              </div>
              <div className="ts-empty__title">Crée ou rejoins une équipe</div>
              <div className="ts-empty__text">
                Tu dois être connecté à une équipe avant de prendre le selfie.
              </div>

              <button className="ts-cta" onClick={() => nav(`/e/${slug}/team`, { replace: true })}>
                <ArrowRight size={18} />
                Revenir
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const s = session;

  function openCamera() {
    setError(null);
    fileInputRef.current?.click();
  }

  function onPickFile(f: File | null) {
    setError(null);
    if (!f) return;

    if (!isImageFile(f)) {
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
    setError(null);
    setFile(null);
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    openCamera();
  }

  async function uploadSelfie() {
    setError(null);

    if (!consent) return setError("Consentement requis pour envoyer la photo.");
    if (!file) return setError("Prends un selfie d’équipe d’abord.");

    setLoading(true);
    try {
      // 1) 2 versions : HQ + preview
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

      // 2) upload storage (upsert autorisé pour retake)
      const upHQ = await supabase.storage
        .from("connect-public")
        .upload(pathHQ, blobHQ, { contentType: "image/jpeg", upsert: true });
      if (upHQ.error) throw new Error(upHQ.error.message);

      const upPrev = await supabase.storage
        .from("connect-public")
        .upload(pathPreview, blobPreview, { contentType: "image/jpeg", upsert: true });
      if (upPrev.error) throw new Error(upPrev.error.message);

      // 3) update team paths (⚠️ colonnes requises)
      const upd = await supabase
        .from("teams")
        .update({ selfie_path: pathHQ, selfie_path_preview: pathPreview })
        .eq("id", s.teamId)
        .select("id")
        .single();
      if (upd.error) throw new Error(upd.error.message);

      // 4) tracking uploads (optionnel)
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

      nav(`/e/${slug}/team-dashboard`, { replace: true });
    } catch (e: any) {
      setError(e?.message ?? "Erreur upload");
    } finally {
      setLoading(false);
    }
  }

  const canSend = !!file && consent && !loading;

  return (
    <div className="ts-root">
      <div className="ts-container">
        {/* Header */}
        <header className="ts-header">
          <div className="ts-header__top">
            <div className="ts-titleblock">
              <div className="ts-title">Selfie d’équipe</div>
              <div className="ts-subtitle">
                Équipe : <b>{s.teamName}</b>
              </div>
            </div>

            <div className="ts-badge" title="1 équipe = 1 téléphone">
              <Users size={16} />
              1 équipe
            </div>
          </div>

          <div className="ts-header__bottom">
            <div className="ts-hintline">
              <Info size={16} />
              <span>
                Prenez une photo nette : équipe rapprochée, bonne lumière. (HQ + preview)
              </span>
            </div>
          </div>
        </header>

        {/* Card */}
        <main className="ts-card" aria-busy={loading}>
          {/* Preview area */}
          <div className="ts-preview">
            {!previewUrl ? (
              <button className="ts-preview__placeholder" onClick={openCamera} disabled={loading} type="button">
                <div className="ts-preview__icon">
                  <Camera size={22} />
                </div>
                <div className="ts-preview__title">Prendre le selfie</div>
                <div className="ts-preview__sub">Ouvre la caméra du téléphone</div>
                <div className="ts-preview__chip">
                  <ImageIcon size={16} />
                  image/* • caméra frontale
                </div>
              </button>
            ) : (
              <div className="ts-preview__imageWrap">
                <img className="ts-preview__image" src={previewUrl} alt="Aperçu selfie" />
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
              style={{ display: "none" }}
            />
          </div>

          {/* Consent */}
          <label className={`ts-consent ${loading ? "is-disabled" : ""}`}>
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              disabled={loading}
            />
            <div className="ts-consent__text">
              <div className="ts-consent__title">
                <ShieldCheck size={16} />
                Consentement
              </div>
              <div className="ts-consent__body">
                Nous acceptons que cette photo soit utilisée par l’organisateur dans le cadre de l’événement.
              </div>
            </div>
          </label>

          {/* Error */}
          {error ? (
            <div className="ts-error" role="alert">
              <div className="ts-error__icon">
                <AlertTriangle size={18} />
              </div>
              <div>
                <div className="ts-error__title">Erreur</div>
                <div className="ts-error__msg">{error}</div>
              </div>
            </div>
          ) : null}

          {/* Secondary actions (only if photo selected) */}
          {file ? (
            <div className="ts-actions">
              <button className="ts-btn" onClick={retake} disabled={loading} type="button">
                <RotateCcw size={18} />
                Reprendre
              </button>
            </div>
          ) : null}
        </main>

        <div className="ts-spacer" />

        {/* Footer CTA */}
        <footer className="ts-footer">
          <div className="ts-footer__wrap">
            <button
              className={`ts-cta ${canSend ? "" : "is-disabled"}`}
              onClick={uploadSelfie}
              disabled={!canSend}
              type="button"
            >
              <ArrowRight size={18} />
              {loading ? "Envoi..." : "Envoyer le selfie"}
            </button>

            <div className="ts-footer__sub">
              <span>{file ? "Photo prête" : "Aucune photo"}</span>
              <span>{consent ? "Consentement OK" : "Consentement requis"}</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}