import { supabase } from "../../../lib/supabase/client";
import type {
  SendAnnouncementCampaignInput,
  SendAnnouncementCampaignResult,
} from "../types";

export async function sendAnnouncementCampaign(
  input: SendAnnouncementCampaignInput,
): Promise<SendAnnouncementCampaignResult> {
  const { data, error } = await supabase.functions.invoke(
    "send-participant-announcement",
    {
      body: input,
    },
  );

  if (error) {
    throw error;
  }

  return data as SendAnnouncementCampaignResult;
}