import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import App from './App';
import './styles/index.css';

const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID as string;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <PayPalScriptProvider
        options={{
          clientId: paypalClientId,
          currency: 'USD',
          intent: 'capture',
          components: 'buttons',
          // Solo botón PayPal: sin tarjeta, sin crédito, sin pay-later
          'disable-funding': 'card,credit,paylater,venmo,sepa,bancontact',
          'enable-funding': 'paypal',
        } as any}
      >
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
