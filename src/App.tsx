import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from '@/components/layout/app-shell';
import { PageSkeleton } from '@/components/layout/page';
import { FullScreenLoader, BackendUnavailable } from '@/components/layout/boot';
import { useAuth } from '@/hooks/use-auth';
import LoginPage from '@/pages/login';
import DashboardPage from '@/pages/dashboard';
import ApplicationsPage from '@/pages/applications';
import ApplicationDetailPage from '@/pages/application-detail';
import InboxPage from '@/pages/inbox';
import NotFoundPage from '@/pages/not-found';

// Heavy pages are code-split
const CalendarPage = lazy(() => import('@/pages/calendar'));
const KanbanPage = lazy(() => import('@/pages/kanban'));
const CompaniesPage = lazy(() => import('@/pages/companies'));
const CompanyDetailPage = lazy(() => import('@/pages/company-detail'));
const AnalyticsPage = lazy(() => import('@/pages/analytics'));
const SettingsLayout = lazy(() => import('@/pages/settings/layout'));
const GeneralSettingsPage = lazy(() => import('@/pages/settings/general'));
const EmailAccountsPage = lazy(() => import('@/pages/settings/email-accounts'));

function RequireAuth() {
  const { user, isLoading, probeError, retry } = useAuth();
  const location = useLocation();
  if (isLoading) return <FullScreenLoader />;
  if (probeError && !user) return <BackendUnavailable error={probeError} onRetry={retry} />;
  if (!user) {
    const from = location.pathname + location.search;
    return <Navigate to={`/login${from && from !== '/' ? `?from=${encodeURIComponent(from)}` : ''}`} replace />;
  }
  return <Outlet />;
}

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageSkeleton />}>{children}</Suspense>;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="applications" element={<ApplicationsPage />} />
          <Route path="applications/:id" element={<ApplicationDetailPage />} />
          <Route path="inbox" element={<InboxPage />} />
          <Route path="calendar" element={<Lazy><CalendarPage /></Lazy>} />
          <Route path="kanban" element={<Lazy><KanbanPage /></Lazy>} />
          <Route path="companies" element={<Lazy><CompaniesPage /></Lazy>} />
          <Route path="companies/:id" element={<Lazy><CompanyDetailPage /></Lazy>} />
          <Route path="analytics" element={<Lazy><AnalyticsPage /></Lazy>} />
          <Route path="settings" element={<Lazy><SettingsLayout /></Lazy>}>
            <Route index element={<Navigate to="/settings/general" replace />} />
            <Route path="general" element={<Lazy><GeneralSettingsPage /></Lazy>} />
            <Route path="email-accounts" element={<Lazy><EmailAccountsPage /></Lazy>} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
