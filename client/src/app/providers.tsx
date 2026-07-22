import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { DocumentLanguage } from '@/components/providers/DocumentLanguage';
import { queryClient } from '@/lib/query-client';

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <DocumentLanguage>{children}</DocumentLanguage>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
