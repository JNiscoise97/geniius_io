import { AncestorNode } from "../ui/AncestorNode";


export function AscendanceView() {
  return (
    <div className="min-h-[720px] overflow-auto bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-4 text-slate-950">
      <div className="relative mx-auto min-h-[650px] max-w-5xl">
        <AncestorNode
          className="left-[40px] top-[330px]"
          title="(MAMMOSA) Pierre Gédéon"
          subtitle="1833–1862"
          tone="selected"
        />

        <AncestorNode
          className="left-[180px] top-[180px]"
          title="Ajouter le père"
          empty
          tone="hypothesis"
        />

        <AncestorNode
          className="left-[230px] top-[430px]"
          title="(MAMMOSA) Julie"
          subtitle="1807–1855"
          tone="source"
        />
      </div>
    </div>
  )
}