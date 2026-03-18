import { supabase } from "../../../lib/supabase/client";

export type SendParticipantConnectionViaTokenInput = {
  eventSlug: string;
  participantId: string;
  firstName?: string;
  lastName?: string;
};

export async function sendParticipantConnectionViaToken(
  input: SendParticipantConnectionViaTokenInput,
): Promise<void> {
  const { error } = await supabase.functions.invoke(
    "send-participant-connection-via-token",
    {
      body: {
        eventSlug: input.eventSlug.trim(),
        participantId: input.participantId.trim(),
        firstName: input.firstName?.trim(),
        lastName: input.lastName?.trim(),
      },
    },
  );

  if (error) {
    throw new Error(
      error.message || "Impossible d’enregistrer la connexion via lien.",
    );
  }
}