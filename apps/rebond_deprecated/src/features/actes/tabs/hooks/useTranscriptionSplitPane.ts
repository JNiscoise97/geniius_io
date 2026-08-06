// useTranscriptionSplitPane.ts
import { useRef, useState } from 'react';

type SplitState = { leftPct: number };
const SPLIT_LS_KEY = 'rebond.transcription.split';

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function useTranscriptionSplitPane() {
  const [split, setSplit] = useState<SplitState>(() => {
    try {
      const raw = localStorage.getItem(SPLIT_LS_KEY);
      if (!raw) return { leftPct: 66 };
      const parsed = JSON.parse(raw);
      const pct = Number(parsed?.leftPct);
      if (!Number.isFinite(pct)) return { leftPct: 66 };
      return { leftPct: clamp(pct, 40, 80) };
    } catch {
      return { leftPct: 66 };
    }
  });

  const dragRef = useRef<{ dragging: boolean; startX: number; startPct: number } | null>(null);

  function setSplitPct(next: number) {
    const clamped = clamp(next, 40, 80);
    setSplit({ leftPct: clamped });
    try {
      localStorage.setItem(SPLIT_LS_KEY, JSON.stringify({ leftPct: clamped }));
    } catch {
      // ignore
    }
  }

  const splitApi = {
    leftPct: split.leftPct,
    onMouseDownDivider: (e: any) => {
      const container = document.getElementById('transcription-split-root');
      if (!container) return;

      dragRef.current = { dragging: true, startX: e.clientX, startPct: split.leftPct };
      const rect = container.getBoundingClientRect();

      const onMove = (ev: MouseEvent) => {
        if (!dragRef.current?.dragging) return;
        const dx = ev.clientX - dragRef.current.startX;
        const pctDelta = (dx / rect.width) * 100;
        setSplitPct(dragRef.current.startPct + pctDelta);
      };

      const onUp = () => {
        if (dragRef.current) dragRef.current.dragging = false;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
  };

  return splitApi;
}
