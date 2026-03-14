import { supabase } from "../../../lib/supabase/client";
import type {
  FamilyKnowledgeStepKey,
  FamilyKnowledgeStepStatus,
} from "../config/familyKnowledgeStepsConfig";

export type FamilyKnowledgeProgress = Record<
  FamilyKnowledgeStepKey,
  FamilyKnowledgeStepStatus
>;

type GetFamilyKnowledgeProgressInput = {
  slug: string;
  participantId?: string | null;
};

function getFallbackProgressFromLocalStorage(
  slug: string,
): FamilyKnowledgeProgress {
  return {
    close_family:
      localStorage.getItem(`connect:${slug}:family-knowledge:close_family`) ===
      "done"
        ? "done"
        : "todo",
    grandparents:
      localStorage.getItem(`connect:${slug}:family-knowledge:grandparents`) ===
      "done"
        ? "done"
        : "todo",
    godparents:
      localStorage.getItem(`connect:${slug}:family-knowledge:godparents`) ===
      "done"
        ? "done"
        : "todo",
    current_links:
      localStorage.getItem(`connect:${slug}:family-knowledge:current_links`) ===
      "done"
        ? "done"
        : "todo",
    memory:
      localStorage.getItem(`connect:${slug}:family-knowledge:memory`) === "done"
        ? "done"
        : "todo",
  };
}

export async function getFamilyKnowledgeProgress({
  slug,
  participantId,
}: GetFamilyKnowledgeProgressInput): Promise<FamilyKnowledgeProgress> {
  if (!participantId) {
    return getFallbackProgressFromLocalStorage(slug);
  }

  try {
    const [
      closeFamilyRes,
      grandparentsRes,
      godparentsRes,
      currentLinksRes,
      memoryRes,
    ] = await Promise.all([
      supabase
        .from("participant_family_knowledge_close_family")
        .select("completed")
        .eq("participant_id", participantId)
        .maybeSingle(),

      supabase
        .from("participant_family_knowledge_grandparents")
        .select("completed")
        .eq("participant_id", participantId)
        .maybeSingle(),

      supabase
        .from("participant_family_knowledge_godparents")
        .select("completed")
        .eq("participant_id", participantId)
        .maybeSingle(),

      supabase
        .from("participant_family_knowledge_current_links")
        .select("completed")
        .eq("participant_id", participantId)
        .maybeSingle(),

      supabase
        .from("participant_family_knowledge_memory")
        .select("completed")
        .eq("participant_id", participantId)
        .maybeSingle(),
    ]);

    return {
      close_family: closeFamilyRes.data?.completed ? "done" : "todo",
      grandparents: grandparentsRes.data?.completed ? "done" : "todo",
      godparents: godparentsRes.data?.completed ? "done" : "todo",
      current_links: currentLinksRes.data?.completed ? "done" : "todo",
      memory: memoryRes.data?.completed ? "done" : "todo",
    };
  } catch {
    return getFallbackProgressFromLocalStorage(slug);
  }
}