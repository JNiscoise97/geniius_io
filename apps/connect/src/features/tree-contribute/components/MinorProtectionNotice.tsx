// components/tree-contribute/MinorProtectionNotice.tsx

import { Shield, UserRound } from "lucide-react";

type MinorProtectionNoticeProps = {
  title?: string;
  text?: string;
};

export function MinorProtectionNotice({
  title = "Personne mineure",
  text = "Les informations concernant les mineurs peuvent être conservées pour la cohérence de l’arbre familial, avec une visibilité limitée. L’invitation par email n’est pas proposée dans ce cas.",
}: MinorProtectionNoticeProps) {
  return (
    <div className="rounded-[22px] border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-2xl bg-white/70 p-3 text-amber-700">
          <Shield size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-black text-amber-900">{title}</div>

            <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-amber-800">
              <UserRound size={12} />
              Protection renforcée
            </span>
          </div>

          <div className="mt-2 text-xs font-bold leading-5 text-amber-800">
            {text}
          </div>
        </div>
      </div>
    </div>
  );
}