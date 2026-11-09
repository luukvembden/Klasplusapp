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
import { startNotificaties } from './lib/notificaties';

// Offline werken als website. In de telefoon-app zitten de bestanden al in het pakket.
if (isDemo) registerSW({ immediate: true });

// Eerst een bewaarde sessie terughalen (tokens uit de veilige opslag), dan pas tekenen.
api
  .start()
  .catch(() => undefined)
  .finally(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    verbergLaadscherm();
    // Meldingen: achtergrondcontrole aanzetten en kijken of er iets nieuws is (alleen in de telefoon-app).
    void startNotificaties().catch(() => undefined);
  });

/** Het laadscherm uit index.html zacht laten verdwijnen zodra de app op het scherm staat. */
function verbergLaadscherm() {
  const scherm = document.getElementById('laadscherm');
  if (!scherm) return;
  // Twee frames wachten: dan is de eerste weergave van de app echt getekend.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      scherm.classList.add('laadscherm--weg');
      setTimeout(() => scherm.remove(), 260);
    }),
  );
}
