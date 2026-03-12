import type { DeviceStoredProfile } from "../api/getStoredProfiles";
import { DeviceProfileCard } from "./DeviceProfileCard";
import { EmptyDeviceProfilesState } from "./EmptyDeviceProfilesState";

type Props = {
  profiles: DeviceStoredProfile[];
  activeParticipantId?: string | null;
  onOpenProfile?: (participantId: string) => void;
  onRemoveProfile?: (participantId: string) => void;
};

export function DeviceProfilesList({
  profiles,
  activeParticipantId,
  onOpenProfile,
  onRemoveProfile,
}: Props) {
  if (!profiles.length) {
    return <EmptyDeviceProfilesState />;
  }

  return (
    <div className="space-y-3">
      {profiles.map((profile) => (
        <DeviceProfileCard
          key={profile.participantId}
          profile={profile}
          isActive={profile.participantId === activeParticipantId}
          onOpen={() => onOpenProfile?.(profile.participantId)}
          onRemove={() => onRemoveProfile?.(profile.participantId)}
        />
      ))}
    </div>
  );
}