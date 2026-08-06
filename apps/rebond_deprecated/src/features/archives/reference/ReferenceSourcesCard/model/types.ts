// ReferenceSourcesCard/model/types.ts
export type DraftKey = string;

export type LeafNode<TDraft> = {
  kind: 'leaf';
  key: string;
  draftKey: DraftKey;
  c: TDraft;
};

export type UnitNode<TDraft> = {
  kind: 'unite';
  key: string;
  uniteId: string | null;
  label: string;
  instLabel: string;
  depotLabel: string;
  online: boolean;
  count: number;
  children: LeafNode<TDraft>[];
};

export type SelectedMeta<TDraft> = {
  draftKey: DraftKey;
  c: TDraft;
  globalNo: number | null;
};