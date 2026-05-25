export function FormRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <label className="grid grid-cols-[90px_1fr] items-center gap-2">
      <span className="text-[11px] font-black uppercase text-slate-500">
        {label}
      </span>

      <input
        className="rounded-lg border border-slate-200 bg-white px-2 py-1"
        defaultValue={value}
      />
    </label>
  )
}