import { createBrowserRouter, Navigate } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import LandingPage from '../pages/LandingPage'
import JournalListPage from '../pages/JournalListPage'
import JournalNewPage from '../pages/JournalNewPage'
import JournalSessionPage from '../pages/JournalSessionPage'
import JournalProposalsPage from '../pages/JournalProposalsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/journal" replace />,
  },
  {
    path: '/journal',
    element: (
      <Layout>
        <LandingPage />
      </Layout>
    ),
  },
  {
    path: '/journal/sessions',
    element: (
      <Layout>
        <JournalListPage />
      </Layout>
    ),
  },
  {
    path: '/journal/new',
    element: (
      <Layout>
        <JournalNewPage />
      </Layout>
    ),
  },
  {
    path: '/journal/session/:id',
    element: (
      <Layout>
        <JournalSessionPage />
      </Layout>
    ),
  },
  {
    path: '/journal/proposals',
    element: (
      <Layout>
        <JournalProposalsPage />
      </Layout>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/journal" replace />,
  },
])
