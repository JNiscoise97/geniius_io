import { useEffect, useState, type ChangeEvent, type ElementType, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { CheckCircle2, FileText, Image, Loader2, LogIn, TreePine, UploadCloud } from 'lucide-react'
import { supabase } from '../lib/supabase/client'

const BUCKET = 'tree-files'

type Tree = { id: string; name: string }
type StoredFile = { id: string | null; name: string }

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

  async function uploadGedcom(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || !selectedTreeId) return

    setUploading('gedcom')
    setError(null)
    setNotice(null)

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(`${selectedTreeId}/gedcom/${file.name}`, file, { upsert: true })

    setUploading(null)
    event.target.value = ''

    if (uploadError) {
      setError(uploadError.message)
      return
    }

    setNotice('Fichier GEDCOM déposé — il sera analysé dans une prochaine étape.')
    refreshFileLists(selectedTreeId)
  }

  async function uploadMedia(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files
    if (!files || files.length === 0 || !selectedTreeId) return

    setUploading('media')
    setError(null)
    setNotice(null)

    for (const file of Array.from(files)) {
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(`${selectedTreeId}/media/${file.name}`, file, { upsert: true })

      if (uploadError) {
        setError(uploadError.message)
        break
      }
    }

    setUploading(null)
    setNotice(`${files.length} fichier(s) déposé(s) — ils seront rattachés aux personnes dans une prochaine étape.`)
    event.target.value = ''
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
          hint=".ged — un seul fichier"
          accept=".ged"
          multiple={false}
          uploading={uploading === 'gedcom'}
          onChange={uploadGedcom}
          files={gedcomFiles}
        />
        <UploadCard
          icon={Image}
          title="Médias"
          hint="Photos et scans — plusieurs fichiers possibles"
          accept="image/*"
          multiple
          uploading={uploading === 'media'}
          onChange={uploadMedia}
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
  uploading,
  onChange,
  files,
}: {
  icon: ElementType
  title: string
  hint: string
  accept: string
  multiple: boolean
  uploading: boolean
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  files: StoredFile[]
}) {
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

      <label
        className={[
          'mt-4 flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm font-bold text-slate-500 transition',
          uploading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-indigo-300 hover:text-indigo-700',
        ].join(' ')}
      >
        {uploading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
        {uploading ? 'Envoi…' : 'Choisir un fichier'}
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={onChange}
          disabled={uploading}
          className="hidden"
        />
      </label>

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
