// components/tree-contribute/ContributePersonHero.tsx

import {
  Mail,
  Shield,
  Sparkles,
  User,
  UserRoundCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type ContributePersonHeroProps = {
  roleLabel: string;
  displayName: string;
  subtitle?: string;
  isLiving?: boolean | null;
  isMinor?: boolean | null;
  invitationPossible?: boolean;
  icon?: LucideIcon;
};

export function ContributePersonHero({
  roleLabel,
  displayName,
  subtitle,
  isLiving = null,
  isMinor = null,
  invitationPossible = false,
  icon: Icon = User,
}: ContributePersonHeroProps) {
  return (
    <section className="overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_45%,#312e81_100%)] text-white shadow-[0_24px_60px_rgba(15,23,42,0.20)]">
      <div className="p-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white/90">
          <Icon size={14} />
          {roleLabel}
        </div>

        <div className="mt-4 text-[30px] leading-[1.02] font-black tracking-tight">
          {displayName}
        </div>

        {subtitle ? (
          <p className="mt-3 max-w-[42rem] text-sm font-bold leading-6 text-white/85">
            {subtitle}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {isLiving === true ? (
            <HeroBadge icon={UserRoundCheck} label="Personne vivante" />
          ) : null}

          {isMinor === true ? (
            <HeroBadge icon={Shield} label="Mineur" />
          ) : null}

          {invitationPossible ? (
            <HeroBadge icon={Mail} label="Invitation possible" />
          ) : null}

          {!invitationPossible && isMinor !== true && isLiving === true ? (
            <HeroBadge icon={Sparkles} label="Décision à préciser" />
          ) : null}
        </div>
      </div>
    </section>
  );
}

function HeroBadge({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] font-extrabold text-white/90">
      <Icon size={13} />
      {label}
    </span>
  );
}