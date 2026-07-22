import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { GuestRoute, ProtectedRoute, AdminRoute, EmployerRoute, SuperAdminRoute } from '@/components/auth/RouteGuards';

const HomePage = lazy(() =>
  import('@/pages/HomePage').then((m) => ({ default: m.HomePage })),
);
const JobsBrowsePage = lazy(() =>
  import('@/pages/JobsBrowsePage').then((m) => ({ default: m.JobsBrowsePage })),
);
const JobDetailPage = lazy(() =>
  import('@/pages/JobDetailPage').then((m) => ({ default: m.JobDetailPage })),
);
const LoginPage = lazy(() =>
  import('@/pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import('@/pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })),
);
const EmployerRegisterPage = lazy(() =>
  import('@/pages/auth/EmployerRegisterPage').then((m) => ({ default: m.EmployerRegisterPage })),
);
const ForgotPasswordPage = lazy(() =>
  import('@/pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })),
);
const VerifyEmailPage = lazy(() =>
  import('@/pages/auth/VerifyEmailPage').then((m) => ({ default: m.VerifyEmailPage })),
);
const AuthCallbackPage = lazy(() =>
  import('@/pages/auth/AuthCallbackPage').then((m) => ({ default: m.AuthCallbackPage })),
);
const ResetPasswordPage = lazy(() =>
  import('@/pages/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })),
);
const ApplicantDashboardPage = lazy(() =>
  import('@/pages/dashboard/ApplicantDashboardPage').then((m) => ({
    default: m.ApplicantDashboardPage,
  })),
);
const EmployerDashboardPage = lazy(() =>
  import('@/pages/dashboard/EmployerDashboardPage').then((m) => ({
    default: m.EmployerDashboardPage,
  })),
);
const ApplicationsPage = lazy(() =>
  import('@/pages/dashboard/ApplicationsPage').then((m) => ({ default: m.ApplicationsPage })),
);
const ApplicationDetailPage = lazy(() =>
  import('@/pages/dashboard/ApplicationDetailPage').then((m) => ({
    default: m.ApplicationDetailPage,
  })),
);
const DocumentsPage = lazy(() =>
  import('@/pages/dashboard/DocumentsPage').then((m) => ({ default: m.DocumentsPage })),
);
const AdminApplicationsPage = lazy(() =>
  import('@/pages/admin/AdminApplicationsPage').then((m) => ({
    default: m.AdminApplicationsPage,
  })),
);
const SuperAdminDashboardPage = lazy(() =>
  import('@/pages/admin/SuperAdminDashboardPage').then((m) => ({
    default: m.SuperAdminDashboardPage,
  })),
);
const ApplyWizardPage = lazy(() =>
  import('@/pages/apply/ApplyWizardPage').then((m) => ({ default: m.ApplyWizardPage })),
);
const CvPreparationPage = lazy(() =>
  import('@/pages/dashboard/CvServicePages').then((m) => ({ default: m.CvPreparationPage })),
);
const CvPaymentPage = lazy(() =>
  import('@/pages/dashboard/CvServicePages').then((m) => ({ default: m.CvPaymentPage })),
);
const CvStatusPage = lazy(() =>
  import('@/pages/dashboard/CvServicePages').then((m) => ({ default: m.CvStatusPage })),
);
const CountriesIndexPage = lazy(() =>
  import('@/pages/CountriesIndexPage').then((m) => ({ default: m.CountriesIndexPage })),
);
const CountryDetailPage = lazy(() =>
  import('@/pages/CountryDetailPage').then((m) => ({ default: m.CountryDetailPage })),
);
const ServicesPage = lazy(() =>
  import('@/pages/ServicesPage').then((m) => ({ default: m.ServicesPage })),
);
const LegalPage = lazy(() =>
  import('@/pages/LegalPage').then((m) => ({ default: m.LegalPage })),
);
const AdminReportsPage = lazy(() =>
  import('@/pages/admin/AdminReportsPage').then((m) => ({ default: m.AdminReportsPage })),
);
const AdminJobsPage = lazy(() =>
  import('@/pages/admin/AdminJobsPage').then((m) => ({ default: m.AdminJobsPage })),
);
const AdminEmployersPage = lazy(() =>
  import('@/pages/admin/AdminEmployersPage').then((m) => ({ default: m.AdminEmployersPage })),
);
const PaymentsPage = lazy(() =>
  import('@/pages/dashboard/PaymentsPage').then((m) => ({ default: m.PaymentsPage })),
);
const SavedJobsPage = lazy(() =>
  import('@/pages/dashboard/SavedJobsPage').then((m) => ({ default: m.SavedJobsPage })),
);
const MessagesPage = lazy(() =>
  import('@/pages/dashboard/MessagesPage').then((m) => ({ default: m.MessagesPage })),
);
const ApplicantCalendarPage = lazy(() =>
  import('@/pages/dashboard/ApplicantCalendarPage').then((m) => ({
    default: m.ApplicantCalendarPage,
  })),
);
const AccountSettingsPage = lazy(() =>
  import('@/pages/dashboard/AccountSettingsPage').then((m) => ({
    default: m.AccountSettingsPage,
  })),
);
const AdminUsersPage = lazy(() =>
  import('@/pages/admin/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })),
);
const AdminCountriesPage = lazy(() =>
  import('@/pages/admin/AdminCountriesPage').then((m) => ({ default: m.AdminCountriesPage })),
);
const AdminCampaignsPage = lazy(() =>
  import('@/pages/admin/AdminCampaignsPage').then((m) => ({ default: m.AdminCampaignsPage })),
);
const AdminPaymentsPage = lazy(() =>
  import('@/pages/admin/AdminPaymentsPage').then((m) => ({ default: m.AdminPaymentsPage })),
);
const AdminAuditPage = lazy(() =>
  import('@/pages/admin/AdminAuditPage').then((m) => ({ default: m.AdminAuditPage })),
);
const AdminSupportInboxPage = lazy(() =>
  import('@/pages/admin/AdminSupportInboxPage').then((m) => ({ default: m.AdminSupportInboxPage })),
);

function RouteFallback() {
  const { t } = useTranslation();
  return (
    <div
      className="flex min-h-[50vh] items-center justify-center bg-[var(--bg)] text-sm font-medium text-ink-muted dark:text-ink-muted-dark"
      role="status"
      aria-live="polite"
    >
      {t('app.loading')}
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/jobs" element={<JobsBrowsePage />} />
          <Route path="/jobs/:jobId" element={<JobDetailPage />} />
          <Route path="/countries" element={<CountriesIndexPage />} />
          <Route path="/countries/:countrySlug" element={<CountryDetailPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/legal/:pageSlug" element={<LegalPage />} />

          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>

          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register/employer" element={<EmployerRegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/apply/:jobId" element={<ApplyWizardPage />} />
            <Route path="/dashboard" element={<ApplicantDashboardPage />} />
            <Route element={<EmployerRoute />}>
              <Route path="/dashboard/employer" element={<EmployerDashboardPage />} />
            </Route>
            <Route path="/dashboard/applications" element={<ApplicationsPage />} />
            <Route
              path="/dashboard/applications/:applicationId"
              element={<ApplicationDetailPage />}
            />
            <Route path="/dashboard/documents" element={<DocumentsPage />} />
            <Route path="/dashboard/payments" element={<PaymentsPage />} />
            <Route path="/dashboard/saved-jobs" element={<SavedJobsPage />} />
            <Route path="/dashboard/messages" element={<MessagesPage />} />
            <Route path="/dashboard/calendar" element={<ApplicantCalendarPage />} />
            <Route path="/dashboard/settings" element={<AccountSettingsPage />} />
            <Route path="/dashboard/cv-preparation" element={<CvPreparationPage />} />
            <Route path="/dashboard/cv-payment" element={<CvPaymentPage />} />
            <Route path="/dashboard/cv-status" element={<CvStatusPage />} />
            <Route element={<AdminRoute />}>
              <Route path="/admin/applications" element={<AdminApplicationsPage />} />
              <Route path="/admin/jobs" element={<AdminJobsPage />} />
              <Route path="/admin/employers" element={<AdminEmployersPage />} />
              <Route path="/admin/reports" element={<AdminReportsPage />} />
              <Route path="/admin/countries" element={<AdminCountriesPage />} />
              <Route path="/admin/campaigns" element={<AdminCampaignsPage />} />
              <Route path="/admin/payments" element={<AdminPaymentsPage />} />
              <Route path="/admin/audit" element={<AdminAuditPage />} />
              <Route path="/admin/support" element={<AdminSupportInboxPage />} />
            </Route>
            <Route element={<SuperAdminRoute />}>
              <Route path="/admin" element={<SuperAdminDashboardPage />} />
              <Route path="/admin/super" element={<SuperAdminDashboardPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
