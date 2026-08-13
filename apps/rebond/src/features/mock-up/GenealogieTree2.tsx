import { Circle, Mars, Venus } from 'lucide-react';
import type { FC, JSX } from 'react';

export type IndividuMinimal = {
  id: string;
  prenom: string;
  nom: string;
  sexe: string;
  pereId?: string | null;
  mereId?: string | null;
  naissance?: string;
  deces?: string;
};

type TreeNode = {
  id?: string;
  data?: IndividuMinimal;
  pere?: TreeNode | null;
  mere?: TreeNode | null;
};

type GenealogyTreeProps = {
  individu: IndividuMinimal;
  individus: Record<string, IndividuMinimal>;
  generations?: number;
};

const Card: FC<{ data?: IndividuMinimal }> = ({ data }) => {
  const sexe = data?.sexe;
  const icon =
    sexe === 'M' ? (
      <Mars className='w-3 h-3 text-blue-500' />
    ) : sexe === 'F' ? (
      <Venus className='w-3 h-3 text-pink-500' />
    ) : (
      <Circle className='w-3 h-3 text-gray-400' />
    );

  return (
    <div className='w-36 h-28 border border-gray-300 rounded bg-white flex flex-col items-center justify-center text-center text-xs px-2 py-1 leading-tight'>
      {data ? (
        <>
          <div className='flex items-center gap-1 mb-0.5'>
            <span className='font-semibold text-sm truncate'>{data.prenom}</span>
            {icon}
          </div>
          <div className='text-gray-500 truncate'>{data.nom}</div>
          <div className='mt-1 text-[11px] text-gray-500 leading-tight'>
            {data.naissance && <div>* {data.naissance}</div>}
            {data.deces && <div>✝ {data.deces}</div>}
            {!data.naissance && !data.deces && (
              <div className='italic text-gray-400'>Dates inconnues</div>
            )}
          </div>
        </>
      ) : (
        <div className='text-gray-400 italic text-xs'>Inconnu</div>
      )}
    </div>
  );
};

function buildSkeleton(
  individuId: string | null,
  individus: Record<string, IndividuMinimal>,
  depth: number
): TreeNode | null {
  if (depth <= 0) return null;

  const data = individuId ? individus[individuId] : undefined;

  return {
    id: data?.id,
    data,
    pere: buildSkeleton(data?.pereId ?? null, individus, depth - 1),
    mere: buildSkeleton(data?.mereId ?? null, individus, depth - 1),
  };
}



const renderTree = (node: TreeNode | null): JSX.Element => {
  if (!node) return <Card />;

  const hasParents = node.pere || node.mere;

  return (
    <div className='flex flex-col items-center'>
      {hasParents && (
        <div className='flex justify-center items-start gap-8 mb-4'>
          <div className='flex flex-col items-center'>{renderTree(node.pere ?? null)}</div>
          <div className='flex flex-col items-center'>{renderTree(node.mere ?? null)}</div>
        </div>
      )}
      <Card data={node.data} />
    </div>
  );
};

const GenealogyTree: FC<GenealogyTreeProps> = ({ individu, individus, generations = 3 }) => {
  const root = buildSkeleton(individu?.id, individus, generations);

  return (
    <div className='relative w-full overflow-x-auto p-8'>
      <div className='flex flex-col items-center gap-16 min-w-[800px]'>{renderTree(root)}</div>
    </div>
  );
};

export default GenealogyTree;
