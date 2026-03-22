import { supabase } from "../../../lib/supabase/client";

export async function deleteMyPersonPhoto(params: {
  photoId: string;
  participantId: string;
}): Promise<void> {
  const { photoId, participantId } = params;

  const now = new Date().toISOString();

  // 1. Récupérer la photo pour avoir event_slug + person_id
  const { data: photo, error: photoReadError } = await supabase
    .from("family_person_photos")
    .select(
      `
        id,
        event_slug,
        person_id
      `,
    )
    .eq("id", photoId)
    .eq("participant_id", participantId)
    .neq("moderation_status", "deleted")
    .single();

  if (photoReadError || !photo) {
    throw photoReadError ?? new Error("Photo introuvable.");
  }

  // 2. Soft delete
  const { error: deleteError } = await supabase
    .from("family_person_photos")
    .update({
      moderation_status: "deleted",
      updated_at: now,
    })
    .eq("id", photoId)
    .eq("participant_id", participantId)
    .neq("moderation_status", "deleted");

  if (deleteError) throw deleteError;

  // 3. Vérifier s’il existe un override
  const { data: overrideRow, error: overrideReadError } = await supabase
    .from("person_overrides")
    .select("id, overrides")
    .eq("event_slug", photo.event_slug)
    .eq("person_id", photo.person_id)
    .maybeSingle();

  if (overrideReadError) throw overrideReadError;

  if (!overrideRow?.overrides) return;

  const currentOverrides =
    typeof overrideRow.overrides === "object" &&
    !Array.isArray(overrideRow.overrides)
      ? { ...(overrideRow.overrides as Record<string, unknown>) }
      : null;

  if (!currentOverrides) return;

  // 4. Supprimer uniquement photoSrc
  if (!("photoSrc" in currentOverrides)) return;

  delete currentOverrides.photoSrc;

  // 5. Si plus rien → supprimer la ligne (optionnel mais propre)
  const isEmpty = Object.keys(currentOverrides).length === 0;

  if (isEmpty) {
    const { error: deleteOverrideError } = await supabase
      .from("person_overrides")
      .delete()
      .eq("id", overrideRow.id);

    if (deleteOverrideError) throw deleteOverrideError;
  } else {
    const { error: updateOverrideError } = await supabase
      .from("person_overrides")
      .update({
        overrides: currentOverrides,
        updated_at: now,
      })
      .eq("id", overrideRow.id);

    if (updateOverrideError) throw updateOverrideError;
  }
}