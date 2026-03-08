import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { AuthProvider, useAuth } from '@/auth/context';
import { RequireAuth } from '@/auth/guards/RequireAuth';
import { RequireRole } from '@/auth/guards/RequireRole';
import { getRoleHomePath } from '@/auth/routing';
import SurveyPage from '@/pages/SurveyPage';
import Login from '@/pages/Login';
import NotFound from '@/pages/NotFound';
import { Loader2 } from 'lucide-react';
import PublicLandingPage from '@/pages/PublicLandingPage';
import Signup from '@/pages/Signup';
import AdminLogin from '@/pages/AdminLogin';
import SubscriberInvitePage from '@/pages/SubscriberInvitePage';

const SubscriberDashboardPage = lazy(() => import('@/pages/SubscriberDashboardPage'));
const AdminUsersPage = lazy(() => import('@/pages/AdminUsersPage'));
const AdminUnrecognizedEntriesPage = lazy(() => import('@/pages/AdminUnrecognizedEntriesPage'));
const AdminSubscribersPage = lazy(() => import('@/pages/AdminSubscribersPage'));
const AdminQuestionnairesPage = lazy(() => import('@/pages/AdminQuestionnairesPage'));
const AdminPanelsPage = lazy(() => import('@/pages/AdminPanelsPage'));
const AdminReportsPage = lazy(() => import('@/pages/AdminReportsPage'));
const SubscriberReportsPage = lazy(() => import('@/pages/SubscriberReportsPage'));
const SubscriberPendingPage = lazy(() => import('@/pages/SubscriberPendingPage'));
const AdminAliasesPage = lazy(() => import('@/pages/AdminAliasesPage'));
const AdminRafflesPage = lazy(() => import('@/pages/AdminRafflesPage'));
const AdminSubscriberViewPage = lazy(() => import('@/pages/AdminSubscriberViewPage'));

const queryClient = new QueryClient();

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center space-y-4">
      <Loader2 size={48} className="animate-spin mx-auto text-primary" />
      <p className="text-muted-foreground">Authenticating...</p>
    </div>
  </div>
);

const RoleRedirect: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state } = useAuth();

  if (state.isLoading) return <LoadingScreen />;

  if (!state.isAuthenticated || !state.user) {
    return <>{children}</>;
  }

  return <Navigate to={getRoleHomePath(state.user.role)} replace />;
};

const PublicSurveyGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state } = useAuth();

  if (state.isLoading) return <LoadingScreen />;

  if (state.isAuthenticated && state.user) {
    return <Navigate to={getRoleHomePath(state.user.role)} replace />;
  }

  return <>{children}</>;
};

const AdminSurveyGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state } = useAuth();

  if (state.isLoading) return <LoadingScreen />;

  if (state.isAuthenticated && state.user && state.user.role === 'admin') {
    return <>{children}</>;
  }

  return <Navigate to="/" replace />;
};

const AppRoutes: React.FC = () => (
  <Routes>
    <Route
      path="/"
      element={
        <RoleRedirect>
          <PublicLandingPage />
        </RoleRedirect>
      }
    />

    <Route
      path="/survey/:country"
      element={
        <PublicSurveyGate>
          <SurveyPage />
        </PublicSurveyGate>
      }
    />
    <Route
      path="/survey/:country/:wave"
      element={
        <PublicSurveyGate>
          <SurveyPage />
        </PublicSurveyGate>
      }
    />
    <Route
      path="/admin/survey/:country"
      element={
        <AdminSurveyGate>
          <SurveyPage />
        </AdminSurveyGate>
      }
    />
    <Route
      path="/admin/survey/:country/:wave"
      element={
        <AdminSurveyGate>
          <SurveyPage />
        </AdminSurveyGate>
      }
    />

    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />
    <Route path="/admin/login" element={<AdminLogin />} />
    <Route path="/invite/:token" element={<SubscriberInvitePage />} />

    <Route
      path="/admin"
      element={
        <RequireAuth redirectTo="/admin/login">
          <RequireRole allowedRoles={['admin']}>
            <Suspense fallback={<LoadingScreen />}>
              <AdminSubscriberViewPage />
            </Suspense>
          </RequireRole>
        </RequireAuth>
      }
    />
    <Route
      path="/admin/users"
      element={
        <RequireAuth redirectTo="/admin/login">
          <RequireRole allowedRoles={['admin']}>
            <Suspense fallback={<LoadingScreen />}>
              <AdminUsersPage />
            </Suspense>
          </RequireRole>
        </RequireAuth>
      }
    />
    <Route
      path="/admin/unrecognized"
      element={
        <RequireAuth redirectTo="/admin/login">
          <RequireRole allowedRoles={['admin']}>
            <Suspense fallback={<LoadingScreen />}>
              <AdminUnrecognizedEntriesPage />
            </Suspense>
          </RequireRole>
        </RequireAuth>
      }
    />
    <Route
      path="/admin/subscribers"
      element={
        <RequireAuth redirectTo="/admin/login">
          <RequireRole allowedRoles={['admin']}>
            <Suspense fallback={<LoadingScreen />}>
              <AdminSubscribersPage />
            </Suspense>
          </RequireRole>
        </RequireAuth>
      }
    />
    <Route
      path="/admin/questionnaires"
      element={
        <RequireAuth redirectTo="/admin/login">
          <RequireRole allowedRoles={['admin']}>
            <Suspense fallback={<LoadingScreen />}>
              <AdminQuestionnairesPage />
            </Suspense>
          </RequireRole>
        </RequireAuth>
      }
    />
    <Route
      path="/admin/panels"
      element={
        <RequireAuth redirectTo="/admin/login">
          <RequireRole allowedRoles={['admin']}>
            <Suspense fallback={<LoadingScreen />}>
              <AdminPanelsPage />
            </Suspense>
          </RequireRole>
        </RequireAuth>
      }
    />
    <Route
      path="/admin/reports"
      element={
        <RequireAuth redirectTo="/admin/login">
          <RequireRole allowedRoles={['admin']}>
            <Suspense fallback={<LoadingScreen />}>
              <AdminReportsPage />
            </Suspense>
          </RequireRole>
        </RequireAuth>
      }
    />
    <Route
      path="/admin/aliases"
      element={
        <RequireAuth redirectTo="/admin/login">
          <RequireRole allowedRoles={['admin']}>
            <Suspense fallback={<LoadingScreen />}>
              <AdminAliasesPage />
            </Suspense>
          </RequireRole>
        </RequireAuth>
      }
    />
    <Route
      path="/admin/raffles"
      element={
        <RequireAuth redirectTo="/admin/login">
          <RequireRole allowedRoles={['admin']}>
            <Suspense fallback={<LoadingScreen />}>
              <AdminRafflesPage />
            </Suspense>
          </RequireRole>
        </RequireAuth>
      }
    />
    <Route
      path="/admin/subscriber-view"
      element={<Navigate to="/admin" replace />}
    />

    <Route
      path="/dashboard"
      element={
        <RequireAuth>
          <RequireRole allowedRoles={['subscriber']}>
            <Suspense fallback={<LoadingScreen />}>
              <SubscriberDashboardPage />
            </Suspense>
          </RequireRole>
        </RequireAuth>
      }
    />
    <Route
      path="/dashboard/pending"
      element={
        <RequireAuth>
          <RequireRole allowedRoles={['subscriber']}>
            <Suspense fallback={<LoadingScreen />}>
              <SubscriberPendingPage />
            </Suspense>
          </RequireRole>
        </RequireAuth>
      }
    />
    <Route
      path="/dashboard/:country"
      element={
        <RequireAuth>
          <RequireRole allowedRoles={['subscriber']}>
            <Suspense fallback={<LoadingScreen />}>
              <SubscriberDashboardPage />
            </Suspense>
          </RequireRole>
        </RequireAuth>
      }
    />
    <Route
      path="/dashboard/reports"
      element={
        <RequireAuth>
          <RequireRole allowedRoles={['subscriber']}>
            <Suspense fallback={<LoadingScreen />}>
              <SubscriberReportsPage />
            </Suspense>
          </RequireRole>
        </RequireAuth>
      }
    />

    <Route path="/survey" element={<Navigate to="/" replace />} />
    <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />
    <Route path="/subscriber/dashboard" element={<Navigate to="/dashboard" replace />} />

    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
