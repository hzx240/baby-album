import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import RootLayout from './layouts/RootLayout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import AcceptInvitePage from './pages/family/AcceptInvitePage'
import ProtectedRoute from './components/ProtectedRoute'
import { initCsrfToken } from './lib/api-client'

// 懒加载页面组件 - 按需加载减少首屏bundle大小
const ChildrenPage = lazy(() => import('./pages/children/ChildrenPage'))
const PhotosPage = lazy(() => import('./pages/family/PhotosPage'))
const PhotoDetailPage = lazy(() => import('./pages/family/PhotoDetailPage'))
const MembersPage = lazy(() => import('./pages/family/MembersPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const GrowthPage = lazy(() => import('./pages/growth/GrowthPage'))
const TimelinePage = lazy(() => import('./pages/timeline/TimelinePage'))
const AlbumsListPage = lazy(() => import('./pages/albums/AlbumsListPage'))
const AlbumDetailPage = lazy(() => import('./pages/albums/AlbumDetailPage'))
const BatchUploadPage = lazy(() => import('./pages/upload/BatchUploadPage'))

// 懒加载加载中组件
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-warm-50 to-warm-100">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-warm-200 border-t-warm-500 rounded-full animate-spin" />
      <p className="text-warm-400 animate-pulse">加载中...</p>
    </div>
  </div>
)

// Initialize CSRF token on app startup
initCsrfToken().catch((error) => {
  console.error('Failed to initialize CSRF token:', error);
});

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// Create router with lazy loading
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
            <Suspense fallback={<PageLoader />}>
              <ChildrenPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'photos',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <PhotosPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'photos/:photoId',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <PhotoDetailPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'members',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <MembersPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'invite',
        element: <AcceptInvitePage />,
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <DashboardPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'growth',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <GrowthPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'growth/:childId',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <GrowthPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'timeline',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <TimelinePage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'albums',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <AlbumsListPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'albums/:albumId',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <AlbumDetailPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'family',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <MembersPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'upload',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <BatchUploadPage />
            </Suspense>
          </ProtectedRoute>
        ),
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
