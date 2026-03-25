// components/tree-contribute/InvitationSummaryCard.tsx

import { Mail, Shield, UserCheck, Users } from "lucide-react";

export type InvitationSummaryCounts = {
  inviteAdultCount?: number;
  managedByRelativeCount?: number;
  noInvitationCount?: number;
  minorProtectedCount?: number;
};

type InvitationSummaryCardProps = {
  counts: InvitationSummaryCounts;
  title?: string;
  subtitle?: string;
};

export function InvitationSummaryCard({
  counts,
  title = "Invitations et gestion des fiches",
  subtitle = "Voici comment les fiches seront gérées après l’envoi de tes propositions.",
}: InvitationSummaryCardProps) {
  const items = [
    {
      key: "invite-adult",
      label: "Invitations à envoyer",
      count: counts.inviteAdultCount ?? 0,
      icon: Mail,
      className: "bg-indigo-50 text-indigo-700",
    },
    {
      key: "managed-by-relative",
      label: "Fiches gérées par un proche",
      count: counts.managedByRelativeCount ?? 0,
      icon: UserCheck,
      className: "bg-emerald-50 text-emerald-700",
    },
    {
      key: "no-invitation",
      label: "Sans invitation immédiate",
      count: counts.noInvitationCount ?? 0,
      icon: Users,
      className: "bg-slate-100 text-slate-700",
    },
    {
      key: "minor-protected",
      label: "Mineurs à visibilité limitée",
      count: counts.minorProtectedCount ?? 0,
      icon: Shield,
      className: "bg-amber-50 text-amber-700",
    },
  ].filter((item) => item.count > 0);

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <div className="text-[16px] font-black text-slate-900">{title}</div>
        <div className="mt-1 text-sm font-bold leading-6 text-slate-700">
          {subtitle}
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-600">
            Aucune invitation ou règle particulière de gestion n’a été définie.
          </div>
        ) : (
          items.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.key}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={[
                      "rounded-xl p-2",
                      item.className,
                    ].join(" ")}
                  >
                    <Icon size={16} />
                  </div>

                  <div className="min-w-0 text-sm font-black text-slate-900">
                    {item.label}
                  </div>
                </div>

                <div className="rounded-full bg-white px-3 py-1 text-[12px] font-black text-slate-900">
                  {item.count}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}