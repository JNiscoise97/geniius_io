import { supabase } from "../../../lib/supabase/client";
import type { AttendanceFormValues } from "../components/AttendanceForm";

type SaveAttendanceInput = {
  participantId: string;
  values: AttendanceFormValues;
};

function toPartySizeOrNull(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;
  if (!/^\d{1,2}$/.test(s)) return null;

  const n = Number(s);
  if (!Number.isFinite(n) || n < 1 || n > 50) return null;

  return n;
}

function cleanText(value: string): string | null {
  const s = value.trim();
  return s ? s : null;
}

export async function saveAttendance({
  participantId,
  values,
}: SaveAttendanceInput): Promise<void> {
  const attendanceStatus = values.attendanceStatus || "maybe";

  const res = await supabase.from("participant_attendance").upsert(
    {
      participant_id: participantId,
      attendance_status: attendanceStatus,
      party_size:
        attendanceStatus === "no" ? null : toPartySizeOrNull(values.partySize),
      can_help: attendanceStatus === "no" ? false : values.canHelp,
      help_types:
        attendanceStatus === "no" || !values.canHelp ? [] : values.helpTypes,
      note: cleanText(values.note),
      completed: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "participant_id" },
  );

  if (res.error) {
    throw new Error(res.error.message);
  }
}