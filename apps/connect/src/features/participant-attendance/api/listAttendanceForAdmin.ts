import { supabase } from "../../../lib/supabase/client";

export type AdminAttendanceItem = {
  participantId: string;
  participantLabel: string;
  participantEmail: string | null;
  attendanceStatus: "yes" | "no" | "maybe" | "definitive-no";
  partySize: number | null;
  canHelp: boolean;
  helpTypes: string[];
  note: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

type AttendanceRow = {
  participant_id: string;
  attendance_status: "yes" | "no" | "maybe" | "definitive-no";
  party_size: number | null;
  can_help: boolean;
  help_types: string[] | null;
  note: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

type ParticipantRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  nickname: string | null;
  email: string | null;
  event_slug: string;
};

function getParticipantLabel(participant: ParticipantRow | undefined): string {
  if (!participant) {
    return "Participant inconnu";
  }

  const nickname = participant.nickname?.trim();
  if (nickname) {
    return nickname;
  }

  const fullName = [participant.first_name, participant.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (fullName) {
    return fullName;
  }

  return participant.email?.trim() || "Participant inconnu";
}

export async function listAttendanceForAdmin(
  eventSlug: string
): Promise<AdminAttendanceItem[]> {
  const { data: participants, error: participantsError } = await supabase
    .from("participants")
    .select("id, first_name, last_name, nickname, email, event_slug")
    .eq("event_slug", eventSlug)
    .returns<ParticipantRow[]>();

  if (participantsError) {
    throw new Error(
      `Impossible de charger les participants : ${participantsError.message}`
    );
  }

  const participantIds = (participants ?? []).map((p) => p.id);

  if (participantIds.length === 0) {
    return [];
  }

  const { data: attendanceRows, error: attendanceError } = await supabase
    .from("participant_attendance")
    .select(
      "participant_id, attendance_status, party_size, can_help, help_types, note, completed, created_at, updated_at"
    )
    .in("participant_id", participantIds)
    .returns<AttendanceRow[]>();

  if (attendanceError) {
    throw new Error(
      `Impossible de charger les présences : ${attendanceError.message}`
    );
  }

  const participantsById = new Map(
    (participants ?? []).map((participant) => [participant.id, participant])
  );

  return (attendanceRows ?? []).map((row) => ({
    participantId: row.participant_id,
    participantLabel: getParticipantLabel(participantsById.get(row.participant_id)),
    participantEmail: participantsById.get(row.participant_id)?.email ?? null,
    attendanceStatus: row.attendance_status,
    partySize: row.party_size,
    canHelp: row.can_help,
    helpTypes: row.help_types ?? [],
    note: row.note,
    completed: row.completed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}