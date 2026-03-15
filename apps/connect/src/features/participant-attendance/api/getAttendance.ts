import { supabase } from "../../../lib/supabase/client";
import type { AttendanceFormValues } from "../components/AttendanceForm";

type GetAttendanceInput = {
  participantId: string;
};

export async function getAttendance({
  participantId,
}: GetAttendanceInput): Promise<AttendanceFormValues | null> {
  const res = await supabase
    .from("participant_attendance")
    .select("attendance_status, party_size, can_help, help_types, note")
    .eq("participant_id", participantId)
    .maybeSingle();

  if (res.error) {
    throw new Error(res.error.message);
  }

  if (!res.data) return null;

  return {
    attendanceStatus: (res.data.attendance_status ?? "") as
      | ""
      | "yes"
      | "no"
      | "maybe"
      | "definitive-no",
    partySize: res.data.party_size ? String(res.data.party_size) : "",
    canHelp: res.data.can_help ?? false,
    helpTypes: (res.data.help_types ?? []) as AttendanceFormValues["helpTypes"],
    note: res.data.note ?? "",
  };
}