import { supabase } from "../../../lib/supabase/client";

export type FamilyDocumentEventAction = "view" | "download";

export async function trackFamilyDocumentEvent(params: {
  eventSlug: string;
  participantId: string;
  documentSlug: string;
  action: FamilyDocumentEventAction;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const { error } = await supabase.from("participant_document_events").insert({
    event_slug: params.eventSlug,
    participant_id: params.participantId,
    document_slug: params.documentSlug,
    action: params.action,
    metadata: params.metadata ?? {},
  });

  if (error) {
    throw new Error(
      `Impossible d'enregistrer l'événement documentaire : ${error.message}`
    );
  }
}