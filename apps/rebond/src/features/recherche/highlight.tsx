// highlight.tsx

export function highlight(text: string, term: string) {
  if (!text) return null;
  if (!term) return text;

  const parts = text.split(new RegExp(`(${term})`, 'gi'));
  const lower = term.toLowerCase();

  return (
    <>
      {parts.map((part, i) => (
        <span
          key={i}
          className={part.toLowerCase() === lower ? 'text-blue-600 underline font-semibold' : ''}
        >
          {part}
        </span>
      ))}
    </>
  );
}
