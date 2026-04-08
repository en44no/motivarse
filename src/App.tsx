import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { CoupleProvider } from './contexts/CoupleContext';
import { DataProvider } from './contexts/DataContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthGuard } from './components/layout/AuthGuard';
import { AppLayout } from './components/layout/AppLayout';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { CardSkeleton } from './components/ui/Skeleton';
import { DashboardPage } from './pages/DashboardPage';
import { HabitsPage } from './pages/HabitsPage';
import { ROUTES } from './config/routes';

function lazyRetry<T extends { [key: string]: any }>(
  factory: () => Promise<T>,
  retries = 2
): Promise<T> {
  return factory().catch((err) => {
    if (retries > 0) {
      return new Promise<T>((resolve) => setTimeout(() => resolve(lazyRetry(factory, retries - 1)), 1000));
    }
    throw err;
  });
}

const LoginPage = lazy(() => lazyRetry(() => import('./pages/LoginPage')).then((m) => ({ default: m.LoginPage })));
const RunningPage = lazy(() => lazyRetry(() => import('./pages/RunningPage')).then((m) => ({ default: m.RunningPage })));
const SharedPage = lazy(() => lazyRetry(() => import('./pages/SharedPage')).then((m) => ({ default: m.SharedPage })));
const ProfilePage = lazy(() => lazyRetry(() => import('./pages/ProfilePage')).then((m) => ({ default: m.ProfilePage })));
const JournalPage = lazy(() => lazyRetry(() => import('./pages/JournalPage')).then((m) => ({ default: m.JournalPage })));
const MonthlyInsightsPage = lazy(() => lazyRetry(() => import('./pages/MonthlyInsightsPage')).then((m) => ({ default: m.MonthlyInsightsPage })));
const ExpensesPage = lazy(() => lazyRetry(() => import('./pages/ExpensesPage')).then((m) => ({ default: m.ExpensesPage })));

function PageSkeleton() {
  return (
    <div className="space-y-4 py-4">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
}

function AppRoutes() {
  const location = useLocation();
  return (
    <ErrorBoundary resetKey={location.pathname}>
      <Routes>
        <Route path={ROUTES.LOGIN} element={<Suspense fallback={<PageSkeleton />}><LoginPage /></Suspense>} />
        <Route
          element={
            <AuthGuard>
              <AppLayout />
            </AuthGuard>
          }
        >
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.HABITS} element={<HabitsPage />} />
          <Route path={ROUTES.RUNNING} element={<Suspense fallback={<PageSkeleton />}><RunningPage /></Suspense>} />
          <Route path={ROUTES.SHARED} element={<Suspense fallback={<PageSkeleton />}><SharedPage /></Suspense>} />
          <Route path={ROUTES.PROFILE} element={<Suspense fallback={<PageSkeleton />}><ProfilePage /></Suspense>} />
          <Route path={ROUTES.JOURNAL} element={<Suspense fallback={<PageSkeleton />}><JournalPage /></Suspense>} />
          <Route path={ROUTES.INSIGHTS} element={<Suspense fallback={<PageSkeleton />}><MonthlyInsightsPage /></Suspense>} />
          <Route path={ROUTES.EXPENSES} element={<Suspense fallback={<PageSkeleton />}><ExpensesPage /></Suspense>} />
        </Route>
        <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
        <CoupleProvider>
        <DataProvider>
          <AppRoutes />
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                fontSize: '14px',
              },
            }}
          />
        </DataProvider>
        </CoupleProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
