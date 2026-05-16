import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';

import { ModalHost, ToastHost } from '@medcord/ui';
import { AuthProvider } from '@shared/providers/auth-provider.tsx';
import { UserBootstrap } from '@shared/providers/user-bootstrap.tsx';

interface AppProvidersProps {
  readonly children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <UserBootstrap>{children}</UserBootstrap>
        </AuthProvider>
        <ModalHost />
        <ToastHost />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
