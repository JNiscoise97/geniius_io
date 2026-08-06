import { useState } from 'react';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { CheckCircle, ChevronDown, ChevronRight, XCircle } from 'lucide-react';
import type { LieuPreview } from '@/types/lieux';
import { detectLieuxPreview } from '@/lib/detectLieuxPreview';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Link } from 'react-router-dom';

type LieuNode = {
  label: string;
  count?: number;
  children?: LieuNode[];
};

type TempNode = {
  label: string;
  count?: number;
  children?: Record<string, TempNode>;
};

export function AnalyseLieuxPreview() {
  const [lieux, setLieux] = useState<LieuPreview[]>([]);
  const [treeData, setTreeData] = useState<LieuNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTree, setShowTree] = useState(false);
  const [showTreeFromDb, setShowTreeFromDb] = useState(false);

  const [lieuxExistants, setLieuxExistants] = useState<LieuMinimal[]>([]);

  const refreshTree = async () => {
    const result = await detectLieuxPreview();
    const tree = buildTree(result);
    setTreeData(tree);
    setShowTree(true);

    // recharger tous les lieux existants en base
    const { data } = await supabase.from('lieux').select('id, libelle, type, parent_id');
    setLieuxExistants(data ?? []);
  };

  const refreshTreeFromDB = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('lieux')
      .select('id, libelle, type, parent_id');

    if (error) {
      console.error('[REFRESH TREE FROM DB] Erreur chargement lieux :', error.message);
      setLoading(false);
      return;
    }

    const tree = buildTreeFromTable(data);
    setTreeData(tree);
    setLieuxExistants(data ?? []);
    setShowTree(false);
    setShowTreeFromDb(true);
    setLoading(false);
  };

  const handleClick = async () => {
    setLoading(true);
    const result = await detectLieuxPreview();
    setLieux(result);
    setShowTree(false);
    setLoading(false);
  };

  const handleClickTree = async () => {
    setLoading(true);
    const result = await detectLieuxPreview();
    const tree = buildTree(result);
    console.log('treeview', tree)
    await refreshTree();
    setTreeData(tree);
    setShowTree(true);
    setLoading(false);
  };

  const handleClickTreeFromDB = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('lieux')
      .select('id, libelle, type, parent_id');

    if (error) {
      console.error('[LOAD LIEUX]', error.message);
      setLoading(false);
      return;
    }

    const tree = buildTreeFromTable(data);
    setTreeData(tree);
    setShowTreeFromDb(true);
    setLoading(false);
  };

  function buildTreeFromTable(lieux: LieuMinimal[]): LieuNode[] {
    const map = new Map<string, LieuNode>();
    const rootNodes: LieuNode[] = [];

    // 1. Créer tous les noeuds
    for (const lieu of lieux) {
      map.set(lieu.id, {
        label: lieu.libelle,
        children: [],
      });
    }

    // 2. Lier parents / enfants
    for (const lieu of lieux) {
      const node = map.get(lieu.id)!;

      if (lieu.parent_id) {
        const parentNode = map.get(lieu.parent_id);
        if (parentNode) {
          parentNode.children?.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    }

    // 3. Fonction récursive de tri
    function sortChildren(node: LieuNode) {
      if (node.children) {
        node.children.sort((a, b) => a.label.localeCompare(b.label));
        node.children.forEach(sortChildren);
      }
    }

    rootNodes.forEach(sortChildren);

    return rootNodes;
  }


  function TreeNode3({
    node,
    lieuxExistants,
    parentPath = [],
    onLieuCreated
  }: {
    node: LieuNode;
    lieuxExistants: LieuMinimal[];
    parentPath?: string[];
    onLieuCreated: () => void;
  }) {
    const [open, setOpen] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const hasChildren = node.children && node.children.length > 0;
    const fullPath = [...parentPath, node.label];

    const handleCreate = () => {
      setShowModal(true);
    };

    const handleSubmit = async ({ libelle, type }: { libelle: string; type: string }) => {
      const id = uuidv4();

      // Trouver dynamiquement le bon parent_id à partir du chemin
      let currentParentId: string | null = null;

      for (let i = 0; i < parentPath.length; i++) {
        const parentLabel = parentPath[i].replace(/\(\d+\)/, '').trim();
        const parentType = ['commune', 'section', 'propriete', 'maison'][i] ?? 'autre';

        const match = lieuxExistants.find(
          (lieu) =>
            lieu.libelle.toLowerCase() === parentLabel.toLowerCase() &&
            lieu.type === parentType &&
            lieu.parent_id === currentParentId
        );

        if (!match) {
          console.warn(`Parent introuvable: ${parentLabel}`);
          return;
        }

        currentParentId = match.id;
      }

      const { error } = await supabase.from('lieux').insert({
        id,
        libelle,
        type,
        parent_id: currentParentId,
      });

      if (error) {
        console.error('[INSERT lieu]', error.message);
      } else {
        await onLieuCreated();
      }

      setShowModal(false);
    };

    return (
      <div className="pl-2 mt-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 cursor-pointer hover:underline" onClick={() => setOpen(!open)}>
            {hasChildren &&
              (open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
            <span>{node.label}</span>
          </div>

          <Button variant="outline" className="text-xs px-2 py-1" onClick={handleCreate}>
            Ajouter un lieu enfant
          </Button>
        </div>

        <LieuModal
          open={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={(data) => handleSubmit(data)}
          defaultLibelle=""
          niveau="autre"
          parentId={null} // sera recalculé dans handleSubmit
        />

        {hasChildren && open && (
          <div className="pl-4">
            {node.children!.map((child, i) => (
              <TreeNode3
                key={i}
                node={child}
                lieuxExistants={lieuxExistants}
                parentPath={fullPath}
                onLieuCreated={onLieuCreated}
              />
            ))}
          </div>
        )}
      </div>
    );
  }






  const columns = [
    { key: 'fonction', label: 'Fonction' },
    { key: 'texte_brut', label: 'Texte brut' },
    { key: 'commune', label: 'Commune' },
    { key: 'section', label: 'Section' },
    { key: 'propriete', label: 'Propriété / Hameau' },
    { key: 'maison', label: 'Maison' },
    { key: 'precisions', label: 'Précisions' },
    { key: 'numero', label: 'Numéro' },
    { key: 'acte_label', label: 'Acte' }
  ];

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Button onClick={handleClick} disabled={loading}>
          {loading ? 'Analyse en cours...' : 'Prévisualiser les lieux'}
        </Button>
        <Button onClick={handleClickTree} disabled={loading}>
          {loading ? 'Analyse en cours...' : 'Afficher par lieu'}
        </Button>
        <Button onClick={handleClickTreeFromDB} disabled={loading}>
          {loading ? 'Analyse en cours...' : 'Afficher depuis la base'}
        </Button>

        <Link to="/admin/parsing/mentions-toponymes"><Button>
          Mention/Toponyme table
        </Button>
        </Link>
      </div>

      {!showTree && lieux.length > 0 && (
        <div className="mt-4">
          <DataTable data={lieux} columns={columns} />
        </div>
      )}

      {showTree && treeData.length > 0 && (
        <div className="mt-4 border rounded p-4 bg-white">
          {treeData.map((node, i) => (
            <TreeNode2 key={i} node={node} path={[]} parentId={null}
              lieuxExistants={lieuxExistants}
              onLieuCreated={refreshTree} />
          ))}
        </div>
      )}

      {showTreeFromDb && treeData.length > 0 && (
        <div className="mt-4 border rounded p-4 bg-white">
          {treeData.map((node, i) => (
            <TreeNode3 key={i} node={node} lieuxExistants={lieuxExistants}
              onLieuCreated={refreshTreeFromDB} />
          ))}
        </div>
      )}
    </div>
  );
}

function buildTree(lieux: LieuPreview[]): LieuNode[] {
  const root: Record<string, TempNode> = {};

  for (const lieu of lieux) {
    const commune = lieu.commune ?? '(Commune inconnue)';
    const section = lieu.section ?? '(Section inconnue)';
    const propriete = lieu.propriete ?? '(Propriété inconnue)';
    const precision = lieu.precisions ?? null;

    const nodeCommune = root[commune] ??= { label: commune, children: {} };
    const nodeSection = nodeCommune.children![section] ??= {
      label: section,
      children: {},
      count: 0,
    };
    const nodeProp = nodeSection.children![propriete] ??= {
      label: propriete,
      children: {},
      count: 0,
    };

    if (precision) {
      const nodePrec = nodeProp.children![precision] ??= {
        label: precision,
        count: 0,
      };
      nodePrec.count! += 1;
    } else {
      nodeProp.count! += 1;
    }

    nodeSection.count! += 1;
    nodeCommune.count = (nodeCommune.count ?? 0) + 1;
  }

  const mapToArray = (node: TempNode): LieuNode => {
    const children = node.children
      ? Object.values(node.children).map(mapToArray).sort((a, b) =>
        a.label.localeCompare(b.label),
      )
      : undefined;

    return {
      label: `${node.label}${node.count !== undefined ? ` (${node.count})` : ''}`,
      count: node.count,
      children,
    };
  };

  return Object.values(root).map(mapToArray).sort((a, b) => a.label.localeCompare(b.label));
}



function TreeNode({ node }: { node: LieuNode }) {
  const [open, setOpen] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="pl-2">
      <div
        className="flex items-center gap-1 cursor-pointer hover:underline"
        onClick={() => hasChildren && setOpen(!open)}
      >
        {hasChildren &&
          (open ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          ))}
        <span>
          {node.label}
        </span>
      </div>
      {hasChildren && open && (
        <div className="pl-4">
          {node.children!.map((child, i) => (
            <TreeNode
              key={i}
              node={node}
            />
          ))}
        </div>
      )}
    </div>
  );
}
type LieuMinimal = {
  id: string;
  libelle: string;
  type: string;
  parent_id: string | null;
};

function TreeNode2({
  node,
  path = [],
  parentId = null,
  lieuxExistants,
  onLieuCreated
}: {
  node: LieuNode;
  path?: string[];
  parentId?: string | null;
  lieuxExistants: LieuMinimal[];
  onLieuCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const hasChildren = node.children && node.children.length > 0;
  const fullPath = [...path, node.label];

  const niveau = ['commune', 'section', 'propriete', 'maison'][path.length] ?? 'autre';
  const cleanLabel = node.label.replace(/\(\d+\)/, '').trim();

  const lieuExiste = lieuxExistants.some(
    (lieu) =>
      lieu.libelle.toLowerCase() === cleanLabel.toLowerCase() &&
      lieu.type === niveau &&
      lieu.parent_id === parentId
  );

  const handleCreateLieu = async (data: { libelle: string; type: string; parent_id: string | null }) => {
    const id = uuidv4();
    const { libelle, type } = data;

    // Trouver dynamiquement le parent réel à partir du path
    let currentParentId: string | null = null;

    for (let i = 0; i < path.length; i++) {
      const parentLibelle = path[i].replace(/\(\d+\)/, '').trim();
      const parentType = ['commune', 'section', 'propriete', 'maison'][i] ?? 'autre';

      const lieuParent = lieuxExistants.find(
        (lieu) =>
          lieu.libelle.toLowerCase() === parentLibelle.toLowerCase() &&
          lieu.type === parentType &&
          lieu.parent_id === currentParentId
      );

      if (!lieuParent) {
        console.warn(`Parent "${parentLibelle}" (${parentType}) non trouvé pour ${libelle}`);
        return;
      }

      currentParentId = lieuParent.id;
    }

    const { error } = await supabase.from('lieux').insert({
      id,
      libelle,
      type,
      parent_id: currentParentId,
    });

    if (!error) {
      await onLieuCreated();
    } else {
      console.error('[INSERT lieu] erreur:', error.message);
    }
  };


  return (
    <div className="pl-2 mt-1">
      <div className="flex items-center gap-2">
        <div
          className="flex items-center gap-1 cursor-pointer hover:underline"
          onClick={() => hasChildren && setOpen(!open)}
        >
          {hasChildren &&
            (open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
          <span>{node.label}</span>
        </div>

        <Button
          variant="outline"
          className="text-xs px-2 py-1"
          onClick={() => setShowModal(true)}
        >
          Créer
        </Button>

        {lieuExiste ? (
          <CheckCircle className="text-green-600 w-4 h-4" />
        ) : (
          <XCircle className="text-gray-400 w-4 h-4" />
        )}

        <LieuModal
          open={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={handleCreateLieu}
          defaultLibelle={cleanLabel}
          niveau={niveau}
          parentId={parentId}
        />
      </div>

      {hasChildren && open && (
        <div className="pl-4">
          {node.children!.map((child, i) => (
            <TreeNode2
              key={i}
              node={child}
              path={fullPath}
              parentId={parentId} // ou à remplacer par l'id réel si disponible
              lieuxExistants={lieuxExistants}
              onLieuCreated={onLieuCreated}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// components/LieuModal.tsx



type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { libelle: string; type: string; parent_id: string | null }) => void;
  defaultLibelle?: string;
  niveau: string;
  parentId?: string | null;
  path?: string[];
};

export function LieuModal({ open, onClose, onSubmit, defaultLibelle = '', niveau, parentId = null, path = [] }: Props) {
  const [libelle, setLibelle] = useState(defaultLibelle);
  const [type, setType] = useState(niveau);

  const types = ['maison', 'habitation', 'section', 'quartier', 'hameau', 'commune', 'lieu-dit', 'propriete', 'entite_naturelle', 'département', 'région', 'province', 'état', 'pays', 'continent', 'autre'];

  const handleSubmit = () => {
    onSubmit({ libelle, type, parent_id: parentId });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un lieu enfant ({niveau})</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <div className="text-sm text-muted-foreground italic">
            <strong>Chemin :</strong> {path.join(' > ')}
          </div>

          <Input
            value={libelle}
            onChange={(e) => setLibelle(e.target.value)}
            placeholder="Nom du lieu"
          />

          <Select value={type} onValueChange={(value) => setType(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Type de lieu" />
            </SelectTrigger>
            <SelectContent>
              {types.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit}>Créer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
