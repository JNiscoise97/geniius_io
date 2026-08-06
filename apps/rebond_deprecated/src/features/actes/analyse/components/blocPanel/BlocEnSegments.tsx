// BlocEnSegments.tsx

import { segmenterBloc } from "@/utils/segmenterBloc"
import type { Entity } from "@/types/analyse"
import { useEntityStore } from "@/store/useEntityStore"
import clsx from "clsx"
import { highlightSearchMatches } from "@/lib/highlightSearch"
import { useRef, type RefObject } from "react"

// 🎨 Palette Material Design étendue avec bon contraste (30 couleurs)
const palette = [
  { bg: "#E0F7FA", text: "#006064" },  // Cyan
  { bg: "#FFF3E0", text: "#E65100" },  // Orange
  { bg: "#EDE7F6", text: "#4527A0" },  // Deep Purple
  { bg: "#F3E5F5", text: "#6A1B9A" },  // Purple
  { bg: "#F1F8E9", text: "#33691E" },  // Light Green
  { bg: "#FFFDE7", text: "#F57F17" },  // Yellow
  { bg: "#E8F5E9", text: "#1B5E20" },  // Green
  { bg: "#FBE9E7", text: "#BF360C" },  // Deep Orange
  { bg: "#E3F2FD", text: "#0D47A1" },  // Blue
  { bg: "#ECEFF1", text: "#263238" },  // Blue Grey
  { bg: "#FFEBEE", text: "#B71C1C" },  // Red
  { bg: "#FCE4EC", text: "#880E4F" },  // Pink
  { bg: "#E8EAF6", text: "#1A237E" },  // Indigo
  { bg: "#E0F2F1", text: "#004D40" },  // Teal
  { bg: "#FFF8E1", text: "#FF6F00" },  // Amber
  { bg: "#EDEDED", text: "#212121" },  // Grey
  { bg: "#F1F8E9", text: "#2E7D32" },  // Green dark
  { bg: "#F9FBE7", text: "#827717" },  // Lime
  { bg: "#EFEBE9", text: "#3E2723" },  // Brown
  { bg: "#F3E5AB", text: "#5D4037" },  // Beige
  { bg: "#F5F5F5", text: "#212121" },  // Neutral light
  { bg: "#E3F2FD", text: "#1565C0" },  // Blue 700
  { bg: "#E0F2F1", text: "#00796B" },  // Teal 700
  { bg: "#FFF9C4", text: "#FBC02D" },  // Yellow 600
  { bg: "#FFCCBC", text: "#D84315" },  // Orange 700
  { bg: "#E6EE9C", text: "#9E9D24" },  // Lime 700
  { bg: "#FFCDD2", text: "#C62828" },  // Red 700
  { bg: "#D1C4E9", text: "#512DA8" },  // Purple 700
  { bg: "#C8E6C9", text: "#388E3C" },  // Green 700
  { bg: "#B3E5FC", text: "#0288D1" },  // Light Blue 700
]

function hashStringToInt(str: string, max: number): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % max
}

function hexToHSL(hex: string): { h: number; s: number; l: number } {
  let r = 0, g = 0, b = 0;
  if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16) / 255;
    g = parseInt(hex.slice(3, 5), 16) / 255;
    b = parseInt(hex.slice(5, 7), 16) / 255;
  }
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / d + 2); break;
      case b: h = ((r - g) / d + 4); break;
    }
    h = h * 60;
  }
  return { h, s: s * 100, l: l * 100 };
}

function isHueTooClose(h: number, recentHues: number[]) {
  return recentHues.some(prev => {
    const diff = Math.abs(h - prev);
    return diff < 30 || diff > 330;
  });
}

function getEntityColorAvoidingRecentHues(entityId: string, recentHuesRef: RefObject<number[]>): { bg: string; text: string } {
  const baseIndex = hashStringToInt(entityId, palette.length);
  let candidateIndex = baseIndex;
  const maxTries = palette.length;
  let tries = 0;

  while (tries < maxTries) {
    const { bg, text } = palette[candidateIndex];
    const { h } = hexToHSL(bg);
    if (!isHueTooClose(h, recentHuesRef.current)) {
      // Ajouter la teinte à la mémoire circulaire
      recentHuesRef.current.push(h);
      if (recentHuesRef.current.length > 6) {
        recentHuesRef.current.shift();
      }
      return { bg, text };
    }
    candidateIndex = (candidateIndex + 1) % palette.length;
    tries++;
  }

  // Fallback
  const fallback = palette[baseIndex];
  const { h } = hexToHSL(fallback.bg);
  recentHuesRef.current.push(h);
  if (recentHuesRef.current.length > 6) {
    recentHuesRef.current.shift();
  }
  return fallback;
}

const colorMapGlobal: Record<string, { bg: string; text: string }> = {}


export function BlocEnSegments({
  blocId,
  contenu,
  type,
  onMouseUp,
  search,
  onSelectEntity,
  shouldHighlight,
  registerMatchRef,
  recentHuesRef,
}: {
  blocId: string
  contenu: string
  type: string
  onMouseUp?: React.MouseEventHandler
  search: string
  onSelectEntity: (entity: Entity) => void
  shouldHighlight?: (entityId: string) => boolean
  registerMatchRef?: (el: HTMLElement) => void
  recentHuesRef: RefObject<number[]>
}) {
  const mentions = useEntityStore((s) =>
    s.getMentions().filter((m) => m.bloc_id === blocId)
  );
  const deleteMention = useEntityStore((s) => s.deleteMention)
  const segments = segmenterBloc(contenu, mentions)

  const blocClassName = clsx(
    "whitespace-pre-wrap text-gray-800",
    {
      titre: "text-xl font-bold text-primary tracking-tight",
      texte: "text-base leading-relaxed",
      "liste-à-puces": "pl-6 list-disc",
      "liste-numérotée": "pl-6 list-decimal",
    }[type] || "text-base"
  )

  const seen = new WeakSet<HTMLElement>()
  const registerAllMatches = (el: HTMLElement) => {
    if (el && registerMatchRef && !seen.has(el)) {
      seen.add(el)
      registerMatchRef(el)
    }
  }

  function getStableEntityColor(entityId: string): { bg: string; text: string } {
  if (!colorMapGlobal[entityId]) {
    colorMapGlobal[entityId] = getEntityColorAvoidingRecentHues(entityId, recentHuesRef)
  }
  return colorMapGlobal[entityId]
}

  return (
    <p className={blocClassName} data-bloc-id={blocId} onMouseUp={onMouseUp}>
      {segments.map((seg, i) => {
        if (seg.type === "mention" && (!shouldHighlight || shouldHighlight(seg.entityId || ""))) {
          const entityId = seg.entityId || "";
          const { bg, text } = getStableEntityColor(entityId);
          return (
            <span
              key={i}
              className={`relative group px-1 rounded-sm font-medium cursor-pointer ${entityId}`}
              style={{ backgroundColor: bg, color: text }}
              title="Cliquer pour afficher les détails de l'entité"
              onClick={() => {
                const entity = useEntityStore.getState().entities.find(e => e.id === seg.entityId)
                if (entity) onSelectEntity(entity)
              }}
            >
              {highlightSearchMatches(seg.text, search, registerAllMatches)}
            </span>
          )
        }

        return <span key={i}>{highlightSearchMatches(seg.text, search, registerAllMatches)}</span>
      })}
    </p>
  )
}