export const PARTICIPANT_SESSION_CHANGED_EVENT = "participant-session-changed";

export function notifyParticipantSessionChanged(){
    window.dispatchEvent(new  CustomEvent(PARTICIPANT_SESSION_CHANGED_EVENT))
}