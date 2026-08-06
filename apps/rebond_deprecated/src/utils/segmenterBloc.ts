// segmenterBloc.ts

import type { Mention, Segment } from "@/types/analyse"

export function segmenterBloc(contenu: string, mentions: Mention[] = []): Segment[] {
  const segments: Segment[] = []
  const sorted = [...mentions].sort((a, b) => a.start - b.start)

  let currentIndex = 0

  for (const mention of sorted) {
    if (mention.start > currentIndex) {
      segments.push({
        text: contenu.slice(currentIndex, mention.start),
        type: "plain",
      })
    }

    segments.push({
      text: contenu.slice(mention.start, mention.end),
      type: "mention",
      entityId: mention.entite_id,
      mentionId: mention.id,
    })

    currentIndex = mention.end
  }

  if (currentIndex < contenu.length) {
    segments.push({
      text: contenu.slice(currentIndex),
      type: "plain",
    })
  }
  return segments
}