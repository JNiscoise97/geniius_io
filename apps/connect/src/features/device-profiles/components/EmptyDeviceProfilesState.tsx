import { UserPlus } from "lucide-react";

export function EmptyDeviceProfilesState() {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm text-center">
      <div className="flex justify-center">
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
          <UserPlus size={20} />
        </div>
      </div>

      <div className="mt-3 text-[16px] font-black text-slate-900">
        Aucun profil enregistré
      </div>

      <p className="mt-2 text-sm font-bold text-slate-600 leading-6">
        Lorsque tu ouvriras un profil sur cet appareil,
        il apparaîtra ici pour y accéder facilement.
      </p>
    </div>
  );
}