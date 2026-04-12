import { supabase } from "../../../../lib/supabase/client";

export type InPersonAssistPrefill = {
    participantExists: boolean;
    participantId: string | null;
    email: string;
    birthYear: string;
    allowNameInFamilyTree: boolean | null;
    allowPhotoInFamilyTree: boolean | null;
    allowInfoInFamilyTree: boolean | null;
    attended2023: boolean | null;
    attended2024: boolean | null;
    isPresentToday: boolean;

    testimonyInterest:
    | ""
    | "very_willing"
    | "willing"
    | "maybe"
    | "reluctant"
    | "no";
    testimonyTopics: string;
};

type Params = {
    eventSlug: string;
    personId: string;
};

type IdentityClaimRow = {
    participant_id: string | null;
};

type ParticipantRow = {
    email: string | null;
    birth_year: number | null;
};

type ParticipantConsentsRow = {
    allow_name_in_family_tree: boolean | null;
    allow_photo_in_family_tree: boolean | null;
    allow_info_in_family_tree: boolean | null;
};

type InPersonAssistRow = {
    declared_present: boolean;
    attended_2023: boolean | null;
    attended_2024: boolean | null;
    testimony_interest:
    | "very_willing"
    | "willing"
    | "maybe"
    | "reluctant"
    | "no"
    | null;
    testimony_topics: string | null;
    created_at: string;
};

type ParticipantOriginsRow = {
    attended_edition_keys: string[] | null;
};

function hasEdition(
    attendedEditionKeys: string[] | null | undefined,
    editionKey: string,
): boolean | null {
    if (!attendedEditionKeys) {
        return null;
    }

    return attendedEditionKeys.includes(editionKey);
}

function pickAttendanceValue(
    assistValue: boolean | null | undefined,
    originsValue: boolean | null,
): boolean | null {
    if (assistValue !== null && assistValue !== undefined) {
        return assistValue;
    }

    return originsValue;
}

export async function getInPersonAssistPrefill({
    eventSlug,
    personId,
}: Params): Promise<InPersonAssistPrefill> {
    const { data: claim, error: claimError } = await supabase
        .from("family_person_identity_claims")
        .select("participant_id")
        .eq("event_slug", eventSlug)
        .eq("person_id", personId)
        .eq("claim_status", "approved")
        .maybeSingle<IdentityClaimRow>();

    if (claimError) {
        throw new Error(
            `Impossible de charger le rattachement participant : ${claimError.message}`,
        );
    }

    const { data: latestAssist, error: assistError } = await supabase
        .from("family_tree_in_person_assists")
        .select(
            "declared_present, attended_2023, attended_2024, testimony_interest, testimony_topics, created_at",
        )
        .eq("event_slug", eventSlug)
        .eq("target_person_id", personId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<InPersonAssistRow>();

    if (assistError) {
        throw new Error(
            `Impossible de charger les données d'assistance : ${assistError.message}`,
        );
    }

    const participantId = claim?.participant_id ?? null;

    if (!participantId) {
        return {
            participantExists: false,
            participantId: null,
            email: "",
            birthYear: "",
            allowNameInFamilyTree: null,
            allowPhotoInFamilyTree: null,
            allowInfoInFamilyTree: null,
            attended2023: latestAssist?.attended_2023 ?? null,
            attended2024: latestAssist?.attended_2024 ?? null,
            isPresentToday: latestAssist?.declared_present === true,
            testimonyInterest: latestAssist?.testimony_interest ?? "",
            testimonyTopics: latestAssist?.testimony_topics?.trim() ?? "",
        };
    }

    const [
        { data: participant, error: participantError },
        { data: consents, error: consentsError },
        { data: origins, error: originsError },
    ] = await Promise.all([
        supabase
            .from("participants")
            .select("email, birth_year")
            .eq("id", participantId)
            .eq("event_slug", eventSlug)
            .maybeSingle<ParticipantRow>(),

        supabase
            .from("participant_consents")
            .select(
                "allow_name_in_family_tree, allow_photo_in_family_tree, allow_info_in_family_tree",
            )
            .eq("participant_id", participantId)
            .eq("event_slug", eventSlug)
            .maybeSingle<ParticipantConsentsRow>(),

        supabase
            .from("participant_origins")
            .select("attended_edition_keys")
            .eq("participant_id", participantId)
            .maybeSingle<ParticipantOriginsRow>(),
    ]);

    if (participantError) {
        throw new Error(
            `Impossible de charger le participant : ${participantError.message}`,
        );
    }

    if (consentsError) {
        throw new Error(
            `Impossible de charger les consentements : ${consentsError.message}`,
        );
    }

    if (originsError) {
        throw new Error(
            `Impossible de charger les participations précédentes : ${originsError.message}`,
        );
    }

    const originsAttended2023 = hasEdition(origins?.attended_edition_keys, "2023");
    const originsAttended2024 = hasEdition(origins?.attended_edition_keys, "2024");

    console.log("DEBUG attendance", {
        participantId,
        latestAssist,
        origins,
    });

    return {
        participantExists: true,
        participantId,
        email: participant?.email?.trim() ?? "",
        birthYear:
            participant?.birth_year !== null && participant?.birth_year !== undefined
                ? String(participant.birth_year)
                : "",
        allowNameInFamilyTree: consents?.allow_name_in_family_tree ?? null,
        allowPhotoInFamilyTree: consents?.allow_photo_in_family_tree ?? null,
        allowInfoInFamilyTree: consents?.allow_info_in_family_tree ?? null,
        attended2023: pickAttendanceValue(
            latestAssist?.attended_2023,
            originsAttended2023,
        ),
        attended2024: pickAttendanceValue(
            latestAssist?.attended_2024,
            originsAttended2024,
        ),
        isPresentToday: latestAssist?.declared_present === true,
        testimonyInterest: latestAssist?.testimony_interest ?? "",
        testimonyTopics: latestAssist?.testimony_topics?.trim() ?? "",
    };
}