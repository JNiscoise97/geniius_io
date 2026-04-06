import { AlertTriangle } from "lucide-react";

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-5 w-5 text-rose-700" />
        <div className="text-sm font-bold text-rose-900">{message}</div>
      </div>
    </div>
  );
}