import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { PayPalScriptProvider, type ReactPayPalScriptOptions } from '@paypal/react-paypal-js';
import App from './App';
import './styles/index.css';

const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID as string;
const paypalOptions: ReactPayPalScriptOptions = {
  clientId: paypalClientId,
  currency: 'USD',
  intent: 'capture',
  components: 'buttons',
  // Habilitar PayPal y tarjeta; deshabilitar alternativas no soportadas en sandbox
  'disable-funding': 'credit,paylater,venmo,sepa,bancontact',
  'enable-funding': 'paypal,card',
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <PayPalScriptProvider options={paypalOptions}>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#141B34',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)',
            },
            success: { iconTheme: { primary: '#22C55E', secondary: '#0B1020' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#0B1020' } },
          }}
        />
      </PayPalScriptProvider>
    </BrowserRouter>
  </StrictMode>,
);
