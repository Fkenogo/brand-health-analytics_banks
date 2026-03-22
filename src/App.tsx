import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { AuthProvider, useAuth } from '@/auth/context';
import { RequireAuth } from '@/auth/guards/RequireAuth';
import { RequireRole } from '@/auth/guards/RequireRole';
import { RequireAdminAccess } from '@/auth/guards/RequireAdminAccess';
import { getRoleHomePath } from '@/auth/routing';
import SurveyPage from '@/pages/SurveyPage';
import Login from '@/pages/Login';
import NotFound from '@/pages/NotFound';
import { Loader2 } from 'lucide-react';
import PublicLandingPage from '@/pages/PublicLandingPage';
import SurveyLandingPage from '@/pages/SurveyLandingPage';
import MethodologyPage from '@/pages/MethodologyPage';
import CoveragePage from '@/pages/CoveragePage';
import DemoDashboardPage from '@/pages/DemoDashboardPage';
import Signup from '@/pages/Signup';
import AdminLogin from '@/pages/AdminLogin';
import SubscriberInvitePage from '@/pages/SubscriberInvitePage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';

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
const AdminSubscriptionManagementPage = lazy(() => import('@/pages/AdminSubscriptionManagementPage'));

const queryClient = new QueryClient();
const VALID_SURVEY_COUNTRIES = new Set(['rwanda', 'uganda', 'burundi']);

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center space-y-4">
      <Loader2 size={48} className="animate-spin mx-auto text-primary" />
      <p className="text-muted-foreground">Authenticating...</p>
    </div>
  </div>
);

const canUseAdminSurveyMode = (state: ReturnType<typeof useAuth>['state']) =>
  state.isAuthenticated
  && Boolean(state.user)
  && state.user?.role === 'admin'
  && state.user?.hasAdminClaim === true;

const RoleRedirect: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state } = useAuth();

  if (!state.isAuthenticated || !state.user) {
    return <>{children}</>;
  }

  return <Navigate to={getRoleHomePath(state.user.role)} replace />;
};

const PublicSurveyGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state } = useAuth();

  if (canUseAdminSurveyMode(state)) {
    return <>{children}</>;
  }

  if (state.isAuthenticated && state.user) {
    return <Navigate to={getRoleHomePath(state.user.role)} replace />;
  }

  return <>{children}</>;
};

const AdminSurveyGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state } = useAuth();

  if (state.isLoading) return <LoadingScreen />;

  if (canUseAdminSurveyMode(state)) {
    return <>{children}</>;
  }

  return <Navigate to="/" replace />;
};

const LegacySurveyRedirect: React.FC = () => {
  const { country, wave } = useParams<{ country: string; wave?: string }>();
  const normalizedCountry = String(country || '').toLowerCase();
  if (!VALID_SURVEY_COUNTRIES.has(normalizedCountry)) {
    return <Navigate to="/survey" replace />;
  }
  const target = wave ? `/survey/start/${country}/${wave}` : `/survey/start/${country}`;
  return <Navigate to={target} replace />;
};

const ValidatedSurveyStartRoute: React.FC = () => {
  const { country } = useParams<{ country?: string }>();
  const normalizedCountry = String(country || '').toLowerCase();

  if (country && !VALID_SURVEY_COUNTRIES.has(normalizedCountry)) {
    return <Navigate to="/survey" replace />;
  }

  return <SurveyPage />;
};

export const AppRoutes: React.FC = () => (
  <Routes>
    <Route
      path="/"
      element={
        <RoleRedirect>
          <PublicLandingPage />
        </RoleRedirect>
      }
    />
    <Route path="/insights" element={<Navigate to="/#insights" replace />} />
    <Route path="/methodology" element={<MethodologyPage />} />
    <Route path="/coverage" element={<CoveragePage />} />
    <Route path="/demo" element={<DemoDashboardPage />} />

    <Route
      path="/survey"
      element={
        <PublicSurveyGate>
          <SurveyLandingPage />
        </PublicSurveyGate>
      }
    />
    <Route
      path="/survey/start"
      element={
        <PublicSurveyGate>
          <Navigate to="/survey" replace />
        </PublicSurveyGate>
      }
    />
    <Route
      path="/survey/start/:country"
      element={
        <PublicSurveyGate>
          <ValidatedSurveyStartRoute />
        </PublicSurveyGate>
      }
    />
    <Route
      path="/survey/start/:country/:wave"
      element={
        <PublicSurveyGate>
          <ValidatedSurveyStartRoute />
        </PublicSurveyGate>
      }
    />
    <Route path="/survey/:country" element={<LegacySurveyRedirect />} />
    <Route path="/survey/:country/:wave" element={<LegacySurveyRedirect />} />
    <Route
      path="/admin/survey"
      element={
        <AdminSurveyGate>
          <Navigate to="/survey" replace />
        </AdminSurveyGate>
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
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="/get-started" element={<Signup />} />
    <Route path="/signup" element={<Signup />} />
    <Route path="/admin/login" element={<AdminLogin />} />
    <Route path="/invite/:token" element={<SubscriberInvitePage />} />

    <Route
      path="/admin"
      element={
        <RequireAuth redirectTo="/admin/login">
          <RequireAdminAccess>
            <Suspense fallback={<LoadingScreen />}>
              <AdminSubscriberViewPage />
            </Suspense>
          </RequireAdminAccess>
        </RequireAuth>
      }
    />
    <Route
      path="/admin/users"
      element={
        <RequireAuth redirectTo="/admin/login">
          <RequireAdminAccess>
            <Suspense fallback={<LoadingScreen />}>
              <AdminUsersPage />
            </Suspense>
          </RequireAdminAccess>
        </RequireAuth>
      }
    />
    <Route
      path="/admin/unrecognized"
      element={
        <RequireAuth redirectTo="/admin/login">
          <RequireAdminAccess>
            <Suspense fallback={<LoadingScreen />}>
              <AdminUnrecognizedEntriesPage />
            </Suspense>
          </RequireAdminAccess>
        </RequireAuth>
      }
    />
    <Route
      path="/admin/subscribers"
      element={
        <RequireAuth redirectTo="/admin/login">
          <RequireAdminAccess>
            <Suspense fallback={<LoadingScreen />}>
              <AdminSubscribersPage />
            </Suspense>
          </RequireAdminAccess>
        </RequireAuth>
      }
    />
    <Route
      path="/admin/subscriptions"
      element={
        <RequireAuth redirectTo="/admin/login">
          <RequireAdminAccess>
            <Suspense fallback={<LoadingScreen />}>
              <AdminSubscriptionManagementPage />
            </Suspense>
          </RequireAdminAccess>
        </RequireAuth>
      }
    />
    <Route
      path="/admin/questionnaires"
      element={
        <RequireAuth redirectTo="/admin/login">
          <RequireAdminAccess>
            <Suspense fallback={<LoadingScreen />}>
              <AdminQuestionnairesPage />
            </Suspense>
          </RequireAdminAccess>
        </RequireAuth>
      }
    />
    <Route
      path="/admin/panels"
      element={
        <RequireAuth redirectTo="/admin/login">
          <RequireAdminAccess>
            <Suspense fallback={<LoadingScreen />}>
              <AdminPanelsPage />
            </Suspense>
          </RequireAdminAccess>
        </RequireAuth>
      }
    />
    <Route
      path="/admin/reports"
      element={
        <RequireAuth redirectTo="/admin/login">
          <RequireAdminAccess>
            <Suspense fallback={<LoadingScreen />}>
              <AdminReportsPage />
            </Suspense>
          </RequireAdminAccess>
        </RequireAuth>
      }
    />
    <Route
      path="/admin/aliases"
      element={
        <RequireAuth redirectTo="/admin/login">
          <RequireAdminAccess>
            <Suspense fallback={<LoadingScreen />}>
              <AdminAliasesPage />
            </Suspense>
          </RequireAdminAccess>
        </RequireAuth>
      }
    />
    <Route
      path="/admin/raffles"
      element={
        <RequireAuth redirectTo="/admin/login">
          <RequireAdminAccess>
            <Suspense fallback={<LoadingScreen />}>
              <AdminRafflesPage />
            </Suspense>
          </RequireAdminAccess>
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
