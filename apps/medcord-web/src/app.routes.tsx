import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { ROUTES } from '@shared/constants/routes.ts';
import { AuthGuard } from '@shared/guards/auth-guard.tsx';
import { tokenStorage } from '@shared/helpers/token-storage.ts';
import { PlaceholderScreen } from '@features/placeholder/placeholder-screen.tsx';

// Auth screens — lazy, public
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

// Workspace — lazy (Phase 2 stubs for now)
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
        element={
          <AuthGuard>
            <Lazy><HospitalsScreen /></Lazy>
          </AuthGuard>
        }
      />
      <Route
        path={ROUTES.HOSPITAL_CREATE}
        element={
          <AuthGuard>
            <Lazy><HospitalCreateScreen /></Lazy>
          </AuthGuard>
        }
      />

      {/* Hospital-scoped routes — /h/:slug/* (Phase 2+) */}
      <Route
        path="/h/:slug/*"
        element={
          <AuthGuard>
            <PlaceholderScreen label="Hospital workspace" />
          </AuthGuard>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
