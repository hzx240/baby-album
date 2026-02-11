import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import RootLayout from './layouts/RootLayout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ChildrenPage from './pages/children/ChildrenPage'
import PhotosPage from './pages/family/PhotosPage'
import PhotoDetailPage from './pages/family/PhotoDetailPage'
import MembersPage from './pages/family/MembersPage'
import AcceptInvitePage from './pages/family/AcceptInvitePage'
import ProtectedRoute from './components/ProtectedRoute'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// Create router
const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
      {
        path: 'children',
        element: (
          <ProtectedRoute>
            <ChildrenPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'photos',
        element: (
          <ProtectedRoute>
            <PhotosPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'photos/:photoId',
        element: (
          <ProtectedRoute>
            <PhotoDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'members',
        element: (
          <ProtectedRoute>
            <MembersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'invite',
        element: <AcceptInvitePage />,
      },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
