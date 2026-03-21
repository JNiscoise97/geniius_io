// src/features/moderation/pages/ModerationReviewPage.tsx

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Image as ImageIcon,
  Loader2,
  Lock,
  MessageSquareText,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getModerationEntity } from "../api/getModerationEntity";
import { moderateEntity } from "../api/moderateEntity";
import type {
  ModerationEntityRecord,
  ModerationStatus,
  SupportedModerationEntityType,
} from "../types";
import { isSupportedModerationEntityType } from "../types";

const MODERATION_PASSWORD = "3826";

function getStatusBadge(status: ModerationStatus) {
  switch (status) {
    case "approved":
      return {
        label: "Validé",
        icon: <CheckCircle2 size={16} />,
        className:
          "inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700",
      };

    case "rejected":
      return {
        label: "Rejeté",
        icon: <XCircle size={16} />,
        className:
          "inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700",
      };

    case "pending":
    default:
      return {
        label: "En attente",
        icon: <Clock3 size={16} />,
        className:
          "inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700",
      };
  }
}

function EntityIcon({ type }: { type: SupportedModerationEntityType }) {
  if (type === "photo") {
    return <ImageIcon size={18} />;
  }

  return <MessageSquareText size={18} />;
}

function EntityPreview({ entity }: { entity: ModerationEntityRecord }) {
  if (entity.type === "photo") {
    return (
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-sm font-black text-slate-900">Contenu proposé</div>

        <div className="mt-4 space-y-4">
          {entity.imageUrl ? (
            <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50">
              <img
                src={entity.imageUrl}
                alt={entity.title}
                className="block h-auto w-full object-cover"
              />
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm font-medium text-slate-500">
              Impossible d’afficher l’image.
            </div>
          )}

          {entity.content ? (
            <div className="whitespace-pre-wrap rounded-[24px] bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              {entity.content}
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm font-black text-slate-900">Contenu proposé</div>

      <div className="mt-4 whitespace-pre-wrap rounded-[24px] bg-slate-50 p-4 text-sm leading-6 text-slate-700">
        {entity.content || "Aucun contenu à afficher."}
      </div>
    </section>
  );
}

export function ModerationReviewPage() {
  const navigate = useNavigate();
  const { eventSlug, entityType, entityId } = useParams();

  const [entity, setEntity] = useState<ModerationEntityRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingAction, setSubmittingAction] = useState<
    "approved" | "rejected" | null
  >(null);
  const [moderatorComment, setModeratorComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  const validType: SupportedModerationEntityType | null =
    isSupportedModerationEntityType(entityType) ? entityType : null;

  const moderationSessionKey = eventSlug
    ? `connect:${eventSlug}:moderation`
    : null;

  const statusBadge = useMemo(() => {
    if (!entity) return null;
    return getStatusBadge(entity.moderationStatus);
  }, [entity]);

  async function load() {
    if (!eventSlug || !validType || !entityId) {
      setError("Paramètres de modération invalides.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getModerationEntity({
        eventSlug,
        entityType: validType,
        entityId,
      });

      setEntity(data);
      setModeratorComment(data.moderatorComment ?? "");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger l’élément à modérer.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleUnlock() {
    if (!eventSlug || !moderationSessionKey) {
      setError("Paramètre eventSlug manquant.");
      return;
    }

    if (password === MODERATION_PASSWORD) {
      sessionStorage.setItem(moderationSessionKey, "true");
      setIsUnlocked(true);
      setPasswordError(false);
      setPassword("");
      return;
    }

    setPasswordError(true);
  }

  useEffect(() => {
    if (!eventSlug) {
      setError("Paramètre eventSlug manquant.");
      setLoading(false);
      return;
    }

    if (!moderationSessionKey) {
      setLoading(false);
      return;
    }

    const unlocked = sessionStorage.getItem(moderationSessionKey);
    if (unlocked === "true") {
      setIsUnlocked(true);
      return;
    }

    setLoading(false);
  }, [eventSlug, moderationSessionKey]);

  useEffect(() => {
    if (!eventSlug || !validType || !entityId || !isUnlocked) return;
    void load();
  }, [eventSlug, validType, entityId, isUnlocked]);

  async function handleModerate(nextStatus: "approved" | "rejected") {
    if (!eventSlug || !validType || !entityId || !entity) return;

    setSubmittingAction(nextStatus);
    setError(null);

    try {
      await moderateEntity({
        eventSlug,
        entityType: validType,
        entityId,
        status: nextStatus,
        moderatorComment,
      });

      navigate(`/e/${eventSlug}/moderation`, { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de mettre à jour la modération.",
      );
      setSubmittingAction(null);
    }
  }

  function handleBack() {
    if (!eventSlug) {
      navigate(-1);
      return;
    }

    navigate(`/e/${eventSlug}/moderation`);
  }

  function handleGoHome() {
    if (!eventSlug) {
      navigate("/", { replace: true });
      return;
    }

    navigate(`/e/${eventSlug}`, { replace: true });
  }

  if (!isUnlocked) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <Lock size={22} />
          </div>

          <div className="mt-4 text-center">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Accès protégé
            </div>

            <div className="mt-2 text-xl font-black text-slate-900">
              Modération
            </div>

            <div className="mt-2 text-sm font-medium text-slate-500">
              Saisissez le mot de passe pour ouvrir cet élément de modération.
            </div>
          </div>

          <div className="mt-6">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) {
                  setPasswordError(false);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleUnlock();
                }
              }}
              placeholder="Mot de passe"
              autoFocus
              className={`w-full rounded-2xl border px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition ${
                passwordError
                  ? "border-rose-300 bg-rose-50 focus:border-rose-400"
                  : "border-slate-200 bg-white focus:border-slate-300"
              }`}
            />

            {passwordError ? (
              <div className="mt-2 text-xs font-semibold text-rose-600">
                Mot de passe incorrect.
              </div>
            ) : null}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleGoHome}
              className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
            >
              Retour à l’accueil
            </button>

            <button
              type="button"
              onClick={handleUnlock}
              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              Accéder
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="inline-flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200">
          <Loader2 size={18} className="animate-spin text-slate-500" />
          <span className="text-sm font-semibold text-slate-700">
            Chargement de l’élément à modérer…
          </span>
        </div>
      </div>
    );
  }

  if (error || !validType || !entity) {
    return (
      <div className="mx-auto max-w-2xl p-4">
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-rose-600">
              <AlertTriangle size={18} />
            </div>

            <div>
              <div className="text-base font-black text-rose-900">
                Impossible d’ouvrir la modération
              </div>
              <div className="mt-1 text-sm font-medium text-rose-700">
                {error ?? "Élément introuvable."}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={handleBack}
              className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-800 ring-1 ring-slate-200"
            >
              Retour à la file
            </button>
          </div>
        </div>
      </div>
    );
  }

  const alreadyModerated = entity.moderationStatus !== "pending";
  const isSubmitting = submittingAction !== null;

  return (
    <div className="mx-auto max-w-2xl p-4">
      <div className="space-y-4">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <EntityIcon type={validType} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Modération
              </div>

              <div className="mt-1 text-xl font-black text-slate-900">
                {entity.title}
              </div>

              {entity.subtitle ? (
                <div className="mt-1 text-sm font-medium text-slate-500">
                  {entity.subtitle}
                </div>
              ) : null}
            </div>

            {statusBadge ? (
              <span className={statusBadge.className}>
                {statusBadge.icon}
                {statusBadge.label}
              </span>
            ) : null}
          </div>

          {(entity.submittedAt || entity.moderatedAt) && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {entity.submittedAt ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                    Soumis le
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-800">
                    {new Date(entity.submittedAt).toLocaleString("fr-FR")}
                  </div>
                </div>
              ) : null}

              {entity.moderatedAt ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                    Modéré le
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-800">
                    {new Date(entity.moderatedAt).toLocaleString("fr-FR")}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </section>

        <EntityPreview entity={entity} />

        {entity.meta?.length ? (
          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-black text-slate-900">
              Informations complémentaires
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {entity.meta.map((item) => (
                <div
                  key={`${item.label}-${item.value}`}
                  className="rounded-2xl bg-slate-50 px-4 py-3"
                >
                  <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                    {item.label}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-800">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-black text-slate-900">
            Commentaire de modération
          </div>
          <div className="mt-1 text-sm font-medium text-slate-500">
            Tu peux laisser une raison de rejet ou une note interne.
          </div>

          <textarea
            value={moderatorComment}
            onChange={(e) => setModeratorComment(e.target.value)}
            rows={5}
            disabled={isSubmitting}
            className="mt-4 w-full resize-y rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-300"
            placeholder="Ex. photo floue, doublon, souvenir à reformuler…"
          />

          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => void handleModerate("approved")}
              disabled={isSubmitting}
              className="flex-1 rounded-[20px] bg-emerald-600 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submittingAction === "approved" ? "Validation…" : "Valider"}
            </button>

            <button
              type="button"
              onClick={() => void handleModerate("rejected")}
              disabled={isSubmitting}
              className="flex-1 rounded-[20px] bg-rose-600 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submittingAction === "rejected" ? "Rejet…" : "Rejeter"}
            </button>
          </div>

          <div className="mt-3">
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 ring-1 ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Retour à la file
            </button>
          </div>

          {alreadyModerated ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
              Cet élément a déjà été modéré. Tu peux tout de même modifier la
              décision.
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}