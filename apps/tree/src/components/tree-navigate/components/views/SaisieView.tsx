import { UserRound } from 'lucide-react'
import { DataTable } from '../ui/DataTable'
import { FormRow } from '../ui/FormRow'

export function SaisieView() {
  return (
    <div className="min-h-[720px] bg-slate-50">
      <div className="bg-white px-3 py-2 shadow-sm">
        <button className="mr-2 rounded-full bg-indigo-700 px-4 py-1 font-black text-white">
          Saisie individu
        </button>
      </div>

      <div className="grid gap-3 p-3 xl:grid-cols-[280px_1fr]">
        <div className="flex min-h-[220px] items-center justify-center rounded-2xl bg-indigo-50">
          <div className="flex h-36 w-44 rotate-[-6deg] items-center justify-center rounded-xl bg-white shadow-lg">
            <UserRound size={80} className="text-indigo-300" />
          </div>
        </div>

        <div className="grid gap-2">
          <FormRow label="Nom" value="(MAMMOSA)" />
          <FormRow label="Prénoms" value='Pierre “Gédéon”' />
          <FormRow label="Profession" value="cultivateur" />
        </div>
      </div>

      <DataTable
        title="Parents"
        rows={[
          ['M', '(MAMMOSA)', 'Julie'],
        ]}
      />
    </div>
  )
}