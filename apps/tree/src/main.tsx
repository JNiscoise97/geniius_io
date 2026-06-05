import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'

import { router } from './app/router'
import { GraphBootstrap } from './components/GraphBootstrap'
import { LoadingScreen } from './components/layout/LoadingScreen'

import './index.css'
import './App.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense fallback={<LoadingScreen />}>
      <GraphBootstrap>
        <Toaster richColors position="top-right" />
        <RouterProvider router={router} />
      </GraphBootstrap>
    </Suspense>
  </React.StrictMode>,
)
