import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type Props = {
  mcType: string | null | undefined;
  setMcType: (v: string) => void;
  mcTarget: string | null | undefined;
  setMcTarget: (v: string) => void;
  mcStruck: string | null | undefined;
  setMcStruck: (v: string) => void;
  mcReplacement: string | null | undefined;
  setMcReplacement: (v: string) => void;
  mcNote: string | null | undefined;
  setMcNote: (v: string) => void;
  loading: boolean;
  disabled: boolean;
  onCancel: () => void;
  onSave: () => void;
};

export function MarginalCrossoutFormSection({
  mcType, setMcType,
  mcTarget, setMcTarget,
  mcStruck, setMcStruck,
  mcReplacement, setMcReplacement,
  mcNote, setMcNote,
  loading,
  disabled,
  onCancel,
  onSave,
}: Props) {
  const canSave =
    !loading &&
    !disabled &&
    ((mcType ?? '').trim() ||
      (mcTarget ?? '').trim() ||
      (mcStruck ?? '').trim() ||
      (mcReplacement ?? '').trim());

  return (
    <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3'>
      <div className='grid grid-cols-2 gap-3'>
        <div>
          <div className='text-xs font-medium text-slate-700'>Type de rature</div>
          <Input
            className='mt-1'
            placeholder='rature_simple / surcharge / grattage…'
            value={mcType ?? ''}
            onChange={(e) => setMcType(e.target.value)}
            disabled={loading || disabled}
          />
        </div>

        <div>
          <div className='text-xs font-medium text-slate-700'>Cible</div>
          <Input
            className='mt-1'
            placeholder='mot / ligne / bloc / mention / ...'
            value={mcTarget ?? ''}
            onChange={(e) => setMcTarget(e.target.value)}
            disabled={loading || disabled}
          />
        </div>

        <div className='col-span-2'>
          <div className='text-xs font-medium text-slate-700'>Texte barré (si lisible)</div>
          <Textarea
            className='mt-1 min-h-[110px]'
            placeholder='Texte barré…'
            value={mcStruck ?? ''}
            onChange={(e) => setMcStruck(e.target.value)}
            disabled={loading || disabled}
          />
        </div>

        <div className='col-span-2'>
          <div className='text-xs font-medium text-slate-700'>Remplacement (si visible)</div>
          <Textarea
            className='mt-1 min-h-[110px]'
            placeholder='Texte corrigé…'
            value={mcReplacement ?? ''}
            onChange={(e) => setMcReplacement(e.target.value)}
            disabled={loading || disabled}
          />
        </div>

        <div className='col-span-2'>
          <div className='text-xs font-medium text-slate-700'>Note</div>
          <Textarea
            className='mt-1 min-h-[90px]'
            placeholder='Ambiguïtés, lecture…'
            value={mcNote ?? ''}
            onChange={(e) => setMcNote(e.target.value)}
            disabled={loading || disabled}
          />
        </div>
      </div>

      <div className='flex items-center justify-end gap-2 pt-2'>
        <Button variant='outline' onClick={onCancel} disabled={loading}>
          Annuler
        </Button>
        <Button onClick={onSave} disabled={!canSave}>
          Enregistrer
        </Button>
      </div>
    </div>
  );
}
