import { useEffect, useMemo, useRef } from "react";
import rough from "roughjs";
import type { PlaceTreeNode } from "@/features/entites/entites.types";

// HierarchyTreeSketch — vue graphique "style croquis" (via roughjs) de la
// hiérarchie administrative descendante d'un lieu (commune -> sections ->
// hameaux -> habitations...), 2026-08-15, demande explicite après l'ajout
// de l'onglet "Hiérarchie administrative". Même technique que
// CarteVoisinageSketch (rough.svg + <text> DOM natifs), mais sur de VRAIES
// données (fetchPlaceDescendants) plutôt qu'un jeu d'exemple figé.
//
// Rendu en "boîtes dans des boîtes" (une grande boîte commune contient ses
// sections, qui contiennent elles-mêmes leurs hameaux...) plutôt qu'un
// icicle à niveaux séparés reliés par des traits — demande explicite après
// une première version en niveaux empilés jugée pas assez lisible comme
// containment. Couleur = qualité administrative (commune/section/hameau/
// habitation...), avec légende — pas la profondeur brute, pour que la
// couleur porte une information (le même niveau garde toujours la même
// couleur, même si sa profondeur varie d'une branche à l'autre, ex.
// "Destine" hameau à depth 2 dans une branche et depth 3 dans une autre).
function countLeaves(node: PlaceTreeNode): number {
  if (node.children.length === 0) return 1;
  return node.children.reduce((sum, c) => sum + countLeaves(c), 0);
}

function treeDepth(node: PlaceTreeNode): number {
  if (node.children.length === 0) return 1;
  return 1 + Math.max(...node.children.map(treeDepth));
}

function collectQualities(node: PlaceTreeNode, into: string[]) {
  const q = node.quality ?? "Non renseigné";
  if (!into.includes(q)) into.push(q);
  node.children.forEach(c => collectQualities(c, into));
}

const PALETTE = ["#e0e7ff", "#fef3c7", "#dcfce7", "#fce7f3", "#e0f2fe", "#f3e8ff", "#fee2e2", "#ecfccb"];
const UNKNOWN_COLOR = "#e5e7eb";

const LABEL_H = 22;
const PAD = 8;
const GAP = 4;
const MIN_LEAF_H = 46;
const LEAF_MIN_W = 130;

export default function HierarchyTreeSketch({ tree }: { tree: PlaceTreeNode }) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const colorByQuality = useMemo(() => {
    const qualities: string[] = [];
    collectQualities(tree, qualities);
    qualities.sort((a, b) => a.localeCompare(b));
    const map = new Map<string, string>();
    let i = 0;
    for (const q of qualities) {
      map.set(q, q === "Non renseigné" ? UNKNOWN_COLOR : PALETTE[i++ % PALETTE.length]);
    }
    return map;
  }, [tree]);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const totalLeaves = countLeaves(tree);
    const maxDepth = treeDepth(tree);
    const width = Math.max(360, totalLeaves * LEAF_MIN_W);
    const height = maxDepth * (LABEL_H + PAD) + MIN_LEAF_H + 20;

    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));

    const rc = rough.svg(svg);

    function drawLabel(x: number, y: number, text: string, fontSize: number) {
      const el = document.createElementNS("http://www.w3.org/2000/svg", "text");
      el.setAttribute("x", String(x));
      el.setAttribute("y", String(y));
      el.setAttribute("fill", "#111827");
      el.setAttribute("font-size", String(fontSize));
      el.setAttribute("font-weight", "600");
      svg.appendChild(el);
      el.textContent = text;
    }

    function drawNode(node: PlaceTreeNode, x: number, y: number, w: number, h: number, depth: number) {
      const fill = colorByQuality.get(node.quality ?? "Non renseigné") ?? UNKNOWN_COLOR;
      const rect = rc.rectangle(x, y, w, h, {
        fill,
        fillStyle: "solid",
        stroke: "#111827",
        roughness: 1.4,
        bowing: 1,
        strokeWidth: depth === 0 ? 2.2 : 1.4,
      });
      svg.appendChild(rect);

      const fontSize = depth === 0 ? 13 : 11;
      drawLabel(x + 8, y + 16, node.label, fontSize);

      if (node.children.length === 0) return;

      const innerX = x + PAD;
      const innerY = y + LABEL_H;
      const innerW = w - PAD * 2;
      const innerH = h - LABEL_H - PAD;
      // Plus assez de place pour dessiner un niveau de plus lisiblement —
      // les enfants restent consultables dans la liste au-dessus, le
      // dessin s'arrête simplement là plutôt que de produire des boîtes
      // illisiblement petites.
      if (innerW < 40 || innerH < 30) return;

      const childLeaves = node.children.map(countLeaves);
      const totalChildLeaves = childLeaves.reduce((a, b) => a + b, 0);
      let cursor = innerX;
      node.children.forEach((child, i) => {
        const isLast = i === node.children.length - 1;
        const slot = (childLeaves[i] / totalChildLeaves) * innerW;
        const childW = Math.max(20, slot - (isLast ? 0 : GAP));
        drawNode(child, cursor, innerY, childW, innerH, depth + 1);
        cursor += slot;
      });
    }

    drawNode(tree, 0, 10, width, height - 20, 0);
  }, [tree, colorByQuality]);

  return (
    <div className="space-y-3">
      <div className="w-full overflow-x-auto">
        <svg ref={svgRef} />
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {[...colorByQuality.entries()].map(([quality, color]) => (
          <span key={quality} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="w-3 h-3 rounded-sm border border-gray-300 shrink-0" style={{ backgroundColor: color }} />
            {quality}
          </span>
        ))}
      </div>
    </div>
  );
}
