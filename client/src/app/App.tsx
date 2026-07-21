import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { GuestRoute, ProtectedRoute } from '@/components/auth/RouteGuards';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage';
import { AuthCallbackPage } from '@/pages/auth/AuthCallbackPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { ApplicantDashboardPage } from '@/pages/dashboard/ApplicantDashboardPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<ApplicantDashboardPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
