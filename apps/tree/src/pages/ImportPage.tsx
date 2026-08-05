import { useEffect, useState, type DragEvent, type ElementType, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { CheckCircle2, FileText, FolderUp, Image, Loader2, LogIn, TreePine, UploadCloud } from 'lucide-react'
import { supabase } from '../lib/supabase/client'

const BUCKET = 'tree-files'

type Tree = { id: string; name: string }
type StoredFile = { id: string | null; name: string }
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

function pathFor(kind: 'gedcom' | 'media', treeId: string, file: FileWithRelPath) {
  const relative = file.webkitRelativePath
  return `${treeId}/${kind}/${relative && relative.length > 0 ? relative : file.name}`
}

export default function ImportPage() {
  const [searchParams] = useSearchParams()
  const requestedTreeId = searchParams.get('tree')

  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [trees, setTrees] = useState<Tree[] | null>(null)
  const [selectedTreeId, setSelectedTreeId] = useState('')
  const [gedcomFiles, setGedcomFiles] = useState<StoredFile[]>([])
  const [mediaFiles, setMediaFiles] = useState<StoredFile[]>([])
  const [uploading, setUploading] = useState<'gedcom' | 'media' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })
    return () => subscription.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return

    supabase
      .from('trees')
      .select('id, name')
      .order('created_at', { ascending: false })
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setError(fetchError.message)
          return
        }
        setTrees(data ?? [])

        const requestedExists = requestedTreeId && data?.some((tree) => tree.id === requestedTreeId)
        setSelectedTreeId((current) => current || (requestedExists ? requestedTreeId : data?.[0]?.id) || '')
      })
  }, [session, requestedTreeId])

  useEffect(() => {
    if (selectedTreeId) refreshFileLists(selectedTreeId)
  }, [selectedTreeId])

  async function refreshFileLists(treeId: string) {
    const [gedcomRes, mediaRes] = await Promise.all([
      supabase.storage.from(BUCKET).list(`${treeId}/gedcom`),
      supabase.storage.from(BUCKET).list(`${treeId}/media`),
    ])
    setGedcomFiles(gedcomRes.data ?? [])
    setMediaFiles(mediaRes.data ?? [])
  }

  async function uploadFiles(kind: 'gedcom' | 'media', incoming: File[]) {
    if (!selectedTreeId || incoming.length === 0) return

    const files = kind === 'gedcom' ? incoming.slice(0, 1) : incoming

    setUploading(kind)
    setError(null)
    setNotice(null)

    let failed = false

    for (const file of files) {
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(pathFor(kind, selectedTreeId, file), file, { upsert: true })

      if (uploadError) {
        setError(uploadError.message)
        failed = true
        break
      }
    }

    setUploading(null)

    if (!failed) {
      setNotice(
        kind === 'gedcom'
          ? 'Fichier GEDCOM déposé — il sera analysé dans une prochaine étape.'
          : `${files.length} fichier(s) déposé(s) — ils seront rattachés aux personnes dans une prochaine étape.`,
      )
    }

    refreshFileLists(selectedTreeId)
  }

  if (session === undefined) {
    return (
      <CenteredState>
        <Loader2 className="animate-spin text-slate-400" size={22} />
      </CenteredState>
    )
  }

  if (session === null) {
    return (
      <CenteredState>
        <TreePine size={32} className="text-slate-300" />
        <h1 className="mt-4 text-xl font-black text-slate-950">
          Connectez-vous pour importer un arbre
        </h1>
        <Link
          to="/login"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800"
        >
          <LogIn size={16} />
          Se connecter
        </Link>
      </CenteredState>
    )
  }

  if (trees && trees.length === 0) {
    return (
      <CenteredState>
        <TreePine size={32} className="text-slate-300" />
        <h1 className="mt-4 text-xl font-black text-slate-950">Créez d'abord un arbre</h1>
        <p className="mt-2 max-w-sm text-sm font-medium leading-6 text-slate-500">
          L'import se fait dans un arbre existant — créez-en un avant d'importer votre GEDCOM.
        </p>
        <Link
          to="/trees"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800"
        >
          Aller à mes arbres
        </Link>
      </CenteredState>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12 lg:px-8">
      <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">Importer un arbre</h1>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
        Déposez votre fichier GEDCOM et vos médias — pour l'instant, ils sont simplement stockés
        en sécurité. L'analyse et l'affichage dans l'arbre viennent dans une prochaine étape.
      </p>

      <div className="mt-6">
        <label className="mb-2 block text-sm font-bold text-slate-700">Arbre concerné</label>
        <select
          value={selectedTreeId}
          onChange={(event) => setSelectedTreeId(event.target.value)}
          className="w-full max-w-sm rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-950 outline-none transition focus:border-indigo-300"
        >
          {trees?.map((tree) => (
            <option key={tree.id} value={tree.id}>
              {tree.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {notice && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {notice}
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
          uploading={uploading === 'gedcom'}
          onFiles={(files) => uploadFiles('gedcom', files)}
          files={gedcomFiles}
        />
        <UploadCard
          icon={Image}
          title="Médias"
          hint="Photos et scans — fichiers ou dossier entier"
          accept="image/*"
          multiple
          folder
          uploading={uploading === 'media'}
          onFiles={(files) => uploadFiles('media', files)}
          files={mediaFiles}
        />
      </div>
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
  uploading,
  onFiles,
  files,
}: {
  icon: ElementType
  title: string
  hint: string
  accept: string
  multiple: boolean
  folder: boolean
  uploading: boolean
  onFiles: (files: File[]) => void
  files: StoredFile[]
}) {
  const [dragging, setDragging] = useState(false)

  async function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    if (uploading) return
    const dropped = await filesFromDataTransfer(event.dataTransfer)
    if (dropped.length > 0) onFiles(dropped)
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
          <Icon size={17} className="text-indigo-700" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-slate-950">{title}</p>
          <p className="text-xs font-medium text-slate-400">{hint}</p>
        </div>
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault()
          if (!uploading) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={[
          'mt-4 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition',
          uploading
            ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60'
            : dragging
              ? 'border-indigo-400 bg-indigo-50'
              : 'border-slate-300 bg-slate-50',
        ].join(' ')}
      >
        {uploading ? (
          <Loader2 size={18} className="animate-spin text-slate-400" />
        ) : (
          <UploadCloud size={18} className={dragging ? 'text-indigo-600' : 'text-slate-400'} />
        )}

        <p className="text-xs font-medium text-slate-400">
          {uploading ? 'Envoi…' : dragging ? 'Déposez ici' : 'Glissez-déposez, ou'}
        </p>

        {!uploading && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <label className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-indigo-300 hover:text-indigo-700">
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
              <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-indigo-300 hover:text-indigo-700">
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
        )}
      </div>

      {files.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {files.map((file) => (
            <li key={file.id ?? file.name} className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <CheckCircle2 size={13} className="shrink-0 text-emerald-600" />
              <span className="truncate">{file.name}</span>
            </li>
          ))}
        </ul>
      )}
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
