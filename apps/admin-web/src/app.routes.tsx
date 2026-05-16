import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { ADMIN_ROUTES } from '@shared/constants/routes.ts';
import { AdminGuard } from '@shared/guards/admin-guard.tsx';
import { AdminShell } from '@shared/widgets/admin-shell/admin-shell.tsx';

// ── Auth ──────────────────────────────────────────────────────────────────────

const AdminLoginScreen = lazy(() =>
  import('@features/auth/screen/admin-login-screen.tsx').then((m) => ({
    default: m.AdminLoginScreen,
  })),
);

// ── Dashboard ─────────────────────────────────────────────────────────────────

const AdminDashboardScreen = lazy(() =>
  import('@features/dashboard/screen/admin-dashboard-screen.tsx').then((m) => ({
    default: m.AdminDashboardScreen,
  })),
);

// ── Hospitals ─────────────────────────────────────────────────────────────────

const HospitalListScreen = lazy(() =>
  import('@features/hospitals/screen/hospital-list-screen.tsx').then((m) => ({
    default: m.HospitalListScreen,
  })),
);

const HospitalDetailScreen = lazy(() =>
  import('@features/hospitals/screen/hospital-detail-screen.tsx').then((m) => ({
    default: m.HospitalDetailScreen,
  })),
);

// ── Users ─────────────────────────────────────────────────────────────────────

const UserListScreen = lazy(() =>
  import('@features/users/screen/user-list-screen.tsx').then((m) => ({
    default: m.UserListScreen,
  })),
);

const UserDetailScreen = lazy(() =>
  import('@features/users/screen/user-detail-screen.tsx').then((m) => ({
    default: m.UserDetailScreen,
  })),
);

// ── Lazy wrapper ──────────────────────────────────────────────────────────────

function Lazy({ children }: { readonly children: ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}

// ── Routes ────────────────────────────────────────────────────────────────────

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path={ADMIN_ROUTES.LOGIN}
        element={<Lazy><AdminLoginScreen /></Lazy>}
      />

      <Route element={<AdminGuard><AdminShell /></AdminGuard>}>
        <Route index element={<Navigate to={ADMIN_ROUTES.DASHBOARD} replace />} />
        <Route
          path={ADMIN_ROUTES.DASHBOARD}
          element={<Lazy><AdminDashboardScreen /></Lazy>}
        />
        <Route
          path={ADMIN_ROUTES.HOSPITALS}
          element={<Lazy><HospitalListScreen /></Lazy>}
        />
        <Route
          path={ADMIN_ROUTES.HOSPITAL_DETAIL(':hospitalId')}
          element={<Lazy><HospitalDetailScreen /></Lazy>}
        />
        <Route
          path={ADMIN_ROUTES.USERS}
          element={<Lazy><UserListScreen /></Lazy>}
        />
        <Route
          path={ADMIN_ROUTES.USER_DETAIL(':userId')}
          element={<Lazy><UserDetailScreen /></Lazy>}
        />
      </Route>

      <Route path="*" element={<Navigate to={ADMIN_ROUTES.DASHBOARD} replace />} />
    </Routes>
  );
}
