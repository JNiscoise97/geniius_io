import { AlertTriangle, CalendarCheck } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AttendanceForm,
  type AttendanceFormValues,
} from "../components/AttendanceForm";
import { attendanceFormConfig } from "../config/attendanceFormConfig";
import { saveAttendance } from "../api/saveAttendance";
import { getAttendance } from "../api/getAttendance";

type LocalParticipantSession = {
  participantId: string;
  firstName?: string;
  lastName?: string;
};

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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  function getParticipantSession(): LocalParticipantSession | null {
    const raw = localStorage.getItem(`connect:${slug}:participant`);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as LocalParticipantSession;
    } catch {
      return null;
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function loadExistingData() {
      const participantSession = getParticipantSession();

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

    if (values.attendanceStatus !== "no") {
      if (!values.partySize.trim()) {
        return "Merci d’indiquer combien vous serez.";
      }

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

    const participantSession = getParticipantSession();
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

      nav(`/e/${slug}/welcome/confirmation?step=attendance`, { replace: true });
    } catch (e: any) {
      setError(e?.message ?? "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pt-3 pb-28">
        <div className="flex items-center gap-3 px-1">
          <div className="h-11 w-11 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center">
            <CalendarCheck size={18} className="text-slate-800" />
          </div>
          <div className="min-w-0">
            <div className="text-[18px] font-black tracking-tight text-slate-900">
              {attendanceFormConfig.title}
            </div>
          </div>
        </div>

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