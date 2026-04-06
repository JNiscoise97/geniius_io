export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-600 shadow-sm">
      {message}
    </div>
  );
}