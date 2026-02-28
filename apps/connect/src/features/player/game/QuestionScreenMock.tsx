// src/components/QuestionScreenMock.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  XCircle,
  Trophy,
  Image as ImageIcon,
  ShieldCheck,
  ScanLine,
  TextCursorInput,
  Hash,
} from "lucide-react";
import "./question-screen.css";

type QuestionType =
  | "qcu"
  | "qcm"
  | "truefalse"
  | "numeric"
  | "short"
  | "fill"
  | "photo";

type TierOption = { value: number; label: string; points: number };
type UploadCfg = { bucket: string; folder: string };

type Question = {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: string[];
  answer?: any; // MOCK ONLY
  points?: number;

  penaltyEnabled?: boolean;
  penalty?: number;
  retry?: boolean;

  tolerance?: number; // numeric
  mode?: "exact" | "normalized"; // short/fill

  upload?: UploadCfg;
  consentText?: string;

  tier?: { label: string; options: TierOption[] };
  note?: { enabled: boolean; placeholder?: string };
};

type Zone = {
  id: string;
  title: string;
  theme?: string;
  intro?: string;
  questions: Question[];
};

type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved"; at: number }
  | { status: "offline" }
  | { status: "error"; message: string };

type ResultState = {
  show: boolean;
  correct: boolean;
  earned: number;
  max: number;
  penaltyApplied: number;
  canRetry: boolean;
  attemptsLeft: number;
};

function useDebouncedEffect(fn: () => void, deps: any[], delayMs: number) {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = window.setTimeout(() => fn(), delayMs);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function normalize(s: string) {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function isEqualNormalized(a: string, b: string) {
  return normalize(a) === normalize(b);
}

function arrayEqSet(a: any[], b: any[]) {
  const A = new Set(a);
  const B = new Set(b);
  if (A.size !== B.size) return false;
  for (const x of A) if (!B.has(x)) return false;
  return true;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function getTypePill(type: QuestionType) {
  switch (type) {
    case "qcu":
      return { label: "QCU", icon: <ScanLine size={14} /> };
    case "qcm":
      return { label: "QCM", icon: <ScanLine size={14} /> };
    case "truefalse":
      return { label: "V/F", icon: <CheckCircle2 size={14} /> };
    case "numeric":
      return { label: "Nombre", icon: <Hash size={14} /> };
    case "short":
      return { label: "Réponse", icon: <TextCursorInput size={14} /> };
    case "fill":
      return { label: "Compléter", icon: <TextCursorInput size={14} /> };
    case "photo":
      return { label: "Photo", icon: <ImageIcon size={14} /> };
    default:
      return { label: "Question", icon: <ScanLine size={14} /> };
  }
}

/**
 * UI RULES (jour J):
 * - 1 écran = 1 question
 * - pas de bouton "Précédente"
 * - CTA unique:
 *   - écran question -> "Valider"
 *   - écran résultat plein écran -> "Question suivante" OU "Réessayer"
 */
export function QuestionScreenMock() {
  // ---- MOCK: from your MD (zone z01) ----
  const zone: Zone = useMemo(
    () => ({
      id: "z01",
      title: "Zone 1 — Histoire",
      theme: "histoire",
      intro:
        "Bienvenue dans la zone Histoire. Lisez les éléments autour de vous…\n\nDans cette zone, vous allez répondre à plusieurs types de questions.\nCertaines autorisent une deuxième tentative, d’autres non.",
      questions: [
        {
          id: "q1",
          type: "qcu",
          prompt: "En quelle année a lieu l’abolition de l’esclavage (décret) ?",
          options: ["1848", "1804", "1789", "1914"],
          answer: "1848",
          points: 10,
          penaltyEnabled: false,
          penalty: 0,
          retry: false,
        },
        {
          id: "q2",
          type: "qcm",
          prompt: "Sélectionne les couleurs possibles pour une équipe.",
          options: ["rouge", "vert", "blanc", "bleu", "jaune", "violet"],
          answer: ["rouge", "vert", "blanc", "bleu", "jaune"],
          points: 15,
          penaltyEnabled: true,
          penalty: 5,
          retry: true,
        },
        {
          id: "q3",
          type: "truefalse",
          prompt: "La Réunion apprend l’abolition immédiatement en avril 1848.",
          answer: false,
          points: 10,
          penaltyEnabled: false,
          penalty: 0,
          retry: true,
        },
        {
          id: "q4",
          type: "numeric",
          prompt: "Combien de couleurs minimum dans une équipe ?",
          answer: 3,
          tolerance: 0,
          points: 10,
          penaltyEnabled: false,
          penalty: 0,
          retry: true,
        },
        {
          id: "q5",
          type: "numeric",
          prompt: "Combien de zones l’organisateur a-t-il découpé pour le jeu ?",
          answer: 6,
          tolerance: 0,
          points: 10,
          penaltyEnabled: false,
          penalty: 0,
          retry: false,
        },
        {
          id: "q6",
          type: "short",
          prompt: "Quel est le nom du projet ?",
          answer: "Connect",
          mode: "normalized",
          points: 10,
          penaltyEnabled: false,
          penalty: 0,
          retry: true,
        },
        {
          id: "q7",
          type: "fill",
          prompt: "Complète : Une équipe utilise un seul ________ pour jouer.",
          answer: "téléphone",
          mode: "normalized",
          points: 10,
          penaltyEnabled: false,
          penalty: 0,
          retry: false,
        },
        {
          id: "q8",
          type: "qcu",
          prompt: "Combien de personnes maximum dans une équipe ?",
          options: ["4", "5", "6", "7"],
          answer: "6",
          points: 10,
          penaltyEnabled: true,
          penalty: 3,
          retry: true,
        },
        {
          id: "q9",
          type: "qcm",
          prompt: "Quels éléments sont requis pour créer une équipe ?",
          options: [
            "Nom d’équipe",
            "Prénom de chaque participant",
            "Couleur de chaque participant",
            "Numéro de passeport",
            "Code d’accès (DOB/PIN)",
          ],
          answer: [
            "Nom d’équipe",
            "Prénom de chaque participant",
            "Couleur de chaque participant",
            "Code d’accès (DOB/PIN)",
          ],
          points: 15,
          penaltyEnabled: false,
          penalty: 0,
          retry: false,
        },
        {
          id: "q10",
          type: "short",
          prompt: "Réponds exactement : écris le mot 'OK'.",
          answer: "OK",
          mode: "exact",
          points: 5,
          penaltyEnabled: false,
          penalty: 0,
          retry: false,
        },
        {
          id: "q11",
          type: "photo",
          prompt: "Prends en photo la personne la plus âgée présente aujourd’hui.",
          points: 20,
          retry: false,
          upload: { bucket: "connect-public", folder: "answers" },
          consentText:
            "Nous acceptons que cette photo soit utilisée par l’organisateur (retour en images).",
        },
        {
          id: "q12",
          type: "photo",
          prompt: "Réunis une chaîne familiale sur une photo (3/4/5 générations).",
          points: 0,
          retry: false,
          upload: { bucket: "connect-public", folder: "answers" },
          tier: {
            label: "Combien de générations sur la photo ?",
            options: [
              { value: 3, label: "3 générations", points: 20 },
              { value: 4, label: "4 générations", points: 40 },
              { value: 5, label: "5 générations", points: 60 },
            ],
          },
          note: {
            enabled: true,
            placeholder:
              "Optionnel : prénoms / lien (ex: Mamie Jo, maman Sarah, bébé Léa)",
          },
          consentText: "Nous acceptons l’utilisation de cette photo par l’organisateur.",
        },
      ],
    }),
    []
  );

  const [qIndex, setQIndex] = useState(0);
  const q = zone.questions[qIndex];
  const total = zone.questions.length;

  // mock online/offline toggle
  const [online, setOnline] = useState(true);

  // answers local
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const currentValue = answers[q.id];

  // save state
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });

  // score total
  const [score, setScore] = useState(0);

  // attempts per question (retry=true => max 2)
  const [attemptsUsed, setAttemptsUsed] = useState<Record<string, number>>({});

  // full-screen result overlay
  const [result, setResult] = useState<ResultState>({
    show: false,
    correct: false,
    earned: 0,
    max: q.points ?? 0,
    penaltyApplied: 0,
    canRetry: false,
    attemptsLeft: 0,
  });

  // reset on question change
  useEffect(() => {
    const used = attemptsUsed[q.id] ?? 0;
    const allowedAttempts = q.retry ? 2 : 1;
    const left = clamp(allowedAttempts - used, 0, allowedAttempts);

    setResult({
      show: false,
      correct: false,
      earned: 0,
      max: q.points ?? 0,
      penaltyApplied: 0,
      canRetry: false,
      attemptsLeft: left,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.id]);

  function updateAnswer(next: any) {
    setAnswers((prev) => ({ ...prev, [q.id]: next }));
  }

  // auto-save (debounced)
  useDebouncedEffect(
    () => {
      if (!online) {
        setSaveState({ status: "offline" });
        return;
      }
      setSaveState({ status: "saving" });

      window.setTimeout(() => {
        const fail = Math.random() < 0.01;
        if (fail) {
          setSaveState({ status: "error", message: "réseau instable" });
          return;
        }
        setSaveState({ status: "saved", at: Date.now() });
      }, 260);
    },
    [q.id, JSON.stringify(currentValue), online],
    420
  );

  function renderSaveLine() {
    if (!online || saveState.status === "offline") {
      return (
        <div className="qs-save qs-save--warn">
          <WifiOff size={16} />
          <span>Hors-ligne — en attente</span>
        </div>
      );
    }
    if (saveState.status === "saving") {
      return (
        <div className="qs-save">
          <Wifi size={16} />
          <span>Enregistrement…</span>
        </div>
      );
    }
    if (saveState.status === "saved") {
      return (
        <div className="qs-save qs-save--ok">
          <CheckCircle2 size={16} />
          <span>Enregistré • {formatTime(saveState.at)}</span>
        </div>
      );
    }
    if (saveState.status === "error") {
      return (
        <div className="qs-save qs-save--err">
          <AlertTriangle size={16} />
          <span>Erreur — {saveState.message}</span>
        </div>
      );
    }
    return (
      <div className="qs-save">
        <Wifi size={16} />
        <span>Prêt</span>
      </div>
    );
  }

  function attemptsLeftForQuestion(): number {
    const used = attemptsUsed[q.id] ?? 0;
    const allowed = q.retry ? 2 : 1;
    return clamp(allowed - used, 0, allowed);
  }

  function canValidate(): boolean {
    if (result.show) return false;
    if (attemptsLeftForQuestion() <= 0) return false;

    if (q.type === "qcu") return typeof currentValue === "string" && currentValue.length > 0;
    if (q.type === "qcm") return Array.isArray(currentValue) && currentValue.length > 0;
    if (q.type === "truefalse") return currentValue === true || currentValue === false;

    if (q.type === "numeric") {
      const s = String(currentValue ?? "").trim();
      return s.length > 0 && !Number.isNaN(parseFloat(s.replace(",", ".")));
    }

    if (q.type === "short" || q.type === "fill") {
      return typeof currentValue === "string" && currentValue.trim().length > 0;
    }

    if (q.type === "photo") {
      const hasFile = !!currentValue?.fileName;
      const hasConsent = currentValue?.consent === true;
      const hasTier = q.tier ? typeof currentValue?.tierValue === "number" : true;
      return hasFile && hasConsent && hasTier;
    }

    return false;
  }

  function computeCorrect(): boolean {
    // MOCK ONLY
    if (q.type === "qcu") return currentValue === q.answer;

    if (q.type === "qcm") {
      const a = Array.isArray(currentValue) ? currentValue : [];
      const b = Array.isArray(q.answer) ? q.answer : [];
      return arrayEqSet(a, b);
    }

    if (q.type === "truefalse") return currentValue === q.answer;

    if (q.type === "numeric") {
      const v = parseFloat(String(currentValue ?? "").replace(",", "."));
      const target = Number(q.answer);
      const tol = Number(q.tolerance ?? 0);
      return Number.isFinite(v) && Math.abs(v - target) <= tol;
    }

    if (q.type === "short" || q.type === "fill") {
      const mode = q.mode ?? "normalized";
      const a = String(currentValue ?? "");
      const b = String(q.answer ?? "");
      return mode === "exact" ? a === b : isEqualNormalized(a, b);
    }

    if (q.type === "photo") {
      // En prod: validation admin; ici: “soumis” => ok
      return true;
    }

    return false;
  }

  function pointsForQuestion(): number {
    if (q.type === "photo" && q.tier) {
      const v = currentValue?.tierValue;
      return Number(q.tier.options.find((o) => o.value === v)?.points ?? 0);
    }
    return Number(q.points ?? 0);
  }

  function computePoints(correct: boolean): { earned: number; penaltyApplied: number; max: number } {
    const max = pointsForQuestion();
    if (correct) return { earned: max, penaltyApplied: 0, max };

    const penalty = q.penaltyEnabled ? Number(q.penalty ?? 0) : 0;
    return { earned: Math.max(0, max - penalty), penaltyApplied: penalty, max };
  }

  function onValidate() {
    if (!canValidate()) return;

    const used = attemptsUsed[q.id] ?? 0;
    const attemptNumber = used + 1;

    const correct = computeCorrect();
    const { earned, penaltyApplied, max } = computePoints(correct);

    setAttemptsUsed((prev) => ({ ...prev, [q.id]: attemptNumber }));
    setScore((s) => s + earned);

    const left = clamp((q.retry ? 2 : 1) - attemptNumber, 0, q.retry ? 2 : 1);
    const canRetryNow = q.retry === true && !correct && left > 0;

    setResult({
      show: true,
      correct,
      earned,
      max,
      penaltyApplied,
      canRetry: canRetryNow,
      attemptsLeft: left,
    });
  }

  function onRetry() {
    // ferme l’overlay => l’équipe corrige la réponse puis re-valide
    setResult((r) => ({ ...r, show: false, canRetry: false }));
  }

  function nextQuestion() {
    setQIndex((i) => clamp(i + 1, 0, total - 1));
  }

  // ---- Inputs ----
  function toggleQcm(opt: string) {
    const arr: string[] = Array.isArray(currentValue) ? currentValue : [];
    updateAnswer(arr.includes(opt) ? arr.filter((x) => x !== opt) : [...arr, opt]);
  }

  function renderInput() {
    const disabled = result.show;

    if (q.type === "qcu") {
      return (
        <div className="qs-options">
          {q.options?.map((opt) => {
            const active = currentValue === opt;
            return (
              <button
                key={opt}
                className={`qs-option ${active ? "is-active" : ""}`}
                onClick={() => updateAnswer(opt)}
                disabled={disabled}
              >
                <div className="qs-option__left">
                  <div className="qs-option__value">{opt}</div>
                </div>
                <div className={`qs-dot ${active ? "is-on" : ""}`} aria-hidden="true" />
              </button>
            );
          })}
        </div>
      );
    }

    if (q.type === "qcm") {
      const arr: string[] = Array.isArray(currentValue) ? currentValue : [];
      return (
        <>
          <div className="qs-options">
            {q.options?.map((opt) => {
              const active = arr.includes(opt);
              return (
                <button
                  key={opt}
                  className={`qs-option ${active ? "is-active" : ""}`}
                  onClick={() => toggleQcm(opt)}
                  disabled={disabled}
                >
                  <div className="qs-option__left">
                    <div className="qs-option__value">{opt}</div>
                  </div>
                  <div className={`qs-dot ${active ? "is-on" : ""}`} aria-hidden="true" />
                </button>
              );
            })}
          </div>
          <div className="qs-hint">Sélection : {arr.length}</div>
        </>
      );
    }

    if (q.type === "truefalse") {
      return (
        <div className="qs-grid-2">
          <button
            className={`qs-bigbtn ${currentValue === true ? "is-active" : ""}`}
            onClick={() => updateAnswer(true)}
            disabled={disabled}
          >
            Vrai
          </button>
          <button
            className={`qs-bigbtn ${currentValue === false ? "is-active-red" : ""}`}
            onClick={() => updateAnswer(false)}
            disabled={disabled}
          >
            Faux
          </button>
        </div>
      );
    }

    if (q.type === "numeric") {
      return (
        <div className="qs-field">
          <label className="qs-label">Ta réponse (nombre)</label>
          <input
            className="qs-input"
            value={typeof currentValue === "string" ? currentValue : currentValue ?? ""}
            onChange={(e) => updateAnswer(e.target.value)}
            inputMode="numeric"
            placeholder="Ex: 3"
            disabled={disabled}
          />
          <div className="qs-hint">Clavier numérique</div>
        </div>
      );
    }

    if (q.type === "short") {
      return (
        <div className="qs-field">
          <label className="qs-label">Ta réponse</label>
          <input
            className="qs-input"
            value={typeof currentValue === "string" ? currentValue : ""}
            onChange={(e) => updateAnswer(e.target.value)}
            placeholder="Tape ta réponse…"
            disabled={disabled}
          />
          <div className="qs-hint">Réponse {q.mode === "exact" ? "exacte" : "normalisée"}</div>
        </div>
      );
    }

    if (q.type === "fill") {
      return (
        <div className="qs-field">
          <label className="qs-label">Complète la phrase</label>
          <input
            className="qs-input"
            value={typeof currentValue === "string" ? currentValue : ""}
            onChange={(e) => updateAnswer(e.target.value)}
            placeholder="Ex: téléphone"
            disabled={disabled}
          />
          <div className="qs-hint">Réponse normalisée</div>
        </div>
      );
    }

    if (q.type === "photo") {
      const tierValue = currentValue?.tierValue ?? null;
      const fileName = currentValue?.fileName ?? "";
      const note = currentValue?.note ?? "";
      const consent = currentValue?.consent ?? false;

      return (
        <div className="qs-photo">
          {q.tier ? (
            <div className="qs-tier">
              <div className="qs-label">{q.tier.label}</div>
              <div className="qs-options">
                {q.tier.options.map((opt) => {
                  const active = tierValue === opt.value;
                  return (
                    <button
                      key={opt.value}
                      className={`qs-option ${active ? "is-active" : ""}`}
                      onClick={() => updateAnswer({ ...currentValue, tierValue: opt.value })}
                      disabled={disabled}
                    >
                      <div className="qs-option__left">
                        <div className="qs-option__value">{opt.label}</div>
                        <div className="qs-option__sub">+{opt.points} pts</div>
                      </div>
                      <div className={`qs-dot ${active ? "is-on" : ""}`} aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <button
            className="qs-upload"
            onClick={() =>
              updateAnswer({
                ...currentValue,
                fileName: fileName || "photo_zone.jpg",
              })
            }
            disabled={disabled}
          >
            <ImageIcon size={18} />
            <span>{fileName ? `Photo ajoutée : ${fileName}` : "Ajouter une photo (mock)"}</span>
          </button>

          {q.note?.enabled ? (
            <div className="qs-field">
              <label className="qs-label">Note (optionnel)</label>
              <textarea
                className="qs-textarea"
                value={note}
                onChange={(e) => updateAnswer({ ...currentValue, note: e.target.value })}
                placeholder={q.note.placeholder || "Note…"}
                rows={3}
                disabled={disabled}
              />
            </div>
          ) : null}

          <label className={`qs-consent ${disabled ? "is-disabled" : ""}`}>
            <input
              type="checkbox"
              checked={!!consent}
              onChange={(e) => updateAnswer({ ...currentValue, consent: e.target.checked })}
              disabled={disabled}
            />
            <div className="qs-consent__text">
              <div className="qs-consent__title">
                <ShieldCheck size={16} />
                Consentement
              </div>
              <div className="qs-consent__body">
                {q.consentText || "J’accepte l’utilisation de cette photo."}
              </div>
            </div>
          </label>

          <div className="qs-hint">
            Upload : <b>{q.upload?.bucket}</b> / {q.upload?.folder}
          </div>
        </div>
      );
    }

    return null;
  }

  const typePill = getTypePill(q.type);
  const attemptsLeft = attemptsLeftForQuestion();
  const maxPts = pointsForQuestion();

  const showOverlay = result.show;

  return (
    <div className="qs-root">
      <div className="qs-container">
        {/* Header */}
        <header className="qs-header">
          <div className="qs-header__top">
            <div className="qs-titleblock">
              <div className="qs-zone">{zone.title}</div>
              <div className="qs-progress">
                Question <b>{qIndex + 1}</b>/<b>{total}</b>
              </div>
            </div>

            <button
              className={`qs-online ${online ? "is-online" : "is-offline"}`}
              onClick={() => setOnline((v) => !v)}
              title="Mock: bascule online/offline"
            >
              {online ? <Wifi size={16} /> : <WifiOff size={16} />}
              {online ? "Online" : "Offline"}
            </button>
          </div>

          <div className="qs-header__bottom">
            {renderSaveLine()}
            <div className="qs-score">
              <Trophy size={16} />
              <span>
                Score : <b>{score}</b>
              </span>
            </div>
          </div>
        </header>

        {/* Question */}
        <main className="qs-card" aria-hidden={showOverlay}>
          <div className="qs-topmeta">
            <span className="qs-pill">
              {typePill.icon}
              {typePill.label}
            </span>
            <span className="qs-topmeta__sep">•</span>
            <span className="qs-topmeta__item">{maxPts} pts</span>

            <span className="qs-topmeta__sep">•</span>
            <span className="qs-topmeta__item">{q.retry ? "2 essais max" : "1 essai"}</span>

            {q.penaltyEnabled ? (
              <>
                <span className="qs-topmeta__sep">•</span>
                <span className="qs-topmeta__item">pénalité -{q.penalty ?? 0}</span>
              </>
            ) : null}

            <span className="qs-topmeta__sep">•</span>
            <span className="qs-topmeta__item">{attemptsLeft} restant</span>
          </div>

          <h1 className="qs-question">{q.prompt}</h1>
          <div className="qs-body">{renderInput()}</div>
        </main>

        <div className="qs-spacer" />

        {/* Footer (question screen) */}
        {!showOverlay ? (
          <footer className="qs-footer">
            <div className="qs-footer__wrap">
              <div className="qs-footer__inner qs-footer__inner--single">
                <button
                  className={`qs-primary ${canValidate() ? "" : "is-disabled"}`}
                  onClick={onValidate}
                  disabled={!canValidate()}
                >
                  <CheckCircle2 size={18} />
                  <span>Valider</span>
                </button>
              </div>

              <div className="qs-footer__sub">
                <span>Auto-save activé</span>
                <span>Statut : en cours</span>
              </div>
            </div>
          </footer>
        ) : null}
      </div>

      {/* FULL SCREEN RESULT OVERLAY */}
      {showOverlay ? (
        <div
          className={`qs-overlay ${result.correct ? "is-ok" : "is-bad"}`}
          role="dialog"
          aria-modal="true"
        >
          <div className="qs-overlay__card">
            <div className="qs-overlay__icon">
              {result.correct ? <CheckCircle2 size={44} /> : <XCircle size={44} />}
            </div>

            <div className="qs-overlay__title">
              {result.correct ? "Bonne réponse" : "Mauvaise réponse"}
            </div>

            <div className="qs-overlay__score">
              <span className="qs-overlay__scorePlus">+{result.earned}</span>
              <span className="qs-overlay__scoreMax"> / {result.max} pts</span>
            </div>

            {result.penaltyApplied > 0 ? (
              <div className="qs-overlay__meta">Pénalité appliquée : -{result.penaltyApplied}</div>
            ) : (
              <div className="qs-overlay__meta">&nbsp;</div>
            )}

            {result.canRetry ? (
              <div className="qs-overlay__hint">
                Il te reste <b>{result.attemptsLeft}</b> essai.
              </div>
            ) : (
              <div className="qs-overlay__hint">
                {qIndex === total - 1 ? "Dernière question." : "Passe à la suite."}
              </div>
            )}

            <div className="qs-overlay__actions">
              {result.canRetry ? (
                <button className="qs-cta qs-cta--warn" onClick={onRetry}>
                  <RotateCcw size={18} />
                  Réessayer
                </button>
              ) : (
                <button
                  className="qs-cta"
                  onClick={nextQuestion}
                  disabled={qIndex === total - 1}
                  title={qIndex === total - 1 ? "Terminer" : undefined}
                >
                  <ArrowRight size={18} />
                  {qIndex === total - 1 ? "Terminer" : "Question suivante"}
                </button>
              )}
            </div>

            <div className="qs-overlay__footer">
              <span className="qs-overlay__tiny">
                Zone : <b>{zone.title}</b>
              </span>
              <span className="qs-overlay__tiny">
                Question : <b>{qIndex + 1}/{total}</b>
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}