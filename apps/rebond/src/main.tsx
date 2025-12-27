import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Dashboard from "@/features/accueil/Dashboard"
import ActeList from "@/features/actes/ActeList"
import ActeDetail from "@/features/actes/ActeDetail"
import Transcription from "@/features/actes/Transcription"
import Analyse from "@/features/actes/Analyse"
import Liens from "@/features/actes/Liens"
import Annotations from "@/features/actes/Annotations"
import Fichier from "@/features/actes/Fichier"
import Layout from "@/components/layout/Layout"
import "./index.css"
import ActeMinimalForm from "./features/actes/ActeMinimalForm"
import ActesSaisisRoulementForm from "./features/actes/ActesSaisisRoulementForm"
import NotaireDetail from "./features/notaires/NotaireDetail"
import NotaireForm from "./features/notaires/NotaireForm"
import NotaireList from "./features/notaires/NotaireList"
import SnippetManager from "./features/parameters/SnippetManager"
import TranscriptionEditor from "./features/actes/transcription/TranscriptionEditor"
import { Toaster } from "sonner"
import PageIndividu from "./features/mock-up/fiche-individu"
import ImportEtatCivil from "./features/parameters/ImportEtatCivil"
import PageActeEtatCivil from "./features/etat-civil/PageActeEtatCivil"
import ImportIndividusRebond from "./features/parameters/ImportIndividusRebond"
import IndividuList from "./features/rebond/IndividuList"
import ActeFormPage from "./features/etat-civil/ActeFormPage"
import IndividuMentionsTraitement from "./features/rebond/IndividuMentionsTraitement"
import PageIndividu2 from "./features/mock-up/fiche-individu-2"
import PageIndividu3 from "./features/mock-up/fiche-individu-3"
import PageIndividu4 from "./features/mock-up/fiche-individu-4"
import IndividuFiche from "./features/rebond/IndividuFiche"
import EtatCivilList from "./features/etat-civil/suivi/EtatCivilList"
import BureauLayout from "./features/etat-civil/suivi/BureauLayout"
import RegistreLayout from "./features/etat-civil/suivi/RegistreLayout"
import ActePreview from "./features/etat-civil/suivi/ActePreview"
import NotaireLayout from "./features/notaires/NotaireLayout"
import NotaireRegistreLayout from "./features/notaires/NotaireRegistreLayout"
import NotaireActePreview from "./features/notaires/NotaireActePreview"
import { AnalyseRelationsPreview } from "./features/parameters/AnalyseRelationsPreview"
import ActeEdit from "./features/etat-civil/suivi/ActeEdit"
import { AnalyseLieuxPreview } from "./features/parameters/AnalyseLieuxPreview"
import DashboardTest from "./features/accueil/DashboardTest"
import CycleDeContribution from "./features/accueil/CycleDeContribution"
import ConfigurationPage from "./features/configuration/Configuration"
import { ProtectedRoute } from "./components/shared/ProtectedRoute"
import Unauthorized from "./components/shared/Unauthorized"
import { LandingPage } from "./features/accueil/LandingPage"
import { SqlFunctionsExecutorPage } from "./features/configuration/SqlFunctions"
import { LieuBrutCreator } from "./features/configuration/LieuBrutCreator"
import MentionsToponymesTable from "./features/parameters/MentionsToponymesTable"
import LieuPreview from "./features/lieux/LieuPreview"
import SearchResultsPage from "./features/recherche/SearchResultsPage"
import LogsConsole from "./features/parameters/LogsConsole"
import ActivityTimeline from "./components/shared/ActivityTimeline"
import RefConfigPage from "./features/parameters/RefConfigPage"
import MockDialogActeur from "./components/actes/MockDialogActeur"
import ProfessionsTable from "./features/parameters/ProfessionsTable"
import { SchemaExplorer } from "./features/configuration/SchemaExplorer"
import NotaireEdit from "./features/notaires/NotaireEdit"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Toaster richColors />
      <Layout>
        <Routes>
          {/* Redirections automatiques */}
          <Route path="/notaires" element={<Navigate to="/notaires/liste" replace />} />
          <Route path="/ac-actes" element={<Navigate to="/ac-actes/liste" replace />} />
          <Route path="/ec-bureau" element={<Navigate to="/ec-bureaux/liste" replace />} />
          <Route path="/ec-bureaux" element={<Navigate to="/ec-bureaux/liste" replace />} />
  
          <Route path="/" element={<LandingPage />} />
          <Route path="/configuration" element={
              <ProtectedRoute minRole="visiteur">
                <ConfigurationPage />
              </ProtectedRoute>
            } />
            <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/faq/cycle-de-contribution" element={<CycleDeContribution />} />
          <Route path="/ac-actes/liste" element={<ActeList />} />
          <Route path="ac-actes/nouveau/minimal" element={<ActeMinimalForm />} />
          <Route path="ac-actes/nouveau/roulement" element={<ActesSaisisRoulementForm />} />
          <Route path="ac-actes/:id" element={<ActeDetail />} />
          <Route path="ac-actes/:id/transcription" element={<Transcription />} />
          <Route path="ac-actes/:id/analyse" element={<Analyse />} />
          <Route path="ac-actes/:id/liens" element={<Liens />} />
          <Route path="ac-actes/:id/annotations" element={<Annotations />} />
          <Route path="ac-actes/:id/fichier" element={<Fichier />} />
          <Route path="/notaires/liste" element={<NotaireList />} />
          <Route path="/notaire/nouveau" element={<NotaireForm />} />
          <Route path="/notaire/edit/:id" element={<NotaireEdit />} />
          <Route path="/notaires-2/:id" element={<NotaireDetail />} />
          <Route path="/notaires/:id" element={<NotaireLayout />} />
          <Route path="/ac-registre/:notaireId/:id" element={<NotaireRegistreLayout />} />
          <Route path="/ac-acte/:acteId" element={<NotaireActePreview />} />

          <Route path="/ec-bureaux/liste" element={<EtatCivilList />} />
          <Route path="/ec-bureau/:id" element={<BureauLayout />} />
          <Route path="/ec-registre/:bureauId/:id" element={<RegistreLayout />} />
          <Route path="/ec-acte/:acteId" element={<ActePreview />} />

          <Route path="/individu/:individuId" element={<IndividuFiche />} />
          <Route path="/individus" element={<Navigate to="/individus/liste" replace />} />
          <Route path="/individus/liste" element={<IndividuList />} />

          <Route path="/individus/mention" element={<IndividuMentionsTraitement />} />
          
          <Route path="/ec-acte/new" element={<ActeFormPage />} />
          <Route path="/ec-acte/edit2/:acteId" element={<ActeFormPage />} />
          <Route path="/ec-acte/edit/:acteId" element={<ActeEdit />} />

          <Route path="/lieu/:lieuId" element={<LieuPreview />} />


          <Route path="/admin/snippets" element={<SnippetManager />} />
          <Route path="/admin/import-ec" element={<ImportEtatCivil />} />
          <Route path="/admin/relations-preview" element={<AnalyseRelationsPreview />} />
          <Route path="/admin/lieux-preview" element={<AnalyseLieuxPreview />} />
          <Route path="/admin/import-rebond-individu" element={<ImportIndividusRebond />} />
          <Route path="/transcription" element={<TranscriptionEditor acteId={"0"} />} />

          <Route path="/mock/individu" element={<PageIndividu />} />
          <Route path="/mock/individu2" element={<PageIndividu2 />} />
          <Route path="/mock/individu3" element={<PageIndividu3 />} />
          <Route path="/mock/individu4" element={<PageIndividu4 />} />
          <Route path="/mock/acte1" element={<ActePreview />} />
          <Route path="/mock/activity" element={<ActivityTimeline />} />
          <Route path="/mock/acteur-dialog" element={<MockDialogActeur />} />

          <Route path="y" element={<SqlFunctionsExecutorPage />} />
          <Route path="admin/schema-sql" element={<SchemaExplorer />} />
          <Route path="admin/lieu-parsing" element={<LieuBrutCreator />} />
          <Route path="admin/logs" element={<LogsConsole />} />
          <Route path="admin/dictionnaire" element={<RefConfigPage />} />
          <Route path="/admin/parsing/mentions-toponymes" element={<MentionsToponymesTable />} />
          <Route path="/admin/parsing/professions" element={<ProfessionsTable />} />
          <Route path="/recherche" element={<SearchResultsPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  </React.StrictMode>
)
