// components/tree-contribute/VisibilityInvitationCard.tsx

import { Mail, Send, Shield, UserCheck, Users } from "lucide-react";
import { InvitationEmailField } from "./InvitationEmailField";
import { MinorProtectionNotice } from "./MinorProtectionNotice";
import {
  PersonDisplayChoiceField,
  type PersonDisplayChoiceValue,
} from "./PersonDisplayChoiceField";

export type VisibilityInvitationMode =
  | ""
  | "none"
  | "invite_adult"
  | "managed_by_relative";

type VisibilityInvitationCardProps = {
  shouldAppearInTree: boolean | null;
  onChangeShouldAppearInTree: (value: boolean) => void;

  invitationMode: VisibilityInvitationMode;
  onChangeInvitationMode: (value: VisibilityInvitationMode) => void;

  displayChoice: PersonDisplayChoiceValue;
  onChangeDisplayChoice: (value: PersonDisplayChoiceValue) => void;

  inviteEmail: string;
  onChangeInviteEmail: (value: string) => void;

  isLiving?: boolean | null;
  isMinor?: boolean | null;
};

export function VisibilityInvitationCard({
  shouldAppearInTree,
  onChangeShouldAppearInTree,
  invitationMode,
  onChangeInvitationMode,
  displayChoice,
  onChangeDisplayChoice,
  inviteEmail,
  onChangeInviteEmail,
  isLiving = null,
  isMinor = null,
}: VisibilityInvitationCardProps) {
  const canInviteAdult = isLiving === true && isMinor !== true;
  const showMinorNotice = isMinor === true;
  const showInvitationEmail = invitationMode === "invite_adult" && canInviteAdult;

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-2xl bg-indigo-50 p-3 text-indigo-700">
          <Users size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[16px] font-black text-slate-900">
            Présence dans l’arbre et invitation
          </div>
          <div className="mt-1 text-sm font-bold leading-6 text-slate-700">
            Précise si cette personne doit être ajoutée à l’arbre familial, si
            elle doit être visible dans l’arbre partagé et si une invitation
            doit être envoyée.
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        <div className="grid gap-2">
          <div className="text-sm font-black text-slate-900">
            Cette personne doit-elle être ajoutée à l’arbre familial ?
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onChangeShouldAppearInTree(true)}
              className={[
                "h-12 rounded-2xl border font-extrabold transition",
                shouldAppearInTree === true
                  ? "border-indigo-200 bg-indigo-50 text-slate-900"
                  : "border-slate-200 bg-white text-slate-700",
              ].join(" ")}
            >
              Oui
            </button>

            <button
              type="button"
              onClick={() => onChangeShouldAppearInTree(false)}
              className={[
                "h-12 rounded-2xl border font-extrabold transition",
                shouldAppearInTree === false
                  ? "border-slate-300 bg-slate-100 text-slate-900"
                  : "border-slate-200 bg-white text-slate-700",
              ].join(" ")}
            >
              Non
            </button>
          </div>
        </div>

        {shouldAppearInTree === true ? (
          <>
            <PersonDisplayChoiceField
              value={displayChoice}
              onChange={onChangeDisplayChoice}
            />

            {showMinorNotice ? <MinorProtectionNotice /> : null}

            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-2xl bg-white p-3 text-slate-700">
                  {canInviteAdult ? <Mail size={18} /> : <Shield size={18} />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-sm font-black text-slate-900">
                    Qui gère cette fiche ?
                  </div>
                  <div className="mt-1 text-xs font-bold leading-5 text-slate-600">
                    {canInviteAdult
                      ? "Tu peux inviter cette personne à gérer elle-même sa fiche, ou transmettre les informations toi-même."
                      : "Cette fiche sera gérée par un proche responsable, sans invitation directe."}
                  </div>

                  <div className="mt-4 grid gap-2">
                    {canInviteAdult ? (
                      <>
                        <InvitationModeButton
                          active={invitationMode === "invite_adult"}
                          title="Envoyer une invitation"
                          text="Cette personne recevra un email pour gérer sa fiche elle-même."
                          icon={<Send size={16} />}
                          onClick={() => onChangeInvitationMode("invite_adult")}
                        />

                        <InvitationModeButton
                          active={invitationMode === "managed_by_relative"}
                          title="Je gère cette fiche moi-même"
                          text="Je transmets les informations à sa place pour le moment."
                          icon={<UserCheck size={16} />}
                          onClick={() =>
                            onChangeInvitationMode("managed_by_relative")
                          }
                        />

                        <InvitationModeButton
                          active={invitationMode === "none"}
                          title="Pas d’invitation pour l’instant"
                          text="La fiche peut être créée sans invitation immédiate."
                          icon={<Shield size={16} />}
                          onClick={() => onChangeInvitationMode("none")}
                        />
                      </>
                    ) : (
                      <InvitationModeButton
                        active={invitationMode === "managed_by_relative"}
                        title="Fiche gérée par un proche"
                        text="Tu restes l’interlocuteur pour cette personne."
                        icon={<UserCheck size={16} />}
                        onClick={() =>
                          onChangeInvitationMode("managed_by_relative")
                        }
                      />
                    )}
                  </div>

                  {showInvitationEmail ? (
                    <div className="mt-4">
                      <InvitationEmailField
                        value={inviteEmail}
                        onChange={onChangeInviteEmail}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

function InvitationModeButton({
  active,
  title,
  text,
  icon,
  onClick,
}: {
  active: boolean;
  title: string;
  text: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full rounded-[20px] border p-3 text-left transition",
        active
          ? "border-indigo-200 bg-indigo-50"
          : "border-slate-200 bg-white",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div
          className={[
            "mt-0.5 rounded-xl p-2",
            active ? "bg-white text-indigo-700" : "bg-slate-100 text-slate-700",
          ].join(" ")}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <div className="text-sm font-black text-slate-900">{title}</div>
          <div className="mt-1 text-xs font-bold leading-5 text-slate-600">
            {text}
          </div>
        </div>
      </div>
    </button>
  );
}