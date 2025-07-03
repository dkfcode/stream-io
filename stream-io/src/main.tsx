import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initializeStores } from './stores';
import App from './App.tsx';
import './index.css';

const queryClient = new QueryClient();

// Initialize Zustand stores with system detection and responsive state
initializeStores();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);