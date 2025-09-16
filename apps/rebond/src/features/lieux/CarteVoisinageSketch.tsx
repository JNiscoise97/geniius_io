import { useEffect, useMemo, useRef, useState } from "react";
import rough from 'roughjs';
import { Button } from "@/components/ui/button";

/**
 * CarteVoisinageSketch
 *
 * Démo "hard-coded" de 2 rendus schématiques (style croquis) :
 * - Radial (ego-network)
 * - Icicle (blocs imbriqués)
 *
 * Aucune donnée distante : c'est 100% local pour visualiser le concept.
 */

const SAMPLE = {
  center: { id: "L0", label: "Habitation Nogent", type: "habitation", mentions: 128 },
  siblings: [
    { id: "L1", label: "Habitation Clugny", type: "habitation", mentions: 64, coActs: 12 },
    { id: "L2", label: "Habitation Ravine Chaude", type: "habitation", mentions: 38, coActs: 9 },
    { id: "L3", label: "Habitation Zévallos", type: "habitation", mentions: 22, coActs: 5 },
  ],
  children: [
    { id: "L4", label: "Quartier Bas", type: "quartier", mentions: 18 },
    { id: "L5", label: "Chemin de Nogent", type: "chemin", mentions: 7 },
  ],
};

type Mode = "radial" | "icicle";

export default function CarteVoisinageSketch() {
  const [mode, setMode] = useState<Mode>("radial");

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Carte & voisinage — démo (hard-coded)</h2>
        <div className="flex items-center gap-2">
          <Button
            variant={mode === "radial" ? "default" : "outline"}
            className={mode === "radial" ? "bg-gray-900 hover:bg-gray-800" : ""}
            onClick={() => setMode("radial")}
          >
            Radial croquis
          </Button>
          <Button
            variant={mode === "icicle" ? "default" : "outline"}
            className={mode === "icicle" ? "bg-gray-900 hover:bg-gray-800" : ""}
            onClick={() => setMode("icicle")}
          >
            Icicle croquis
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-3">
        {mode === "radial" ? <RadialSketch data={SAMPLE} /> : <IcicleSketch data={SAMPLE} />}
      </div>

      <p className="mt-3 text-sm text-gray-600">
        Style "dessin" via <code>roughjs</code>. Les tailles reflètent l'activité (mentions), et dans le radial
        l'épaisseur des liens reflète les co-mentions (actes communs). Les étiquettes sont abrégées quand nécessaire.
      </p>
    </div>
  );
}

// -------------------------------------------------
// RADIAL
// -------------------------------------------------
function RadialSketch({
  data,
}: {
  data: typeof SAMPLE;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const { width, height } = { width: 880, height: 520 };

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    // Clear
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const rc = rough.svg(svg);
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    // Helpers
    const center = { x: width / 2, y: height / 2 };
    const ring1 = 170; // frères
    const ring2 = 250; // enfants du lieu (anneau externe)

    const sizeFromMentions = (m: number) => 18 + Math.sqrt(m) * 1.3; // diamètre approx
    const edgeWidth = (w: number) => Math.max(1, Math.min(6, 1 + w * 0.4));

    // -- draw ring guides (subtils)
    const guide1 = rc.circle(center.x, center.y, ring1 * 2, {
      roughness: 1,
      stroke: "#e5e7eb",
      bowing: 1.2,
      strokeWidth: 1,
    });
    svg.appendChild(guide1);
    const guide2 = rc.circle(center.x, center.y, ring2 * 2, {
      roughness: 1,
      stroke: "#f1f5f9",
      bowing: 1.2,
      strokeWidth: 1,
    });
    svg.appendChild(guide2);

    // -- compute positions
    const sibCount = data.siblings.length;
    const chiCount = data.children.length;

    const sibPositions = data.siblings.map((_, i) => {
      const angle = (i / Math.max(1, sibCount)) * Math.PI * 2 - Math.PI / 2; // start top
      return {
        angle,
        x: center.x + ring1 * Math.cos(angle),
        y: center.y + ring1 * Math.sin(angle),
      };
    });

    const chiPositions = data.children.map((_, i) => {
      const angle = (i / Math.max(1, chiCount)) * Math.PI * 2 - Math.PI / 2 + Math.PI / 6; // slight offset
      return {
        angle,
        x: center.x + ring2 * Math.cos(angle),
        y: center.y + ring2 * Math.sin(angle),
      };
    });

    // -- edges from center to siblings (weighted by coActs)
    data.siblings.forEach((sib, i) => {
      const p = sibPositions[i];
      const e = rc.line(center.x, center.y, p.x, p.y, {
        stroke: "#374151",
        strokeWidth: edgeWidth(sib.coActs || 1),
        roughness: 1.2,
        bowing: 1.2,
      });
      svg.appendChild(e);
      // label weight
      const midx = (center.x + p.x) / 2;
      const midy = (center.y + p.y) / 2;
      const wt = document.createElementNS("http://www.w3.org/2000/svg", "text");
      wt.setAttribute("x", String(midx));
      wt.setAttribute("y", String(midy));
      wt.setAttribute("fill", "#4b5563");
      wt.setAttribute("font-size", "10");
      wt.setAttribute("text-anchor", "middle");
      wt.textContent = String(sib.coActs || 0);
      svg.appendChild(wt);
    });

    // -- draw center node
    const dCenter = sizeFromMentions(data.center.mentions);
    const centerCircle = rc.circle(center.x, center.y, dCenter, {
      fill: "#f8fafc",
      fillStyle: "hachure",
      hachureAngle: 80,
      hachureGap: 4,
      stroke: "#111827",
      strokeWidth: 2,
      roughness: 1.6,
    });
    svg.appendChild(centerCircle);
    label(svg, center.x, center.y, data.center.label, data.center.mentions);

    // -- draw siblings
    data.siblings.forEach((sib, i) => {
      const p = sibPositions[i];
      const d = sizeFromMentions(sib.mentions);
      const c = rc.circle(p.x, p.y, d, {
        fill: "#f9fafb",
        fillStyle: "hachure",
        hachureAngle: 75,
        hachureGap: 5,
        stroke: "#1f2937",
        strokeWidth: 1.8,
        roughness: 1.8,
      });
      svg.appendChild(c);
      label(svg, p.x, p.y, sib.label, sib.mentions);
    });

    // -- draw children (outer ring)
    data.children.forEach((chi, i) => {
      const p = chiPositions[i];
      const d = sizeFromMentions(chi.mentions);
      const c = rc.circle(p.x, p.y, d, {
        fill: "#ffffff",
        fillStyle: "hachure",
        hachureAngle: -70,
        hachureGap: 5,
        stroke: "#1f2937",
        strokeWidth: 1.6,
        roughness: 1.7,
      });
      svg.appendChild(c);
      label(svg, p.x, p.y, chi.label, chi.mentions);

      // subtle connector (thin)
      const e = rc.line(center.x, center.y, p.x, p.y, {
        stroke: "#9ca3af",
        strokeWidth: 1,
        roughness: 1.1,
      });
      svg.appendChild(e);
    });
  }, [data]);

  return (
    <div className="w-full overflow-x-auto">
      <svg ref={svgRef} width="100%" height="520" />
    </div>
  );
}

function label(svg: SVGSVGElement, x: number, y: number, text: string, value?: number) {
  // split label if too long
  const max = 18;
  const parts: string[] = [];
  let t = text;
  if (t.length <= max) {
    parts.push(t);
  } else {
    // naive split
    const mid = Math.floor(t.length / 2);
    parts.push(t.slice(0, mid).trim());
    parts.push(t.slice(mid).trim());
  }
  const off = parts.length > 1 ? -4 : 4;
  parts.forEach((p, i) => {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "text");
    line.setAttribute("x", String(x));
    line.setAttribute("y", String(y + (i === 0 ? -2 : 10)));
    line.setAttribute("fill", "#111827");
    line.setAttribute("font-size", "11");
    line.setAttribute("font-weight", "600");
    line.setAttribute("text-anchor", "middle");
    line.textContent = p;
    svg.appendChild(line);
  });
  if (typeof value === "number") {
    const v = document.createElementNS("http://www.w3.org/2000/svg", "text");
    v.setAttribute("x", String(x));
    v.setAttribute("y", String(y + 22));
    v.setAttribute("fill", "#4b5563");
    v.setAttribute("font-size", "10");
    v.setAttribute("text-anchor", "middle");
    v.textContent = `${value} mentions`;
    svg.appendChild(v);
  }
}

// -------------------------------------------------
// ICICLE (blocs imbriqués)
// -------------------------------------------------
function IcicleSketch({ data }: { data: typeof SAMPLE }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const { width, height } = { width: 880, height: 420 };

  // Construction simple d'une hiérarchie factice :
  // Deshaies (root)
  //  ├─ Sainte-Rose (contient Habitation Nogent + Ravine Chaude)
  //  └─ Grand Cul-de-Sac (contient Clugny + Zévallos)
  const hier = useMemo(() => {
    const SR_children = [
      { id: data.center.id, label: data.center.label, mentions: data.center.mentions },
      { id: data.siblings[1].id, label: data.siblings[1].label, mentions: data.siblings[1].mentions },
    ];
    const GCS_children = [
      { id: data.siblings[0].id, label: data.siblings[0].label, mentions: data.siblings[0].mentions },
      { id: data.siblings[2].id, label: data.siblings[2].label, mentions: data.siblings[2].mentions },
    ];
    const SR = { id: "SR", label: "Sainte-Rose", children: SR_children };
    const GCS = { id: "GCS", label: "Grand Cul-de-Sac", children: GCS_children };
    const root = { id: "DES", label: "Deshaies", children: [SR, GCS] } as any;

    function sum(n: any): number {
      if (!n.children) return n.mentions || 0;
      n.mentions = n.children.map(sum).reduce((a: number, b: number) => a + b, 0);
      return n.mentions;
    }
    sum(root);
    return root;
  }, [data]);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const rc = rough.svg(svg);
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    const paddingX = 20;
    const levelH = 110; // hauteur par niveau

    function drawNode(n: any, x: number, y: number, w: number, level: number) {
      // cadre
      const rect = rc.rectangle(x, y, w, levelH - 18, {
        fill: level === 0 ? "#f8fafc" : level === 1 ? "#f9fafb" : "#ffffff",
        fillStyle: "hachure",
        stroke: "#111827",
        roughness: 1.5,
        hachureGap: 6,
        strokeWidth: level === 0 ? 2 : 1.7,
      });
      svg.appendChild(rect);

      // label principal
      const title = document.createElementNS("http://www.w3.org/2000/svg", "text");
      title.setAttribute("x", String(x + 10));
      title.setAttribute("y", String(y + 24));
      title.setAttribute("fill", "#111827");
      title.setAttribute("font-size", "12");
      title.setAttribute("font-weight", "600");
      title.textContent = `${n.label}`;
      svg.appendChild(title);

      // badge mentions
      const badge = document.createElementNS("http://www.w3.org/2000/svg", "text");
      badge.setAttribute("x", String(x + 10));
      badge.setAttribute("y", String(y + 42));
      badge.setAttribute("fill", "#4b5563");
      badge.setAttribute("font-size", "11");
      badge.textContent = `${n.mentions} mentions`;
      svg.appendChild(badge);

      if (!n.children || n.children.length === 0) return;
      const total = n.children.reduce((a: number, c: any) => a + c.mentions, 0);
      let xCursor = x + paddingX;
      const innerW = w - paddingX * 2;
      n.children.forEach((c: any) => {
        const cw = Math.max(80, (c.mentions / total) * innerW);
        drawNode(c, xCursor, y + levelH, cw, level + 1);
        xCursor += cw;
      });
    }

    drawNode(hier, 10, 10, width - 20, 0);
  }, [hier]);

  return (
    <div className="w-full overflow-x-auto">
      <svg ref={svgRef} width="100%" height="420" />
    </div>
  );
}
