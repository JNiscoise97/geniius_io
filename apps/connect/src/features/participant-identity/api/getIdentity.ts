import { supabase } from "../../../lib/supabase/client";
import type { IdentityFormValues } from "../components/IdentityForm";

type GetIdentityInput = {
  participantId: string;
};

export async function getIdentity({
  participantId,
}: GetIdentityInput): Promise<IdentityFormValues | null> {
  const [participantRes, identityRes] = await Promise.all([
    supabase
      .from("participants")
      .select("first_name, last_name, nickname, birth_year")
      .eq("id", participantId)
      .maybeSingle(),

    supabase
      .from("participant_identity")
      .select("branch_keys, attended_edition_keys")
      .eq("participant_id", participantId)
      .maybeSingle(),
  ]);

  if (participantRes.error) {
    throw new Error(participantRes.error.message);
  }

  if (identityRes.error) {
    throw new Error(identityRes.error.message);
  }

  if (!participantRes.data) return null;

  return {
    firstName: participantRes.data.first_name ?? "",
    lastName: participantRes.data.last_name ?? "",
    nickname: participantRes.data.nickname ?? "",
    birthYear: participantRes.data.birth_year
      ? String(participantRes.data.birth_year)
      : "",
    branchKeys: identityRes.data?.branch_keys ?? [],
    previousEditionKeys: identityRes.data?.attended_edition_keys ?? [],
  };
}