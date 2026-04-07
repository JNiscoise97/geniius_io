// src/features/player/experiences/learn/components/LearnQuestionCard.tsx

import { useEffect, useState } from "react";
import { Check, Image as ImageIcon, Info, Upload } from "lucide-react";
import type { ActivityQuestionDefinition } from "../../../core/activity/activityTypes";
import type {
  LearnAnswerValue,
  LearnPhotoAnswerValue,
} from "../hooks/useLearnActivityPlayer";
import { SmartImage } from "../../../../../lib/media/useSmartImage";

type LearnQuestionCardProps = {
  question: ActivityQuestionDefinition;
  answer: LearnAnswerValue;
  disabled?: boolean;
  onAnswerChange: (value: LearnAnswerValue) => void;
  maxAttempts?: number;
  attemptsUsed?: number;
};

function isPhotoAnswerValue(
  value: LearnAnswerValue
): value is LearnPhotoAnswerValue {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "consent" in value
  );
}

function toggleStringInArray(values: string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function renderAttemptNotice(maxAttempts?: number, attemptsUsed = 0) {
  const showAttemptsPressure = maxAttempts !== undefined && maxAttempts > 1;
  if (!showAttemptsPressure) return null;

  const attemptsLeft = Math.max(maxAttempts - attemptsUsed, 0);
  const isLastAttempt = attemptsLeft === 1;

  if (!isLastAttempt) return null;

  return (
    <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
      <div className="text-xs font-bold text-slate-700">
        Il te reste un seul essai pour cette question.
      </div>
    </div>
  );
}

function QcuBlock({
  question,
  answer,
  disabled,
  onAnswerChange,
}: {
  question: Extract<ActivityQuestionDefinition, { type: "qcu" }>;
  answer: LearnAnswerValue;
  disabled: boolean;
  onAnswerChange: (value: LearnAnswerValue) => void;
}) {
  const selected = typeof answer === "string" ? answer : "";

  return (
    <div className="mt-4 grid gap-3">
      {question.options.map((option) => {
        const isActive = selected === option.value;

        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onAnswerChange(option.value)}
            className={[
              "flex w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left transition",
              isActive
                ? "border-indigo-300 bg-indigo-50"
                : "border-slate-200 bg-white",
              disabled ? "cursor-not-allowed opacity-60" : "",
            ].join(" ")}
          >
            <div className="min-w-0">
              <div className="text-base font-extrabold text-slate-900">
                {option.label}
              </div>
            </div>

            <div
              className={[
                "h-5 w-5 shrink-0 rounded-full border-2 transition",
                isActive
                  ? "border-indigo-600 bg-indigo-600"
                  : "border-slate-300 bg-white",
              ].join(" ")}
            >
              {isActive ? (
                <div className="m-[3px] h-2.5 w-2.5 rounded-full bg-white" />
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function QcmBlock({
  question,
  answer,
  disabled,
  onAnswerChange,
}: {
  question: Extract<ActivityQuestionDefinition, { type: "qcm" }>;
  answer: LearnAnswerValue;
  disabled: boolean;
  onAnswerChange: (value: LearnAnswerValue) => void;
}) {
  const selected = Array.isArray(answer)
    ? answer.filter((v): v is string => typeof v === "string")
    : [];

  return (
    <>
      <div className="mt-4 grid gap-3">
        {question.options.map((option) => {
          const isActive = selected.includes(option.value);

          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() =>
                onAnswerChange(toggleStringInArray(selected, option.value))
              }
              className={[
                "flex w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left transition",
                isActive
                  ? "border-indigo-300 bg-indigo-50"
                  : "border-slate-200 bg-white",
                disabled ? "cursor-not-allowed opacity-60" : "",
              ].join(" ")}
            >
              <div className="min-w-0">
                <div className="text-base font-extrabold text-slate-900">
                  {option.label}
                </div>
              </div>

              <div
                className={[
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition",
                  isActive
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-slate-300 bg-white text-transparent",
                ].join(" ")}
              >
                <Check size={12} />
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-3 text-xs font-bold text-slate-600">
        Sélection : <span className="text-slate-900">{selected.length}</span>
      </div>
    </>
  );
}

function TrueFalseBlock({
  answer,
  disabled,
  onAnswerChange,
}: {
  answer: LearnAnswerValue;
  disabled: boolean;
  onAnswerChange: (value: LearnAnswerValue) => void;
}) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onAnswerChange(true)}
        className={[
          "rounded-2xl border p-4 text-center font-black transition",
          answer === true
            ? "border-emerald-300 bg-emerald-50 text-slate-900"
            : "border-slate-200 bg-white text-slate-900",
          disabled ? "cursor-not-allowed opacity-60" : "",
        ].join(" ")}
      >
        Vrai
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onAnswerChange(false)}
        className={[
          "rounded-2xl border p-4 text-center font-black transition",
          answer === false
            ? "border-rose-300 bg-rose-50 text-slate-900"
            : "border-slate-200 bg-white text-slate-900",
          disabled ? "cursor-not-allowed opacity-60" : "",
        ].join(" ")}
      >
        Faux
      </button>
    </div>
  );
}

function NumericBlock({
  question,
  answer,
  disabled,
  onAnswerChange,
}: {
  question: Extract<ActivityQuestionDefinition, { type: "numeric" }>;
  answer: LearnAnswerValue;
  disabled: boolean;
  onAnswerChange: (value: LearnAnswerValue) => void;
}) {
  const value =
    typeof answer === "string" || typeof answer === "number"
      ? String(answer)
      : "";

  return (
    <div className="mt-4">
      <input
        type="number"
        inputMode={question.inputMode === "decimal" ? "decimal" : "numeric"}
        step={question.inputMode === "decimal" ? "any" : "1"}
        min={question.min}
        max={question.max}
        disabled={disabled}
        value={value}
        placeholder="Ex: 3"
        onChange={(e) => {
          const raw = e.target.value.replace(",", ".");
          onAnswerChange(raw);
        }}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
      />

      <div className="mt-2 text-xs font-bold text-slate-600">
        Réponse numérique
        {question.min !== undefined || question.max !== undefined ? (
          <>
            {" · "}
            {question.min !== undefined ? `min ${question.min}` : null}
            {question.min !== undefined && question.max !== undefined
              ? " · "
              : null}
            {question.max !== undefined ? `max ${question.max}` : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

function TextBlock({
  question,
  answer,
  disabled,
  onAnswerChange,
  label,
}: {
  question: Extract<ActivityQuestionDefinition, { type: "short" | "fill" }>;
  answer: LearnAnswerValue;
  disabled: boolean;
  onAnswerChange: (value: LearnAnswerValue) => void;
  label?: string;
}) {
  const value = typeof answer === "string" ? answer : "";

  return (
    <div className="mt-4">
      {label ? (
        <div className="mb-2 text-xs font-black text-slate-700">{label}</div>
      ) : null}

      <input
        type="text"
        disabled={disabled}
        value={value}
        placeholder={question.placeholder ?? ""}
        onChange={(e) => onAnswerChange(e.target.value)}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
      />
    </div>
  );
}

function SelectBlock({
  question,
  answer,
  disabled,
  onAnswerChange,
}: {
  question: Extract<ActivityQuestionDefinition, { type: "select" }>;
  answer: LearnAnswerValue;
  disabled: boolean;
  onAnswerChange: (value: LearnAnswerValue) => void;
}) {
  if (question.multiple) {
    const selected = Array.isArray(answer)
      ? answer.filter((v): v is string => typeof v === "string")
      : [];

    return (
      <>
        <div className="mt-4 grid gap-3">
          {question.options.map((option) => {
            const isActive = selected.includes(option.value);

            return (
              <button
                key={option.value}
                type="button"
                disabled={disabled}
                onClick={() =>
                  onAnswerChange(toggleStringInArray(selected, option.value))
                }
                className={[
                  "flex w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left transition",
                  isActive
                    ? "border-indigo-300 bg-indigo-50"
                    : "border-slate-200 bg-white",
                  disabled ? "cursor-not-allowed opacity-60" : "",
                ].join(" ")}
              >
                <div className="text-base font-extrabold text-slate-900">
                  {option.label}
                </div>

                <div
                  className={[
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition",
                    isActive
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-slate-300 bg-white text-transparent",
                  ].join(" ")}
                >
                  <Check size={12} />
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-3 text-xs font-bold text-slate-600">
          Sélection : <span className="text-slate-900">{selected.length}</span>
        </div>
      </>
    );
  }

  const value = typeof answer === "string" ? answer : "";

  return (
    <div className="mt-4">
      <select
        disabled={disabled}
        value={value}
        onChange={(e) => onAnswerChange(e.target.value)}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
      >
        <option value="">Choisir…</option>
        {question.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function supportsDateInput(): boolean {
  if (typeof document === "undefined") return true;

  const input = document.createElement("input");
  input.setAttribute("type", "date");

  return input.type === "date";
}

function normalizeDateInput(value: string): string {
  return value.trim();
}

function DateBlock({
  question,
  answer,
  disabled,
  onAnswerChange,
}: {
  question: Extract<ActivityQuestionDefinition, { type: "date" }>;
  answer: LearnAnswerValue;
  disabled: boolean;
  onAnswerChange: (value: LearnAnswerValue) => void;
}) {
  const value = typeof answer === "string" ? answer : "";
  const hasNativeDateInput = supportsDateInput();

  return (
    <>
      <div className="mt-4">
        <input
          type={hasNativeDateInput ? "date" : "text"}
          inputMode={hasNativeDateInput ? undefined : "numeric"}
          disabled={disabled}
          value={value}
          placeholder={hasNativeDateInput ? undefined : "YYYY-MM-DD"}
          onChange={(e) => onAnswerChange(normalizeDateInput(e.target.value))}
          className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
        />
      </div>

      <div className="mt-2 text-xs font-bold text-slate-600">
        {hasNativeDateInput ? "Format date" : "Format attendu : YYYY-MM-DD"}
        {question.precision ? ` · précision ${question.precision}` : ""}
      </div>
    </>
  );
}

function InfoBlock({
  question,
}: {
  question: Extract<ActivityQuestionDefinition, { type: "info" }>;
}) {
  return (
    <div className="mt-4 rounded-3xl border border-indigo-100 bg-indigo-50 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-indigo-200 bg-white text-indigo-700">
          <Info size={18} />
        </div>

        <div className="min-w-0">
          <div className="text-sm font-black text-slate-900">Information</div>
          <div className="mt-2 whitespace-pre-wrap text-[15px] leading-6 font-medium text-slate-800">
            {question.bodyMarkdown}
          </div>
          <div className="mt-3 text-xs font-bold text-slate-600">
            Appuie sur “Continuer” pour passer à la suite.
          </div>
        </div>
      </div>
    </div>
  );
}

function PhotoBlock({
  question,
  answer,
  disabled,
  onAnswerChange,
}: {
  question: Extract<ActivityQuestionDefinition, { type: "photo" }>;
  answer: LearnAnswerValue;
  disabled: boolean;
  onAnswerChange: (value: LearnAnswerValue) => void;
}) {
  const photoValue: LearnPhotoAnswerValue = isPhotoAnswerValue(answer)
    ? answer
    : {
        file: null,
        consent: false,
        tierValue:
          question.tier?.options?.[0]?.value !== undefined
            ? question.tier.options[0].value
            : null,
        note: "",
      };

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!photoValue.file) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(photoValue.file);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [photoValue.file]);

  const manualReviewPoints =
    question.evaluation.kind === "manual_review"
      ? question.evaluation.points
      : undefined;

  const tierPoints =
    question.tier?.options?.map((option) => option.points) ?? [];

  const minTierPoints =
    tierPoints.length > 0 ? Math.min(...tierPoints) : undefined;

  const maxTierPoints =
    tierPoints.length > 0 ? Math.max(...tierPoints) : undefined;

  const pointsLabel =
    maxTierPoints !== undefined && minTierPoints !== undefined
      ? minTierPoints === maxTierPoints
        ? `${maxTierPoints} pts après validation`
        : `${minTierPoints} à ${maxTierPoints} pts après validation`
      : manualReviewPoints !== undefined
        ? `${manualReviewPoints} pts après validation`
        : "Points attribués après validation";

  return (
    <div className="mt-4 grid gap-4">
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-indigo-200 bg-white text-indigo-700">
            <ImageIcon size={18} />
          </div>

          <div className="min-w-0">
            <div className="text-sm font-black text-slate-900">
              Photo à soumettre
            </div>

            <div className="mt-1 text-sm font-medium leading-6 text-slate-700">
              {pointsLabel}
            </div>

            <div className="mt-2 text-xs font-bold text-slate-600">
              Cette réponse sera relue par l’organisateur. Les points seront ajoutés après modération.
            </div>

            {question.evaluation.kind === "manual_review" &&
            question.evaluation.reviewLabel ? (
              <div className="mt-2 text-xs font-bold text-slate-600">
                Vérification :{" "}
                <span className="text-slate-900">
                  {question.evaluation.reviewLabel}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {question.tier?.options?.length ? (
        <div className="grid gap-3">
          <div className="text-xs font-black text-slate-700">
            {question.tier.label ?? "Choisis un niveau"}
          </div>

          {question.tier.options.map((option) => {
            const isActive = photoValue.tierValue === option.value;

            return (
              <button
                key={option.value}
                type="button"
                disabled={disabled}
                onClick={() =>
                  onAnswerChange({
                    ...photoValue,
                    tierValue: option.value,
                  })
                }
                className={[
                  "flex w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left transition",
                  isActive
                    ? "border-indigo-300 bg-indigo-50"
                    : "border-slate-200 bg-white",
                  disabled ? "cursor-not-allowed opacity-60" : "",
                ].join(" ")}
              >
                <div className="min-w-0">
                  <div className="text-base font-extrabold text-slate-900">
                    {option.label}
                  </div>
                  <div className="mt-1 text-xs font-bold text-slate-600">
                    {option.points} pts après validation
                  </div>
                </div>

                <div
                  className={[
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition",
                    isActive
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-slate-300 bg-white text-transparent",
                  ].join(" ")}
                >
                  <Check size={12} />
                </div>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="grid gap-2">
        <label className="text-xs font-black text-slate-700">
          Ajoute une photo
        </label>

        <label
          className={[
            "flex min-h-[56px] cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed px-4 py-4 text-center transition",
            disabled
              ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
              : "border-slate-300 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50",
          ].join(" ")}
        >
          <Upload size={16} />
          <span className="text-sm font-black">
            {photoValue.file ? photoValue.file.name : "Choisir une image"}
          </span>

          <input
            type="file"
            accept="image/*"
            disabled={disabled}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              onAnswerChange({
                ...photoValue,
                file,
              });
            }}
          />
        </label>
      </div>

      {previewUrl ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          <SmartImage
            src={previewUrl}
            alt="Aperçu de la photo"
          />
        </div>
      ) : null}

      {question.note?.enabled ? (
        <div className="grid gap-2">
          <label className="text-xs font-black text-slate-700">
            Note complémentaire
          </label>
          <textarea
            rows={3}
            disabled={disabled}
            value={photoValue.note ?? ""}
            placeholder={question.note.placeholder ?? ""}
            onChange={(e) =>
              onAnswerChange({
                ...photoValue,
                note: e.target.value,
              })
            }
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
          />
        </div>
      ) : null}

      <label
        className={[
          "flex items-start gap-3 rounded-2xl border p-4",
          disabled ? "opacity-60" : "bg-white",
          photoValue.consent
            ? "border-emerald-200 bg-emerald-50"
            : "border-slate-200",
        ].join(" ")}
      >
        <input
          type="checkbox"
          disabled={disabled}
          checked={photoValue.consent}
          onChange={(e) =>
            onAnswerChange({
              ...photoValue,
              consent: e.target.checked,
            })
          }
          className="mt-1"
        />

        <div className="min-w-0">
          <div className="text-sm font-black text-slate-900">Consentement</div>
          <div className="mt-1 text-sm font-medium leading-6 text-slate-700">
            {question.consentText ??
              "J’accepte que cette photo soit transmise pour validation par l’organisateur."}
          </div>
        </div>
      </label>
    </div>
  );
}

export function LearnQuestionCard({
  question,
  answer,
  disabled = false,
  onAnswerChange,
  maxAttempts,
  attemptsUsed = 0,
}: LearnQuestionCardProps) {
  const attemptNotice = renderAttemptNotice(maxAttempts, attemptsUsed);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      {attemptNotice}

      <div className="text-xl font-black text-slate-900">{question.prompt}</div>

      {question.helpMarkdown ? (
        <div className="mt-2 whitespace-pre-wrap text-sm font-medium text-slate-700">
          {question.helpMarkdown}
        </div>
      ) : null}

      {question.type === "qcu" && (
        <QcuBlock
          question={question}
          answer={answer}
          disabled={disabled}
          onAnswerChange={onAnswerChange}
        />
      )}

      {question.type === "qcm" && (
        <QcmBlock
          question={question}
          answer={answer}
          disabled={disabled}
          onAnswerChange={onAnswerChange}
        />
      )}

      {question.type === "truefalse" && (
        <TrueFalseBlock
          answer={answer}
          disabled={disabled}
          onAnswerChange={onAnswerChange}
        />
      )}

      {question.type === "numeric" && (
        <NumericBlock
          question={question}
          answer={answer}
          disabled={disabled}
          onAnswerChange={onAnswerChange}
        />
      )}

      {question.type === "short" && (
        <TextBlock
          question={question}
          answer={answer}
          disabled={disabled}
          onAnswerChange={onAnswerChange}
        />
      )}

      {question.type === "fill" && (
        <TextBlock
          question={question}
          answer={answer}
          disabled={disabled}
          onAnswerChange={onAnswerChange}
          label="Complète la phrase"
        />
      )}

      {question.type === "select" && (
        <SelectBlock
          question={question}
          answer={answer}
          disabled={disabled}
          onAnswerChange={onAnswerChange}
        />
      )}

      {question.type === "date" && (
        <DateBlock
          question={question}
          answer={answer}
          disabled={disabled}
          onAnswerChange={onAnswerChange}
        />
      )}

      {question.type === "info" && <InfoBlock question={question} />}

      {question.type === "photo" && (
        <PhotoBlock
          question={question}
          answer={answer}
          disabled={disabled}
          onAnswerChange={onAnswerChange}
        />
      )}
    </div>
  );
}