import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { TradingControlModeProvider } from '@/context/TradingControlModeContext';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <TradingControlModeProvider>
          <App />
        </TradingControlModeProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
