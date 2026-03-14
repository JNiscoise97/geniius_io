import { supabase } from "../../../lib/supabase/client";
import type { OriginsFormValues } from "../components/OriginsForm";

type GetOriginsInput = {
  participantId: string;
};

type ParticipantOriginsRow = {
  heard_about_initiative: string | null;
  heard_about_initiative_other: string | null;
  branch_keys: string[] | null;
  attended_edition_keys: string[] | null;
  cousinade_expectation: string | null;
  completed: boolean | null;
};

export async function getOrigins({
  participantId,
}: GetOriginsInput): Promise<OriginsFormValues | null> {
  const res = await supabase
    .from("participant_origins")
    .select(
      "heard_about_initiative, heard_about_initiative_other, branch_keys, attended_edition_keys, cousinade_expectation, completed",
    )
    .eq("participant_id", participantId)
    .maybeSingle<ParticipantOriginsRow>();

  if (res.error) {
    throw new Error(res.error.message);
  }

  if (!res.data) return null;

  return {
    heardAboutInitiative: res.data.heard_about_initiative ?? "",
    heardAboutInitiativeOther: res.data.heard_about_initiative_other ?? "",
    branchKeys: res.data.branch_keys ?? [],
    attendedEditionKeys: res.data.attended_edition_keys ?? [],
    cousinadeExpectation: res.data.cousinade_expectation ?? "",
  };
}