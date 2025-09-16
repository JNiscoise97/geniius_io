import { Button } from '@/components/ui/button'
import { useRoleStore } from '@/store/useRoleStore'
import { Link } from 'react-router-dom'

export default function ConfigurationPage() {
  const { role, setRole } = useRoleStore()

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-10">
      {/* Choix du rôle */}
      <div>
        <h1 className="text-2xl font-bold mb-4">Choix du rôle</h1>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as any)}
          className="border rounded p-2 w-full"
        >
          <option value="visiteur">Visiteur</option>
          <option value="utilisateur">Utilisateur</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Section Mentions */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Mentions</h2>
        <div className="flex flex-wrap gap-2">
          <Link to="/individus/mention"><Button>Mentions</Button></Link>
        </div>
      </div>
      
      {/* Section Admin */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Administration</h2>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/snippets"><Button>Gestion des snippets</Button></Link>
          <Link to="/admin/relations-preview"><Button>Gestion des relations</Button></Link>
          <Link to="/admin/lieux-preview"><Button>Gestion des lieux</Button></Link>
          {/* <Link to="/admin/import-ec"><Button>Import Excel EC</Button></Link> */}
          <Link to="/admin/fonctions-sql"><Button>Fonctions SQL</Button></Link>
          <Link to="/admin/schema-sql"><Button>Schéma SQL</Button></Link>
          
          <Link to="/admin/lieu-parsing"><Button>Lieux parsing</Button></Link>
          <Link to="/admin/logs"><Button>Logs</Button></Link>
          <Link to="/admin/dictionnaire"><Button>Dictionnaires</Button></Link>
          <Link to="/admin/parsing/professions"><Button>Parsing professions</Button></Link>
        </div>
      </div>

      {/* Section Mock-ups */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Mock-ups</h2>
        <div className="flex flex-wrap gap-2">
          <Link to="/transcription"><Button>Mock-up transcription</Button></Link>
          <Link to="/mock/individu"><Button>Mock-up individu</Button></Link>
          <Link to="/mock/individu2"><Button>Mock-up individu 2</Button></Link>
          <Link to="/mock/individu3"><Button>Mock-up individu 3</Button></Link>
          <Link to="/mock/individu4"><Button>Mock-up individu 4</Button></Link>
          <Link to="/mock/acte1"><Button>Mock-up acte 1</Button></Link>
          <Link to="/mock/activity"><Button>Mock-up logs</Button></Link>
          <Link to="/mock/acte1"><Button>Mock-up acte 1</Button></Link>
          <Link to="/mock/acteur-dialog"><Button>Mock-up dialog</Button></Link>
        </div>
      </div>
    </div>
  )
}
