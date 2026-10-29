import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/figtree/400.css';
import '@fontsource/figtree/500.css';
import '@fontsource/figtree/600.css';
import '@fontsource/figtree/700.css';
// Algemene stijlen eerst, zodat de stijl van elk onderdeel (bijvoorbeeld de docenttekst in een kaart)
// er altijd overheen gaat, in welke volgorde de schermen ook geladen worden.
import './styles/global.css';
import './components/ui/ui.css';
import { registerSW } from 'virtual:pwa-register';
import { api, isDemo } from './api';
import { App } from './App';

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
