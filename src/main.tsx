import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/figtree/400.css';
import '@fontsource/figtree/500.css';
import '@fontsource/figtree/600.css';
import '@fontsource/figtree/700.css';
import { registerSW } from 'virtual:pwa-register';
import { api, isDemo } from './api';
import { App } from './App';
import './styles/global.css';

// Offline werken als website. In de telefoon-app zitten de bestanden al in het pakket.
if (isDemo) registerSW({ immediate: true });

// Eerst een bewaarde sessie terughalen (tokens uit de veilige opslag), dan pas tekenen.
api
  .start()
  .catch(() => undefined)
  .finally(() =>
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    ),
  );
