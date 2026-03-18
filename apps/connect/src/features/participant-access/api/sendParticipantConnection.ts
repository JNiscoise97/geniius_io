import { supabase } from "../../../lib/supabase/client";

export type SendParticipantConnectionInput = {
  eventSlug: string;
  participantId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  source?: "device" | "email-recovery";
};

export async function sendParticipantConnection(
  input: SendParticipantConnectionInput,
): Promise<void> {
  const { error } = await supabase.functions.invoke("send-participant-connection", {
    body: {
      eventSlug: input.eventSlug.trim(),
      participantId: input.participantId.trim(),
      firstName: input.firstName?.trim(),
      lastName: input.lastName?.trim(),
      email: input.email?.trim(),
      source: input.source,
    },
  });

  if (error) {
    throw new Error(error.message || "Impossible d’enregistrer la connexion.");
  }
}