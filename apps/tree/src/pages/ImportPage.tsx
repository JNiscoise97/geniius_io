import { useEffect, useState, type DragEvent, type ElementType, type ReactNode } from 'react'
import { CheckCircle2, FileText, FolderUp, Image, Loader2, TreePine, UploadCloud, X } from 'lucide-react'
import { bridgeGetJson, bridgePublish, BridgeError } from '../lib/bridge/client'
import type { BridgeTree, PublishResult } from '../lib/bridge/types'

type FileWithRelPath = File & { webkitRelativePath?: string }

// ── Extraction de fichiers depuis un drop (supporte les dossiers) ──────────────

function readEntry(entry: FileSystemEntry): Promise<File[]> {
  return new Promise((resolve) => {
    if (entry.isFile) {
      ;(entry as FileSystemFileEntry).file((file) => resolve([file]))
      return
    }

    if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader()
      const collected: FileSystemEntry[] = []

      const readBatch = () => {
        reader.readEntries(async (batch) => {
          if (batch.length === 0) {
            const nested = await Promise.all(collected.map(readEntry))
            resolve(nested.flat())
            return
          }
          collected.push(...batch)
          readBatch()
        })
      }

      readBatch()
      return
    }

    resolve([])
  })
}

async function filesFromDataTransfer(dataTransfer: DataTransfer): Promise<File[]> {
  const items = dataTransfer.items

  if (items && items.length > 0 && typeof items[0].webkitGetAsEntry === 'function') {
    const entries = Array.from(items)
      .map((item) => item.webkitGetAsEntry())
      .filter((entry): entry is FileSystemEntry => entry !== null)

    if (entries.length > 0) {
      const results = await Promise.all(entries.map(readEntry))
      return results.flat()
    }
  }

  return Array.from(dataTransfer.files)
}

function basenameOf(file: FileWithRelPath) {
  const relative = file.webkitRelativePath
  if (relative && relative.length > 0) return relative.split('/').pop() ?? file.name
  return file.name
}

export default function ImportPage() {
  const [trees, setTrees] = useState<BridgeTree[] | null>(null)
  const [treesError, setTreesError] = useState<string | null>(null)
  const [selectedTreeId, setSelectedTreeId] = useState('')
  const [creatingNewTree, setCreatingNewTree] = useState(false)
  const [newTreeId, setNewTreeId] = useState('')
  const [newTreeLabel, setNewTreeLabel] = useState('')
  const [rotateKey, setRotateKey] = useState(false)

  const [gedcomFile, setGedcomFile] = useState<File | null>(null)
  const [mediaFiles, setMediaFiles] = useState<Map<string, File>>(new Map())

  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PublishResult | null>(null)

  useEffect(() => {
    bridgeGetJson<BridgeTree[]>('/trees')
      .then((data) => {
        setTrees(data)
        setSelectedTreeId((current) => current || data[0]?.id || '')
        if (data.length === 0) setCreatingNewTree(true)
      })
      .catch((err) => setTreesError(err instanceof Error ? err.message : String(err)))
  }, [])

  function addMediaFiles(files: File[]) {
    setMediaFiles((current) => {
      const next = new Map(current)
      for (const file of files) next.set(basenameOf(file as FileWithRelPath), file)
      return next
    })
  }

  function removeMediaFile(basename: string) {
    setMediaFiles((current) => {
      const next = new Map(current)
      next.delete(basename)
      return next
    })
  }

  async function handlePublish() {
    const treeId = creatingNewTree ? newTreeId.trim() : selectedTreeId
    if (!treeId || !gedcomFile) return

    setPublishing(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.set('tree_id', treeId)
      if (creatingNewTree) formData.set('tree_label', newTreeLabel.trim())
      if (rotateKey) formData.set('rotate_key', 'true')
      formData.set('gedcom', gedcomFile, gedcomFile.name)
      for (const [basename, file] of mediaFiles) formData.append('media', file, basename)

      const response = await bridgePublish(formData)
      const published: PublishResult = await response.json()
      setResult(published)
      setGedcomFile(null)
      setMediaFiles(new Map())
      setRotateKey(false)

      if (creatingNewTree) {
        setTrees((current) => [...(current ?? []), { id: treeId, label: newTreeLabel.trim() }])
        setSelectedTreeId(treeId)
        setCreatingNewTree(false)
        setNewTreeId('')
        setNewTreeLabel('')
      }
    } catch (err) {
      setError(err instanceof BridgeError ? err.message : 'La publication a échoué.')
    } finally {
      setPublishing(false)
    }
  }

  if (treesError) {
    return (
      <CenteredState>
        <TreePine size={32} className="text-slate-300" />
        <h1 className="mt-4 text-xl font-black text-slate-950">Pont injoignable</h1>
        <p className="mt-2 max-w-sm text-sm font-medium leading-6 text-slate-500">{treesError}</p>
      </CenteredState>
    )
  }

  if (trees === null) {
    return (
      <CenteredState>
        <Loader2 className="animate-spin text-slate-400" size={22} />
      </CenteredState>
    )
  }

  const canPublish = !publishing && !!gedcomFile && (creatingNewTree ? !!newTreeId.trim() && !!newTreeLabel.trim() : !!selectedTreeId)

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12 lg:px-8">
      <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">Publier un arbre</h1>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
        Déposez votre export GEDCOM et vos médias, puis publiez — le pont chiffre et met en ligne
        une nouvelle version, comme <code className="rounded bg-slate-100 px-1.5 py-0.5">tool/publish.dart</code>.
      </p>

      <div className="mt-6">
        <label className="mb-2 block text-sm font-bold text-slate-700">Arbre concerné</label>
        {!creatingNewTree ? (
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedTreeId}
              onChange={(event) => setSelectedTreeId(event.target.value)}
              className="w-full max-w-sm rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-950 outline-none transition focus:border-[#1B4D3E]/50"
            >
              {trees.map((tree) => (
                <option key={tree.id} value={tree.id}>
                  {tree.label} ({tree.id})
                </option>
              ))}
            </select>
            <button
              onClick={() => setCreatingNewTree(true)}
              className="text-xs font-bold text-[#1B4D3E] hover:text-[#143c30]"
            >
              Nouvel arbre…
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={newTreeId}
              onChange={(event) => setNewTreeId(event.target.value)}
              placeholder="identifiant (ex. default)"
              className="w-48 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-950 outline-none transition focus:border-[#1B4D3E]/50"
            />
            <input
              type="text"
              value={newTreeLabel}
              onChange={(event) => setNewTreeLabel(event.target.value)}
              placeholder="Nom affiché"
              className="w-48 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-950 outline-none transition focus:border-[#1B4D3E]/50"
            />
            {trees.length > 0 && (
              <button
                onClick={() => setCreatingNewTree(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Annuler
              </button>
            )}
          </div>
        )}
      </div>

      <label className="mt-4 flex w-fit items-center gap-2 text-xs font-bold text-slate-600">
        <input type="checkbox" checked={rotateKey} onChange={(event) => setRotateKey(event.target.checked)} />
        Révoquer l'accès de quelqu'un (nouvelle clé de chiffrement)
      </label>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4 rounded-2xl border border-[#1B4D3E]/20 bg-[#E9F2ED] px-4 py-3 text-sm font-medium text-[#1B4D3E]">
          Version {result.version} publiée — {result.diff.newIndividualsCount} nouvelle(s) personne(s),{' '}
          {result.diff.newPhotosCount} nouvelle(s) photo(s), {result.diff.modifiedEventsCount} événement(s)
          modifié(s). {result.media.uploaded} photo(s) envoyée(s)
          {result.media.missing.length > 0 && `, ${result.media.missing.length} introuvable(s)`}.
        </div>
      )}

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <UploadCard
          icon={FileText}
          title="Fichier GEDCOM"
          hint=".ged — un seul fichier, glissez-le ici"
          accept=".ged"
          multiple={false}
          folder={false}
          onFiles={(files) => setGedcomFile(files[0] ?? null)}
        >
          {gedcomFile && (
            <ul className="mt-4 space-y-1.5">
              <li className="flex items-center justify-between gap-2 text-xs font-medium text-slate-600">
                <span className="flex min-w-0 items-center gap-2">
                  <CheckCircle2 size={13} className="shrink-0 text-[#1B4D3E]" />
                  <span className="truncate">{gedcomFile.name}</span>
                </span>
                <button onClick={() => setGedcomFile(null)} className="shrink-0 text-slate-400 hover:text-red-600">
                  <X size={13} />
                </button>
              </li>
            </ul>
          )}
        </UploadCard>
        <UploadCard
          icon={Image}
          title="Médias"
          hint="Photos et scans — fichiers ou dossier entier"
          accept="image/*"
          multiple
          folder
          onFiles={addMediaFiles}
        >
          {mediaFiles.size > 0 && (
            <ul className="mt-4 max-h-40 space-y-1.5 overflow-y-auto">
              {[...mediaFiles.keys()].map((basename) => (
                <li key={basename} className="flex items-center justify-between gap-2 text-xs font-medium text-slate-600">
                  <span className="flex min-w-0 items-center gap-2">
                    <CheckCircle2 size={13} className="shrink-0 text-[#1B4D3E]" />
                    <span className="truncate">{basename}</span>
                  </span>
                  <button onClick={() => removeMediaFile(basename)} className="shrink-0 text-slate-400 hover:text-red-600">
                    <X size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </UploadCard>
      </div>

      <button
        onClick={handlePublish}
        disabled={!canPublish}
        className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[#1B4D3E] px-6 py-3 text-sm font-black text-white shadow-lg shadow-[#1B4D3E]/25 transition hover:bg-[#143c30] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {publishing ? <Loader2 size={16} className="animate-spin" /> : null}
        {publishing ? 'Publication…' : 'Publier'}
      </button>
    </div>
  )
}

function UploadCard({
  icon: Icon,
  title,
  hint,
  accept,
  multiple,
  folder,
  onFiles,
  children,
}: {
  icon: ElementType
  title: string
  hint: string
  accept: string
  multiple: boolean
  folder: boolean
  onFiles: (files: File[]) => void
  children?: ReactNode
}) {
  const [dragging, setDragging] = useState(false)

  async function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    const dropped = await filesFromDataTransfer(event.dataTransfer)
    if (dropped.length > 0) onFiles(dropped)
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E4EFEA]">
          <Icon size={17} className="text-[#1B4D3E]" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-slate-950">{title}</p>
          <p className="text-xs font-medium text-slate-400">{hint}</p>
        </div>
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={[
          'mt-4 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition',
          dragging ? 'border-[#1B4D3E] bg-[#E4EFEA]' : 'border-slate-300 bg-slate-50',
        ].join(' ')}
      >
        <UploadCloud size={18} className={dragging ? 'text-[#1B4D3E]' : 'text-slate-400'} />
        <p className="text-xs font-medium text-slate-400">{dragging ? 'Déposez ici' : 'Glissez-déposez, ou'}</p>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <label className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-[#1B4D3E]/40 hover:text-[#1B4D3E]">
            Choisir un fichier
            <input
              type="file"
              accept={accept}
              multiple={multiple}
              onChange={(event) => {
                const picked = event.target.files ? Array.from(event.target.files) : []
                if (picked.length > 0) onFiles(picked)
                event.target.value = ''
              }}
              className="hidden"
            />
          </label>

          {folder && (
            <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-[#1B4D3E]/40 hover:text-[#1B4D3E]">
              <FolderUp size={13} />
              Choisir un dossier
              <input
                type="file"
                // @ts-expect-error — attribut non standard mais largement supporté (Chrome, Edge, Firefox, Safari)
                webkitdirectory=""
                directory=""
                multiple
                onChange={(event) => {
                  const picked = event.target.files ? Array.from(event.target.files) : []
                  if (picked.length > 0) onFiles(picked)
                  event.target.value = ''
                }}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      {children}
    </div>
  )
}

function CenteredState({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      {children}
    </div>
  )
}
