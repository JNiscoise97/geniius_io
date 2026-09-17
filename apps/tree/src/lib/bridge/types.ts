export type BridgeTree = {
  id: string
  label: string
}

export type VersionDiffDetail = {
  category: string
  personId: string
  personName: string
  note: string | null
}

export type MissingPhotoEntry = {
  individualId: string
  personName: string
  kind: 'primary' | 'gallery'
  mediaId: string
  expectedFileName: string
}

export type PublishResult = {
  version: number
  diff: {
    newIndividualsCount: number
    newPhotosCount: number
    modifiedEventsCount: number
    details: VersionDiffDetail[]
  }
  media: {
    resolved: number
    uploaded: number
    missing: MissingPhotoEntry[]
  }
}

export type VersionHistoryEntry = {
  version: number
  created_at: string
  checksum: string
  stats: {
    new_individuals_count: number | null
    new_photos_count: number | null
    modified_events_count: number | null
    details_json: string
    media_missing_json: string
    media_resolved_count: number
    media_uploaded_count: number
    computed_at: string
  } | null
}

export type MissingPhotosResponse = {
  version: number | null
  missing: MissingPhotoEntry[]
}
