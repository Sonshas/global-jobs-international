import { createContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { RegisterFormValues } from '@/schemas/auth';
import type { EmployerRegisterFormValues } from '@/schemas/employer-auth';

export type AuthResult = {
  error: string | null;
};

export type SignUpProfile = Omit<RegisterFormValues, 'password' | 'confirmPassword'> & {
  phoneE164: string;
  phoneDialCode: string;
};

export type EmployerSignUpProfile = Omit<EmployerRegisterFormValues, 'password' | 'confirmPassword'> & {
  phoneE164: string;
  phoneDialCode: string;
};

export type SignUpInput = {
  email: string;
  password: string;
  fullName: string;
  /** Defaults to 'applicant' when omitted (backward compatible with existing callers). */
  accountType?: 'applicant' | 'employer';
  /** Required when accountType is 'applicant' (or omitted). */
  profile?: SignUpProfile;
  /** Required when accountType is 'employer'. */
  employerProfile?: EmployerSignUpProfile;
};

export type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (input: SignUpInput) => Promise<AuthResult & { needsEmailVerification: boolean }>;
  signOut: () => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  resendVerification: (email: string) => Promise<AuthResult>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
