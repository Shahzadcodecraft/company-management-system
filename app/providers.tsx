'use client';

import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRef } from 'react';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/components/ThemeProvider';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30 * 1000, retry: 1 },
    },
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClientRef = useRef<QueryClient | null>(null);
  if (!queryClientRef.current) {
    queryClientRef.current = makeQueryClient();
  }
  const queryClient = queryClientRef.current;

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'var(--surface)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px',
              },
              success: { iconTheme: { primary: 'var(--success)', secondary: 'var(--surface)' } },
              error: { iconTheme: { primary: 'var(--danger)', secondary: 'var(--surface)' } },
            }}
          />
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
