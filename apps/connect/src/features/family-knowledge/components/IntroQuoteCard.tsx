import { Quote } from "lucide-react";

type IntroQuoteCardProps = {
  quote: string;
  text?: string;
};

export function IntroQuoteCard({ quote, text }: IntroQuoteCardProps) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
      <div className="h-11 w-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-700">
        <Quote size={18} />
      </div>

      <blockquote className="mt-4 text-[22px] leading-[1.25] font-black tracking-tight text-slate-900">
        “{quote}”
      </blockquote>

      {text ? (
        <p className="mt-4 text-sm font-bold leading-6 text-slate-700">
          {text}
        </p>
      ) : null}
    </div>
  );
}