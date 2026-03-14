import { Loader2, ShieldCheck } from "lucide-react";

type AccessGateScreenProps = {
  title?: string;
  subtitle?: string;
};

export function AccessGateScreen({
  title = "Ouverture du profil",
  subtitle = "Nous retrouvons ton accès sur cet appareil…",
}: AccessGateScreenProps) {
  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container min-h-screen flex items-center justify-center py-10">
        <section className="w-full max-w-md rounded-[28px] bg-white border border-slate-200 shadow-sm p-6 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-extrabold text-indigo-700">
            <ShieldCheck size={14} />
            Accès au profil
          </div>

          <div className="mt-5 flex justify-center">
            <div className="rounded-full bg-slate-100 p-4 text-slate-900">
              <Loader2 size={22} className="animate-spin" />
            </div>
          </div>

          <h1 className="mt-5 text-[24px] leading-tight font-black tracking-tight text-slate-900">
            {title}
          </h1>

          <p className="mt-3 text-sm font-bold leading-6 text-slate-700">
            {subtitle}
          </p>
        </section>
      </main>
    </div>
  );
}