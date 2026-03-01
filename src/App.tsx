import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { CoupleProvider } from './contexts/CoupleContext';
import { DataProvider } from './contexts/DataContext';
import { AuthGuard } from './components/layout/AuthGuard';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { HabitsPage } from './pages/HabitsPage';
import { RunningPage } from './pages/RunningPage';
import { SharedPage } from './pages/SharedPage';
import { ProfilePage } from './pages/ProfilePage';
import { ROUTES } from './config/routes';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CoupleProvider>
        <DataProvider>
          <Routes>
            <Route path={ROUTES.LOGIN} element={<LoginPage />} />
            <Route
              element={
                <AuthGuard>
                  <AppLayout />
                </AuthGuard>
              }
            >
              <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
              <Route path={ROUTES.HABITS} element={<HabitsPage />} />
              <Route path={ROUTES.RUNNING} element={<RunningPage />} />
              <Route path={ROUTES.SHARED} element={<SharedPage />} />
              <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
            </Route>
            <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          </Routes>
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
      </AuthProvider>
    </BrowserRouter>
  );
}
