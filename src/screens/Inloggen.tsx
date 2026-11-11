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
          {/* Bovenin: een paar stukjes uit de app, als voorproefje. Verzonnen voorbeelden. */}
          <div className="inloggen__kop" aria-hidden="true">
            <div className="inloggen__zweef inloggen__zweef--les">
              <span className="inloggen__uur">3</span>
              <span>
                <strong>Biologie</strong>
                <span className="inloggen__sub">10:20 · 1.08 · nu bezig</span>
              </span>
            </div>
            <div className="inloggen__zweef inloggen__zweef--leren">
              <span className="inloggen__label">Leren</span>
              <strong className="inloggen__tijd">19:00</strong>
              <span className="inloggen__sub">SO Frans</span>
            </div>
            <div className="inloggen__zweef inloggen__zweef--melding">
              <img src="icoon.svg" alt="" width={30} height={30} />
              <span className="inloggen__meldtekst">
                <span className="inloggen__wie">
                  <span>KLAS+</span>
                  <span>07:15</span>
                </span>
                <strong>Engels om 9:15 vervalt</strong>
              </span>
            </div>
          </div>

          <div className="inloggen__onder">
            <div className="inloggen__merk">
              <img className="inloggen__logo" src="icoon.svg" alt="" width={40} height={40} />
              <span className="inloggen__naam">Klas+</span>
            </div>
            <h1 className="inloggen__titel">Alles voor school. Eén overzicht.</h1>
            <p className="inloggen__uitleg">Weekoverzicht, leren plannen, een ochtendmelding en nog veel meer.</p>

            <div className="inloggen__ruimte" />

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
              <p className="inloggen__klein inloggen__slot">
                <Lock size={14} strokeWidth={2.2} aria-hidden="true" />
                <span>
                  {isDemo
                    ? 'Dit is de demo met verzonnen gegevens. Inloggen met je echte account kan alleen in de telefoon-app.'
                    : 'Je logt in op de pagina van je school; Klas+ ziet je wachtwoord nooit. Onofficiële app, je gegevens blijven op je telefoon.'}
                </span>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
