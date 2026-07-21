import { createContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';

export type AuthResult = {
  error: string | null;
};

export type SignUpInput = {
  email: string;
  password: string;
  fullName: string;
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
