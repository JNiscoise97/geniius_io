import { useEffect, useState, type ElementType } from 'react'
import { ArrowLeft, CheckCircle2, FileText, Image, TreePine, UploadCloud } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase/client'

const BUCKET = 'tree-files'

type StoredFile = { id: string | null; name: string }

export default function TreePage() {
  const { treeId } = useParams<{ treeId: string }>()

  const [loaded, setLoaded] = useState(false)
  const [treeName, setTreeName] = useState<string | null>(null)
  const [createdAt, setCreatedAt] = useState<string | null>(null)
  const [gedcomFiles, setGedcomFiles] = useState<StoredFile[]>([])
  const [mediaFiles, setMediaFiles] = useState<StoredFile[]>([])

  useEffect(() => {
    if (!treeId) return

    supabase
      .from('trees')
      .select('name, created_at')
      .eq('id', treeId)
      .maybeSingle()
      .then(({ data }) => {
        setTreeName(data?.name ?? null)
        setCreatedAt(data?.created_at ?? null)
        setLoaded(true)
      })

    Promise.all([
      supabase.storage.from(BUCKET).list(`${treeId}/gedcom`),
      supabase.storage.from(BUCKET).list(`${treeId}/media`),
    ]).then(([gedcomRes, mediaRes]) => {
      setGedcomFiles(gedcomRes.data ?? [])
      setMediaFiles(mediaRes.data ?? [])
    })
  }, [treeId])

  const hasFiles = gedcomFiles.length > 0 || mediaFiles.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="mx-auto w-full max-w-3xl px-6 py-10 lg:px-8">
        <Link
          to="/trees"
          className="mb-6 inline-flex items-center gap-2 text-sm font-black text-slate-500 hover:text-emerald-700"
        >
          <ArrowLeft size={17} />
          Retour aux arbres
        </Link>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
            <TreePine size={26} className="text-emerald-700" />
          </div>

          <h1 className="mt-5 text-2xl font-black text-slate-950 sm:text-3xl">
            {loaded ? (treeName ?? 'Arbre introuvable') : 'Chargement...'}
          </h1>

          {createdAt && (
            <p className="mt-1 text-xs font-medium text-slate-400">
              Créé le {new Date(createdAt).toLocaleDateString('fr-FR')}
            </p>
          )}

          <p className="mx-auto mt-4 max-w-md text-sm font-medium leading-6 text-slate-500">
            {hasFiles
              ? "Vos fichiers sont bien déposés et en sécurité. L'analyse et l'affichage de cet arbre arrivent dans une prochaine étape."
              : "Cet arbre est vide pour l'instant. Importez un fichier GEDCOM et vos médias pour commencer à le construire."}
          </p>

          <Link
            to={`/import?tree=${treeId}`}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800"
          >
            <UploadCloud size={17} />
            {hasFiles ? 'Gérer les fichiers importés' : 'Importer mon GEDCOM et mes médias'}
          </Link>

          {hasFiles && (
            <div className="mt-8 grid gap-3 text-left sm:grid-cols-2">
              <FileStatus icon={FileText} label="GEDCOM" files={gedcomFiles} />
              <FileStatus icon={Image} label="Médias" files={mediaFiles} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FileStatus({
  icon: Icon,
  label,
  files,
}: {
  icon: ElementType
  label: string
  files: StoredFile[]
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
        <Icon size={14} />
        {label}
      </div>

      {files.length === 0 ? (
        <p className="mt-2 text-sm font-medium text-slate-400">Aucun fichier</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {files.map((file) => (
            <li key={file.id ?? file.name} className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
              <CheckCircle2 size={13} className="shrink-0 text-emerald-600" />
              <span className="truncate">{file.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
