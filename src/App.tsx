import { HashRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { VereistSessie } from './components/VereistSessie';
import { useThema } from './hooks/useThema';
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
          <Route path="/*" element={<AppLayout />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
