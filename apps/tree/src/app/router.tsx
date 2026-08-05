
import { Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import LandingPage from '../pages/LandingPage'
import LoginPage from '../pages/LoginPage'
import Layout from '../components/layout/Layout'
import TreePage from '../pages/TreePage'
import TreeNavigatePage from '../pages/TreeNavigatePage'
import TreeStatsPage from '../pages/TreeStatsPage'
import TreesListPage from '../pages/TreesListPage'
import ImportPage from '../pages/ImportPage'
import { GraphBootstrap } from '../components/GraphBootstrap'
import { LoadingScreen } from '../components/layout/LoadingScreen'

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="tree-container py-12">
      <h1 className="text-3xl font-black">{title}</h1>
      <p className="mt-3 font-medium text-slate-600">
        Page à construire.
      </p>
    </div>
  )
}

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
    path: '/trees',
    element: (
      <Layout>
        <TreesListPage />
      </Layout>
    ),
  },

  {
    path: '/import',
    element: (
      <Layout>
        <ImportPage />
      </Layout>
    ),
  },

  {
    path: '/explore',
    element: (
      <Layout>
        <PlaceholderPage title="Explorer" />
      </Layout>
    ),
  },

  {
    path: '/sources',
    element: (
      <Layout>
        <PlaceholderPage title="Sources" />
      </Layout>
    ),
  },

  {
    path: '/profil',
    element: (
      <Layout>
        <PlaceholderPage title="Profil" />
      </Layout>
    ),
  },

  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
  {
    path: '/trees/:treeId',
    element: (
      <Layout>
        <Suspense fallback={<LoadingScreen />}>
          <GraphBootstrap>
            <TreePage />
          </GraphBootstrap>
        </Suspense>
      </Layout>
    ),
  },
  {
    path: '/trees/:treeId/navigate',
    element: (
      <Layout>
        <Suspense fallback={<LoadingScreen />}>
          <GraphBootstrap>
            <TreeNavigatePage />
          </GraphBootstrap>
        </Suspense>
      </Layout>
    ),
  },
  {
    path: '/trees/:treeId/stats/:section',
    element: (
      <Layout>
        <Suspense fallback={<LoadingScreen />}>
          <GraphBootstrap>
            <TreeStatsPage />
          </GraphBootstrap>
        </Suspense>
      </Layout>
    ),
  },

])