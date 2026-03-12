import { UserRoundCog } from "lucide-react";
import type { ManagedProfile } from "../api/getManagedProfiles";
import { delegationsConfig } from "../config/delegationsConfig";
import { ManagedProfileCard } from "./ManagedProfileCard";

type ManagedProfilesListProps = {
  profiles: ManagedProfile[];
  onOpenProfile?: (participantId: string) => void;
};

export function ManagedProfilesList({
  profiles,
  onOpenProfile,
}: ManagedProfilesListProps) {
  if (!profiles.length) {
    return (
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm text-center">
        <div className="flex justify-center">
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
            <UserRoundCog size={20} />
          </div>
        </div>

        <div className="mt-3 text-[16px] font-black text-slate-900">
          {delegationsConfig.emptyTitle}
        </div>

        <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
          {delegationsConfig.emptyText}
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-3">
      {profiles.map((profile) => (
        <ManagedProfileCard
          key={profile.participantId}
          profile={profile}
          onOpen={() => onOpenProfile?.(profile.participantId)}
        />
      ))}
    </div>
  );
}