import { User, MapPin } from "lucide-react";
import type { PersonSummary } from "../../types";
import { SmartImage } from "../../../../lib/media/useSmartImage";

type PersonHeroCardProps = {
  person: PersonSummary;
  subtitle?: string;
  badge?: string;
};

export function PersonHeroCard({
  person,
  subtitle,
  badge,
}: PersonHeroCardProps) {
  const name = `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim();

  return (
    <div className="rounded-[26px] bg-gradient-to-br from-slate-900 to-slate-700 p-4 text-white shadow-lg">
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-extrabold uppercase text-white/70">
          Fiche personne
        </span>

        {badge ? (
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-black">
            {badge}
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex items-start gap-4">
        <div className="h-20 w-20 overflow-hidden rounded-[20px] bg-slate-100">
          {person.photoSrc ? (
            <SmartImage src={person.photoSrc} alt={name} />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-500">
              <User size={24} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-xl font-black">{name || "Personne"}</div>

          {person.nickname ? (
            <div className="mt-1 text-sm font-bold text-white/80">
              appelé {person.nickname}
            </div>
          ) : null}

          {subtitle ? (
            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold">
              <MapPin size={12} />
              {subtitle}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}