'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/query-client';
import { useState } from 'react';

/**
 * Props for the QueryProvider component
 */
interface QueryProviderProps {
  children: React.ReactNode;
}

/**
 * QueryProvider component that provides TanStack Query client to the application
 * Includes React Query Devtools in development mode
 * @param children - React children to wrap with the query provider
 * @returns JSX element with QueryClientProvider and optional devtools
 */
export function QueryProvider({ children }: QueryProviderProps) {
  // Create a new QueryClient instance for each user session
  // This prevents data leakage between different users
  const [client] = useState(() => queryClient);

  return (
    <QueryClientProvider client={client}>
      {children}
      {/* Only show devtools in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
        />
      )}
    </QueryClientProvider>
  );
}
