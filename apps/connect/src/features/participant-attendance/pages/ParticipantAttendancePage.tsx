import { AlertTriangle, ArrowLeft, CalendarCheck } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AttendanceForm,
  type AttendanceFormValues,
} from "../components/AttendanceForm";
import { attendanceFormConfig } from "../config/attendanceFormConfig";
import { saveAttendance } from "../api/saveAttendance";
import { getAttendance } from "../api/getAttendance";
import { getParticipantSession } from "../../../lib/participant-session/getActiveParticipant";
import { supabase } from "../../../lib/supabase/client";
import { createPageTimeTracker } from "../../../lib/analytics/pageTimeTracker";

type AttendanceNotificationPayload = {
  participantId: string;
  eventSlug: string;
  displayName: string;
  attendanceStatus: "yes" | "no" | "maybe" | "definitive-no";
  partySize: number | null;
  canHelp: boolean;
  helpTypes: string[];
  note: string | null;
};

function toPartySizeOrNull(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;
  if (!/^\d{1,2}$/.test(s)) return null;

  const n = Number(s);
  if (!Number.isFinite(n) || n < 1 || n > 50) return null;
  return n;
}

export function ParticipantAttendancePage() {
  const nav = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const [values, setValues] = useState<AttendanceFormValues>({
    attendanceStatus: "",
    partySize: "",
    canHelp: false,
    helpTypes: [],
    note: "",
  });

  const [loading, setLoading] = useState(false);
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const participantSession = getParticipantSession(slug);
  const participantId = participantSession?.participantId ?? null;
  
    useEffect(() => {
          if (!participantId) return;
      
          const tracker = createPageTimeTracker({
            participantId,
            eventSlug: slug,
            pageKey: `/e/${slug}/attendance`,
          });
      
          tracker.start();
      
          return () => {
            void tracker.stop();
          };
        }, [participantId, slug]);

  useEffect(() => {
    let isMounted = true;

    async function loadExistingData() {
      const participantSession = getParticipantSession(slug);

      if (!participantSession?.participantId) {
        if (isMounted) {
          setLoadingInitialData(false);
        }
        return;
      }

      try {
        const existing = await getAttendance({
          participantId: participantSession.participantId,
        });

        if (!isMounted) return;

        if (existing) {
          setValues(existing);
        }
      } catch (e: any) {
        if (!isMounted) return;
        setError(
          e?.message ?? "Impossible de charger ta participation existante.",
        );
      } finally {
        if (isMounted) {
          setLoadingInitialData(false);
        }
      }
    }

    void loadExistingData();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  function validate(): string | null {
    if (!values.attendanceStatus) {
      return "Merci d’indiquer si tu prévois de venir.";
    }

    if (values.attendanceStatus === "yes") {
      if (!values.partySize.trim()) {
        return "Merci d’indiquer combien vous serez.";
      }

      const n = Number(values.partySize);
      if (!Number.isFinite(n) || n < 1 || n > 50) {
        return "Le nombre de personnes doit être compris entre 1 et 50.";
      }
    }

    if (values.attendanceStatus === "maybe" && values.partySize.trim()) {
      const n = Number(values.partySize);
      if (!Number.isFinite(n) || n < 1 || n > 50) {
        return "Le nombre de personnes doit être compris entre 1 et 50.";
      }
    }

    return null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    const participantSession = getParticipantSession(slug);
    if (!participantSession?.participantId) {
      setError(
        "Nous n’avons pas retrouvé ton identification. Merci de commencer par te présenter.",
      );
      return;
    }

    setLoading(true);

    try {
      await saveAttendance({
        participantId: participantSession.participantId,
        values,
      });

      const displayName =
        [
          participantSession.firstName?.trim(),
          participantSession.lastName?.trim(),
        ]
          .filter(Boolean)
          .join(" ") || "Participant inconnu";

      const payload: AttendanceNotificationPayload = {
        participantId: participantSession.participantId,
        eventSlug: slug,
        displayName,
        attendanceStatus: values.attendanceStatus as
          | "yes"
          | "no"
          | "maybe"
          | "definitive-no",
        partySize: toPartySizeOrNull(values.partySize),
        canHelp:
          values.attendanceStatus === "no" ||
          values.attendanceStatus === "definitive-no"
            ? false
            : values.canHelp,
        helpTypes:
          values.attendanceStatus === "no" ||
          values.attendanceStatus === "definitive-no" ||
          !values.canHelp
            ? []
            : values.helpTypes,
        note: values.note.trim() || null,
      };

      const { error: notifyError } = await supabase.functions.invoke(
        "attendance",
        {
          body: payload,
        },
      );

      if (notifyError) {
        throw new Error(
          `Participation enregistrée, mais la notification a échoué : ${notifyError.message}`,
        );
      }

      nav(`/e/${slug}/welcome/confirmation?step=attendance`, {
        replace: true,
      });
    } catch (e: any) {
      setError(e?.message ?? "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pt-3 pb-28">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-extrabold text-indigo-700">
              <CalendarCheck size={14} />
              Disponibilité
            </div>

            <button
              type="button"
              onClick={() => nav(`/e/${slug}/home`)}
              className="shrink-0 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm"
            >
              <span className="inline-flex items-center gap-2">
                <ArrowLeft size={14} />
                Retour
              </span>
            </button>
          </div>

          <h1 className="mt-4 text-[28px] leading-[1.05] font-black tracking-tight text-slate-900">
            {attendanceFormConfig.title}
          </h1>
        </section>

        {error ? (
          <div className="mt-3 rounded-2xl bg-white shadow-sm border border-[rgba(220,38,38,0.22)] p-3">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 text-[color:var(--bad)]">
                <AlertTriangle size={18} />
              </div>
              <div>
                <div className="font-black text-slate-900">Oups</div>
                <div className="text-sm font-bold text-slate-700">{error}</div>
              </div>
            </div>
          </div>
        ) : null}

        {loadingInitialData ? (
          <section className="mt-3 rounded-3xl bg-white border border-slate-200 p-4 shadow-sm">
            <div className="text-sm font-bold text-slate-700">
              Chargement de ta participation…
            </div>
          </section>
        ) : (
          <AttendanceForm
            config={attendanceFormConfig}
            value={values}
            loading={loading}
            onChange={(patch) =>
              setValues((prev) => ({
                ...prev,
                ...patch,
              }))
            }
            onSubmit={onSubmit}
          />
        )}
      </main>
    </div>
  );
}