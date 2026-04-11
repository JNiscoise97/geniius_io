import { supabase } from "../../../lib/supabase/client";
import { listActivityDefinitions } from "../core/activity/content/queries/listActivityDefinitions";

type ActivitySessionLeaderboardRow = {
  id: string;
  event_slug: string;
  activity_slug: string;
  participant_id: string;
  mode: "learn" | "collect" | "play";
  status: "in_progress" | "completed" | "abandoned";
  score: number | null;
  pending_review_score: number | null;
  has_started: boolean | null;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
  created_at: string;
};

type ParticipantRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  nickname: string | null;
  email: string | null;
};

export type LearnQuizScoreItem = {
  activitySlug: string;
  activityTitle: string;
  completedAt: string | null;
  startedAt: string | null;
  score: number;
};

export type LearnLeaderboardEntry = {
  participantId: string;
  participantLabel: string;
  totalScore: number;
  completedQuizCount: number;
  quizScores: LearnQuizScoreItem[];
};

export type CollectContributionItem = {
  activitySlug: string;
  activityTitle: string;
  status: "completed" | "in_progress";
  startedAt: string | null;
  completedAt: string | null;
  updatedAt: string;
};

export type CollectLeaderboardEntry = {
  participantId: string;
  participantLabel: string;
  completedCount: number;
  startedCount: number;
  contributions: CollectContributionItem[];
};

export type ActivityLeaderboardData = {
  learn: LearnLeaderboardEntry[];
  collect: CollectLeaderboardEntry[];
};

export type GetActivityLeaderboardDataInput = {
  eventSlug: string;
};

function getParticipantLabel(participant: ParticipantRow | undefined): string {
  if (!participant) {
    return "Participant inconnu";
  }

  const nickname = participant.nickname?.trim();
  if (nickname) {
    return nickname;
  }

  const fullName = [participant.first_name, participant.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (fullName) {
    return fullName;
  }

  return participant.email?.trim() || "Participant inconnu";
}

export async function getActivityLeaderboardData({
  eventSlug,
}: GetActivityLeaderboardDataInput): Promise<ActivityLeaderboardData> {
  const { data: sessions, error: sessionsError } = await supabase
    .from("activity_sessions")
    .select(
      "id, event_slug, activity_slug, participant_id, mode, status, score, pending_review_score, has_started, started_at, completed_at, updated_at, created_at"
    )
    .eq("event_slug", eventSlug)
    .in("mode", ["learn", "collect"])
    .returns<ActivitySessionLeaderboardRow[]>();

  if (sessionsError) {
    throw new Error(
      `Impossible de charger les sessions d'activité : ${sessionsError.message}`
    );
  }

  const participantIds = Array.from(
    new Set((sessions ?? []).map((row) => row.participant_id).filter(Boolean))
  );

  let participantsById = new Map<string, ParticipantRow>();

  if (participantIds.length > 0) {
    const { data: participants, error: participantsError } = await supabase
      .from("participants")
      .select("id, first_name, last_name, nickname, email")
      .in("id", participantIds)
      .returns<ParticipantRow[]>();

    if (participantsError) {
      throw new Error(
        `Impossible de charger les participants : ${participantsError.message}`
      );
    }

    participantsById = new Map((participants ?? []).map((row) => [row.id, row]));
  }

  const activityDefinitions = listActivityDefinitions();
  const activityTitleBySlug = new Map(
    activityDefinitions.map((activity) => [activity.slug, activity.title])
  );

  const learnByParticipant = new Map<string, LearnLeaderboardEntry>();
  const collectByParticipant = new Map<string, CollectLeaderboardEntry>();

  for (const session of sessions ?? []) {
    const participant = participantsById.get(session.participant_id);
    const participantLabel = getParticipantLabel(participant);
    const activityTitle =
      activityTitleBySlug.get(session.activity_slug) ?? session.activity_slug;

    if (session.mode === "learn") {
      if (session.status !== "completed") {
        continue;
      }

      const existing = learnByParticipant.get(session.participant_id) ?? {
        participantId: session.participant_id,
        participantLabel,
        totalScore: 0,
        completedQuizCount: 0,
        quizScores: [],
      };

      const score = session.score ?? 0;

      existing.totalScore += score;
      existing.completedQuizCount += 1;
      existing.quizScores.push({
        activitySlug: session.activity_slug,
        activityTitle,
        completedAt: session.completed_at ?? null,
        startedAt: session.started_at ?? null,
        score,
      });

      learnByParticipant.set(session.participant_id, existing);
    }

    if (session.mode === "collect") {
      if (!session.has_started) {
        continue;
      }

      const existing = collectByParticipant.get(session.participant_id) ?? {
        participantId: session.participant_id,
        participantLabel,
        completedCount: 0,
        startedCount: 0,
        contributions: [],
      };

      const status =
        session.status === "completed" ? "completed" : "in_progress";

      if (status === "completed") {
        existing.completedCount += 1;
      } else {
        existing.startedCount += 1;
      }

      existing.contributions.push({
        activitySlug: session.activity_slug,
        activityTitle,
        status,
        startedAt: session.started_at ?? null,
        completedAt: session.completed_at ?? null,
        updatedAt: session.updated_at,
      });

      collectByParticipant.set(session.participant_id, existing);
    }
  }

  const learn = Array.from(learnByParticipant.values())
    .map((entry) => ({
      ...entry,
      quizScores: [...entry.quizScores].sort((a, b) => {
        const aDate = new Date(a.completedAt ?? a.startedAt ?? 0).getTime();
        const bDate = new Date(b.completedAt ?? b.startedAt ?? 0).getTime();
        return bDate - aDate;
      }),
    }))
    .sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      if (b.completedQuizCount !== a.completedQuizCount) {
        return b.completedQuizCount - a.completedQuizCount;
      }
      return a.participantLabel.localeCompare(b.participantLabel, "fr");
    });

  const collect = Array.from(collectByParticipant.values())
    .map((entry) => ({
      ...entry,
      contributions: [...entry.contributions].sort((a, b) => {
        const aDate = new Date(a.completedAt ?? a.updatedAt ?? a.startedAt ?? 0).getTime();
        const bDate = new Date(b.completedAt ?? b.updatedAt ?? b.startedAt ?? 0).getTime();
        return bDate - aDate;
      }),
    }))
    .sort((a, b) => {
      if (b.completedCount !== a.completedCount) {
        return b.completedCount - a.completedCount;
      }
      if (b.startedCount !== a.startedCount) {
        return b.startedCount - a.startedCount;
      }
      return a.participantLabel.localeCompare(b.participantLabel, "fr");
    });

  return { learn, collect };
}