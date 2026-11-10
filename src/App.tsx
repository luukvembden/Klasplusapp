import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { VereistSessie } from './components/VereistSessie';
import { useThema } from './hooks/useThema';
import { useInstellingen } from './lib/instellingen';
import { Inloggen } from './screens/Inloggen';

// HashRouter werkt op elke statische host en straks ook in Capacitor, zonder serverinstellingen.
// De schermen zelf staan in paginaRoutes; AppLayout toont ze.
export function App() {
  useThema();

  return (
    <HashRouter>
      <Routes>
        <Route path="/inloggen" element={<Inloggen />} />
        <Route element={<VereistSessie />}>
          <Route path="/*" element={<Opstart />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

/**
 * Bij het openen van de app (het allereerste adres heeft sleutel "default") naar Home, als je daarmee
 * opstart. Tik je later op Agenda, dan blijf je gewoon in de Agenda.
 */
function Opstart() {
  const locatie = useLocation();
  const { start } = useInstellingen();
  if (start === 'home' && locatie.key === 'default' && locatie.pathname === '/') return <Navigate to="/home" replace />;
  return <AppLayout />;
}
