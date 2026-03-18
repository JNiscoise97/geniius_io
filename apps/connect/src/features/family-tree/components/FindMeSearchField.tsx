// src/features/family-knowledge/components/FindMeSearchField.tsx

import { Search } from "lucide-react";
import { useMemo } from "react";
import type { PersonSummary } from "../types";
import { searchFindMeSuggestions } from "../api/findMeCandidates";

export function FindMeSearchField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const suggestions = useMemo<PersonSummary[]>(
    () => (value.trim().length >= 2 ? searchFindMeSuggestions(value) : []),
    [value],
  );

  return (
    <div className="space-y-2">
      <label className="block text-sm font-black text-slate-900">{label}</label>

      <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <Search size={16} className="shrink-0 text-slate-400" />
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {suggestions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((person) => (
            <button
              key={person.id}
              type="button"
              onClick={() =>
                onChange(`${person.firstName} ${person.lastName}`.trim())
              }
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-700 shadow-sm transition active:scale-[0.99]"
            >
              {person.firstName} {person.lastName}
              {person.birthYear ? ` · ${person.birthYear}` : ""}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}