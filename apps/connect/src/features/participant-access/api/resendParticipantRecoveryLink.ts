import { supabase } from "../../../lib/supabase/client";

export type ResendParticipantRecoveryLinkInput = {
  eventSlug: string;
  participantId: string;
  recoveryLink: string;
  firstName?: string;
  lastName?: string;
  email: string;
};

export async function resendParticipantRecoveryLink(
  input: ResendParticipantRecoveryLinkInput,
): Promise<void> {
  const { error } = await supabase.functions.invoke(
    "resend-participant-recovery-link",
    {
      body: {
        eventSlug: input.eventSlug.trim(),
        participantId: input.participantId.trim(),
        recoveryLink: input.recoveryLink.trim(),
        firstName: input.firstName?.trim(),
        lastName: input.lastName?.trim(),
        email: input.email.trim(),
      },
    },
  );

  if (error) {
    throw new Error(error.message || "Impossible de renvoyer le lien personnel.");
  }
}