import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Mail,
  Search,
  Send,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getParticipantSession } from "../../../lib/participant-session/getActiveParticipant";

import { getAnnouncementRecipients } from "../api/getAnnouncementRecipients";
import { sendAnnouncementCampaign } from "../api/sendAnnouncementCampaign";
import { announcementEmailConfig } from "../config/announcementEmailConfig";
import type {
  AnnouncementComposerFormValues,
  AnnouncementRecipient,
  SendAnnouncementCampaignResult,
} from "../types";

function matchesSearch(recipient: AnnouncementRecipient, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  return [
    recipient.displayName,
    recipient.firstName ?? "",
    recipient.lastName ?? "",
    recipient.nickname ?? "",
    recipient.email,
  ]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

export default function AnnouncementComposerPage() {
  const navigate = useNavigate();
  const { eventSlug = "" } = useParams<{ eventSlug: string }>();

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendResult, setSendResult] =
    useState<SendAnnouncementCampaignResult | null>(null);

  const [recipients, setRecipients] = useState<AnnouncementRecipient[]>([]);
  const [search, setSearch] = useState("");

  const [formValues, setFormValues] = useState<AnnouncementComposerFormValues>({
    subject: "",
    message: "",
    selectionMode: "all",
    selectedParticipantIds: [],
    replyTo: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setLoading(true);
        setError(null);

        const session = getParticipantSession(eventSlug);
        if (!session?.participantId) {
          throw new Error("Session participant introuvable.");
        }

        const data = await getAnnouncementRecipients(eventSlug);
        if (!cancelled) {
          setRecipients(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erreur inconnue.");
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
  }, [eventSlug]);

  const filteredRecipients = useMemo(
    () => recipients.filter((recipient) => matchesSearch(recipient, search)),
    [recipients, search],
  );

  const selectedCount =
    formValues.selectionMode === "all"
      ? recipients.length
      : formValues.selectedParticipantIds.length;

  function toggleParticipant(participantId: string) {
    setFormValues((prev) => {
      const exists = prev.selectedParticipantIds.includes(participantId);

      return {
        ...prev,
        selectedParticipantIds: exists
          ? prev.selectedParticipantIds.filter((id) => id !== participantId)
          : [...prev.selectedParticipantIds, participantId],
      };
    });
  }

  function toggleVisibleRecipients(selectAll: boolean) {
    setFormValues((prev) => {
      const visibleIds = filteredRecipients.map((r) => r.participantId);

      if (selectAll) {
        const merged = new Set([
          ...prev.selectedParticipantIds,
          ...visibleIds,
        ]);

        return {
          ...prev,
          selectedParticipantIds: Array.from(merged),
        };
      }

      return {
        ...prev,
        selectedParticipantIds: prev.selectedParticipantIds.filter(
          (id) => !visibleIds.includes(id),
        ),
      };
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    try {
      setSending(true);
      setError(null);
      setSendResult(null);

      const subject = formValues.subject.trim();
      const message = formValues.message.trim();
      const replyTo = formValues.replyTo?.trim() || undefined;

      if (!subject) {
        throw new Error("Le sujet est requis.");
      }

      if (!message) {
        throw new Error("Le message est requis.");
      }

      if (
        formValues.selectionMode === "manual" &&
        formValues.selectedParticipantIds.length === 0
      ) {
        throw new Error("Sélectionne au moins un destinataire.");
      }

      const result = await sendAnnouncementCampaign({
        eventSlug,
        subject,
        message,
        selectionMode: formValues.selectionMode,
        participantIds:
          formValues.selectionMode === "manual"
            ? formValues.selectedParticipantIds
            : undefined,
        replyTo,
      });

      setSendResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Chargement des destinataires…
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            {announcementEmailConfig.pageTitle}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {announcementEmailConfig.pageSubtitle}
          </p>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-rose-700" />
            <div className="min-w-0 text-sm text-rose-800">{error}</div>
          </div>
        </div>
      ) : null}

      {sendResult ? (
        <div className="mb-4 rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-4 w-4 text-emerald-700" />
            <div className="min-w-0 text-sm text-emerald-900">
              <div className="font-bold">{sendResult.message}</div>
              <div className="mt-1">
                Envoyés : {sendResult.totalSent} · Échecs :{" "}
                {sendResult.totalFailed} · Destinataires :{" "}
                {sendResult.totalRecipients}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-5">
        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Mail className="h-5 w-5 text-slate-700" />
            <h2 className="text-base font-black text-slate-900">Message</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-800">
                Sujet
              </label>
              <input
                value={formValues.subject}
                onChange={(e) =>
                  setFormValues((prev) => ({
                    ...prev,
                    subject: e.target.value,
                  }))
                }
                placeholder={announcementEmailConfig.subjectPlaceholder}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-800">
                Message
              </label>
              <textarea
                rows={12}
                value={formValues.message}
                onChange={(e) =>
                  setFormValues((prev) => ({
                    ...prev,
                    message: e.target.value,
                  }))
                }
                placeholder={announcementEmailConfig.messagePlaceholder}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              />
              <p className="mt-2 text-xs text-slate-500">
                {announcementEmailConfig.helpText}
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-800">
                Reply-To
              </label>
              <input
                value={formValues.replyTo ?? ""}
                onChange={(e) =>
                  setFormValues((prev) => ({
                    ...prev,
                    replyTo: e.target.value,
                  }))
                }
                placeholder="organisateur@exemple.com"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              />
            </div>
          </div>
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-slate-700" />
            <h2 className="text-base font-black text-slate-900">
              Destinataires
            </h2>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() =>
                setFormValues((prev) => ({
                  ...prev,
                  selectionMode: "all",
                }))
              }
              className={`rounded-[20px] border px-4 py-4 text-left transition ${
                formValues.selectionMode === "all"
                  ? "border-indigo-300 bg-indigo-50"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <div className="text-sm font-black text-slate-900">
                Tous les participants
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Envoi à tous les destinataires disponibles.
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                setFormValues((prev) => ({
                  ...prev,
                  selectionMode: "manual",
                }))
              }
              className={`rounded-[20px] border px-4 py-4 text-left transition ${
                formValues.selectionMode === "manual"
                  ? "border-indigo-300 bg-indigo-50"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <div className="text-sm font-black text-slate-900">
                Sélection manuelle
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Choisis un ou plusieurs participants.
              </div>
            </button>
          </div>

          <div className="mt-4 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            Destinataires visés : <strong>{selectedCount}</strong>
          </div>

          {formValues.selectionMode === "manual" ? (
            <div className="mt-4">
              <div className="relative mb-3">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un participant"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </div>

              <div className="mb-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => toggleVisibleRecipients(true)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Tout sélectionner
                </button>

                <button
                  type="button"
                  onClick={() => toggleVisibleRecipients(false)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Tout désélectionner
                </button>
              </div>

              <div className="max-h-[420px] space-y-2 overflow-auto pr-1">
                {filteredRecipients.map((recipient) => {
                  const checked = formValues.selectedParticipantIds.includes(
                    recipient.participantId,
                  );

                  return (
                    <label
                      key={recipient.participantId}
                      className={`flex cursor-pointer items-start gap-3 rounded-[18px] border px-4 py-3 transition ${
                        checked
                          ? "border-indigo-300 bg-indigo-50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleParticipant(recipient.participantId)}
                        className="mt-1"
                      />

                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold text-slate-900">
                          {recipient.displayName}
                        </div>
                        <div className="truncate text-sm text-slate-600">
                          {recipient.email}
                        </div>
                      </div>
                    </label>
                  );
                })}

                {filteredRecipients.length === 0 ? (
                  <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
                    Aucun destinataire ne correspond à la recherche.
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </section>

        <div className="sticky bottom-4 flex justify-end">
          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Envoi en cours…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Envoyer l’annonce
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}