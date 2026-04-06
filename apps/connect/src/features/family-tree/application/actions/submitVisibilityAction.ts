import { saveMyPersonVisibilityRequest } from "../../data/visibility/saveMyPersonVisibilityRequest";

export type SubmitVisibilityActionInput = {
  eventSlug: string;
  participantId: string;
  personId: string;

  hasLegitimateFamilyLink: boolean;
  personCannotRequestByThemself: boolean;
  hasConsent: boolean;
  justification: string;

  participantFirstName?: string;
  participantLastName?: string;
  participantDisplayName?: string;
  personFirstName?: string;
  personLastName?: string;
  personDisplayName?: string;
};

export async function submitVisibilityAction(
  input: SubmitVisibilityActionInput,
): Promise<void> {
  await saveMyPersonVisibilityRequest(input);
}