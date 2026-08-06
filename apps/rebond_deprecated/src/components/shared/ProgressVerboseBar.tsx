export function ProgressVerboseBar({
    value,
    max,
    label,
  }: {
    value: number;
    max: number;
    label?: string;
  }) {
    const percent = max > 0 ? Math.round((value / max) * 100) : 0;
    const color = percent >= 90 ? 'bg-green-600' : percent >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  
    return (
      <div className='space-y-1 w-full'>
        <div className='text-xs text-gray-700'>{label ?? `${value} sur ${max} — ${percent}%`}</div>
        <div className='w-full h-2 bg-gray-200 rounded overflow-hidden'>
          <div className={`h-full ${color} transition-all`} style={{ width: `${percent}%` }} />
        </div>
      </div>
    );
  }