import { supabase } from "../../../lib/supabase/client";

export type SendParticipantRecoveryLinkInput = {
  eventSlug: string;
  participantId: string;
  recoveryLink: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  hasWhatsapp: boolean;
  messenger?: string;
  preferredContactChannels: string[];
};

export async function sendParticipantRecoveryLink(
  input: SendParticipantRecoveryLinkInput,
): Promise<void> {
  const { error } = await supabase.functions.invoke(
    "send-participant-recovery-link",
    {
      body: input,
    },
  );

  if (error) {
    throw new Error(error.message || "Impossible d’envoyer le lien personnel.");
  }
}