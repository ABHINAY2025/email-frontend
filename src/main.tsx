import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import './index.css';
import { App } from './App';
import { ThemeProvider } from '@/lib/theme';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/hooks/use-auth';
import { ApiClientError, primeCsrf } from '@/lib/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      retry: (count, err) => {
        if (err instanceof ApiClientError && err.status >= 400 && err.status < 500) return false;
        return count < 2;
      },
    },
    mutations: { retry: false },
  },
});

void primeCsrf();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <TooltipProvider delayDuration={350} skipDelayDuration={150}>
            <AuthProvider>
              <App />
            </AuthProvider>
            <Toaster />
          </TooltipProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
