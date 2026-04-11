import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Sparkles,
  Star,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createPageTimeTracker } from "../../../lib/analytics/pageTimeTracker";
import { getParticipantSession } from "../../../lib/participant-session/getActiveParticipant";
import {
  FEEDBACK_FORM,
  type FeedbackAnswers,
  type FeedbackQuestion,
} from "../config/feedbackFormConfig";
import { getParticipantEventFeedback } from "../api/getParticipantEventFeedback";
import { listPublicParticipantEventFeedback } from "../api/listPublicParticipantEventFeedback";
import { upsertParticipantEventFeedback } from "../api/upsertParticipantEventFeedback";
import type {
  ParticipantEventFeedbackRow,
  PublicParticipantFeedbackItem,
} from "../types/participantFeedbackTypes";

type TabKey = "form" | "public";

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDefaultAnswers(): FeedbackAnswers {
  return {
    global_rating: 0,
    public_comment: "",
    allow_public_display: true,
  };
}

function normalizeAnswersFromRow(
  row: ParticipantEventFeedbackRow | null
): FeedbackAnswers {
  if (!row) {
    return getDefaultAnswers();
  }

  return {
    ...getDefaultAnswers(),
    ...(row.answers_json ?? {}),
    global_rating: row.global_rating ?? 0,
    public_comment: row.public_comment ?? "",
    allow_public_display: row.allow_public_display ?? false,
  };
}

function StarsInput({
  value,
  onChange,
  size = "md",
}: {
  value: number;
  onChange: (value: number) => void;
  size?: "sm" | "md";
}) {
  const iconSize = size === "sm" ? 16 : 26;

  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= value;

        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="rounded-xl p-1 transition"
          >
            <Star
              size={iconSize}
              className={active ? "fill-current text-amber-500" : "text-slate-300"}
            />
          </button>
        );
      })}
    </div>
  );
}

function SummaryCard({
  items,
}: {
  items: PublicParticipantFeedbackItem[];
}) {
  const average = useMemo(() => {
    if (items.length === 0) return null;
    const total = items.reduce((sum, item) => sum + item.globalRating, 0);
    return total / items.length;
  }, [items]);

  const distribution = useMemo(() => {
    return [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: items.filter((item) => item.globalRating === rating).length,
    }));
  }, [items]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-lg font-black text-slate-900">Avis partagés</div>
      <div className="mt-1 text-sm font-medium text-slate-700">
        Note globale et commentaire public de la famille.
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[220px_minmax(0,1fr)]">
        <div className="rounded-3xl bg-slate-50 p-4">
          <div className="text-xs font-black uppercase tracking-wide text-slate-500">
            Moyenne
          </div>
          <div className="mt-2 text-4xl font-black text-slate-900">
            {average !== null ? average.toFixed(1) : "—"}
          </div>
          <div className="mt-2 text-sm font-bold text-slate-600">
            {items.length} avis partagé{items.length > 1 ? "s" : ""}
          </div>
        </div>

        <div className="rounded-3xl bg-slate-50 p-4">
          <div className="text-xs font-black uppercase tracking-wide text-slate-500">
            Répartition
          </div>

          <div className="mt-3 grid gap-2">
            {distribution.map((item) => (
              <div
                key={item.rating}
                className="flex items-center justify-between rounded-2xl bg-white px-3 py-2"
              >
                <div className="inline-flex items-center gap-2 text-sm font-black text-slate-900">
                  <Star size={14} className="fill-current text-amber-500" />
                  {item.rating}
                </div>
                <div className="text-sm font-bold text-slate-700">
                  {item.count}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PublicFeedbackCard({
  item,
}: {
  item: PublicParticipantFeedbackItem;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-lg font-black text-slate-900">
            {item.participantLabel}
          </div>
          <div className="mt-1 text-xs font-bold text-slate-500">
            Publié le {formatDateTime(item.submittedAt)}
          </div>
        </div>

        <div className="rounded-2xl bg-amber-50 px-3 py-2">
          <div className="inline-flex items-center gap-2 text-sm font-black text-amber-700">
            <Star size={16} className="fill-current" />
            {item.globalRating}/5
          </div>
        </div>
      </div>

      {item.publicComment ? (
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm font-medium leading-6 text-slate-800">
          {item.publicComment}
        </div>
      ) : null}
    </article>
  );
}

function BooleanButtons({
  value,
  onChange,
}: {
  value: boolean | null | undefined;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={[
          "rounded-2xl px-4 py-3 text-sm font-black transition",
          value === true
            ? "bg-emerald-100 text-emerald-800"
            : "bg-slate-100 text-slate-700",
        ].join(" ")}
      >
        Oui
      </button>

      <button
        type="button"
        onClick={() => onChange(false)}
        className={[
          "rounded-2xl px-4 py-3 text-sm font-black transition",
          value === false
            ? "bg-rose-100 text-rose-800"
            : "bg-slate-100 text-slate-700",
        ].join(" ")}
      >
        Non
      </button>
    </div>
  );
}

function ChoiceButtons({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={[
            "rounded-2xl px-4 py-3 text-sm font-black transition",
            value === option.value
              ? "bg-[color:var(--blue)] text-white"
              : "bg-slate-100 text-slate-700",
          ].join(" ")}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function QuestionRenderer({
  question,
  answers,
  onChange,
}: {
  question: FeedbackQuestion;
  answers: FeedbackAnswers;
  onChange: (key: string, value: unknown) => void;
}) {
  const rawValue = answers[question.key];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-sm font-black text-slate-900">{question.label}</div>

      {"hint" in question && question.hint ? (
        <div className="mt-1 text-xs font-bold leading-5 text-slate-600">
          {question.hint}
        </div>
      ) : null}

      {question.type === "rating" ? (
        <div className="mt-3">
          <StarsInput
            value={typeof rawValue === "number" ? rawValue : 0}
            onChange={(value) => onChange(question.key, value)}
          />
        </div>
      ) : null}

      {question.type === "boolean" ? (
        <BooleanButtons
          value={typeof rawValue === "boolean" ? rawValue : null}
          onChange={(value) => onChange(question.key, value)}
        />
      ) : null}

      {question.type === "choice" ? (
        <ChoiceButtons
          value={typeof rawValue === "string" ? rawValue : ""}
          options={question.options}
          onChange={(value) => onChange(question.key, value)}
        />
      ) : null}

      {question.type === "text" ? (
        question.multiline ? (
          <textarea
            rows={4}
            value={typeof rawValue === "string" ? rawValue : ""}
            onChange={(e) => onChange(question.key, e.target.value)}
            placeholder={question.placeholder ?? ""}
            className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
          />
        ) : (
          <input
            type="text"
            value={typeof rawValue === "string" ? rawValue : ""}
            onChange={(e) => onChange(question.key, e.target.value)}
            placeholder={question.placeholder ?? ""}
            className="mt-3 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 font-medium text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
          />
        )
      ) : null}
    </div>
  );
}

export function ParticipantFeedbackPage() {
  const navigate = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const participantSession = getParticipantSession(slug);
  const participantId = participantSession?.participantId ?? null;

  const [tab, setTab] = useState<TabKey>("form");
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [answers, setAnswers] = useState<FeedbackAnswers>(getDefaultAnswers());
  const [publicItems, setPublicItems] = useState<PublicParticipantFeedbackItem[]>([]);
  const [publicItemsLoading, setPublicItemsLoading] = useState(false);

  useEffect(() => {
    if (!participantId) return;

    const tracker = createPageTimeTracker({
      participantId,
      eventSlug: slug,
      pageKey: `/e/${slug}/avis`,
    });

    tracker.start();

    return () => {
      void tracker.stop();
    };
  }, [participantId, slug]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        setIsBootstrapping(true);

        if (participantId) {
          const existing = await getParticipantEventFeedback(slug, participantId);

          if (!cancelled) {
            setAnswers(normalizeAnswersFromRow(existing));
            setSavedAt(existing?.updated_at ?? null);
          }
        }

        setPublicItemsLoading(true);
        const items = await listPublicParticipantEventFeedback(slug);

        if (!cancelled) {
          setPublicItems(items);
        }
      } catch (error) {
        console.error("Impossible de charger la page d'avis", error);
      } finally {
        if (!cancelled) {
          setPublicItemsLoading(false);
          setIsBootstrapping(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [participantId, slug]);

  function updateAnswer(key: string, value: unknown) {
    setAnswers((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  const visibleSections = useMemo(() => {
    return FEEDBACK_FORM.filter((section) =>
      section.condition ? section.condition(answers) : true
    );
  }, [answers]);

  const globalRating =
    typeof answers.global_rating === "number" ? answers.global_rating : 0;

  const publicComment =
    typeof answers.public_comment === "string" ? answers.public_comment : "";

  const allowPublicDisplay = answers.allow_public_display === true;

  const canSubmit =
    participantId !== null &&
    globalRating >= 1 &&
    (!allowPublicDisplay || publicComment.trim().length > 0);

  async function handleSave() {
    if (!participantId || !canSubmit) {
      return;
    }

    try {
      setIsSaving(true);

      const saved = await upsertParticipantEventFeedback({
        eventSlug: slug,
        participantId,
        globalRating,
        publicComment: publicComment.trim() || null,
        allowPublicDisplay,
        answersJson: answers,
      });

      setSavedAt(saved.updated_at);

      const nextPublicItems = await listPublicParticipantEventFeedback(slug);
      setPublicItems(nextPublicItems);
      setTab("public");
    } catch (error) {
      console.error("Impossible d'enregistrer l'avis", error);
      window.alert("Impossible d'enregistrer ton avis.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isBootstrapping) {
    return (
      <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
        <main className="c-container pb-10 pt-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 text-slate-900">
              <Loader2 className="animate-spin" size={20} />
              <div className="text-lg font-black">Chargement de la page d’avis...</div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pb-28 pt-6">
        <button
          type="button"
          onClick={() => navigate(`/e/${slug}/home`)}
          className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 font-black text-slate-700"
        >
          <ArrowLeft size={16} />
          Retour
        </button>

        <section className="mt-4 rounded-[32px] bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_45%,#312e81_100%)] p-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.28)]">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-extrabold">
            <Sparkles size={14} />
            Après la rencontre
          </div>

          <h1 className="mt-4 text-[30px] leading-[1.02] font-black tracking-tight">
            Donner ton avis
          </h1>

          <p className="mt-3 max-w-[42rem] text-sm font-bold leading-6 text-white/88">
            Ton retour aidera à améliorer les prochaines cousinades et à mieux
            comprendre ce qui a vraiment compté pour la famille.
          </p>

          {savedAt ? (
            <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-emerald-500/15 px-3 py-2 text-sm font-black text-emerald-100">
              <CheckCircle2 size={16} />
              Dernière mise à jour : {formatDateTime(savedAt)}
            </div>
          ) : null}
        </section>

        <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTab("form")}
              className={[
                "rounded-2xl px-4 py-3 text-sm font-black transition",
                tab === "form"
                  ? "bg-[color:var(--blue)] text-white"
                  : "bg-slate-50 text-slate-700",
              ].join(" ")}
            >
              Mon avis
            </button>

            <button
              type="button"
              onClick={() => setTab("public")}
              className={[
                "rounded-2xl px-4 py-3 text-sm font-black transition",
                tab === "public"
                  ? "bg-[color:var(--blue)] text-white"
                  : "bg-slate-50 text-slate-700",
              ].join(" ")}
            >
              Avis partagés
            </button>
          </div>
        </section>

        {tab === "form" ? (
          <div className="mt-4 grid gap-4">
            {visibleSections.map((section) => (
              <section key={section.key} className="grid gap-3">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-lg font-black text-slate-900">
                    {section.title}
                  </div>
                  {section.description ? (
                    <div className="mt-1 text-sm font-medium leading-6 text-slate-700">
                      {section.description}
                    </div>
                  ) : null}
                </div>

                {section.questions.map((question) => (
                  <QuestionRenderer
                    key={question.key}
                    question={question}
                    answers={answers}
                    onChange={updateAnswer}
                  />
                ))}
              </section>
            ))}

            <section className="rounded-3xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
              <div className="text-sm font-black text-blue-900">
                Partie publique
              </div>
              <div className="mt-1 text-sm font-medium leading-6 text-blue-800">
                Seuls la note globale et le commentaire public sont susceptibles
                d’être partagés avec la famille, si tu as activé le partage.
              </div>
            </section>
          </div>
        ) : null}

        {tab === "public" ? (
          <div className="mt-4 grid gap-4">
            <SummaryCard items={publicItems} />

            {publicItemsLoading ? (
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3 text-slate-900">
                  <Loader2 className="animate-spin" size={18} />
                  <div className="text-sm font-black">
                    Chargement des avis partagés...
                  </div>
                </div>
              </section>
            ) : null}

            {!publicItemsLoading && publicItems.length === 0 ? (
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-slate-100 p-3 text-slate-900">
                    <MessageSquare size={18} />
                  </div>

                  <div>
                    <div className="text-lg font-black text-slate-900">
                      Aucun avis partagé pour le moment
                    </div>
                    <div className="mt-1 text-sm font-medium leading-6 text-slate-700">
                      Tu peux être le premier à publier ton ressenti sur la
                      cousinade.
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            {!publicItemsLoading &&
              publicItems.map((item) => (
                <PublicFeedbackCard key={item.id} item={item} />
              ))}
          </div>
        ) : null}
      </main>

      {tab === "form" ? (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-white via-white/95 to-white/0 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3">
          <div className="c-container">
            <div className="rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-[0_16px_38px_rgba(15,23,42,0.10)] backdrop-blur">
              <button
                type="button"
                onClick={handleSave}
                disabled={!canSubmit || isSaving}
                className={[
                  "h-12 w-full rounded-2xl font-black transition",
                  canSubmit && !isSaving
                    ? "bg-[color:var(--blue)] text-white"
                    : "cursor-not-allowed bg-slate-200 text-slate-500",
                ].join(" ")}
              >
                {isSaving ? "Enregistrement..." : "Enregistrer mon avis"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}