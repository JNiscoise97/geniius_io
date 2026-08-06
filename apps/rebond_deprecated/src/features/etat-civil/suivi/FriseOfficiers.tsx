// FriseOfficiers.tsx

type Fonction = 'maire' | 'adjoint' | 'greffier';

export type Officier = {
  nom: string;
  fonction: Fonction;
  debut: number; // année
  fin: number; // année
};

type Props = {
  officiers: Officier[];
  anneeDebut?: number;
  anneeFin?: number;
};

export default function FriseOfficiers({ officiers, anneeDebut, anneeFin }: Props) {
  if (!officiers.length) return null;

  const min = anneeDebut ?? Math.min(...officiers.map((r) => r.debut));
  const max = anneeFin ?? Math.max(...officiers.map((r) => r.fin));
  const total = max - min + 1;

  const getPas = (total: number) => {
    if (total > 100) return 10;
    if (total > 50) return 5;
    return 1;
  };

  const pas = getPas(total);

  // Génération dynamique des couleurs à partir des fonctions
  const fonctions = Array.from(new Set(officiers.map((r) => r.fonction)));
  const palette = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-lime-500',
  ];
  const couleurs: Record<string, string> = Object.fromEntries(
    fonctions.map((f, i) => [f, palette[i % palette.length]]),
  );

  return (
    <div className='space-y-4'>
      <div className='flex justify-between text-xs text-gray-500'>
        {Array.from({ length: Math.floor(total / pas) + 1 }, (_, i) => {
          const year = min + i * pas;
          return (
            <span key={year} className='w-[40px] text-center'>
              {year}
            </span>
          );
        })}
      </div>

      {officiers.map((r, i) => {
        const left = ((r.debut - min) / total) * 100;
        const width = ((r.fin - r.debut + 1) / total) * 100;

        return (
          <div key={i} className='relative h-6'>
            <div
              className={`absolute h-6 text-white text-xs px-2 flex items-center rounded ${couleurs[r.fonction]}`}
              style={{
                left: `${left}%`,
                width: `${width}%`,
              }}
              title={`${r.nom} (${r.fonction}) : ${r.debut}–${r.fin}`}
            >
              {r.nom}
            </div>
          </div>
        );
      })}
    </div>
  );
}
