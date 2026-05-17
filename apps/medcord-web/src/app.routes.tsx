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
const EnterCodeScreen = lazy(() =>
  import('@features/auth/features/reset-password/screen/enter-code-screen.tsx').then((m) => ({
    default: m.EnterCodeScreen,
  })),
);
const NewPasswordScreen = lazy(() =>
  import('@features/auth/features/reset-password/screen/new-password-screen.tsx').then((m) => ({
    default: m.NewPasswordScreen,
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

// ── Accept invite (public) ────────────────────────────────────────────────────

const AcceptInviteScreen = lazy(() =>
  import('@features/staff/features/accept-invite/screen/accept-invite-screen.tsx').then((m) => ({
    default: m.AcceptInviteScreen,
  })),
);

// ── Staff ─────────────────────────────────────────────────────────────────────

const RolesScreen = lazy(() =>
  import('@features/staff/features/roles/screen/roles-screen.tsx').then((m) => ({
    default: m.RolesScreen,
  })),
);

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

// ── Patients ──────────────────────────────────────────────────────────────────

const PatientListScreen = lazy(() =>
  import('@features/patients/features/patient-list/screen/patient-list-screen.tsx').then((m) => ({
    default: m.PatientListScreen,
  })),
);
const TransfersScreen = lazy(() =>
  import('@features/patients/features/patient-transfers/screen/transfers-screen.tsx').then((m) => ({
    default: m.TransfersScreen,
  })),
);
const PatientRegisterScreen = lazy(() =>
  import('@features/patients/features/patient-register/screen/patient-register-screen.tsx').then((m) => ({
    default: m.PatientRegisterScreen,
  })),
);
const PatientProfileScreen = lazy(() =>
  import('@features/patients/features/patient-profile/screen/patient-profile-screen.tsx').then((m) => ({
    default: m.PatientProfileScreen,
  })),
);

// ── EMR chart ─────────────────────────────────────────────────────────────────

const ChartOverviewScreen = lazy(() =>
  import('@features/emr/features/chart-overview/screen/chart-overview-screen.tsx').then((m) => ({
    default: m.ChartOverviewScreen,
  })),
);
const VitalsScreen = lazy(() =>
  import('@features/emr/features/vitals/screen/vitals-screen.tsx').then((m) => ({
    default: m.VitalsScreen,
  })),
);
const MedicationsScreen = lazy(() =>
  import('@features/emr/features/medications/screen/medications-screen.tsx').then((m) => ({
    default: m.MedicationsScreen,
  })),
);
const HistoryScreen = lazy(() =>
  import('@features/emr/features/history/screen/history-screen.tsx').then((m) => ({
    default: m.HistoryScreen,
  })),
);
const ProceduresScreen = lazy(() =>
  import('@features/emr/features/procedures/screen/procedures-screen.tsx').then((m) => ({
    default: m.ProceduresScreen,
  })),
);
const ImmunizationsScreen = lazy(() =>
  import('@features/emr/features/immunizations/screen/immunizations-screen.tsx').then((m) => ({
    default: m.ImmunizationsScreen,
  })),
);
const DocumentsScreen = lazy(() =>
  import('@features/emr/features/documents/screen/documents-screen.tsx').then((m) => ({
    default: m.DocumentsScreen,
  })),
);
const AccessLogScreen = lazy(() =>
  import('@features/emr/features/access-log/screen/access-log-screen.tsx').then((m) => ({
    default: m.AccessLogScreen,
  })),
);

// ── Labs ──────────────────────────────────────────────────────────────────────

const LabOrdersScreen = lazy(() =>
  import('@features/labs/features/lab-orders/screen/lab-orders-screen.tsx').then((m) => ({
    default: m.LabOrdersScreen,
  })),
);
const LabOrderDetailScreen = lazy(() =>
  import('@features/labs/features/lab-orders/screen/lab-order-detail-screen.tsx').then((m) => ({
    default: m.LabOrderDetailScreen,
  })),
);
const LabResultQueueScreen = lazy(() =>
  import('@features/labs/features/lab-results/screen/lab-result-queue-screen.tsx').then((m) => ({
    default: m.LabResultQueueScreen,
  })),
);

// ── Review Queue ─────────────────────────────────────────────────────────────

const ReviewQueueScreen = lazy(() =>
  import('@features/review-queue/screen/review-queue-screen.tsx').then((m) => ({
    default: m.ReviewQueueScreen,
  })),
);
const ReviewItemScreen = lazy(() =>
  import('@features/review-queue/screen/review-item-screen.tsx').then((m) => ({
    default: m.ReviewItemScreen,
  })),
);

// ── Notifications ─────────────────────────────────────────────────────────────

const NotificationsScreen = lazy(() =>
  import('@features/notifications/screen/notifications-screen.tsx').then((m) => ({
    default: m.NotificationsScreen,
  })),
);

// ── Search ────────────────────────────────────────────────────────────────────

const SearchScreen = lazy(() =>
  import('@features/search/screen/search-screen.tsx').then((m) => ({
    default: m.SearchScreen,
  })),
);

// ── Assets ────────────────────────────────────────────────────────────────────

const AssetListScreen = lazy(() =>
  import('@features/assets/features/asset-list/screen/asset-list-screen.tsx').then((m) => ({
    default: m.AssetListScreen,
  })),
);
const AssetCreateScreen = lazy(() =>
  import('@features/assets/features/asset-create/screen/asset-create-screen.tsx').then((m) => ({
    default: m.AssetCreateScreen,
  })),
);
const AssetDetailScreen = lazy(() =>
  import('@features/assets/features/asset-detail/screen/asset-detail-screen.tsx').then((m) => ({
    default: m.AssetDetailScreen,
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
      <Route path={ROUTES.RESET_PASSWORD} element={<Lazy><EnterCodeScreen /></Lazy>} />
      <Route path={ROUTES.RESET_PASSWORD_NEW} element={<Lazy><NewPasswordScreen /></Lazy>} />
      <Route path={ROUTES.SETUP_2FA} element={<Lazy><Setup2faScreen /></Lazy>} />
      <Route path="/invitations/:token" element={<Lazy><AcceptInviteScreen /></Lazy>} />

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
        <Route path="staff/roles" element={<Lazy><RolesScreen /></Lazy>} />
        <Route path="staff/:staffId" element={<Lazy><StaffProfileScreen /></Lazy>} />

        {/* Patients */}
        <Route path="patients" element={<Lazy><PatientListScreen /></Lazy>} />
        <Route path="patients/register" element={<Lazy><PatientRegisterScreen /></Lazy>} />
        <Route path="patients/transfers" element={<Lazy><TransfersScreen /></Lazy>} />
        <Route path="patients/:code" element={<Lazy><PatientProfileScreen /></Lazy>} />

        {/* EMR Chart */}
        <Route path="patients/:code/chart" element={<Lazy><ChartOverviewScreen /></Lazy>} />
        <Route path="patients/:code/chart/vitals" element={<Lazy><VitalsScreen /></Lazy>} />
        <Route path="patients/:code/chart/medications" element={<Lazy><MedicationsScreen /></Lazy>} />
        <Route path="patients/:code/chart/history" element={<Lazy><HistoryScreen /></Lazy>} />
        <Route path="patients/:code/chart/procedures" element={<Lazy><ProceduresScreen /></Lazy>} />
        <Route path="patients/:code/chart/immunizations" element={<Lazy><ImmunizationsScreen /></Lazy>} />
        <Route path="patients/:code/chart/documents" element={<Lazy><DocumentsScreen /></Lazy>} />
        <Route path="patients/:code/chart/audit" element={<Lazy><AccessLogScreen /></Lazy>} />

        {/* Labs */}
        <Route path="labs" element={<Lazy><LabOrdersScreen /></Lazy>} />
        <Route path="labs/results" element={<Lazy><LabResultQueueScreen /></Lazy>} />
        <Route path="labs/:orderId" element={<Lazy><LabOrderDetailScreen /></Lazy>} />

        {/* Review Queue */}
        <Route path="review" element={<Lazy><ReviewQueueScreen /></Lazy>} />
        <Route path="review/:itemId" element={<Lazy><ReviewItemScreen /></Lazy>} />

        {/* Notifications */}
        <Route path="notifications" element={<Lazy><NotificationsScreen /></Lazy>} />

        {/* Search */}
        <Route path="search" element={<Lazy><SearchScreen /></Lazy>} />

        {/* Assets */}
        <Route path="assets" element={<Lazy><AssetListScreen /></Lazy>} />
        <Route path="assets/new" element={<Lazy><AssetCreateScreen /></Lazy>} />
        <Route path="assets/:assetId" element={<Lazy><AssetDetailScreen /></Lazy>} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
