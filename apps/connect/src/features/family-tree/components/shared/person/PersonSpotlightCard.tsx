import type { ReactNode } from "react";
import type { PersonSummary } from "../../../types/person";
import { PersonIdentityBlock } from "./PersonIdentityBlock";

export type PersonSpotlightCardProps = {
  person: PersonSummary;
  heroClassName: string;
  topBadges?: ReactNode;
  meta?: ReactNode;
  details?: ReactNode;
  footer?: ReactNode;
};

export function PersonSpotlightCard({
  person,
  heroClassName,
  topBadges,
  meta,
  details,
  footer,
}: PersonSpotlightCardProps) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <div
        className={[
          "rounded-[22px] p-4 text-white shadow-[0_18px_40px_rgba(15,23,42,0.14)]",
          heroClassName,
        ].join(" ")}
      >
        <div className="mb-3 flex flex-wrap items-center gap-2">{topBadges}</div>

        <PersonIdentityBlock
          person={person}
          showSubtitleBadge={false}
          showRelationshipSummary={false}
          imageClassName="h-14 w-14 rounded-2xl"
          nameClassName="text-[20px] font-black leading-tight"
          yearsClassName="mt-2 text-xs font-extrabold text-white/90"
          nicknameClassName="mt-1 text-xs font-extrabold text-white/90"
        />

        {meta ? <div className="mt-3">{meta}</div> : null}
      </div>

      {details ? <div className="mt-4">{details}</div> : null}
      {footer ? <div className="mt-4">{footer}</div> : null}
    </section>
  );
}