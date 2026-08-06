// ListeChipsViewSmart.tsx
import { Pencil, Trash } from 'lucide-react';

type ChipColor =
  | 'slate'
  | 'gray'
  | 'zinc'
  | 'neutral'
  | 'stone'
  | 'red'
  | 'orange'
  | 'amber'
  | 'yellow'
  | 'lime'
  | 'green'
  | 'emerald'
  | 'teal'
  | 'cyan'
  | 'sky'
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'purple'
  | 'fuchsia'
  | 'pink'
  | 'rose';

type ListeChipsViewProps = {
  titre?: string;
  values: string[];

  colors?: Array<string | null | undefined>;

  dense?: boolean;
  placeholderEmpty?: string;

  readonly?: boolean;
  actionsInvisible?: boolean;

  onEdit?: () => void;
  onDelete?: () => void;
};

// ⚠️ Tailwind: on évite bg-${color}-50 dynamiques (non détectées par JIT)
// => map explicite
const CHIP_CLASS_BY_COLOR: Record<ChipColor, string> = {
  slate: 'bg-slate-50 text-slate-800 border-slate-100',
  gray: 'bg-gray-50 text-gray-800 border-gray-100',
  zinc: 'bg-zinc-50 text-zinc-800 border-zinc-100',
  neutral: 'bg-neutral-50 text-neutral-800 border-neutral-100',
  stone: 'bg-stone-50 text-stone-800 border-stone-100',

  red: 'bg-red-50 text-red-800 border-red-100',
  orange: 'bg-orange-50 text-orange-800 border-orange-100',
  amber: 'bg-amber-50 text-amber-800 border-amber-100',
  yellow: 'bg-yellow-50 text-yellow-800 border-yellow-100',

  lime: 'bg-lime-50 text-lime-800 border-lime-100',
  green: 'bg-green-50 text-green-800 border-green-100',
  emerald: 'bg-emerald-50 text-emerald-800 border-emerald-100',
  teal: 'bg-teal-50 text-teal-800 border-teal-100',
  cyan: 'bg-cyan-50 text-cyan-800 border-cyan-100',
  sky: 'bg-sky-50 text-sky-800 border-sky-100',
  blue: 'bg-blue-50 text-blue-800 border-blue-100',
  indigo: 'bg-indigo-50 text-indigo-800 border-indigo-100',
  violet: 'bg-violet-50 text-violet-800 border-violet-100',
  purple: 'bg-purple-50 text-purple-800 border-purple-100',
  fuchsia: 'bg-fuchsia-50 text-fuchsia-800 border-fuchsia-100',
  pink: 'bg-pink-50 text-pink-800 border-pink-100',
  rose: 'bg-rose-50 text-rose-800 border-rose-100',
};

const CHIP_COLORS = new Set<ChipColor>(Object.keys(CHIP_CLASS_BY_COLOR) as ChipColor[]);

function normalizeChipColor(raw?: string | null): ChipColor {
  if (!raw) return 'indigo';
  const c = raw.trim().toLowerCase();
  return CHIP_COLORS.has(c as ChipColor) ? (c as ChipColor) : 'indigo';
}

function getChipClass(rawColor?: string | null) {
  const base = 'px-2.5 py-0.5 rounded-sm border text-sm w-fit';
  const color = normalizeChipColor(rawColor);
  return `${base} ${CHIP_CLASS_BY_COLOR[color]}`;
}

export function ListeChipsViewSmart({
  titre = 'Valeurs',
  values,
  colors,
  dense = false,
  readonly = false,
  actionsInvisible = true,
  placeholderEmpty = 'Non renseigné',
  onEdit,
  onDelete,
}: ListeChipsViewProps) {
  const isEmpty = !values || values.length === 0;

  const showActions = !readonly && (onEdit || onDelete);

  const actionsVisibilityClass = actionsInvisible
    ? 'opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity'
    : 'opacity-100';

  // Heuristique : passe en mode compact si 1 valeur courte ou si dense=true
  const isSingleShort = values && values.length === 1 && (values[0]?.length ?? 0) <= 14;
  const compact = dense || isSingleShort;

  const handleDelete = () => {
    if (!onDelete) return;
    const ok = window.confirm('Supprimer ces valeurs ? Le champ passera à NULL.');
    if (ok) onDelete();
  };

  if (compact) {
    const compactLayout = values.length <= 3;
    return (
      <div className='group flex items-center gap-2 text-sm' role='group' aria-label={titre}>
        {/* Valeur(s) ou placeholder */}
        {isEmpty ? (
          <span className='text-xs text-muted-foreground italic'>{placeholderEmpty}</span>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5 min-w-0 mt-2" role='list' aria-label='Liste de valeurs'>
            {values.map((v, i) => (
              <span
                key={`${v}-${i}`}
                role='listitem'
                title={v}
                className={`${getChipClass(colors?.[i])} px-2 py-0.5`}
              >
                {v}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div
            className={[
              'flex items-center gap-1 mt-2',
              !compactLayout && 'ml-auto',
              actionsVisibilityClass,
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {onEdit && (
              <button
                type='button'
                onClick={onEdit}
                title='Modifier'
                aria-label='Modifier la sélection'
                className='p-1 rounded hover:bg-gray-100 text-gray-600 hover:text-indigo-700'
              >
                <Pencil className='w-4 h-4' />
              </button>
            )}

            {!isEmpty && onDelete && (
              <button
                type='button'
                onClick={handleDelete}
                title='Supprimer'
                aria-label='Supprimer la sélection'
                className='p-1 rounded hover:bg-gray-100 text-gray-600 hover:text-red-700'
              >
                <Trash className='w-4 h-4' />
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={['group rounded-md border bg-white shadow-sm', dense ? 'p-2' : 'p-3'].join(' ')}
    >
      <div className='flex items-center mb-2'>
        <span className='font-semibold text-sm text-gray-900'>{titre}</span>
        {showActions && (
          <div className={`ml-auto flex items-center gap-1 ${actionsVisibilityClass}`}>
            {onEdit && (
              <button
                type='button'
                onClick={onEdit}
                title='Modifier'
                aria-label='Modifier la sélection'
                className='p-1 rounded hover:bg-gray-100 text-gray-600 hover:text-indigo-700'
              >
                <Pencil className='w-4 h-4' />
              </button>
            )}

            {onDelete && (
              <button
                type='button'
                onClick={handleDelete}
                title='Supprimer'
                aria-label='Supprimer la sélection'
                className='p-1 rounded hover:bg-gray-100 text-gray-600 hover:text-red-700'
              >
                <Trash className='w-4 h-4' />
              </button>
            )}
          </div>
        )}
      </div>

      {isEmpty ? (
        <div className='text-sm text-gray-500 italic border border-dashed rounded-sm px-3 py-2 bg-gray-50'>
          Aucune valeur
        </div>
      ) : (
        <div className='flex flex-wrap gap-1.5 w-full' role='list' aria-label='Liste de valeurs'>
          {values.map((v, i) => (
            <span key={`${v}-${i}`} role='listitem' title={v} className={getChipClass(colors?.[i])}>
              {v}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
