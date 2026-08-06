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
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
