import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ExternalLink, Lock } from 'lucide-react';
import { api, InloggenAfgebroken, isDemo } from '../api';
import { demoAlsOuder } from '../api/demoApi';
import '../components/ui/ui.css';
import '../components/inloggen/inloggen.css';

export function Inloggen() {
  const navigate = useNavigate();
  const [fout, setFout] = useState<string | null>(null);
  const [bezig, setBezig] = useState(false);

  if (api.heeftSessie()) return <Navigate to="/" replace />;

  /** `alsOuder` alleen in de demo; met een echt account bepaalt de school of je ouder bent. */
  const inloggen = async (alsOuder = false) => {
    if (isDemo) demoAlsOuder(alsOuder);
    setFout(null);
    setBezig(true);
    try {
      await api.inloggen();
      navigate('/', { replace: true });
    } catch (e) {
      if (!(e instanceof InloggenAfgebroken)) {
        setFout(navigator.onLine ? 'Inloggen is niet gelukt. Probeer het opnieuw.' : 'Je bent offline.');
      }
      setBezig(false);
    }
  };

  return (
    <div className="app">
      <main className="app__inhoud">
        <div className="inloggen">
          <div className="inloggen__intro">
            {/* Het app-icoon zelf (K+ als paden), zodat inlogscherm en beginscherm hetzelfde logo tonen. */}
            <img className="inloggen__logo" src="icoon.svg" alt="" width={64} height={64} />
            <div>
              <h1 className="inloggen__naam">Klas+</h1>
              <p className="inloggen__uitleg">Je rooster, cijfers en huiswerk in één rustig overzicht.</p>
            </div>
          </div>

          <div className="inloggen__formulier">
            <button type="button" className="knop-primair" onClick={() => inloggen()} disabled={bezig}>
              {bezig ? 'Bezig met inloggen…' : 'Inloggen via je school'}
              <ExternalLink size={18} strokeWidth={2.2} aria-hidden="true" />
            </button>
            {isDemo && (
              <button type="button" className="inloggen__ouder" onClick={() => inloggen(true)} disabled={bezig}>
                Demo bekijken als ouder
              </button>
            )}
            {fout && (
              <p className="inloggen__klein inloggen__fout" role="alert">
                {fout}
              </p>
            )}
            <p className="inloggen__klein">
              {isDemo
                ? 'Dit is de demo met verzonnen gegevens. Inloggen met je echte account kan alleen in de telefoon-app.'
                : 'Op de volgende pagina kies je je school en log je in op de officiële inlogpagina. Klas+ ziet je wachtwoord nooit.'}
            </p>
          </div>

          <div className="inloggen__ruimte" />

          <div className="inloggen__let-op">
            <Lock size={20} strokeWidth={2} aria-hidden="true" />
            <p>
              Onofficiële app, niet verbonden aan je schoolsysteem of de leverancier ervan. Je gegevens blijven
              alleen op je telefoon.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
