import { supabase } from "../../../lib/supabase/client";

export type SendParticipantRecoveryLinkInput = {
  eventSlug: string;
  participantId: string;
  recoveryLink: string;
  firstName?: string;
  lastName?: string;
  email: string;
};

export async function sendParticipantRecoveryLink(
  input: SendParticipantRecoveryLinkInput,
): Promise<void> {
  const payload: SendParticipantRecoveryLinkInput = {
    eventSlug: input.eventSlug.trim(),
    participantId: input.participantId.trim(),
    recoveryLink: input.recoveryLink.trim(),
    firstName: input.firstName?.trim(),
    lastName: input.lastName?.trim(),
    email: input.email.trim(),
  };

  if (!payload.eventSlug) {
    throw new Error("eventSlug requis.");
  }

  if (!payload.participantId) {
    throw new Error("participantId requis.");
  }

  if (!payload.recoveryLink) {
    throw new Error("recoveryLink requis.");
  }

  if (!payload.email) {
    throw new Error(
      "Adresse email requise pour l’envoi du lien personnel.",
    );
  }

  const { error } = await supabase.functions.invoke(
    "send-participant-recovery-link",
    {
      body: payload,
    },
  );

  if (error) {
    throw new Error(error.message || "Impossible d’envoyer le lien personnel.");
  }
}