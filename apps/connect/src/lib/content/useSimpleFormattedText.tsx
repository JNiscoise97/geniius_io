import { Fragment, type ReactNode } from "react";

function renderInlineBold(text: string): ReactNode[] {
  const parts = text.split(/(\*\*.*?\*\*)/g);

  return parts.map((part, index) => {
    const boldMatch = part.match(/^\*\*(.*?)\*\*$/);

    if (boldMatch) {
      return (
        <strong key={index} className="font-black text-slate-900">
          {boldMatch[1]}
        </strong>
      );
    }

    return <Fragment key={index}>{part}</Fragment>;
  });
}

export function SimpleFormattedText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const lines = text.split("\n");

  return (
    <div className={className}>
      {lines.map((line, lineIndex) => (
        <Fragment key={lineIndex}>
          {renderInlineBold(line)}
          {lineIndex < lines.length - 1 ? <br /> : null}
        </Fragment>
      ))}
    </div>
  );
}