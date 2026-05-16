import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { ROUTES } from '@shared/constants/routes.ts';
import { AuthGuard } from '@shared/guards/auth-guard.tsx';
import { HospitalShell } from '@shared/guards/hospital-shell.tsx';
import { tokenStorage } from '@shared/helpers/token-storage.ts';

// ── Auth screens ──────────────────────────────────────────────────────────────

const LoginScreen = lazy(() =>
  import('@features/auth/features/login/screen/login-screen.tsx').then((m) => ({
    default: m.LoginScreen,
  })),
);
const RegisterScreen = lazy(() =>
  import('@features/auth/features/register/screen/register-screen.tsx').then((m) => ({
    default: m.RegisterScreen,
  })),
);
const ForgotPasswordScreen = lazy(() =>
  import('@features/auth/features/forgot-password/screen/forgot-password-screen.tsx').then((m) => ({
    default: m.ForgotPasswordScreen,
  })),
);
const ResetPasswordScreen = lazy(() =>
  import('@features/auth/features/reset-password/screen/reset-password-screen.tsx').then((m) => ({
    default: m.ResetPasswordScreen,
  })),
);
const Setup2faScreen = lazy(() =>
  import('@features/auth/features/setup-2fa/screen/setup-2fa-screen.tsx').then((m) => ({
    default: m.Setup2faScreen,
  })),
);

// ── Workspace ─────────────────────────────────────────────────────────────────

const HospitalsScreen = lazy(() =>
  import('@features/workspace/features/hospital-list/screen/hospital-list-screen.tsx').then((m) => ({
    default: m.HospitalListScreen,
  })),
);
const HospitalCreateScreen = lazy(() =>
  import('@features/workspace/features/hospital-create/screen/hospital-create-screen.tsx').then((m) => ({
    default: m.HospitalCreateScreen,
  })),
);

// ── Hospital-scoped ───────────────────────────────────────────────────────────

const HospitalDashboardScreen = lazy(() =>
  import('@features/workspace/features/hospital-dashboard/screen/hospital-dashboard-screen.tsx').then((m) => ({
    default: m.HospitalDashboardScreen,
  })),
);
const HospitalSettingsScreen = lazy(() =>
  import('@features/workspace/features/hospital-settings/screen/hospital-settings-screen.tsx').then((m) => ({
    default: m.HospitalSettingsScreen,
  })),
);

// ── Staff ─────────────────────────────────────────────────────────────────────

const StaffDirectoryScreen = lazy(() =>
  import('@features/staff/features/staff-directory/screen/staff-directory-screen.tsx').then((m) => ({
    default: m.StaffDirectoryScreen,
  })),
);
const StaffProfileScreen = lazy(() =>
  import('@features/staff/features/staff-profile/screen/staff-profile-screen.tsx').then((m) => ({
    default: m.StaffProfileScreen,
  })),
);
const StaffInviteScreen = lazy(() =>
  import('@features/staff/features/staff-invite/screen/staff-invite-screen.tsx').then((m) => ({
    default: m.StaffInviteScreen,
  })),
);
const OrgChartScreen = lazy(() =>
  import('@features/staff/features/org-chart/screen/org-chart-screen.tsx').then((m) => ({
    default: m.OrgChartScreen,
  })),
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function Lazy({ children }: { readonly children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-full min-h-screen items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-forest-900/20 border-t-forest-900" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

export function AppRoutes() {
  const isAuthenticated = tokenStorage.getAccess() !== null;

  return (
    <Routes>
      {/* Root redirect */}
      <Route
        path="/"
        element={
          isAuthenticated
            ? <Navigate to={ROUTES.HOSPITALS} replace />
            : <Navigate to={ROUTES.LOGIN} replace />
        }
      />

      {/* Auth — public */}
      <Route path={ROUTES.LOGIN} element={<Lazy><LoginScreen /></Lazy>} />
      <Route path={ROUTES.REGISTER} element={<Lazy><RegisterScreen /></Lazy>} />
      <Route path={ROUTES.FORGOT_PASSWORD} element={<Lazy><ForgotPasswordScreen /></Lazy>} />
      <Route path={ROUTES.RESET_PASSWORD} element={<Lazy><ResetPasswordScreen /></Lazy>} />
      <Route path={ROUTES.SETUP_2FA} element={<Lazy><Setup2faScreen /></Lazy>} />

      {/* Workspace — requires auth */}
      <Route
        path={ROUTES.HOSPITALS}
        element={<AuthGuard><Lazy><HospitalsScreen /></Lazy></AuthGuard>}
      />
      <Route
        path={ROUTES.HOSPITAL_CREATE}
        element={<AuthGuard><Lazy><HospitalCreateScreen /></Lazy></AuthGuard>}
      />

      {/* Hospital-scoped — requires auth + valid hospital slug */}
      <Route
        path="/h/:slug"
        element={<AuthGuard><HospitalShell /></AuthGuard>}
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Lazy><HospitalDashboardScreen /></Lazy>} />
        <Route path="settings" element={<Lazy><HospitalSettingsScreen /></Lazy>} />

        {/* Staff */}
        <Route path="staff" element={<Lazy><StaffDirectoryScreen /></Lazy>} />
        <Route path="staff/invite" element={<Lazy><StaffInviteScreen /></Lazy>} />
        <Route path="staff/org-chart" element={<Lazy><OrgChartScreen /></Lazy>} />
        <Route path="staff/:staffId" element={<Lazy><StaffProfileScreen /></Lazy>} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
