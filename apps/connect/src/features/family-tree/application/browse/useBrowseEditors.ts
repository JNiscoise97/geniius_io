import { useMemo, useState } from "react";
import type { BrowsePanelMode } from "../../types/browse";

export type MemoryDraftState = {
  value: string;
  loaded: boolean;
  dirty: boolean;
};

const EMPTY_MEMORY_DRAFT: MemoryDraftState = {
  value: "",
  loaded: false,
  dirty: false,
};

export function useBrowseEditors(centerId: string) {
  const [panelMode, setPanelMode] = useState<BrowsePanelMode>("relations");

  const [memoryDraftsByPersonId, setMemoryDraftsByPersonId] = useState<
    Record<string, MemoryDraftState>
  >({});

  const [memoryEditorMode, setMemoryEditorMode] = useState<"create" | "edit">(
    "create",
  );
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);

  const [photoEditorMode, setPhotoEditorMode] = useState<"create" | "edit">(
    "create",
  );
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoCaption, setPhotoCaption] = useState("");
  const [photoConsentObtained, setPhotoConsentObtained] = useState(false);
  const [setAsProfilePhoto, setSetAsProfilePhoto] = useState(false);

  const currentMemoryDraft = useMemo(
    () => memoryDraftsByPersonId[centerId] ?? EMPTY_MEMORY_DRAFT,
    [centerId, memoryDraftsByPersonId],
  );

  function setCurrentMemoryDraft(value: string) {
    setMemoryDraftsByPersonId((prev) => ({
      ...prev,
      [centerId]: {
        ...(prev[centerId] ?? { ...EMPTY_MEMORY_DRAFT, loaded: true }),
        value,
        dirty: true,
      },
    }));
  }

  function ensureDraftLoaded() {
    setMemoryDraftsByPersonId((prev) => {
      if (prev[centerId]) return prev;
      return {
        ...prev,
        [centerId]: {
          ...EMPTY_MEMORY_DRAFT,
          loaded: true,
        },
      };
    });
  }

  function resetMemoryEditor() {
    setMemoryEditorMode("create");
    setEditingMemoryId(null);
    setCurrentMemoryDraft("");
  }

  function resetPhotoEditor() {
    setPhotoEditorMode("create");
    setEditingPhotoId(null);
    setPhotoFile(null);
    setPhotoCaption("");
    setPhotoConsentObtained(false);
    setSetAsProfilePhoto(false);
  }

  return {
    panelMode,
    setPanelMode,

    memoryEditorMode,
    setMemoryEditorMode,
    editingMemoryId,
    setEditingMemoryId,
    memoryDraftsByPersonId,
    setMemoryDraftsByPersonId,
    currentMemoryDraft,
    setCurrentMemoryDraft,
    ensureDraftLoaded,
    resetMemoryEditor,

    photoEditorMode,
    setPhotoEditorMode,
    editingPhotoId,
    setEditingPhotoId,
    photoFile,
    setPhotoFile,
    photoCaption,
    setPhotoCaption,
    photoConsentObtained,
    setPhotoConsentObtained,
    setAsProfilePhoto,
    setSetAsProfilePhoto,
    resetPhotoEditor,
  };
}