import { supabase } from "../../../lib/supabase/client";
import type { OriginsFormValues } from "../components/OriginsForm";

type SaveOriginsInput = {
  participantId: string;
  values: OriginsFormValues;
};

function cleanText(value: string): string | null {
  const s = value.trim();
  return s ? s : null;
}

export async function saveOrigins({
  participantId,
  values,
}: SaveOriginsInput): Promise<void> {
  const res = await supabase.from("participant_origins").upsert(
    {
      participant_id: participantId,
      heard_about_initiative: cleanText(values.heardAboutInitiative),
      heard_about_initiative_other:
        values.heardAboutInitiative === "other"
          ? cleanText(values.heardAboutInitiativeOther)
          : null,
      branch_keys: values.branchKeys,
      attended_edition_keys: values.attendedEditionKeys,
      cousinade_expectation: cleanText(values.cousinadeExpectation),
      completed: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "participant_id" },
  );

  if (res.error) {
    throw new Error(res.error.message);
  }
}