import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { TradingControlModeProvider } from '@/context/TradingControlModeContext';
import { AuthProvider as ArchitectureAuthProvider } from '@/providers/AuthProvider';
import { SessionProvider } from '@/providers/SessionProvider';
import { AppErrorBoundary } from '@/components/system/AppErrorBoundary';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppErrorBoundary>
        <ArchitectureAuthProvider>
          <SessionProvider>
            <AuthProvider>
              <TradingControlModeProvider>
                <App />
              </TradingControlModeProvider>
            </AuthProvider>
          </SessionProvider>
        </ArchitectureAuthProvider>
      </AppErrorBoundary>
    </BrowserRouter>
  </StrictMode>,
);
