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
  const isAbsent =
    attendanceStatus === "no" || attendanceStatus === "definitive-no";

  const partySize =
    attendanceStatus === "yes"
      ? toPartySizeOrNull(values.partySize)
      : attendanceStatus === "maybe"
        ? toPartySizeOrNull(values.partySize)
        : null;

  const res = await supabase.from("participant_attendance").upsert(
    {
      participant_id: participantId,
      attendance_status: attendanceStatus,
      party_size: partySize,
      can_help: isAbsent ? false : values.canHelp,
      help_types: isAbsent || !values.canHelp ? [] : values.helpTypes,
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