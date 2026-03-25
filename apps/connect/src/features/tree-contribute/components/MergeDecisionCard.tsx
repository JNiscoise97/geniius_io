// components/tree-contribute/MergeDecisionCard.tsx

import { AlertTriangle, MessageSquare } from "lucide-react";
import {
  MergeDecisionField,
  type MergeDecisionValue,
} from "./MergeDecisionField";

type MergeDecisionCardProps = {
  value: MergeDecisionValue;
  onChange: (value: MergeDecisionValue) => void;
  comment: string;
  onChangeComment: (value: string) => void;
  matched: boolean;
};

export function MergeDecisionCard({
  value,
  onChange,
  comment,
  onChangeComment,
  matched,
}: MergeDecisionCardProps) {
  const needsComment =
    value === "correct_existing" ||
    value === "create_person" ||
    value === "skip_for_now";

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-[16px] font-black text-slate-900">
        Que veux-tu faire pour cette personne ?
      </div>

      <div className="mt-1 text-sm font-bold leading-6 text-slate-700">
        Choisis comment tes informations doivent être utilisées pour cette fiche.
      </div>

      <div className="mt-4">
        <MergeDecisionField
          value={value}
          onChange={onChange}
          canConfirmExisting={matched}
          canCompleteExisting={matched}
          canCorrectExisting={matched}
          canCreatePerson={!matched}
          canSkip
        />
      </div>

      {value ? (
        <div className="mt-4 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start gap-2">
            <div className="mt-0.5 text-slate-700">
              <MessageSquare size={18} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-sm font-black text-slate-900">
                Ajouter une précision
              </div>

              <div className="mt-1 text-xs font-bold leading-5 text-slate-600">
                {needsComment
                  ? "Merci d’expliquer brièvement ton choix pour faciliter la relecture."
                  : "Tu peux ajouter un commentaire si tu veux préciser une date, un doute ou un contexte utile."}
              </div>

              <textarea
                className="mt-3 min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                value={comment}
                onChange={(e) => onChangeComment(e.target.value)}
                placeholder={
                  value === "correct_existing"
                    ? "Ex. Le nom est mal orthographié dans l’arbre."
                    : value === "create_person"
                      ? "Ex. Cette personne manque dans l’arbre. Je souhaite qu’elle soit créée à partir des informations fournies."
                      : value === "complete_existing"
                        ? "Ex. Il manque son année de naissance et une photo."
                        : value === "confirm_existing"
                          ? "Ex. Les informations affichées me semblent correctes."
                          : "Ex. Je préfère vérifier avec ma famille avant de décider."
                }
              />
            </div>
          </div>
        </div>
      ) : null}

      {value === "skip_for_now" ? (
        <div className="mt-4 rounded-[22px] border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-2">
            <div className="mt-0.5 text-amber-700">
              <AlertTriangle size={18} />
            </div>

            <div>
              <div className="text-sm font-black text-amber-900">
                Cette personne restera en attente
              </div>
              <div className="mt-1 text-xs font-bold leading-5 text-amber-800">
                Tu pourras revenir plus tard pour confirmer, compléter ou créer
                cette fiche.
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}