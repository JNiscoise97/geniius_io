import { createBrowserRouter, Navigate } from 'react-router-dom'
import LandingPage from '../pages/LandingPage'
import LoginPage from '../pages/LoginPage'
import DashboardPage from '../pages/DashboardPage'
import PatrimoineDocumentairePage from '../pages/PatrimoineDocumentairePage'
import ReferenceWizardPage from '../pages/ReferenceWizardPage'
import DocumentDetailPage from '../pages/DocumentDetailPage'
import EnrichirExemplaireActePage from '../pages/EnrichirExemplaireActePage'
import PlateformeDetailPage from '../pages/PlateformeDetailPage'
import InstitutionDetailPage from '../pages/InstitutionDetailPage'
import AtelierDocumentairePage from '../pages/AtelierDocumentairePage'
import AtelierExemplairesPage from '../pages/AtelierExemplairesPage'
import TranscriptionEditorPage from '../pages/TranscriptionEditorPage'
import ExtractionPage from '../pages/ExtractionPage'
import ExtractionHubPage from '../pages/ExtractionHubPage'
import EntitesHubPage from '../pages/EntitesHubPage'
import EntiteDetailPage from '../pages/EntiteDetailPage'
import ReconciliationPage from '../pages/ReconciliationPage'
import Layout from '../components/layout/Layout'

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Layout>
        <LandingPage />
      </Layout>
    ),
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/dashboard',
    element: (
      <Layout>
        <DashboardPage />
      </Layout>
    ),
  },
  {
    path: '/patrimoine-documentaire',
    element: (
      <Layout>
        <PatrimoineDocumentairePage />
      </Layout>
    ),
  },
  {
    path: '/referencer',
    element: (
      <Layout>
        <ReferenceWizardPage />
      </Layout>
    ),
  },
  {
    path: '/documents/:id',
    element: (
      <Layout>
        <DocumentDetailPage />
      </Layout>
    ),
  },
  {
    path: '/exemplaires/:citationId',
    element: (
      <Layout>
        <EnrichirExemplaireActePage />
      </Layout>
    ),
  },
  {
    path: '/plateformes/:plateformeId',
    element: (
      <Layout>
        <PlateformeDetailPage />
      </Layout>
    ),
  },
  {
    path: '/institutions/:institutionId',
    element: (
      <Layout>
        <InstitutionDetailPage />
      </Layout>
    ),
  },
  {
    path: '/atelier-documentaire',
    element: (
      <Layout>
        <AtelierDocumentairePage />
      </Layout>
    ),
  },
  {
    path: '/atelier-documentaire/documents/:id',
    element: (
      <Layout>
        <AtelierExemplairesPage />
      </Layout>
    ),
  },
  {
    path: '/atelier-documentaire/exemplaires/:exemplaireId',
    element: (
      <Layout>
        <TranscriptionEditorPage />
      </Layout>
    ),
  },
  {
    path: '/atelier-documentaire/exemplaires/:exemplaireId/versions/:versionId/extraction',
    element: (
      <Layout>
        <ExtractionPage />
      </Layout>
    ),
  },
  {
    path: '/extraction',
    element: (
      <Layout>
        <ExtractionHubPage />
      </Layout>
    ),
  },
  {
    path: '/entites',
    element: (
      <Layout>
        <EntitesHubPage />
      </Layout>
    ),
  },
  {
    path: '/entites/:entityId',
    element: (
      <Layout>
        <EntiteDetailPage />
      </Layout>
    ),
  },
  {
    path: '/reconciliation',
    element: (
      <Layout>
        <ReconciliationPage />
      </Layout>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
