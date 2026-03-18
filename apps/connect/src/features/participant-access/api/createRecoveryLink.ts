import { supabase } from "../../../lib/supabase/client";

type CreateRecoveryLinkInput = {
  participantId: string;
  eventSlug: string;
  baseUrl?: string;
};

type ParticipantRow = {
  id: string;
  recovery_token: string | null;
};

export type CreateRecoveryLinkResult = {
  recoveryToken: string;
  recoveryLink: string;
};

function generateRecoveryToken(length = 48): string {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

function resolveBaseUrl(explicitBaseUrl?: string): string {
  if (explicitBaseUrl?.trim()) {
    return explicitBaseUrl.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }

  throw new Error("Impossible de déterminer l’URL de base.");
}

export async function createRecoveryLink({
  participantId,
  eventSlug,
  baseUrl,
}: CreateRecoveryLinkInput): Promise<CreateRecoveryLinkResult> {
  const normalizedParticipantId = participantId.trim();
  const normalizedEventSlug = eventSlug.trim();

  if (!normalizedParticipantId) {
    throw new Error("participantId requis.");
  }

  if (!normalizedEventSlug) {
    throw new Error("eventSlug requis.");
  }

  const participantRes = await supabase
    .from("participants")
    .select("id, recovery_token")
    .eq("id", normalizedParticipantId)
    .maybeSingle<ParticipantRow>();

  if (participantRes.error) {
    throw new Error(participantRes.error.message);
  }

  if (!participantRes.data) {
    throw new Error("Participant introuvable.");
  }

  let recoveryToken = participantRes.data.recovery_token?.trim() || "";

  if (!recoveryToken) {
    recoveryToken = generateRecoveryToken(48);

    const updateRes = await supabase
      .from("participants")
      .update({
        recovery_token: recoveryToken,
        recovery_token_created_at: new Date().toISOString(),
      })
      .eq("id", normalizedParticipantId);

    if (updateRes.error) {
      throw new Error(updateRes.error.message);
    }
  }

  const rootUrl = resolveBaseUrl(baseUrl);
  const recoveryLink = `${rootUrl}/e/${normalizedEventSlug}/access/continue?t=${encodeURIComponent(
  recoveryToken,
)}`;

  return {
    recoveryToken,
    recoveryLink,
  };
}