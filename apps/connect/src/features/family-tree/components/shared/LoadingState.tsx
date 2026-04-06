import { Loader2 } from "lucide-react";

export function LoadingState({ label = "Chargement..." }: { label?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-700 shadow-sm">
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        {label}
      </div>
    </div>
  );
}