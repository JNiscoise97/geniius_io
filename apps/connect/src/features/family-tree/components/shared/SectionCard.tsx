type SectionCardProps = {
  title?: string;
  children: React.ReactNode;
};

export function SectionCard({ title, children }: SectionCardProps) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      {title ? (
        <div className="mb-2 text-sm font-black text-slate-900">
          {title}
        </div>
      ) : null}

      {children}
    </section>
  );
}