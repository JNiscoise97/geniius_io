// src/features/moderation/pages/ModerationReviewPage.tsx

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Image as ImageIcon,
  Link2,
  Loader2,
  ShieldCheck,
  UserCircle2,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { moderateEntity } from "../api/moderateEntity";
import { getModerationEntity } from "../api/getModerationEntity";
import {
  moderationTypeDescriptions,
  moderationTypeLabels,
} from "../config/moderationConfig";
import type {
  ModerationEntityRecord,
  ModerationEntityType,
  ModerationStatus,
} from "../types";

function isModerationEntityType(value: string | undefined): value is ModerationEntityType {
  return (
    value === "memory" ||
    value === "photo" ||
    value === "relation" ||
    value === "profile"
  );
}

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

function EntityIcon({ type }: { type: ModerationEntityType }) {
  if (type === "photo") return <ImageIcon size={18} />;
  if (type === "relation") return <Link2 size={18} />;
  if (type === "profile") return <UserCircle2 size={18} />;
  return <ShieldCheck size={18} />;
}

function EntityPreview({ entity }: { entity: ModerationEntityRecord }) {
  if (entity.type === "photo") {
    return (
      <div className="space-y-4">
        {entity.imageUrl ? (
          <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
            <img
              src={entity.imageUrl}
              alt={entity.title}
              className="block h-auto w-full object-cover"
            />
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm font-medium text-slate-500">
            Aucune image à afficher.
          </div>
        )}

        {entity.content ? (
          <div className="rounded-[24px] border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
            {entity.content}
          </div>
        ) : null}
      </div>
    );
  }

  if (entity.type === "relation") {
    return (
      <div className="rounded-[24px] border border-slate-200 bg-white p-4">
        <div className="text-base font-black text-slate-900">{entity.title}</div>
        {entity.subtitle ? (
          <div className="mt-1 text-sm font-medium text-slate-500">
            {entity.subtitle}
          </div>
        ) : null}

        {entity.content ? (
          <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            {entity.content}
          </div>
        ) : null}
      </div>
    );
  }

  if (entity.type === "profile") {
    return (
      <div className="rounded-[24px] border border-slate-200 bg-white p-4">
        <div className="text-base font-black text-slate-900">{entity.title}</div>
        {entity.subtitle ? (
          <div className="mt-1 text-sm font-medium text-slate-500">
            {entity.subtitle}
          </div>
        ) : null}

        {entity.meta?.length ? (
          <div className="mt-4 space-y-3">
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
        ) : null}

        {entity.content ? (
          <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            {entity.content}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4">
      <div className="text-base font-black text-slate-900">{entity.title}</div>
      {entity.subtitle ? (
        <div className="mt-1 text-sm font-medium text-slate-500">
          {entity.subtitle}
        </div>
      ) : null}

      {entity.content ? (
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 whitespace-pre-wrap">
          {entity.content}
        </div>
      ) : null}
    </div>
  );
}

export function ModerationReviewPage() {
  const navigate = useNavigate();
  const { eventSlug, entityType, entityId } = useParams();

  const [entity, setEntity] = useState<ModerationEntityRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [moderatorComment, setModeratorComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  const validType = isModerationEntityType(entityType) ? entityType : null;

  const statusBadge = useMemo(
    () => (entity ? getStatusBadge(entity.moderationStatus) : null),
    [entity],
  );

  useEffect(() => {
    async function run() {
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
        setError(err instanceof Error ? err.message : "Erreur inconnue.");
      } finally {
        setLoading(false);
      }
    }

    void run();
  }, [eventSlug, validType, entityId]);

  async function handleModerate(nextStatus: "approved" | "rejected") {
    if (!validType || !entityId || !entity) return;

    setSubmitting(true);
    setError(null);

    try {
      await moderateEntity({
        entityType: validType,
        entityId,
        status: nextStatus,
        moderatorComment,
      });

      setEntity({
        ...entity,
        moderationStatus: nextStatus,
        moderatorComment,
        moderatedAt: new Date().toISOString(),
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de mettre à jour la modération.",
      );
    } finally {
      setSubmitting(false);
    }
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
      <div className="mx-auto max-w-xl p-4">
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

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-800 ring-1 ring-slate-200"
          >
            Revenir
          </button>
        </div>
      </div>
    );
  }

  const alreadyModerated = entity.moderationStatus !== "pending";

  return (
    <div className="mx-auto max-w-2xl p-4">
      <div className="space-y-4">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <EntityIcon type={entity.type} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Modération
              </div>
              <div className="mt-1 text-xl font-black text-slate-900">
                {moderationTypeLabels[entity.type]}
              </div>
              <div className="mt-1 text-sm font-medium text-slate-500">
                {moderationTypeDescriptions[entity.type]}
              </div>
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
            Tu peux laisser un commentaire interne ou une raison de rejet.
          </div>

          <textarea
            value={moderatorComment}
            onChange={(e) => setModeratorComment(e.target.value)}
            rows={5}
            disabled={submitting}
            className="mt-4 w-full resize-y rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-300"
            placeholder="Ex. photo floue, relation non justifiée, souvenir à reformuler…"
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
              disabled={submitting}
              className="flex-1 rounded-[20px] bg-emerald-600 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Validation…" : "Valider"}
            </button>

            <button
              type="button"
              onClick={() => void handleModerate("rejected")}
              disabled={submitting}
              className="flex-1 rounded-[20px] bg-rose-600 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Rejet…" : "Rejeter"}
            </button>
          </div>

          {alreadyModerated ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
              Cet élément a déjà été modéré. Tu peux néanmoins remettre à jour sa décision.
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}